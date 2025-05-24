"""
Entry point for the Cloud VM Comparison API

This file serves as the main entry point for running the application.
It imports the FastAPI app from the organized package structure.
"""

import uvicorn
from src.api.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
