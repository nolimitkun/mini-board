from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import logging
from contextlib import asynccontextmanager

from ..models import (
    ProvidersResponse, VMsResponse, CompareRequest, CompareResponse,
    RecommendationRequest, RecommendationResponse, RegionsResponse, StatsResponse,
    SortBy, SortOrder
)
from ..services.duckdb_vm_service import duckdb_vm_service
from ..database.duckdb_loader import duckdb_loader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load data using DuckDB loader
    logger.info("Loading VM data using DuckDB loader...")
    try:
        duckdb_loader.load_all_data()
        logger.info("Data loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    duckdb_loader.close()

# Create FastAPI app
app = FastAPI(
    title="Cloud VM Comparison API",
    description="API for comparing virtual machines across multiple cloud providers",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Cloud VM Comparison API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

@app.get("/providers", response_model=ProvidersResponse, tags=["Providers"])
async def get_providers():
    """Get list of available cloud providers"""
    try:
        providers = duckdb_loader.get_providers()
        return ProvidersResponse(providers=providers)
    except Exception as e:
        logger.error(f"Error getting providers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/vms", response_model=VMsResponse, tags=["VMs"])
async def get_vms(
    providers: Optional[str] = Query(None, description="Comma-separated list of cloud providers"),
    min_vcpus: Optional[float] = Query(None, description="Minimum number of vCPUs"),
    max_vcpus: Optional[float] = Query(None, description="Maximum number of vCPUs"),
    min_memory: Optional[float] = Query(None, description="Minimum memory in GiB"),
    max_memory: Optional[float] = Query(None, description="Maximum memory in GiB"),
    has_gpu: Optional[bool] = Query(None, description="Filter for instances with GPU accelerators"),
    gpu_name: Optional[str] = Query(None, description="Filter by specific GPU name"),
    region: Optional[str] = Query(None, description="Filter by region"),
    max_price: Optional[float] = Query(None, description="Maximum price per hour"),
    sort_by: SortBy = Query(SortBy.price, description="Sort results by field"),
    sort_order: SortOrder = Query(SortOrder.asc, description="Sort order"),
    limit: int = Query(100, description="Maximum number of results", ge=1, le=1000)
):
    """Get VMs with filtering options"""
    try:
        # Parse providers
        provider_list = None
        if providers:
            provider_list = [p.strip() for p in providers.split(",")]
        
        result = duckdb_vm_service.get_vms(
            providers=provider_list,
            min_vcpus=min_vcpus,
            max_vcpus=max_vcpus,
            min_memory=min_memory,
            max_memory=max_memory,
            has_gpu=has_gpu,
            gpu_name=gpu_name,
            region=region,
            max_price=max_price,
            sort_by=sort_by.value,
            sort_order=sort_order.value,
            limit=limit
        )
        
        return VMsResponse(**result)
    except Exception as e:
        logger.error(f"Error getting VMs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/vms/compare", response_model=CompareResponse, tags=["VMs"])
async def compare_vms(request: CompareRequest):
    """Compare specific VMs"""
    try:
        if not request.vms:
            raise HTTPException(status_code=400, detail="At least one VM must be provided")
        
        vm_requests = [vm.model_dump() for vm in request.vms]
        result = duckdb_vm_service.compare_vms(vm_requests)
        
        if not result["comparison"]:
            raise HTTPException(status_code=404, detail="No VMs found matching the criteria")
        
        return CompareResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing VMs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/vms/recommendations", response_model=RecommendationResponse, tags=["VMs"])
async def get_recommendations(request: RecommendationRequest):
    """Get VM recommendations based on requirements"""
    try:
        recommendations = duckdb_vm_service.get_recommendations(request.requirements)
        return RecommendationResponse(recommendations=recommendations)
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/regions", response_model=RegionsResponse, tags=["Regions"])
async def get_regions(
    provider: Optional[str] = Query(None, description="Cloud provider name")
):
    """Get available regions by provider"""
    try:
        regions = duckdb_loader.get_regions(provider)
        return RegionsResponse(regions=regions)
    except Exception as e:
        logger.error(f"Error getting regions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/stats", response_model=StatsResponse, tags=["Statistics"])
async def get_stats():
    """Get statistics about the VM catalog"""
    try:
        stats = duckdb_vm_service.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/preview", tags=["Data"])
async def preview_database_data(
    max_rows: int = Query(5, description="Maximum number of sample rows to show", ge=1, le=20)
):
    """Preview data from DuckDB database - shows sample rows and statistics"""
    try:
        preview_data = duckdb_loader.preview_database_data(max_rows=max_rows)
        return {
            "message": "Database data preview",
            "max_rows_shown": max_rows,
            "providers": preview_data
        }
    except Exception as e:
        logger.error(f"Error previewing database data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/reload", tags=["Data"])
async def reload_vm_data():
    """Reload all VM data from GitHub repository"""
    try:
        result = duckdb_loader.reload_from_github()
        return {
            "message": "VM data reloaded successfully from GitHub repository",
            **result
        }
    except Exception as e:
        logger.error(f"Error reloading VM data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reload VM data: {str(e)}")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "providers_loaded": len(duckdb_loader.get_providers())}
