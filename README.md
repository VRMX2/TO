# CyberGameGT

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Docker Build Check](https://github.com/OWNER/REPO/actions/workflows/docker-build-check.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/docker-build-check.yml)

CyberGameGT is an educational platform for demonstrating Game Theory and AI-driven Cyber Security defense strategies.

## 🔒 Security (v2.1)

- **API key auth**: set `API_KEY` in `backend/.env` and the same value in `web/.env.local` as `VITE_API_KEY`. When set, all routes except `/health` and `/ready` require the `X-API-Key` header.
- **Rate limiting**: global API limit + stricter AI endpoint limits (Groq abuse protection).
- **Input validation**: matrix size caps, typed network/AI payloads, safe 500 errors in production (`DEBUG=false`).
- **Headers**: security headers on API responses and nginx (prod).
- **Production**: backend is not published on port 8000 in `docker-compose.prod.yml` — only nginx exposes the app.

Copy `backend/.env.example` → `backend/.env` and `web/.env.example` → `web/.env.local` before deploying.

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- pip
- npm

### 1. Backend Setup

Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Install frontend dependencies:
```bash
cd web
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 3. Docker Backend Build

From the repository root:

```bash
docker build -f backend/Dockerfile -t cybergame-backend backend
```

Alternative backend Dockerfile:

```bash
docker build -f backend/venv/Dockerfile -t cybergame-backend-venv backend
```

### 4. Run Full Stack with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:
- Backend API: `http://localhost:8000`
- Web App: `http://localhost:5173`

### 4.b Production Compose (Static Web + Nginx)

From the repository root:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Production stack services:
- Backend API: `http://localhost:8000`
- Web (Nginx static): `http://localhost:5173`

### 5. Handy Makefile Commands

```bash
make help
make up
make down
make build
make logs
make up-prod
make down-prod
make build-prod
make logs-prod
```

## 🛠️ Usage

### Network Dashboard
The dashboard visualizes a simulated network with:
- **Nodes**: Endpoints, Servers, Core, Firewall.
- **Links**: Connections between nodes.
- **AI Agent Controls**: Compute Nash Equilibrium and run simulations.

### Game Theory Engine
The backend uses Python with NumPy/SciPy to solve mixed-strategy Nash Equilibria.
- **Endpoint**: `http://localhost:8000/game/nash`
- **Request**: `POST` with `payoff_matrix`.
- **Response**: Mixed strategies and equilibrium values.

### Simulation
Run dynamic simulations with the AI agent:
- **Endpoint**: `http://localhost:8000/network/simulate-attack`
- **Request**: `POST` with `topology_type` and `attack_type`.
- **Response**: Attack results and threat level.

## 🚢 Deployment Health Probes

The backend exposes two probe endpoints:

- **Liveness**: `GET /health`
- **Readiness**: `GET /ready`

Use these mappings in deployments:

- `livenessProbe` -> `/health`
- `readinessProbe` -> `/ready`

### Docker (HEALTHCHECK)

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"
```

### Kubernetes Probe Example

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 3
```

## 🧩 Game Description

**Context**: A defender manages a small enterprise network. An attacker attempts to compromise it. The game repeats over rounds, modeling dynamic adaptation.

### 🛡️ Defender Strategies
1. **Firewall**: Static rule updates (Low cost, medium protection).
2. **IDS**: Intrusion Detection System signatures (Medium cost, medium protection).
3. **Patch System**: Deploying security patches (High cost, high protection).
4. **Honey Pot**: Deploying decoy systems (Low cost, low protection).

### ⚔️ Attacker Strategies
1. **SQLi**: SQL Injection (Low cost, medium risk).
2. **DDoS Flood**: Distributed Denial of Service (Medium cost, high risk).
3. **Zero-Day Exploit**: Using unknown vulnerabilities (High cost, critical risk).
4. **Phishing APT**: Advanced Persistent Threat via phishing (Low cost, low risk).

### 💰 Payoff Matrix
Values represent Defender Utility (Risk/Cost).
Attacker aims to minimize this value.

| Attacker \ Defender | Firewall | IDS | Patch System | Honey Pot |
|---------------------|----------|-----|--------------|-----------|
| SQLi                | 35       | 40  | 25           | 45        |
| DDoS Flood          | 65       | 70  | 40           | 75        |
| Zero-Day Exploit    | 80       | 85  | 50           | 90        |
| Phishing APT        | 20       | 25  | 15           | 30        |

### 🔄 Learning Loop
In the **Learning Tab**, the AI agent:
1. Computes the Nash Equilibrium using the current payoff matrix.
2. Simulates attacks and defenses to update threat levels.
3. Learns to adapt strategies based on opponent behavior.
