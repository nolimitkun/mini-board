# Cloud VM Comparison API

A high-performance REST API for comparing virtual machines across multiple cloud providers using SkyPilot's cloud resource catalog data with DuckDB for fast querying.

## Features

- **Multi-cloud support**: Compare VMs across 15+ cloud providers (AWS, Azure, GCP, IBM, and specialized GPU providers)
- **High-performance database**: Uses DuckDB for fast analytical queries on VM data
- **Auto-updating data**: Automatically loads latest VM data from SkyPilot's GitHub repository
- **Advanced filtering**: Filter by CPU, memory, GPU, region, price, and more
- **VM comparison**: Side-by-side comparison of specific VMs
- **Smart recommendations**: Get VM recommendations based on workload requirements
- **Comprehensive data**: Includes pricing, specifications, and availability zones
- **Data management**: Preview, reload, and health check endpoints

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the API Server

```bash
python main.py
```

The API will automatically:
- Initialize a DuckDB database (`vm_catalog.duckdb`)
- Download the latest VM data from SkyPilot's GitHub repository
- Load data into the database for fast querying

The API will be available at `http://localhost:8000`

### 3. View API Documentation

- **Interactive docs**: http://localhost:8000/docs
- **OpenAPI spec**: http://localhost:8000/openapi.json
- **ReDoc**: http://localhost:8000/redoc

### 4. Test the API

```bash
python test_api.py
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and version |
| `/providers` | GET | Get list of available cloud providers |
| `/vms` | GET | Get VMs with filtering and sorting |
| `/vms/compare` | POST | Compare specific VMs side by side |
| `/vms/recommendations` | POST | Get VM recommendations based on requirements |
| `/regions` | GET | Get available regions by provider |
| `/stats` | GET | Get statistics about the VM catalog |

### Data Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/preview` | GET | Preview sample data from the database |
| `/reload` | POST | Reload all VM data from GitHub repository |
| `/health` | GET | Health check and database status |

### Example Usage

#### 1. Get All Providers
```bash
curl http://localhost:8000/providers
```

#### 2. Find Cheapest VMs
```bash
curl "http://localhost:8000/vms?sort_by=price&limit=5"
```

#### 3. Find GPU Instances
```bash
curl "http://localhost:8000/vms?has_gpu=true&limit=10"
```

#### 4. Filter by Specifications
```bash
curl "http://localhost:8000/vms?min_vcpus=4&min_memory=8&max_price=2.0&providers=aws,azure"
```

#### 5. Compare Specific VMs
```bash
curl -X POST http://localhost:8000/vms/compare \
  -H "Content-Type: application/json" \
  -d '{
    "vms": [
      {"provider": "aws", "instance_type": "m5.large", "region": "us-east-1"},
      {"provider": "azure", "instance_type": "Standard_D2s_v3", "region": "eastus"}
    ]
  }'
```

#### 6. Get Recommendations
```bash
curl -X POST http://localhost:8000/vms/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "min_vcpus": 4,
      "min_memory": 8,
      "gpu_required": false,
      "max_budget": 1.0,
      "workload_type": "balanced"
    }
  }'
```

#### 7. Preview Database Data
```bash
curl "http://localhost:8000/preview?max_rows=3"
```

#### 8. Reload Data from GitHub
```bash
curl -X POST http://localhost:8000/reload
```

#### 9. Health Check
```bash
curl http://localhost:8000/health
```

## Query Parameters

### VM Filtering (`/vms`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `providers` | string | Comma-separated list of providers (e.g., "aws,azure,gcp") |
| `min_vcpus` | number | Minimum number of vCPUs |
| `max_vcpus` | number | Maximum number of vCPUs |
| `min_memory` | number | Minimum memory in GiB |
| `max_memory` | number | Maximum memory in GiB |
| `has_gpu` | boolean | Filter for GPU instances |
| `gpu_name` | string | Filter by specific GPU name |
| `region` | string | Filter by region |
| `max_price` | number | Maximum price per hour |
| `sort_by` | string | Sort by: price, spot_price, vcpus, memory, gpu_count |
| `sort_order` | string | Sort order: asc, desc |
| `limit` | integer | Maximum results (1-1000) |

