# CyberGameGT

CyberGameGT is an educational platform for demonstrating Game Theory and AI-driven Cyber Security defense strategies.

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
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

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
