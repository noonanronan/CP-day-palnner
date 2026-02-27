# Day Planner                                                                                                                                                                                                                                                                                                                                                           
  A full-stack workforce scheduling application designed to manage staff availability, role assignments, and daily rota generation.

  Built with a React frontend and Flask backend, the system automates schedule creation while preventing availability conflicts and supporting real operational constraints.                                                                                                                                                                                                
  ## Overview
  Day Planner was built to streamline staff scheduling in a live operational environment. It allows managers to:
  - Maintain structured worker profiles
  - Track availability by date and time
  - Generate role-based daily schedules
  - Export schedules to Excel for operational use
  - Manage authentication-protected routes
  ## Features                                                                                                                                                                        
  
  - **Worker Management** — Create, update, and view workers
  - **Availability Tracking** — Upload and manage worker availability
  - **Schedule Export** — Export schedules to Excel (.xlsx)
  - **Authentication** — Login-protected routes
  - **Modern UI** — Clean modern interface built with Inter font

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

  \```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  \```

  Create a `.env` file in `/backend`:

  \```env
  DATABASE_URI=sqlite:///local.db
  FRONTEND_ORIGINS=http://localhost:3000
  \```

  Run the server:

  \```bash
  flask run
  \```

  ### Frontend

  \```bash
  cd frontend
  npm install
  npm start
  \```

  App runs at `http://localhost:3000`

  ## Deployment

  - Deployed on Render
  - Served using Gunicorn
  - Environment variables required:

  | Variable | Description |
  |---|---|
  | `DATABASE_URI` | PostgreSQL connection string |
  | `FRONTEND_ORIGINS` | Comma-separated list of allowed frontend URLs |

  ### Architecture Overview
  - RESTful API structure
  - Separation of concerns (React frontend / Flask API)
  - Role-based scheduling logic handled server-side
  - Database abstraction via SQLAlchemy ORM
  - CORS handling for cross-origin frontend communication
