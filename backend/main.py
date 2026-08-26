from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse

from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel

import hashlib
import jwt
import re
import json
import csv
import io

from bson import ObjectId

from database import (
    db,
    users_collection,
    resumes_collection,
    jobs_collection,
    todos_collection
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="CareerBoost AI",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://careerboostai01.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "careerboost-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


# ============================================================
# MONGODB HELPERS
# ============================================================

def convert_object_id(value: str):
    """
    Convert a string ID into MongoDB ObjectId.
    """
    try:
        return ObjectId(value)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid ID"
        )


def serialize_document(document):
    """
    Convert MongoDB ObjectId into a normal string ID
    so React/FastAPI can work with it.
    """

    if not document:
        return None

    document = dict(document)

    if "_id" in document:
        document["id"] = str(document["_id"])
        del document["_id"]

    if "user_id" in document:
        document["user_id"] = str(document["user_id"])

    return document


# ============================================================
# AUTH HELPERS
# ============================================================

def hash_password(password: str):
    return hashlib.sha256(
        password.encode()
    ).hexdigest()


def create_token(data: dict):

    expiration = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        **data,
        "exp": expiration
    }

    return jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        try:

            object_id = ObjectId(user_id)

        except Exception:

            raise HTTPException(
                status_code=401,
                detail="Invalid user ID"
            )

        user = users_collection.find_one({
            "_id": object_id
        })

        if not user:

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# ============================================================
# RESUME PARSER
# ============================================================

SKILL_KEYWORDS = [

    "python",
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "node",
    "fastapi",
    "django",
    "flask",

    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",

    "docker",
    "kubernetes",

    "aws",
    "azure",
    "gcp",

    "git",
    "linux",

    "java",
    "c++",
    "c#",
    "go",
    "rust",

    "swift",
    "kotlin",
    "flutter",

    "machine learning",
    "deep learning",

    "tensorflow",
    "pytorch",
    "scikit-learn",

    "pandas",
    "numpy",

    "tableau",
    "power bi",

    "figma",
    "photoshop",

    "agile",
    "scrum",
    "jira",

    "rest api",
    "graphql",

    "html",
    "css"
]


def extract_skills(text: str):

    text_lower = text.lower()

    return [
        skill.title()
        for skill in SKILL_KEYWORDS
        if re.search(
            r"\b" + re.escape(skill) + r"\b",
            text_lower
        )
    ]


def calc_ats_score(text: str, skills: list):

    score = 0

    if skills:

        score += min(
            len(skills) * 3,
            35
        )

    if re.search(r"\b\d{4}\b", text):

        score += 10

    if re.search(
        r"(experience|work|employment)",
        text,
        re.I
    ):

        score += 15

    if re.search(
        r"(education|degree|university|college)",
        text,
        re.I
    ):

        score += 15

    if re.search(
        r"(project|portfolio|built|developed)",
        text,
        re.I
    ):

        score += 10

    if re.search(
        r"[\w.+-]+@[\w-]+\.[a-z]{2,}",
        text
    ):

        score += 10

    if re.search(
        r"\b\d{10}\b|\+\d{1,3}[\s-]\d+",
        text
    ):

        score += 5

    return min(score, 100)


def extract_experience(text: str):

    matches = re.findall(
        r"(\d+)\+?\s*years?",
        text,
        re.I
    )

    return max(
        [int(match) for match in matches],
        default=0
    )


# ============================================================
# AUTH MODELS
# ============================================================

class RegisterBody(BaseModel):

    name: str
    email: str
    password: str


# ============================================================
# REGISTER
# ============================================================

