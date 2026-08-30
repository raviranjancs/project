# AI-Based Disaster Response Management System for Resource Allocation and Relief Coordination

A full-stack disaster response management platform using **FastAPI**, **Neon Serverless PostgreSQL (PostGIS)**, **XGBoost/scikit-learn**, **Google OR-Tools**, and **React.js + Leaflet.js**.

---

## 🚀 Neon PostgreSQL Database Configuration

1. Log in to your [Neon Console](https://console.neon.tech/).
2. Create or select your database project (e.g., `disaster_db`).
3. Copy the Connection String URI from the dashboard:
   ```text
   postgresql://[user]:[password]@[ep-xyz].us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Create a `.env` file in `backend/` and insert:
   ```env
   DATABASE_URL=postgresql+psycopg2://[user]:[password]@[ep-xyz].us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## 🛠️ Step-by-Step Execution Guide

### 1. Backend Setup & Neon DB Seeding
```bash
cd backend
python -m venv venv
# Linux / macOS:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

pip install -r requirements.txt

# Run the Neon database seed script:
python seed_neon_db.py

# Start FastAPI server:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API: `http://localhost:8000/docs`

### 2. Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev
```
- Dashboard URL: `http://localhost:5173`
