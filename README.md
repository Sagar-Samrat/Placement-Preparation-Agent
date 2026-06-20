# Placement Preparation Agent

PrepAgent AI is a premium, full-stack career preparation application. It parses candidate resumes, computes ATS keyword matches and skill gap calculations against company presets or custom JDs, creates personalized 30/60/90-day learning roadmaps, conducts interactive mock interviews round-by-round, and aggregates student stats into a modern analytics dashboard.

---

## System Architecture Overview

The system is designed as a decoupled modern Monorepo:

1. **Backend Server (FastAPI)**:
   - Built on FastAPI for async network execution.
   - Connected asynchronously to MongoDB using the **Motor** driver.
   - Core parser extracts raw text from PDF and DOCX uploads using `pypdf` and `python-docx`.
   - Utilizes Google Gemini API (or OpenAI GPT) to perform structured entity extraction, skill mapping, roadmap curricula generation, and real-time response grading.
   - Secures routes with JWT Bearer tokens and bcrypt password hashing.

2. **Frontend UI client (React + Vite)**:
   - Created with Vite + React SPA for performance and hot reload.
   - Configured with Tailwind CSS v3 for responsive layout and animations.
   - Displays real-time preparation metrics and interview score trends via **Recharts** visualizations.
   - Interacts with APIs using a token-injected **Axios** client layer.

---

## Directory Structure

```text
Placement Preparation Agent/
├── backend/
│   ├── app/
│   │   ├── config.py             # Loads environment variables
│   │   ├── database.py           # MongoDB connection helper
│   │   ├── main.py               # FastAPI server entry point
│   │   ├── models/               # Pydantic schemas (User, Resume, Roadmap, etc.)
│   │   ├── routes/               # API Router endpoints (auth, gap check, interviews)
│   │   ├── services/             # LLM configurations & PDF text parsers
│   │   └── utils/                # Security helpers & logger configurations
│   ├── requirements.txt          # Python requirements
│   └── .env                      # Active local variables
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Protected route wrappers
│   │   ├── context/              # React AuthContext session manager
│   │   ├── pages/                # Login, Dashboard, Mock Interview, Roadmap, etc.
│   │   └── services/             # Axios API client requests definition
│   ├── tailwind.config.js        # Tailwind v3 layout boundaries
│   ├── postcss.config.js         # CSS compiler hooks
│   └── package.json              # NPM script dependencies
└── README.md                     # Documentation
```

---

## Database Schema (MongoDB Collections)

- **`users`**: User registration records, email index, password hashes.
- **`resumes`**: Extracted text and parsed JSON profiles of education, skills, projects, and work experience.
- **`companies`**: Preset databases containing required skills.
- **`job_descriptions`**: Text of custom job descriptions pasted by users and parsed target skills.
- **`skill_analysis`**: Matching/missing listings and computed ATS scores.
- **`roadmaps`**: Task lists representing study materials.
- **`interviews`**: Question arrays, user answers, and step-by-step evaluations.
- **`interview_results`**: Average metrics of accuracy, confidence, and final scores.

---

## Local Setup & Run Instructions

### Prerequisites
- Python 3.9+
- Node.js v18+ & npm
- MongoDB running locally (e.g., `mongodb://localhost:27017`)

---

### 1. Running the FastAPI Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file from the template (fill in your Gemini or OpenAI API keys):
   ```bash
   cp .env.example .env
   ```

5. Run the local backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The Swagger interactive documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

---

### 2. Running the React Frontend

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Start the Vite local server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to [http://localhost:5173](http://localhost:5173).*

---

## Production Deployment Notes

1. **Docker**: You can build separate containers for FastAPI (`Dockerfile` running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and React (static build hosted on Nginx or static provider).
2. **MongoDB**: Swap local MongoDB connection string with an Atlas production database URI inside your `.env` environment variables.
3. **Environment**: Replace `JWT_SECRET` with a secure random key. Change CORS settings in `app/main.py` from `*` wildcard to your specific domain address.
