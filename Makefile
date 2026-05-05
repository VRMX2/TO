SHELL := /bin/sh

.PHONY: help install-backend install-web up down build logs ps restart lint test run-backend run-web up-prod down-prod build-prod logs-prod

help:
	@echo "Available commands:"
	@echo "  make up            - Start backend + web with Docker Compose"
	@echo "  make down          - Stop Docker Compose services"
	@echo "  make build         - Build Docker images"
	@echo "  make logs          - Follow Docker Compose logs"
	@echo "  make up-prod       - Start production compose stack"
	@echo "  make down-prod     - Stop production compose stack"
	@echo "  make build-prod    - Build production compose images"
	@echo "  make logs-prod     - Follow production compose logs"
	@echo "  make ps            - Show Docker Compose service status"
	@echo "  make restart       - Restart Docker Compose services"
	@echo "  make install-backend - Install backend dependencies locally"
	@echo "  make install-web   - Install web dependencies locally"
	@echo "  make run-backend   - Run backend locally on :8000"
	@echo "  make run-web       - Run web locally on :5173"
	@echo "  make lint          - Run web lint"
	@echo "  make test          - Run backend smoke checks"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

ps:
	docker compose ps

restart:
	docker compose down && docker compose up -d

up-prod:
	docker compose -f docker-compose.prod.yml up -d

down-prod:
	docker compose -f docker-compose.prod.yml down

build-prod:
	docker compose -f docker-compose.prod.yml build

logs-prod:
	docker compose -f docker-compose.prod.yml logs -f

install-backend:
	cd backend && pip install -r requirements.txt

install-web:
	cd web && npm install

run-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-web:
	cd web && npm run dev -- --host 0.0.0.0 --port 5173

lint:
	cd web && npm run lint

test:
	cd backend && python -c "from app.main import app; print('backend ok:', app.title)"
