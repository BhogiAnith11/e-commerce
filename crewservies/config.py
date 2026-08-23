import os
from dotenv import load_dotenv

load_dotenv()

NEXT_API_BASE = os.environ.get("NEXT_API_BASE", "http://localhost:3000")
INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
PORT = int(os.environ.get("PORT", 8001))

if not INTERNAL_SERVICE_TOKEN:
    raise RuntimeError(
        "INTERNAL_SERVICE_TOKEN is not set. Copy .env.example to .env and fill it in."
    )
