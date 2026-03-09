import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
from .code_analyzer import CodeAnalyzer
from .vector_store import VectorStore
from .llm_integration import LLMProcessor
from .github_fetcher import fetch_repo_files, parse_github_url

app = FastAPI(title="MouCodeBrain AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
code_analyzer = CodeAnalyzer()
vector_store = VectorStore()
llm_processor = LLMProcessor()

class CodebaseQuery(BaseModel):
    repo_id: str
    query: str
    context: Optional[Dict] = None

class IndexRequest(BaseModel):
    repo_id: str
    files: List[Dict[str, str]]
    repo_name: str

class ConnectAndIndexRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    repo_id: Optional[str] = None

@app.post("/index")
async def index_codebase(request: IndexRequest, background_tasks: BackgroundTasks):
    """Index a codebase for semantic search"""
    background_tasks.add_task(process_and_index, request)
    return {"status": "indexing_started", "repo_id": request.repo_id}

@app.post("/connect-and-index")
async def connect_and_index(request: ConnectAndIndexRequest):
    """Fetch files from a public GitHub repo and index them"""
    try:
        owner, repo_name = parse_github_url(request.repo_url)
        repo_id = request.repo_id or f"{owner}_{repo_name}"

        print(f"Fetching files from {request.repo_url} (branch: {request.branch})...")
        files = await fetch_repo_files(request.repo_url, request.branch)

        if not files:
            raise HTTPException(status_code=400, detail="No indexable files found in repository")

        # Count file extensions to calculate languages
        extension_counts = {}
        file_paths = []
        
        print(f"Indexing {len(files)} files for repo {repo_id}...")
        indexed_count = 0
        for file in files:
            file_paths.append(file['path'])
            try:
                # Track extensions
                ext = '.' + file['path'].rsplit('.', 1)[-1].lower() if '.' in file['path'] else 'unknown'
                extension_counts[ext] = extension_counts.get(ext, 0) + 1
                
                parsed = code_analyzer.parse_file(file['path'], file['content'])
                vector_store.add_document(repo_id, parsed)
                indexed_count += 1
            except Exception as e:
                print(f"  Failed to index {file['path']}: {e}")
                continue

        print(f"Successfully indexed {indexed_count}/{len(files)} files")

        # Map extensions to Language names
        ext_to_lang = {
            '.py': 'Python', '.js': 'JavaScript', '.jsx': 'React', '.ts': 'TypeScript', '.tsx': 'React TS',
            '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.c': 'C', '.cpp': 'C++', '.h': 'C Header',
            '.hpp': 'C++ Header', '.cs': 'C#', '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift',
            '.kt': 'Kotlin', '.scala': 'Scala', '.r': 'R', '.m': 'Objective-C', '.sql': 'SQL',
            '.sh': 'Shell', '.bash': 'Bash', '.yml': 'YAML', '.yaml': 'YAML', '.json': 'JSON',
            '.xml': 'XML', '.toml': 'TOML', '.md': 'Markdown', '.html': 'HTML', '.css': 'CSS',
            '.scss': 'Sass', '.less': 'Less'
        }
        
        # Calculate percentages
        languages = {}
        if indexed_count > 0:
            for ext, count in extension_counts.items():
                lang_name = ext_to_lang.get(ext, ext.strip('.'))
                if lang_name:
                    languages[lang_name] = languages.get(lang_name, 0) + count
            
            # Convert counts to percentages
            for lang in languages:
                languages[lang] = round((languages[lang] / len(files)) * 100)

        return {
            "status": "completed",
            "repo_id": repo_id,
            "repo_name": repo_name,
            "owner": owner,
            "total_files": indexed_count,
            "branch": request.branch,
            "files": file_paths,
            "languages": languages
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Indexing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_codebase(query: CodebaseQuery):
    """Query the codebase using natural language"""
    try:
        # Search for relevant code sections
        relevant_chunks = vector_store.similarity_search(query.repo_id, query.query)

        # Process with LLM
        response = llm_processor.process_query(query.query, relevant_chunks)

        return {
            "response": response,
            "sources": relevant_chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/stats")
async def analyze_stats(repo_id: str):
    """Get Deep repository statistics, capabilities, complexity, and patterns"""
    try:
        # Pull largest possible codebase representation for architectural context
        relevant_chunks = vector_store.similarity_search(repo_id, "architecture frameworks routing database dependency complexity", k=30)
        
        # Process deep contextual stat extraction
        analysis_data = llm_processor.analyze_stats(relevant_chunks)
        return analysis_data
        
    except Exception as e:
        print(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/architecture")
async def analyze_architecture(repo_id: str):
    """Generate architecture diagram data"""
    try:
        # Search for high-level structure context
        relevant_chunks = vector_store.similarity_search(repo_id, "import require include service controller repository model database", k=30)
        
        # Pass context to arch mapped prompt
        architecture_data = llm_processor.analyze_architecture(relevant_chunks)
        return architecture_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/dependencies")
async def analyze_dependencies(repo_id: str):
    """Map dependencies between files"""
    try:
        dependencies = code_analyzer.map_dependencies(repo_id)
        return dependencies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/bugs")
async def find_bugs(repo_id: str):
    """Find potential bugs and issues"""
    try:
        # Look for general bug keywords across context
        relevant_chunks = vector_store.similarity_search(repo_id, "error exception catch bug hack fixme todo security vulnerability memory leak tight loop", k=30)
        
        # Pass to the analyzer
        bugs = llm_processor.analyze_for_bugs(relevant_chunks)
        return bugs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_and_index(request: IndexRequest):
    """Background task to process and index codebase"""
    for file in request.files:
        # Parse code
        parsed = code_analyzer.parse_file(file['path'], file['content'])

        # Store directly in vector DB (LangChain HuggingFaceEmbeddings handles embeddings)
        vector_store.add_document(request.repo_id, parsed)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)