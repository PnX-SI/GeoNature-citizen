# Define variables
APP_NAME := myproject
BACKEND_DIR := backend
FRONTEND_DIR := frontend
DOCKER_IMAGE_BACKEND := $(APP_NAME)-backend
DOCKER_IMAGE_FRONTEND := $(APP_NAME)-frontend
DOCKER_COMPOSE_FILE := docker-compose.yml

# Phony targets
.PHONY: all install-dependencies generate-requirements build docker-start clean

# Default target
all: install-dependencies generate-requirements build docker-start

# Install dependencies for frontend and backend
install-dependencies:
	cd $(BACKEND_DIR) && \
		if [ -f poetry.lock ]; then \
			poetry install; \
		elif [ -f requirements.txt ]; then \
			pip install -r requirements.txt; \
		fi
	cd $(FRONTEND_DIR) && npm install

# Generate Python requirements files
generate-requirements:
	cd $(BACKEND_DIR) && \
		poetry export -f requirements.txt -o requirements.txt --without-hashes && \
		poetry export -f requirements.txt --only=dev -o requirements-dev.txt --without-hashes && \
		poetry export -f requirements.txt --only=docs -o requirements-docs.txt --without-hashes

# Build Docker images for backend and frontend
build:
	docker build -t $(DOCKER_IMAGE_BACKEND) -f $(BACKEND_DIR)/Dockerfile $(BACKEND_DIR)
	docker build -t $(DOCKER_IMAGE_FRONTEND) -f $(FRONTEND_DIR)/Dockerfile $(FRONTEND_DIR)

# Start project using docker-compose
docker-start:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

# Clean up Docker containers and images
clean:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down
	docker rmi $(DOCKER_IMAGE_BACKEND) $(DOCKER_IMAGE_FRONTEND)
