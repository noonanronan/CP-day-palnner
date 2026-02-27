# Day Planner

A full-stack web app for managing worker schedules and availability. Built with a React frontend and Flask backend, deployed via Render.

## Features

- **Worker Management** — Create, update, and view workers
- **Availability Tracking** — Upload and manage worker availability
- **Schedule Export** — Export schedules to Excel (.xlsx)
- **Authentication** — Login-protected routes
- **Dark Navy UI** — Clean modern interface built with Inter font

## Tech Stack

**Frontend**
- React
- React Router
- Axios
- Bootstrap

**Backend**
- Python / Flask
- Flask-SQLAlchemy
- Flask-CORS
- Gunicorn
- PostgreSQL (production) / SQLite (local dev)

## Getting Started

### Prerequisites
- Node.js
- Python 3.x

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
DATABASE_URI=sqlite:///local.db
FRONTEND_ORIGINS=http://localhost:3000
```

Run the server:

```bash
flask run
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

## Deployment

The backend is deployed on **Render** using Gunicorn (`Procfile` included). The frontend can be deployed to any static host (Netlify, Vercel, etc.).

Set the following environment variables on Render:

| Variable | Description |
|---|---|
| `DATABASE_URI` | PostgreSQL connection string |
| `FRONTEND_ORIGINS` | Comma-separated list of allowed frontend URLs |
