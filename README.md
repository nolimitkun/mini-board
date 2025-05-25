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
- **VM Browser**: Browse and filter VMs across providers
- **Comparison Tool**: Side-by-side VM comparison
- **Recommendations**: Smart VM recommendations based on requirements
- **Statistics Dashboard**: Analytics and insights
- **Admin Panel**: Data management interface
- **Responsive Design**: Works on desktop and mobile

### Backend (FastAPI)
- **Multi-cloud Support**: 15+ cloud providers (AWS, Azure, GCP, etc.)
- **High-Performance Database**: DuckDB for fast analytical queries
- **Auto-updating Data**: Latest VM data from SkyPilot's catalog
- **Advanced Filtering**: Filter by CPU, memory, GPU, region, price
- **Smart Recommendations**: ML-based VM recommendations
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
| `/vms` | GET | Get VMs with filtering and sorting |
| `/vms/compare` | POST | Compare specific VMs |
| `/vms/recommendations` | POST | Get VM recommendations |
| `/stats` | GET | Get catalog statistics |
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
DB_PATH=./data/vm_catalog.duckdb

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## Supported Cloud Providers

- **Major Clouds**: AWS, Azure, Google Cloud (GCP), IBM Cloud, Oracle Cloud
- **GPU Specialists**: Lambda Labs, RunPod, Vast.ai, Paperspace, FluidStack
- **Others**: DigitalOcean, Scaleway, OVHcloud, Cudo, Hyperstack

## Data Sources

VM data is sourced from the [SkyPilot project](https://github.com/skypilot-org/skypilot-catalog), providing comprehensive cloud resource information across multiple providers.

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

### v2.0.0 (Current)
- **Reorganized Structure**: Separated frontend and backend into distinct directories
- **React Frontend**: Complete React application with modern UI
- **Docker Support**: Full containerization with docker-compose
- **Development Tools**: Improved development workflow with start-dev.sh
- **Enhanced Documentation**: Comprehensive documentation for both frontend and backend

### v1.0.0
- **Initial Release**: FastAPI backend with DuckDB integration
- **Multi-cloud Support**: Support for 15+ cloud providers
- **VM Comparison**: Basic VM comparison and recommendation features
