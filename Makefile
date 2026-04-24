# Makefile — Chifoumi Ranked (Backend)

.PHONY: help install db-up db-down test test-e2e lint build dev api front full-run

# Afficher l'aide
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install    Installe les dépendances via Yarn"
	@echo "  db-up      Lance la base de données PostgreSQL (Docker)"
	@echo "  db-down    Arrête les services Docker"
	@echo "  test       Lance les tests unitaires"
	@echo "  test-e2e   Lance les tests de bout en bout (e2e)"
	@echo "  lint       Vérifie et corrige le style du code"
	@echo "  build      Compile le projet"
	@echo "  api        Lance l'API NestJS en mode watch"
	@echo "  front      Lance le serveur de fichiers pour le frontend"
	@echo "  dev        Lance tout l'environnement de dev (DB + API + Front)"
	@echo "  full-run   Installation complète, tests et lancement"

install:
	yarn install

db-up:
	docker-compose up -d db

db-down:
	docker-compose down

test:
	yarn test

test-e2e:
	yarn test:e2e

lint:
	yarn lint

build:
	yarn build

api:
	yarn start:dev

front:
	yarn front

dev: db-up
	yarn dev

full-run: install db-up test dev

