import httpx
from typing import List, Dict, Optional
import base64

# File extensions to index (code files only)
CODE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.rb', '.php', '.swift',
    '.kt', '.scala', '.r', '.m', '.sql', '.sh', '.bash',
    '.yml', '.yaml', '.json', '.xml', '.toml', '.cfg', '.ini',
    '.md', '.txt', '.html', '.css', '.scss', '.less',
    '.dockerfile', '.env', '.gitignore', '.properties'
}

# Max file size to index (100KB)
MAX_FILE_SIZE = 100_000

# Max files to index per repo
MAX_FILES = 200


def parse_github_url(url: str) -> tuple:
    """Extract owner and repo name from a GitHub URL."""
    url = url.rstrip('/')
    if url.endswith('.git'):
        url = url[:-4]
    parts = url.replace('https://github.com/', '').replace('http://github.com/', '').split('/')
    if len(parts) >= 2:
        return parts[0], parts[1]
    raise ValueError(f"Invalid GitHub URL: {url}")


async def fetch_repo_files(repo_url: str, branch: str = "main") -> List[Dict[str, str]]:
    """
    Fetch all code files from a public GitHub repository.
    Uses GitHub's Git Trees API for efficient recursive listing.
    Returns list of {path, content} dicts.
    """
    owner, repo = parse_github_url(repo_url)
    files = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get the repo tree recursively
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        headers = {"Accept": "application/vnd.github.v3+json"}

        response = await client.get(tree_url, headers=headers)

        if response.status_code == 404:
            # Try 'master' branch as fallback
            if branch == "main":
                return await fetch_repo_files(repo_url, branch="master")
            raise ValueError(f"Repository not found: {owner}/{repo} (branch: {branch})")

        if response.status_code != 200:
            raise ValueError(f"GitHub API error: {response.status_code} - {response.text}")

        tree_data = response.json()
        tree = tree_data.get("tree", [])

        # Filter to code files only
        code_files = []
        for item in tree:
            if item["type"] != "blob":
                continue
            path = item["path"]
            ext = '.' + path.rsplit('.', 1)[-1].lower() if '.' in path else ''
            # Also accept files without extension that are commonly code (Dockerfile, Makefile, etc.)
            basename = path.rsplit('/', 1)[-1].lower()
            if ext in CODE_EXTENSIONS or basename in {'dockerfile', 'makefile', 'rakefile', 'gemfile', 'procfile'}:
                size = item.get("size", 0)
                if size <= MAX_FILE_SIZE:
                    code_files.append(item)

        # Limit to MAX_FILES
        code_files = code_files[:MAX_FILES]

        # Fetch content for each file via raw URL
        for item in code_files:
            try:
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{item['path']}"
                file_response = await client.get(raw_url)
                if file_response.status_code == 200:
                    content = file_response.text
                    if content.strip():  # Skip empty files
                        files.append({
                            "path": item["path"],
                            "content": content
                        })
            except Exception as e:
                print(f"  Skipping {item['path']}: {e}")
                continue

    print(f"Fetched {len(files)} files from {owner}/{repo}")
    return files
