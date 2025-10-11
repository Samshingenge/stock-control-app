SHELL := /bin/bash
.ONESHELL:

.PHONY: up down logs seed test fmt lint

up:
	docker compose --env-file .env up -d --build

logs:
	docker compose logs -f --tail=100

down:
	docker compose down -v

seed:
	curl -X POST http://localhost:8000/dev/seed || true

test:
	docker compose exec backend pytest -q

fmt:
	docker compose exec backend bash -lc "ruff check --select I --fix . && ruff format ."

lint:
	docker compose exec backend ruff check .