@app.post("/api/auth/register")
def register(body: RegisterBody):

    existing_user = users_collection.find_one({
        "email": body.email
    })

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "created_at": datetime.utcnow()
    }

    try:

        result = users_collection.insert_one(user)

    except Exception as error:

        if "duplicate key" in str(error).lower():

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        raise HTTPException(
            status_code=500,
            detail="Could not create user"
        )

    token = create_token({
        "user_id": str(result.inserted_id),
        "email": body.email
    })

    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": body.name,
            "email": body.email
        }
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(
    form: OAuth2PasswordRequestForm = Depends()
):

    user = users_collection.find_one({
        "email": form.username,
        "password": hash_password(form.password)
    })

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_token({
        "user_id": str(user["_id"]),
        "email": user["email"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/api/auth/me")
def me(
    current_user=Depends(get_current_user)
):

    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"]
    }


# ============================================================
# RESUME UPLOAD
# ============================================================

@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):

    content = await file.read()

    try:

        import pdfplumber

        with pdfplumber.open(
            io.BytesIO(content)
        ) as pdf:

            text = "\n".join(
                page.extract_text() or ""
                for page in pdf.pages
            )

    except Exception:

        text = content.decode(
            "utf-8",
            errors="ignore"
        )

    skills = extract_skills(text)

    ats_score = calc_ats_score(
        text,
        skills
    )

    experience = extract_experience(text)

    resume = {
        "user_id": current_user["_id"],
        "filename": file.filename,
        "raw_text": text,
        "skills": skills,
        "experience_years": experience,
        "education": "",
        "ats_score": ats_score,
        "uploaded_at": datetime.utcnow()
    }

    result = resumes_collection.insert_one(
        resume
    )

    saved_resume = resumes_collection.find_one({
        "_id": result.inserted_id
    })

    return serialize_document(
        saved_resume
    )


# ============================================================
# GET LATEST RESUME
# ============================================================

@app.get("/api/resume/latest")
def get_latest_resume(
    current_user=Depends(get_current_user)
):

    resume = resumes_collection.find_one(
        {
            "user_id": current_user["_id"]
        },
        sort=[
            ("uploaded_at", -1)
        ]
    )

    if not resume:
        return None

    return serialize_document(resume)


# ============================================================
# JOB MODEL
# ============================================================

class JobBody(BaseModel):

    company: str
    role: str
    status: str = "Applied"
    applied_date: Optional[str] = None
    notes: Optional[str] = None
    url: Optional[str] = None
    salary: Optional[str] = None


# ============================================================
# GET JOBS
# ============================================================

@app.get("/api/jobs")
def get_jobs(
    current_user=Depends(get_current_user)
):

    jobs = jobs_collection.find(
        {
            "user_id": current_user["_id"]
        }
    ).sort(
        "created_at",
        -1
    )

    return [
        serialize_document(job)
        for job in jobs
    ]


# ============================================================
# ADD JOB
# ============================================================

@app.post("/api/jobs")
def add_job(
    body: JobBody,
    current_user=Depends(get_current_user)
):

    job = {
        "user_id": current_user["_id"],
        "company": body.company,
        "role": body.role,
        "status": body.status,
        "applied_date": body.applied_date,
        "notes": body.notes,
        "url": body.url,
        "salary": body.salary,
        "created_at": datetime.utcnow()
    }

    result = jobs_collection.insert_one(
        job
    )

    saved_job = jobs_collection.find_one({
        "_id": result.inserted_id
    })

    return serialize_document(
        saved_job
    )


# ============================================================
# UPDATE JOB
# ============================================================

@app.put("/api/jobs/{job_id}")
def update_job(
    job_id: str,
    body: JobBody,
    current_user=Depends(get_current_user)
):

    object_id = convert_object_id(job_id)

    result = jobs_collection.update_one(
        {
            "_id": object_id,
            "user_id": current_user["_id"]
        },
        {
            "$set": {
                "company": body.company,
                "role": body.role,
                "status": body.status,
                "applied_date": body.applied_date,
                "notes": body.notes,
                "url": body.url,
                "salary": body.salary
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job = jobs_collection.find_one({
        "_id": object_id
    })

    return serialize_document(job)


# ============================================================
# DELETE JOB
# ============================================================

@app.delete("/api/jobs/{job_id}")
def delete_job(
    job_id: str,
    current_user=Depends(get_current_user)
):

    object_id = convert_object_id(job_id)

    result = jobs_collection.delete_one(
        {
            "_id": object_id,
            "user_id": current_user["_id"]
        }
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "ok": True
    }


# ============================================================
# TODO MODEL
# ============================================================

class TodoBody(BaseModel):

    title: str
    category: str = "General"
    priority: str = "Medium"
    due_date: Optional[str] = None


# ============================================================
# GET TODOS
# ============================================================

@app.get("/api/todos")
def get_todos(
    current_user=Depends(get_current_user)
):

    todos = todos_collection.find(
        {
            "user_id": current_user["_id"]
        }
    ).sort(
        "created_at",
        -1
    )

    return [
        serialize_document(todo)
        for todo in todos
    ]


# ============================================================
# ADD TODO
# ============================================================

@app.post("/api/todos")
def add_todo(
    body: TodoBody,
    current_user=Depends(get_current_user)
):

    todo = {
        "user_id": current_user["_id"],
        "title": body.title,
        "category": body.category,
        "done": False,
        "priority": body.priority,
        "due_date": body.due_date,
        "created_at": datetime.utcnow()
    }

    result = todos_collection.insert_one(
        todo
    )

    saved_todo = todos_collection.find_one({
        "_id": result.inserted_id
    })

    return serialize_document(
        saved_todo
    )


# ============================================================
# TOGGLE TODO
# ============================================================

@app.patch("/api/todos/{todo_id}/toggle")
def toggle_todo(
    todo_id: str,
    current_user=Depends(get_current_user)
):

    object_id = convert_object_id(todo_id)

    todo = todos_collection.find_one({
        "_id": object_id,
        "user_id": current_user["_id"]
    })

    if not todo:

        raise HTTPException(
            status_code=404,
            detail="Todo not found"
        )

    new_done_value = not todo.get(
        "done",
        False
    )

    todos_collection.update_one(
        {
            "_id": object_id,
            "user_id": current_user["_id"]
        },
        {
            "$set": {
                "done": new_done_value
            }
        }
    )

    updated_todo = todos_collection.find_one({
        "_id": object_id
    })

    return serialize_document(
        updated_todo
    )


# ============================================================
# DELETE TODO
# ============================================================

@app.delete("/api/todos/{todo_id}")
def delete_todo(
    todo_id: str,
    current_user=Depends(get_current_user)
):

    object_id = convert_object_id(todo_id)

    result = todos_collection.delete_one(
        {
            "_id": object_id,
            "user_id": current_user["_id"]
        }
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Todo not found"
        )

    return {
        "ok": True
    }


# ============================================================
# MOCK INTERVIEW
# ============================================================

QUESTIONS_BY_ROLE = {

    "default": [
        "Tell me about yourself and your background.",
        "What is your greatest professional strength?",
        "Describe a challenging project and how you handled it.",
        "Where do you see yourself in 5 years?",
        "Why do you want to work here?"
    ],

    "software": [
        "Explain the difference between REST and GraphQL.",
        "What is Big-O notation? Give an example.",
        "How do you approach debugging a production issue?",
        "Describe your experience with CI/CD pipelines.",
        "What design patterns have you used in real projects?"
    ],

    "data": [
        "Explain overfitting and how to prevent it.",
        "What's the difference between supervised and unsupervised learning?",
        "How do you handle missing data in a dataset?",
        "Describe a model you built end-to-end.",
        "What evaluation metrics would you choose for a classification problem?"
    ]
}


@app.get("/api/interview/questions")
def get_questions(
    role: str = "default",
    current_user=Depends(get_current_user)
):

    role_lower = role.lower()

    if (
        "software" in role_lower
        or "engineer" in role_lower
        or "developer" in role_lower
    ):

        key = "software"

    elif (
        "data" in role_lower
        or "ml" in role_lower
        or "analyst" in role_lower
    ):

        key = "data"

    else:

        key = "default"

    return {
        "questions": (
            QUESTIONS_BY_ROLE["default"]
            + QUESTIONS_BY_ROLE[key]
        )
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    current_user=Depends(get_current_user)
):

    uid = current_user["_id"]

    jobs = list(
        jobs_collection.find({
            "user_id": uid
        }).sort(
            "created_at",
            -1
        )
    )

    todos = list(
        todos_collection.find({
            "user_id": uid
        }).sort(
            "created_at",
            -1
        )
    )

    resume = resumes_collection.find_one(
        {
            "user_id": uid
        },
        sort=[
            ("uploaded_at", -1)
        ]
    )

    status_counts = {}

    for job in jobs:

        status = job.get(
            "status",
            "Applied"
        )

        status_counts[status] = (
            status_counts.get(status, 0)
            + 1
        )

    serialized_jobs = [
        serialize_document(job)
        for job in jobs
    ]

    return {

        "total_jobs": len(jobs),

        "status_breakdown": status_counts,

        "todos_done": sum(
            1
            for todo in todos
            if todo.get("done", False)
        ),

        "todos_total": len(todos),

        "ats_score": (
            resume.get("ats_score", 0)
            if resume
            else 0
        ),

        "skills_count": (
            len(resume.get("skills", []))
            if resume
            else 0
        ),

        "recent_jobs": serialized_jobs[:5]
    }


# ============================================================
# EXPORT JOBS
# ============================================================

@app.get("/api/export/jobs")
def export_jobs(
    current_user=Depends(get_current_user)
):

    jobs = jobs_collection.find(
        {
            "user_id": current_user["_id"]
        }
    ).sort(
        "created_at",
        -1
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Company",
        "Role",
        "Status",
        "Applied Date",
        "Salary",
        "Notes",
        "URL"
    ])

    for job in jobs:

        writer.writerow([
            job.get("company", ""),
            job.get("role", ""),
            job.get("status", ""),
            job.get("applied_date", ""),
            job.get("salary", ""),
            job.get("notes", ""),
            job.get("url", "")
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=jobs.csv"
        }
    )


# ============================================================
# ROOT / HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "message": "CareerBoost AI backend is running",
        "database": "MongoDB Atlas"
    }


@app.get("/health")
def health():

    return {
        "status": "ok",
        "database": "MongoDB Atlas"
    }