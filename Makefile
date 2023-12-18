# Executables (local)
DOCKER_COMP = docker compose
DOCKER = docker

# Local makefile targets
-include local.mk

# Misc
.DEFAULT_GOAL = help
.PHONY        = help build up start down logs sh

## —— 🎵 🐳 The docker Makefile 🐳 🎵 ——————————————————————————————————
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— Docker 🐳 ————————————————————————————————————————————————————————————————
build: ## Builds the Docker images
	@$(DOCKER_COMP) --env-file .env build --pull --no-cache

# up-with-update: down-remove-all
# 	@$(DOCKER_COMP) --env-file .env -f docker-compose.yml -f docker-compose.override.yml up -d --build

up: ## Start the docker hub in detached mode (no logs)
	@$(DOCKER_COMP) up --detach

start: build-dev up ## Build and start the containers

down: ## Stop the docker hub
	@$(DOCKER_COMP) down --remove-orphans

restart: down up ## Down and up

down-remove-all: ## Stop and remove the docker hub
	@$(DOCKER_COMP) down --remove-orphans --rmi all -v

dev-remove:
	@$(DOCKER_COMP) rm -fvs

volume-prune:
	@$(DOCKER) volume prune -f

docker-reset-all: down-remove-all dev-remove volume-prune start

restart-app: ## Start the docker hub in detached mode (no logs)
	@$(DOCKER_COMP) restart app

logs: ## Show live logs
	@$(DOCKER_COMP) logs --tail=0 --follow
