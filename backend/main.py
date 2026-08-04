from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
import sqlite3, json, os, hashlib, jwt, re
from pathlib import Path

app = FastAPI(title="CareerBoost AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://careerboost-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
SECRET_KEY = "careerboost-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DB_PATH = Path(__file__).parent / "database.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT,
        raw_text TEXT,
        skills TEXT,
        experience_years INTEGER DEFAULT 0,
        education TEXT,
        ats_score INTEGER DEFAULT 0,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'Applied',
        applied_date TEXT,
        notes TEXT,
        url TEXT,
        salary TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        done INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'Medium',
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)
    conn.commit()
    conn.close()

init_db()

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

def create_token(data: dict):
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        db.close()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

SKILL_KEYWORDS = [
    "python","javascript","typescript","react","vue","angular","node","fastapi",
    "django","flask","sql","postgresql","mysql","mongodb","redis","docker",
    "kubernetes","aws","azure","gcp","git","linux","java","c++","c#","go",
    "rust","swift","kotlin","flutter","machine learning","deep learning",
    "tensorflow","pytorch","scikit-learn","pandas","numpy","tableau","power bi",
    "figma","photoshop","agile","scrum","jira","rest api","graphql","html","css",
]

def extract_skills(text: str):
    text_lower = text.lower()
    return [s.title() for s in SKILL_KEYWORDS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]

