#!/usr/bin/env python3
"""
Test script to verify the DuckDB parameter fix
"""

import logging
from duckdb_loader import duckdb_loader
from duckdb_vm_service import duckdb_vm_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_parameter_fix():
    """Test that the parameter issue is fixed"""
    try:
        print("Testing DuckDB parameter fix...")
        
        # Initialize the database
        print("1. Initializing database...")
        duckdb_loader.initialize_database()
        
        # Test basic query with parameters (this was failing before)
        print("2. Testing query with min_vcpus parameter...")
        result = duckdb_loader.query_vms(
            min_vcpus=10, 
            sort_by='price', 
            sort_order='asc', 
            limit=5
        )
        print(f"   ✓ Query successful! Found {len(result)} VMs")
        
        # Test query with multiple parameters
        print("3. Testing query with multiple parameters...")
        result = duckdb_loader.query_vms(
            min_vcpus=4,
            max_vcpus=16,
            min_memory=8,
            max_price=1.0,
            sort_by='price',
            sort_order='asc',
            limit=10
        )
        print(f"   ✓ Multi-parameter query successful! Found {len(result)} VMs")
        
        # Test query with providers filter
        print("4. Testing query with providers filter...")
        result = duckdb_loader.query_vms(
            providers=['aws', 'azure'],
            min_vcpus=8,
            limit=5
        )
        print(f"   ✓ Providers filter query successful! Found {len(result)} VMs")
        
        # Test get_vm_by_details
        print("5. Testing get_vm_by_details...")
        result = duckdb_loader.get_vm_by_details('aws', 'a1.2xlarge', 'us-east-1')
        print(f"   ✓ VM details query successful! Found {len(result)} VMs")
        
        # Test get_regions
        print("6. Testing get_regions...")
        regions = duckdb_loader.get_regions('aws')
        print(f"   ✓ Regions query successful! Found {len(regions)} regions")
        
        # Test VM service filtered count
        print("7. Testing VM service filtered count...")
        count = duckdb_vm_service._get_filtered_count(
            min_vcpus=10,
            max_price=2.0
        )
        print(f"   ✓ Filtered count query successful! Count: {count}")
        
        print("\n🎉 All tests passed! The parameter fix is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        logger.exception("Test failed")
        return False
    
    finally:
        # Clean up
        duckdb_loader.close()

if __name__ == "__main__":
    success = test_parameter_fix()
    exit(0 if success else 1)