### Data Preview (`/preview`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `max_rows` | integer | Maximum sample rows to show (1-20) |

## Response Examples

### VM Object
```json
{
  "provider": "aws",
  "instance_type": "m5.large",
  "vcpus": 2.0,
  "memory_gib": 8.0,
  "accelerator_name": null,
  "accelerator_count": null,
  "gpu_info": null,
  "price": 0.096,
  "spot_price": 0.029,
  "region": "us-east-1",
  "availability_zone": "us-east-1a",
  "generation": "V5"
}
```

### VMs Response with Counts
```json
{
  "vms": [/* VM objects */],
  "total_count": 15420,
  "filtered_count": 156
}
```

### Comparison Summary
```json
{
  "comparison": [/* VM objects */],
  "summary": {
    "cheapest": {/* VM object */},
    "most_powerful": {/* VM object */},
    "best_value": {/* VM object */},
    "price_difference": {
      "min": 0.096,
      "max": 0.384,
      "avg": 0.24
    }
  }
}
```

### Recommendation
```json
{
  "recommendations": [
    {
      "provider": "aws",
      "instance_type": "t3.medium",
      "vcpus": 2.0,
      "memory_gib": 4.0,
      "price": 0.0416,
      "score": 85.5,
      "reasoning": "Balanced performance across CPU, memory, and GPU"
    }
  ]
}
```

### Statistics Response
```json
{
  "total_vms": 15420,
  "providers_count": 18,
  "gpu_instances_count": 2847,
  "regions_count": 156,
  "price_range": {
    "min": 0.0042,
    "max": 24.576,
    "avg": 1.234
  }
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "providers_loaded": 18
}
```

## Supported Cloud Providers

- **Major Clouds**: AWS, Azure, Google Cloud (GCP), IBM Cloud, Oracle Cloud (OCI)
- **GPU Specialists**: Lambda Labs, RunPod, Vast.ai, Paperspace, FluidStack
- **Others**: DigitalOcean, Scaleway, OVHcloud, Cudo, Hyperstack, Nebius, SCP

## Workload Types for Recommendations

- **compute**: Optimized for CPU-intensive workloads
- **memory**: Optimized for memory-intensive workloads  
- **gpu**: Optimized for GPU workloads
- **balanced**: Balanced performance across CPU, memory, and GPU

## Architecture

### Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **DuckDB**: High-performance analytical database for fast queries
- **Pandas**: Data manipulation and analysis
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server for running the application

### Database Schema

The DuckDB database contains two main tables:

#### VMs Table
```sql
CREATE TABLE vms (
    provider VARCHAR,
    instance_type VARCHAR,
    vcpus DOUBLE,
    memory_gib DOUBLE,
    accelerator_name VARCHAR,
    accelerator_count DOUBLE,
    gpu_info VARCHAR,
    price DOUBLE,
    spot_price DOUBLE,
    region VARCHAR,
    availability_zone VARCHAR,
    generation VARCHAR
)
```

#### Images Table
```sql
CREATE TABLE images (
    provider VARCHAR,
    tag VARCHAR,
    region VARCHAR,
    os VARCHAR,
    os_version VARCHAR,
    image_id VARCHAR,
    creation_date VARCHAR,
    base_image_id VARCHAR
)
```

### Data Loading Process

1. **Initialization**: On startup, the API checks if the DuckDB database exists and contains data
2. **GitHub Download**: If no data exists, it downloads the latest catalog from SkyPilot's GitHub repository
3. **Data Processing**: CSV files are processed and standardized for each cloud provider
4. **Database Loading**: Data is inserted into DuckDB with proper indexing for performance
5. **Auto-reload**: The `/reload` endpoint allows updating data without restarting the service

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (no VMs match criteria)
- `500`: Internal Server Error