def calc_ats_score(text: str, skills: list):
    score = 0
    if skills: score += min(len(skills) * 3, 35)
    if re.search(r'\b\d{4}\b', text): score += 10
    if re.search(r'(experience|work|employment)', text, re.I): score += 15
    if re.search(r'(education|degree|university|college)', text, re.I): score += 15
    if re.search(r'(project|portfolio|built|developed)', text, re.I): score += 10
    if re.search(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', text): score += 10
    if re.search(r'\b\d{10}\b|\+\d{1,3}[\s-]\d+', text): score += 5
    return min(score, 100)

def extract_experience(text: str):
    matches = re.findall(r'(\d+)\+?\s*years?', text, re.I)
    return max([int(m) for m in matches], default=0)

from pydantic import BaseModel

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

@app.post("/api/auth/register")
def register(body: RegisterBody):
    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email=?", (body.email,)).fetchone()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.execute("INSERT INTO users(name,email,password) VALUES(?,?,?)",
               (body.name, body.email, hash_password(body.password)))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE email=?", (body.email,)).fetchone()
    db.close()
    token = create_token({"user_id": user["id"], "email": user["email"]})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND password=?",
                      (form.username, hash_password(form.password))).fetchone()
    db.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"user_id": user["id"], "email": user["email"]})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@app.get("/api/auth/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "name": current_user["name"], "email": current_user["email"]}

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    content = await file.read()
    try:
        import pdfplumber, io
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception:
        text = content.decode("utf-8", errors="ignore")
    skills = extract_skills(text)
    ats = calc_ats_score(text, skills)
    exp = extract_experience(text)
    db = get_db()
    db.execute(
        "INSERT INTO resumes(user_id,filename,raw_text,skills,ats_score,experience_years) VALUES(?,?,?,?,?,?)",
        (current_user["id"], file.filename, text, json.dumps(skills), ats, exp)
    )
    db.commit()
    row = db.execute("SELECT * FROM resumes WHERE user_id=? ORDER BY id DESC LIMIT 1",
                     (current_user["id"],)).fetchone()
    db.close()
    r = dict(row)
    r["skills"] = json.loads(r["skills"] or "[]")
    return r

@app.get("/api/resume/latest")
def get_latest_resume(current_user=Depends(get_current_user)):
    db = get_db()
    row = db.execute("SELECT * FROM resumes WHERE user_id=? ORDER BY id DESC LIMIT 1",
                     (current_user["id"],)).fetchone()
    db.close()
    if not row:
        return None
    r = dict(row)
    r["skills"] = json.loads(r["skills"] or "[]")
    return r

class JobBody(BaseModel):
    company: str
    role: str
    status: str = "Applied"
    applied_date: Optional[str] = None
    notes: Optional[str] = None
    url: Optional[str] = None
    salary: Optional[str] = None

@app.get("/api/jobs")
def get_jobs(current_user=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("SELECT * FROM jobs WHERE user_id=? ORDER BY created_at DESC",
                      (current_user["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/api/jobs")
def add_job(body: JobBody, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute(
        "INSERT INTO jobs(user_id,company,role,status,applied_date,notes,url,salary) VALUES(?,?,?,?,?,?,?,?)",
        (current_user["id"], body.company, body.role, body.status,
         body.applied_date, body.notes, body.url, body.salary)
    )
    db.commit()
    row = db.execute("SELECT * FROM jobs WHERE user_id=? ORDER BY id DESC LIMIT 1",
                     (current_user["id"],)).fetchone()
    db.close()
    return dict(row)

@app.put("/api/jobs/{job_id}")
def update_job(job_id: int, body: JobBody, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute(
        "UPDATE jobs SET company=?,role=?,status=?,applied_date=?,notes=?,url=?,salary=? WHERE id=? AND user_id=?",
        (body.company, body.role, body.status, body.applied_date,
         body.notes, body.url, body.salary, job_id, current_user["id"])
    )
    db.commit()
    row = db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    db.close()
    return dict(row)

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute("DELETE FROM jobs WHERE id=? AND user_id=?", (job_id, current_user["id"]))
    db.commit()
    db.close()
    return {"ok": True}

class TodoBody(BaseModel):
    title: str
    category: str = "General"
    priority: str = "Medium"
    due_date: Optional[str] = None

@app.get("/api/todos")
def get_todos(current_user=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("SELECT * FROM todos WHERE user_id=? ORDER BY created_at DESC",
                      (current_user["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/api/todos")
def add_todo(body: TodoBody, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute(
        "INSERT INTO todos(user_id,title,category,priority,due_date) VALUES(?,?,?,?,?)",
        (current_user["id"], body.title, body.category, body.priority, body.due_date)
    )
    db.commit()
    row = db.execute("SELECT * FROM todos WHERE user_id=? ORDER BY id DESC LIMIT 1",
                     (current_user["id"],)).fetchone()
    db.close()
    return dict(row)

@app.patch("/api/todos/{todo_id}/toggle")
def toggle_todo(todo_id: int, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute(
        "UPDATE todos SET done = CASE WHEN done=1 THEN 0 ELSE 1 END WHERE id=? AND user_id=?",
        (todo_id, current_user["id"])
    )
    db.commit()
    row = db.execute("SELECT * FROM todos WHERE id=?", (todo_id,)).fetchone()
    db.close()
    return dict(row)

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute("DELETE FROM todos WHERE id=? AND user_id=?", (todo_id, current_user["id"]))
    db.commit()
    db.close()
    return {"ok": True}

QUESTIONS_BY_ROLE = {
    "default": [
        "Tell me about yourself and your background.",
        "What is your greatest professional strength?",
        "Describe a challenging project and how you handled it.",
        "Where do you see yourself in 5 years?",
        "Why do you want to work here?",
    ],
    "software": [
        "Explain the difference between REST and GraphQL.",
        "What is Big-O notation? Give an example.",
        "How do you approach debugging a production issue?",
        "Describe your experience with CI/CD pipelines.",
        "What design patterns have you used in real projects?",
    ],
    "data": [
        "Explain overfitting and how to prevent it.",
        "What's the difference between supervised and unsupervised learning?",
        "How do you handle missing data in a dataset?",
        "Describe a model you built end-to-end.",
        "What evaluation metrics would you choose for a classification problem?",
    ],
}

@app.get("/api/interview/questions")
def get_questions(role: str = "default", current_user=Depends(get_current_user)):
    key = "software" if "software" in role.lower() or "engineer" in role.lower() or "developer" in role.lower() \
        else "data" if "data" in role.lower() or "ml" in role.lower() or "analyst" in role.lower() \
        else "default"
    return {"questions": QUESTIONS_BY_ROLE["default"] + QUESTIONS_BY_ROLE[key]}

@app.get("/api/dashboard")
def dashboard(current_user=Depends(get_current_user)):
    db = get_db()
    uid = current_user["id"]
    jobs = [dict(r) for r in db.execute("SELECT * FROM jobs WHERE user_id=?", (uid,)).fetchall()]
    todos = [dict(r) for r in db.execute("SELECT * FROM todos WHERE user_id=?", (uid,)).fetchall()]
    resume = db.execute("SELECT * FROM resumes WHERE user_id=? ORDER BY id DESC LIMIT 1", (uid,)).fetchone()
    db.close()
    status_counts = {}
    for j in jobs:
        status_counts[j["status"]] = status_counts.get(j["status"], 0) + 1
    return {
        "total_jobs": len(jobs),
        "status_breakdown": status_counts,
        "todos_done": sum(1 for t in todos if t["done"]),
        "todos_total": len(todos),
        "ats_score": resume["ats_score"] if resume else 0,
        "skills_count": len(json.loads(resume["skills"] or "[]")) if resume else 0,
        "recent_jobs": jobs[:5],
    }

from fastapi.responses import StreamingResponse
import csv, io

@app.get("/api/export/jobs")
def export_jobs(current_user=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("SELECT company,role,status,applied_date,salary,notes,url FROM jobs WHERE user_id=?",
                      (current_user["id"],)).fetchall()
    db.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Company", "Role", "Status", "Applied Date", "Salary", "Notes", "URL"])
    for r in rows:
        writer.writerow(list(r))
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=jobs.csv"})
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "CareerBoost AI Backend is running"
    }
