.PHONY: help install lint test build plan deploy-dev deploy-prod clean docker-local docker-push

# ---------- Helpers ----------
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ---------- Local dev ----------
install: ## Install all dependencies (Python + Node)
	cd apps/agents && uv sync
	cd apps/web && npm install

lint: ## Lint everything
	cd apps/agents && ruff check .
	cd apps/web && npm run lint

test: ## Run all tests
	cd apps/agents && pytest
	cd apps/web && npm test -- --watchAll=false

# ---------- SAM ----------
plan: ## SAM plan against dev stack
	cd infra/sam && sam build && sam deploy --config-env dev --no-execute-changeset

deploy-dev: ## Deploy to dev
	cd infra/sam && sam build && sam deploy --config-env dev

deploy-prod: ## Deploy to prod (manual approval)
	cd infra/sam && sam build && sam deploy --config-env prod

# ---------- Docker ----------
docker-local: ## Run frontend + landing locally via Docker
	docker compose -f docker/docker-compose.yml up

docker-push: ## Build and push all images to ECR
	./scripts/docker-push.sh

# ---------- Cleanup ----------
clean: ## Remove build artifacts
	rm -rf infra/sam/.aws-sam
	rm -rf apps/web/node_modules
	rm -rf apps/agents/.venv
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
