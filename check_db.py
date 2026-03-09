from pymongo import MongoClient
import os

mongo_uri = os.environ.get("SPRING_DATA_MONGODB_URI", "mongodb://root:example@localhost:27017/admin")
client = MongoClient(mongo_uri)
db = client["moucodebrain"]
repos = db.repositories.find()
for r in repos:
    print(f"Repo: {r.get('repoName')}, Status: {r.get('status')}, FilePaths: {bool(r.get('filePaths'))}, Languages: {bool(r.get('languages'))}")
