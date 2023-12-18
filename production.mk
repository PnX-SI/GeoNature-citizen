production-build:
	@$(DOCKER_COMP) --env-file .env --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml build --pull --no-cache

production-up: ## Start the docker hub in detached mode (no logs)
	@$(DOCKER_COMP) --env-file .env --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up --detach
