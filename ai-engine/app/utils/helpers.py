import hashlib
import json
from typing import Any, Dict, List
import re

class Helpers:
    """Utility helper functions"""
    
    @staticmethod
    def generate_file_hash(content: str) -> str:
        """Generate a hash for file content"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename for storage"""
        # Remove path traversal attempts
        filename = filename.replace('../', '').replace('..\\', '')
        # Replace invalid characters
        filename = re.sub(r'[^\w\-_.]', '_', filename)
        return filename
    
    @staticmethod
    def extract_code_blocks(text: str) -> List[Dict[str, str]]:
        """Extract code blocks from markdown text"""
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        blocks = []
        for match in matches:
            blocks.append({
                'language': match[0] or 'text',
                'code': match[1].strip()
            })
        
        return blocks
    
    @staticmethod
    def truncate_text(text: str, max_length: int = 1000) -> str:
        """Truncate text to max length"""
        if len(text) <= max_length:
            return text
        return text[:max_length] + "..."
    
    @staticmethod
    def format_error_response(error: Exception) -> Dict[str, Any]:
        """Format error response"""
        return {
            'error': True,
            'message': str(error),
            'type': error.__class__.__name__
        }
    
    @staticmethod
    def safe_json_parse(data: str) -> Dict[str, Any]:
        """Safely parse JSON string"""
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return {}