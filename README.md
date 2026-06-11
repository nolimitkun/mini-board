# Cloud VM Comparison Platform

A full-stack application for comparing virtual machines across multiple cloud providers, featuring a React frontend and FastAPI backend with DuckDB for high-performance data queries.

## Architecture

This project is organized as a monorepo with separate frontend and backend applications:

```
mini-board/
├── frontend/              # React frontend application
│   ├── src/              # React components and pages
│   ├── public/           # Static assets
│   ├── package.json      # Node.js dependencies
│   ├── Dockerfile        # Frontend container
│   └── README.md         # Frontend documentation
├── backend/              # FastAPI backend application
│   ├── src/              # Python source code
│   ├── config/           # Configuration files
│   ├── tests/            # Test files
│   ├── main.py           # Backend entry point
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # Backend container
│   └── README.md         # Backend documentation
├── docs/                 # Project documentation
├── docker-compose.yml    # Multi-container orchestration
├── start-dev.sh          # Development startup script
└── README.md             # This file
```

## Features

### Frontend (React)
- **Modern UI**: Built with React and Tailwind CSS
- **VM Browser**: Browse, filter, and sort VMs across all providers (select-all providers by default)
- **Statistics Dashboard**: Analytics and insights
- **Admin Panel**: Data management interface (preview, reload catalog)
- **Responsive Design**: Works on desktop and mobile

### Backend (FastAPI)
- **Multi-cloud Support**: 25 cloud providers (AWS, Azure, GCP, and more)
- **High-Performance Database**: DuckDB for fast analytical queries
- **Auto-updating Data**: Latest VM data from SkyPilot's catalog (v8)
- **Advanced Filtering**: Filter by CPU, memory, GPU, region, price
- **Graceful Missing Data**: Catalog gaps (e.g. unpriced or region-less GCP rows) surface as null and can be hidden via `hide_incomplete`
- **RESTful API**: Comprehensive REST API with OpenAPI docs
- **Data Management**: Preview, reload, and health check endpoints

## Quick Start

### Option 1: Development Mode (Recommended)

Use the provided development script to start both frontend and backend:

```bash
# Make the script executable
chmod +x start-dev.sh

# Start both services
./start-dev.sh
```

This will:
- Start the backend API on http://localhost:8000
- Start the frontend development server on http://localhost:3000
- Install dependencies automatically
- Provide live reloading for development

### Option 2: Docker Compose

Run the entire stack with Docker:

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 3: Manual Setup

#### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Documentation

The backend provides a comprehensive REST API:

- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/providers` | GET | List available cloud providers |
| `/vms` | GET | Get VMs with filtering and sorting (supports `hide_incomplete`) |
| `/regions` | GET | List available regions (optionally by provider) |
| `/stats` | GET | Get catalog statistics |
| `/preview` | GET | Preview sample rows per provider |
| `/reload` | POST | Re-download the catalog from SkyPilot's GitHub |
| `/health` | GET | Health check |

## Development

### Frontend Development

The frontend is built with:
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.

### Backend Development

The backend is built with:
- **FastAPI**: Modern Python web framework
- **DuckDB**: High-performance analytical database
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

See [backend/README.md](backend/README.md) for detailed backend documentation.

### Project Scripts

- `start-dev.sh`: Start both frontend and backend in development mode
- `docker-compose.yml`: Container orchestration for production

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend
LOG_LEVEL=INFO
DB_PATH=vm_catalog.duckdb
DATA_DIR=v8

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## Supported Cloud Providers

25 providers sourced from SkyPilot's v8 catalog:

- **Major Clouds**: AWS, Azure, Google Cloud (GCP), IBM Cloud, Oracle Cloud (OCI), SCP
- **GPU Specialists**: Lambda, RunPod, Vast, Paperspace, FluidStack, Hyperbolic, Mithril, Prime Intellect, Shadeform, Verda, Yotta, Nebius, Hyperstack
- **Others**: DigitalOcean, Scaleway, OVHcloud, Cudo, Seeweb, Kubernetes

> The exact provider set tracks SkyPilot's catalog and may change as it is updated. Call `GET /providers` for the live list.

## Data Sources

VM data is sourced from the [SkyPilot project](https://github.com/skypilot-org/skypilot-catalog) (catalog `v8`), providing comprehensive cloud resource information across multiple providers. The catalog version is configured via `DATA_DIR` and the GitHub base URL in `backend/src/database/duckdb_loader.py`.

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing
```bash
# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/providers
curl "http://localhost:8000/vms?limit=5"
```

## Production Deployment

### Docker Production
```bash
# Production build
docker-compose -f docker-compose.yml up --build

# With nginx reverse proxy
docker-compose --profile production up
```

### Manual Production

#### Backend
```bash
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the build directory with nginx or another web server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project uses SkyPilot's cloud resource catalog data. Please refer to SkyPilot's license for data usage terms.

## Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: See individual README files in frontend/ and backend/ directories
- **API Docs**: Interactive documentation at http://localhost:8000/docs

## Changelog

### v2.1.0 (Current)
- **SkyPilot v8 Catalog**: Upgraded data source from v7 to v8 (25 providers, including Hyperbolic, Mithril, Prime Intellect, Seeweb, Shadeform, Verda, Yotta)
- **Graceful Missing Data**: Optional VM fields surface as null instead of `nan`/`0`; `hide_incomplete` filter (default on) hides unpriced rows and de-prioritizes them in price sorting
- **VM Browser**: All providers selected by default with a "Select All" checkbox
- **Streamlined UI**: Removed the Compare and Recommendations pages, along with their `/vms/compare` and `/vms/recommendations` API endpoints

### v2.0.0
- **Reorganized Structure**: Separated frontend and backend into distinct directories
- **React Frontend**: Complete React application with modern UI
- **Docker Support**: Full containerization with docker-compose
- **Development Tools**: Improved development workflow with start-dev.sh
- **Enhanced Documentation**: Comprehensive documentation for both frontend and backend

### v1.0.0
- **Initial Release**: FastAPI backend with DuckDB integration
- **Multi-cloud Support**: Support for 15+ cloud providers
- **VM Comparison**: Basic VM comparison and recommendation features
