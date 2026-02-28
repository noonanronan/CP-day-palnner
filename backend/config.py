import os
from pathlib import Path
from zoneinfo import ZoneInfo

# File Storage
UPLOAD_FOLDER = Path('uploaded_templates')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# App constants
TIMEZONE = ZoneInfo("Europe/Dublin")
ALLOWED_PRINT_HOURS = {16, 17, 18}
DASH_PATTERN = r"[-–—]"

# CORS
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()
] or ["*"]
