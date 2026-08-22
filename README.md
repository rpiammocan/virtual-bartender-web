# Virtual Bartender — Web Edition

Virtual Bartender Web is the browser-hosted edition of Virtual Bartender.

## 🍸 Open the Live Application

### [Launch Virtual Bartender](https://rpiammocan.github.io/virtual-bartender-web/)

It is a standalone Web target alongside the CasaOS, Windows, and Android editions. Users open Virtual Bartender in a normal desktop or mobile browser; CasaOS is not required.

## Current status

Web V1 is under active development and hardening. The application reuses the proven Virtual Bartender React frontend and FastAPI backend, with Web-specific deployment, persistence, PWA support, and automated functional testing.

## Architecture

- React + TypeScript frontend
- FastAPI backend
- SQLite persistent data
- Docker Compose Web deployment
- Nginx frontend proxy for `/api/` and `/media/`
- Installable PWA metadata/service worker

## Development history

The initial Web V1 work was developed and tested on the `agent/web-edition` branch of the CasaOS repository before being migrated into this dedicated repository.
