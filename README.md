# MedLens — AI-Powered Clinical Information Intelligence

MedLens is a clinical information intelligence platform engineered to transform unstructured laboratory reports and patient documentation into structured, audited patient records.

---

## 📁 Intuitive Project Directory Structure

```
medlens-clinical-information-intelligence/
├── 🎨 frontend/                     # All React 19 Frontend UI Code
│   ├── public/                      # Static assets & images
│   ├── src/                         # React components, pages & styles
│   │   ├── components/              # UI Components (Navbar, LabTable, AnatomyViewer3D, etc.)
│   │   ├── context/                 # Application state management (PatientContext)
│   │   ├── pages/                   # Views (Home, Patients, Record, Report, Anatomy, Evaluator)
│   │   ├── api.ts                   # API connection helper
│   │   ├── App.tsx                  # Main router setup
│   │   ├── main.tsx                 # React DOM entry point
│   │   └── types.ts                 # Data models & interfaces
│   ├── index.html                   # Web application entry point
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript settings
│   └── package.json                 # Frontend dependencies & scripts
│
├── ⚙️ backend/                      # All Backend API Code
│   ├── node-express/                # Node.js + Express Server (with Gemini AI Integration)
│   │   ├── server.ts                # Express REST API & Vite integration
│   │   └── package.json             # Express dependencies & scripts
│   └── python-fastapi/              # Standalone Python FastAPI + SQLAlchemy Server
│       ├── app/                     # API routers, database models & Pydantic schemas
│       ├── requirements.txt         # Python dependencies
│       └── .env.example             # Python environment template
│
├── .env.example                     # Root environment template
├── .gitignore                       # Git ignore list
├── package.json                     # Root launcher scripts
└── README.md                        # Project documentation
```

---

## 🚀 Easy Quick-Start Guide for Beginners

### Option 1: Express Server + React (Single Launcher)

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ../backend/node-express
   npm install
   cd ../..
   ```

2. **Configure Gemini API Key (Optional):**
   Create a `.env` file in the root folder:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server:**
   From the root folder, run:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

### Option 2: Run Frontend UI Alone (Standalone Vite)

1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

### Option 3: Python FastAPI Backend

1. Navigate to `backend/python-fastapi`:
   ```bash
   cd backend/python-fastapi
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   # source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Start the FastAPI Server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Open Swagger UI at `http://localhost:8000/docs`.

---

## 🌟 Key Features

1. **Multi-Patient Cohort Management**
2. **Deterministic Lab Range Engine** (Zero numerical hallucination risk)
3. **Interactive 3D Human Anatomy Viewer** (Powered by Three.js & React Three Fiber)
4. **Cross-Document Safety & Drug-Allergy Warning Engine**
5. **Non-Diagnostic Patient Summary & Clinician Q&A Generator**
