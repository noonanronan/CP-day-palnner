import React, { useEffect, useState } from "react";
import {
    getAllWorkers,
    deleteWorker,
    apiRequest,
    uploadTemplate,
    uploadAvailability,
    generateSchedule,
} from "../services/workerService";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, compareAsc } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const WorkerList = () => {
    const [workers, setWorkers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [showUploadSection, setShowUploadSection] = useState(false);
    const [showAvailabilitySection, setShowAvailabilitySection] = useState(false);
    const [morningIcaCount, setMorningIcaCount] = useState(4);
    const [afternoonIcaCount, setAfternoonIcaCount] = useState(4);
    const [eveningIcaCount, setEveningIcaCount] = useState(4);
    const [printUntilHour, setPrintUntilHour] = useState(16);
    const [availabilityFile, setAvailabilityFile] = useState(null);
    const [availabilityUploadError, setAvailabilityUploadError] = useState(null);
    const [availabilityUploadSuccess, setAvailabilityUploadSuccess] = useState(null);
    const navigate = useNavigate();

    // Fetch workers and templates on mount
    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const data = await getAllWorkers();
                const now = new Date();

                // Strip out any availability that has already ended
                const cleanedWorkers = data.workers.map((worker) => {
                    const filteredAvailability = worker.availability
                        .map(({ start, end, late }) => ({ start, end, late: !!late }))
                        .filter(({ end }) => new Date(end) >= now);
                    return { ...worker, availability: filteredAvailability };
                });

                setWorkers(cleanedWorkers);
            } catch (error) {
                console.error("Error fetching workers:", error);
            }
        };

        const fetchTemplates = async () => {
            try {
                const data = await apiRequest("get", "/list-templates");
                setTemplates(data.templates);
            } catch (error) {
                console.error("Error fetching templates:", error);
            }
        };

        fetchWorkers();
        fetchTemplates();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteWorker(id);
            setWorkers((prev) => prev.filter((worker) => worker.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDownloadSchedule = async () => {
        if (!selectedTemplate) {
            alert("Please select a template to generate the schedule.");
            return;
        }
        try {
            const blob = await generateSchedule({
                template: selectedTemplate,
                date: selectedDate,
                ica_morning_count: morningIcaCount,
                ica_afternoon_count: afternoonIcaCount,
                ica_evening_count: eveningIcaCount,
                print_until_hour: printUntilHour,
            });

            // Trigger file download in the browser
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "day_schedule.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading schedule:", err);
            alert("Failed to download schedule. Please try again.");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".ods"))) {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError("Please select a valid Excel (.xlsx) or ODS (.ods) file.");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("No file selected. Please select a file to upload.");
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        try {
            const resp = await uploadTemplate(formData);
            alert("File uploaded successfully!");
            setTemplates((prev) => [...prev, resp.filename].filter(Boolean));
        } catch (err) {
            console.error("Error uploading file:", err);
            setError("Failed to upload the file. Please check the format and try again.");
        }
    };

    const handleAvailabilityFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
            setAvailabilityFile(selectedFile);
            setAvailabilityUploadError(null);
            setAvailabilityUploadSuccess(null);
        } else {
            setAvailabilityFile(null);
            setAvailabilityUploadError("Please upload a valid Excel (.xlsx) file.");
        }
    };

    const handleUploadAvailability = async () => {
        if (!availabilityFile) {
            setAvailabilityUploadError("No file selected.");
            return;
        }
        const formData = new FormData();
        formData.append("file", availabilityFile);
        try {
            await uploadAvailability(formData);
            setAvailabilityUploadSuccess("Availability uploaded successfully!");
            setAvailabilityUploadError(null);
        } catch (err) {
            console.error("Error uploading availability:", err);
            setAvailabilityUploadSuccess(null);
            setAvailabilityUploadError("Failed to upload availability. Check the file format and try again.");
        }
    };

    // Returns the first upcoming availability date for a worker
    const getNextAvailability = (availability) => {
        const now = new Date();
        const nextDates = availability
            .map((range) => {
                const start = parseISO(range.start);
                return isValid(start) && compareAsc(start, now) >= 0 ? start : null;
            })
            .filter((date) => date !== null)
            .sort((a, b) => compareAsc(a, b));
        return nextDates.length > 0 ? nextDates[0] : null;
    };

    // Returns today's availability range if the worker is in today
    const getTodayAvailability = (availability) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        return availability.find(({ start, end }) => {
            const startTime = parseISO(start);
            const endTime = parseISO(end);
            return isValid(startTime) && isValid(endTime) && startTime <= todayEnd && endTime >= today;
        });
    };

    const hasFutureAvailability = (availability) => {
        const now = new Date();
        return availability.some(({ start }) => {
            const startDate = parseISO(start);
            return isValid(startDate) && compareAsc(startDate, now) > 0;
        });
    };

    // Returns today, future, or none based on worker availability
    const getAvailabilityStatus = (availability) => {
        if (getTodayAvailability(availability)) return "today";
        if (hasFutureAvailability(availability)) return "future";
        return "none";
    };

    // Sort: workers in today first, then by next availability date, then no availability
    const sortedWorkers = [...workers].sort((a, b) => {
        const aToday = getTodayAvailability(a.availability);
        const bToday = getTodayAvailability(b.availability);
        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;

        const aNext = getNextAvailability(a.availability);
        const bNext = getNextAvailability(b.availability);
        if (aNext && bNext) return compareAsc(aNext, bNext);
        if (aNext && !bNext) return -1;
        if (!aNext && bNext) return 1;
        return 0;
    });

    return (
        <div className="container mt-4">
            <div className="page-header">
                <h1 className="mb-0">Instructor List</h1>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowAvailabilitySection(!showAvailabilitySection)}
                    >
                        {showAvailabilitySection ? "Hide Availability Upload" : "⬆ Upload Availability"}
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowUploadSection(!showUploadSection)}
                    >
                        {showUploadSection ? "Hide Template Upload" : "⬆ Upload Template"}
                    </button>
                </div>
            </div>

            {showAvailabilitySection && (
                <div className="card p-3 mb-4">
                    <div className="panel-header">
                        <span className="panel-icon blue">📊</span>
                        <h5>Upload Worker Availability</h5>
                    </div>
                    <input
                        type="file"
                        className="form-control mb-3"
                        accept=".xlsx"
                        onChange={handleAvailabilityFileChange}
                    />
                    <button className="btn btn-primary" onClick={handleUploadAvailability}>
                        Upload Availability
                    </button>
                    {availabilityUploadSuccess && <p className="text-success mt-2">{availabilityUploadSuccess}</p>}
                    {availabilityUploadError && <p className="text-danger mt-2">{availabilityUploadError}</p>}
                </div>
            )}

            {showUploadSection && (
                <div className="card p-3 mb-4">
                    <div className="panel-header">
                        <span className="panel-icon amber">📄</span>
                        <h5>Upload Schedule Template</h5>
                    </div>
                    <input
                        type="file"
                        className="form-control mb-3"
                        accept=".xlsx,.ods"
                        onChange={handleFileChange}
                    />
                    <button className="btn btn-primary" onClick={handleUpload}>
                        Upload File
                    </button>
                    {error && <p className="text-danger mt-2">{error}</p>}
                </div>
            )}

            <div className="card p-3 mb-4">
                <div className="panel-header">
                    <span className="panel-icon green">📅</span>
                    <h5>Generate Schedule</h5>
                </div>
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Template</label>
                        <select
                            className="form-select"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                        >
                            <option value="">— Choose Template —</option>
                            {templates.map((template, index) => (
                                <option key={index} value={template}>{template}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2 col-6">
                        <label className="form-label">Morning ICA</label>
                        <input
                            type="number"
                            className="form-control"
                            value={morningIcaCount}
                            min={2}
                            max={4}
                            onChange={(e) => setMorningIcaCount(e.target.value)}
                        />
                    </div>
                    <div className="col-md-2 col-6">
                        <label className="form-label">Afternoon ICA</label>
                        <input
                            type="number"
                            className="form-control"
                            value={afternoonIcaCount}
                            min={2}
                            max={4}
                            onChange={(e) => setAfternoonIcaCount(e.target.value)}
                        />
                    </div>
                    <div className="col-md-2 col-6">
                        <label className="form-label">Evening ICA</label>
                        <input
                            type="number"
                            className="form-control"
                            value={eveningIcaCount}
                            min={2}
                            max={4}
                            onChange={(e) => setEveningIcaCount(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3 col-6">
                        <label className="form-label">Stop Printing At</label>
                        <select
                            className="form-select"
                            value={printUntilHour}
                            onChange={(e) => setPrintUntilHour(Number(e.target.value))}
                        >
                            <option value={16}>4:00 PM</option>
                            <option value={17}>5:00 PM</option>
                            <option value={18}>6:00 PM</option>
                        </select>
                    </div>
                    <div className="col-md-2 col-6 d-grid">
                        <button className="btn btn-success" onClick={handleDownloadSchedule}>
                            ⬇ Generate
                        </button>
                    </div>
                </div>
            </div>

            <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search instructors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="row g-3 worker-grid">
                {sortedWorkers
                    .filter((worker) => worker.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((worker) => {
                        const todayRange = getTodayAvailability(worker.availability);
                        const availStatus = getAvailabilityStatus(worker.availability);

                        let borderClass = "border border-secondary";
                        let statusBadge = <span className="badge bg-secondary">No Availability</span>;

                        if (todayRange) {
                            borderClass = "border border-success";
                            statusBadge = <span className="badge bg-success">In Today</span>;
                        } else if (getNextAvailability(worker.availability)) {
                            borderClass = "border border-warning";
                            statusBadge = <span className="badge bg-warning text-dark">Available Soon</span>;
                        }

                        return (
                            <div className={`col-12 col-sm-6 col-md-4 col-lg-3 ${borderClass}`} key={worker.id}>
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h6 className="card-title">
                                            {worker.name}
                                            {statusBadge}
                                        </h6>
                                        <div className="role-tags mb-2">
                                            {worker.roles.map((role) => (
                                                <span key={role} className="role-tag">{role}</span>
                                            ))}
                                        </div>
                                        <p className="avail-text">
                                            {availStatus === "today" && todayRange
                                                ? `${formatInTimeZone(todayRange.start, "Europe/Dublin", "hh:mm a")} – ${formatInTimeZone(todayRange.end, "Europe/Dublin", "hh:mm a")}`
                                                : availStatus === "future"
                                                ? `Next: ${formatInTimeZone(getNextAvailability(worker.availability), "Europe/Dublin", "MMM dd, yyyy")}`
                                                : "No upcoming availability"}
                                        </p>
                                        <div className="d-flex justify-content-between">
                                            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/update-worker/${worker.id}`)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(worker.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default WorkerList;
