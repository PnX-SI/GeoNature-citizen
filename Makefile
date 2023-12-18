# Misc
.DEFAULT_GOAL = help
.PHONY        = help build up start down logs sh

# Executables (local)
DOCKER_COMP = docker compose
DOCKER = docker
DOCKER_COMP_ENV = --env-file .env
DOCKER_COMP_FILES = -f docker-compose.yml -f docker-compose.override.yml

# Include "local" configuration
-include local.mk
-include .env.local
ifneq (,$(wildcard ./.env.local))
DOCKER_COMP_ENV = --env-file .env --env-file .env.local
endif

# Include "production" configuration
include production.mk

## —— 🎵 🐳 The docker Makefile 🐳 🎵 ——————————————————————————————————
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— Docker 🐳 ————————————————————————————————————————————————————————————————
build: build-dev ## Builds the Docker images

up: up-dev ## Start the docker hub in detached mode (no logs)

start: build up ## Build and start the containers

down: ## Stop the docker hub
	@$(DOCKER_COMP) down --remove-orphans

down-remove-all: ## Stop and remove the docker hub
	@$(DOCKER_COMP) down --remove-orphans --rmi all -v

dev-remove: ## remove fvs
	@$(DOCKER_COMP) rm -fvs

volume-prune:  ## volume prune
	@$(DOCKER) volume prune -f

docker-reset-all: down-remove-all dev-remove volume-prune start ## Remove all, prune volumes and 

build-dev: ## Builds the Docker images if ENV variable is set
ifdef ENV_LOCAL_DEFINED
	@$(DOCKER_COMP) $(DOCKER_COMP_ENV) $(DOCKER_COMP_FILES) build --pull --no-cache
else
	@$(DOCKER_COMP) $(DOCKER_COMP_ENV) $(DOCKER_COMP_FILES) build --pull --no-cache
endif

up-dev: ## Builds the Docker images if ENV variable is set
ifdef ENV_LOCAL_DEFINED
	@$(DOCKER_COMP) $(DOCKER_COMP_ENV) $(DOCKER_COMP_FILES) up --detach --build
else
	@$(DOCKER_COMP) $(DOCKER_COMP_ENV) $(DOCKER_COMP_FILES) up --detach --build
endif