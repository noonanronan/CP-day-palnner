import logging
from flask import Blueprint, request, jsonify
from dateutil import parser
from extensions import db
from models import Worker

workers_bp = Blueprint("workers_bp", __name__)


@workers_bp.route("/workers", methods=["GET"])
def get_all_workers():
    try:
        workers = Worker.query.all()
        workers_list = [
            {
                "id": worker.id,
                "name": worker.name,
                "roles": worker.roles,
                "availability": worker.availability
            }
            for worker in workers
        ]
        logging.info("Fetched all workers successfully.")
        return jsonify({"workers": workers_list}), 200
    except Exception as e:
        logging.error(f"Error fetching workers: {e}")
        return jsonify({"error": str(e)}), 500


@workers_bp.route("/workers", methods=["POST"])
def create_worker():
    try:
        logging.debug("Incoming request data: %s", request.json)
        data = request.get_json()

        if not data or "name" not in data or "roles" not in data or "availability" not in data:
            return jsonify({"error": "Missing required fields: name, roles, or availability"}), 400

        new_worker = Worker(
            name=data["name"],
            roles=data["roles"],
            availability=data["availability"],
        )
        db.session.add(new_worker)
        db.session.commit()

        logging.info(f"Worker {new_worker.name} created successfully.")
        return jsonify({
            "message": "Worker created successfully",
            "worker": {
                "id": new_worker.id,
                "name": new_worker.name,
                "roles": new_worker.roles,
                "availability": new_worker.availability,
            },
        }), 201
    except Exception as e:
        logging.error(f"Error creating worker: {e}")
        return jsonify({"error": str(e)}), 500


@workers_bp.route("/workers/<int:worker_id>", methods=["PUT"])
def update_worker(worker_id):
    try:
        worker = Worker.query.get(worker_id)
        if not worker:
            return jsonify({"error": f"No worker found with ID {worker_id}"}), 404

        data = request.get_json()

        worker.name = data.get("name", worker.name)
        worker.roles = data.get("roles", worker.roles)

        if "availability" in data:
            worker.availability = [
                {
                    "start": parser.parse(a["start"]).isoformat(),
                    "end": parser.parse(a["end"]).isoformat(),
                    "late": bool(a.get("late", False)),
                }
                for a in data["availability"]
            ]

        db.session.commit()

        return jsonify({
            "message": "Worker updated successfully",
            "worker": {
                "id": worker.id,
                "name": worker.name,
                "roles": worker.roles,
                "availability": worker.availability,
            },
        }), 200
    except Exception as e:
        logging.error(f"Error updating worker {worker_id}: {e}")
        return jsonify({"error": str(e)}), 500


@workers_bp.route("/workers/<int:worker_id>", methods=["DELETE"])
def delete_worker(worker_id):
    try:
        worker = Worker.query.get(worker_id)
        if not worker:
            return jsonify({"error": f"Worker with ID {worker_id} not found"}), 404

        db.session.delete(worker)
        db.session.commit()

        return jsonify({"message": "Worker deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
