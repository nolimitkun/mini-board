#!/usr/bin/env python3
"""
Simple test script for the Cloud VM Comparison API
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint: str, method: str = "GET", data: Dict[Any, Any] = None) -> None:
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        else:
            print(f"Unsupported method: {method}")
            return
        
        print(f"\n{'='*60}")
        print(f"Testing: {method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)[:500]}...")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {BASE_URL}")
        print("Make sure the API server is running with: python main.py")
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Run API tests"""
    print("Testing Cloud VM Comparison API")
    print(f"Base URL: {BASE_URL}")
    
    # Test basic endpoints
    test_endpoint("/")
    test_endpoint("/health")
    test_endpoint("/providers")
    test_endpoint("/stats")
    
    # Test VMs endpoint with filters
    test_endpoint("/vms?limit=5")
    test_endpoint("/vms?providers=aws,azure&limit=3")
    test_endpoint("/vms?has_gpu=true&limit=3")
    test_endpoint("/vms?min_vcpus=4&max_price=1.0&limit=3")
    
    # Test regions
    test_endpoint("/regions")
    test_endpoint("/regions?provider=aws")
    
    # Test VM comparison
    compare_data = {
        "vms": [
            {
                "provider": "aws",
                "instance_type": "m5.large",
                "region": "us-east-1"
            },
            {
                "provider": "azure",
                "instance_type": "Standard_D2s_v3",
                "region": "eastus"
            }
        ]
    }
    test_endpoint("/vms/compare", "POST", compare_data)
    
    # Test recommendations
    recommendation_data = {
        "requirements": {
            "min_vcpus": 2,
            "min_memory": 4,
            "max_budget": 0.5,
            "workload_type": "balanced"
        }
    }
    test_endpoint("/vms/recommendations", "POST", recommendation_data)

if __name__ == "__main__":
    main()