Error responses include a `detail` field with more information:

```json
{
  "detail": "At least one VM must be provided"
}
```

## Development

### Project Structure
```
├── main.py                  # FastAPI application and endpoints
├── models.py               # Pydantic models and data structures
├── duckdb_loader.py        # DuckDB data loading and management
├── duckdb_vm_service.py    # Business logic using DuckDB
├── data_loader.py          # Legacy CSV data loading (deprecated)
├── vm_service.py           # Legacy business logic (deprecated)
├── api_spec.yaml           # OpenAPI specification
├── test_api.py             # API test script
├── test_duckdb.py          # DuckDB functionality tests
├── requirements.txt        # Python dependencies
├── vm_catalog.duckdb       # DuckDB database file (auto-generated)
└── README.md               # Project documentation
```

### Key Components

1. **DuckDBLoader** (`duckdb_loader.py`): Handles data loading from GitHub, CSV processing, and database management
2. **DuckDBVMService** (`duckdb_vm_service.py`): Provides business logic for VM queries, comparisons, and recommendations
3. **FastAPI App** (`main.py`): Defines API endpoints and handles HTTP requests/responses
4. **Pydantic Models** (`models.py`): Data validation and serialization models

### Adding New Features

1. Update models in `models.py` for new data structures
2. Add database operations in `duckdb_loader.py` if needed
3. Implement business logic in `duckdb_vm_service.py`
4. Create endpoints in `main.py`
5. Update OpenAPI spec in `api_spec.yaml`
6. Add tests in `test_api.py` or `test_duckdb.py`

### Performance Optimizations

- **DuckDB Indexes**: Automatic indexing on commonly queried fields (provider, price, vcpus, memory, GPU, region)
- **Efficient Queries**: SQL-based filtering and sorting for optimal performance
- **Batch Operations**: Bulk data loading using prepared statements
- **Connection Pooling**: Single persistent DuckDB connection for the application lifecycle

### Running in Production

For production deployment, consider:

1. **ASGI Server**: Use Gunicorn with Uvicorn workers for better performance
2. **Environment Configuration**: Use environment variables for database paths and settings
3. **Monitoring**: Add logging, metrics, and health checks
4. **Security**: Implement authentication, rate limiting, and CORS policies
5. **Caching**: Cache frequently accessed data and query results
6. **Database Backup**: Regular backups of the DuckDB database file

```bash
# Production example
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PATH` | Path to DuckDB database file | `vm_catalog.duckdb` |
| `DATA_DIR` | Directory for CSV data files | `v7` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Testing

### Run All Tests
```bash
# Test API endpoints
python test_api.py

# Test DuckDB functionality
python test_duckdb.py
```

### Manual Testing
```bash
# Start the server
python main.py

# Test basic functionality
curl http://localhost:8000/health
curl http://localhost:8000/providers
curl "http://localhost:8000/vms?limit=5"
```

## Data Sources

This project uses VM catalog data from the [SkyPilot project](https://github.com/skypilot-org/skypilot-catalog), which provides comprehensive cloud resource information across multiple providers.

The data is automatically downloaded from:
`https://github.com/skypilot-org/skypilot-catalog/tree/master/catalogs/v7`

## License

This project uses SkyPilot's cloud resource catalog data. Please refer to SkyPilot's license for data usage terms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Changelog

### v1.0.0 (Current)
- **DuckDB Integration**: Migrated from CSV files to DuckDB for better performance
- **GitHub Data Loading**: Automatic data loading from SkyPilot repository
- **Enhanced API**: Added preview, reload, and health check endpoints
- **Improved Architecture**: Separated concerns with dedicated loader and service classes
- **Better Error Handling**: Comprehensive error responses and logging
- **Performance Optimizations**: Database indexing and efficient SQL queries
