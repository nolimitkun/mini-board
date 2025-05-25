# Backend - Cloud VM Comparison API

This directory contains the backend API for the Cloud VM Comparison application, built with FastAPI and Python.

## Structure

```
backend/
├── src/                    # Main application source code
│   ├── api/               # FastAPI routes and endpoints
│   ├── core/              # Core functionality (logging, etc.)
│   ├── database/          # Database connection and operations
│   ├── models/            # Pydantic models and data structures
│   └── services/          # Business logic and services
├── config/                # Configuration files
├── tests/                 # Test files
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── setup.py             # Package setup
└── Dockerfile           # Docker configuration
```

## Development

### Local Development

1. Create and activate a virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
python main.py
```

The API will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Docker Development

Build and run with Docker:
```bash
docker build -t vm-comparison-api .
docker run -p 8000:8000 vm-comparison-api
```

### Testing

Run tests:
```bash
python -m pytest tests/
```

## API Endpoints

The API provides endpoints for:
- VM catalog browsing and filtering
- VM comparison functionality
- VM recommendations
- Statistics and analytics
- Administrative functions

See the interactive documentation at `/docs` for detailed API specifications.

## Environment Variables

- `LOG_LEVEL`: Logging level (default: INFO)
- `DB_PATH`: Path to DuckDB database file
- `PYTHONPATH`: Should include the backend directory

## Dependencies

Key dependencies include:
- FastAPI: Web framework
- Uvicorn: ASGI server
- DuckDB: Database
- Pydantic: Data validation
- Other dependencies listed in requirements.txt
