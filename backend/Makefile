# Cloud VM Comparison API - Development Makefile

.PHONY: help install install-dev run test lint format clean build docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install production dependencies"
	@echo "  install-dev  - Install development dependencies"
	@echo "  run          - Run the API server"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linting checks"
	@echo "  format       - Format code with black"
	@echo "  clean        - Clean up temporary files"
	@echo "  build        - Build the package"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"

# Installation
install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt
	pip install -e ".[dev]"

# Development
run:
	python main.py

test:
	python -m pytest tests/ -v

lint:
	flake8 src/ tests/ main.py
	mypy src/ main.py

format:
	black src/ tests/ main.py setup.py

# Cleanup
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/

# Build
build: clean
	python setup.py sdist bdist_wheel

# Docker
docker-build:
	docker build -t cloud-vm-api .

docker-run:
	docker run -p 8000:8000 cloud-vm-api

# Database operations
reload-data:
	curl -X POST http://localhost:8000/reload

health-check:
	curl http://localhost:8000/health

# Development server with auto-reload
dev:
	uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
