import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set in .env")

client = MongoClient(MONGO_URI)

# Test MongoDB connection
client.admin.command("ping")

# Database
db = client["CareerBoostAI"]

# Collections
users_collection = db["users"]
resumes_collection = db["resumes"]
jobs_collection = db["jobs"]
todos_collection = db["todos"]

# Make email unique
users_collection.create_index(
    "email",
    unique=True
)

print("MongoDB Atlas connection successful!")
print("Database:", db.name)