import tree_sitter
from tree_sitter import Language, Parser
import os
from typing import List, Dict, Any
import networkx as nx
import numpy as np

class CodeAnalyzer:
    def __init__(self):
        # Initialize tree-sitter parsers for different languages
        self.parsers = {}
        self._init_parsers()
        
    def _init_parsers(self):
        """Initialize parsers for supported languages"""
        languages = {
            'python': 'python',
            'javascript': 'javascript',
            'typescript': 'typescript',
            'java': 'java',
            'go': 'go',
            'rust': 'rust'
        }
        
        for lang, parser_name in languages.items():
            try:
                self.parsers[lang] = Parser()
                # You'll need to build the language libraries
                # This is a simplified version
            except Exception as e:
                print(f"Failed to initialize {lang} parser: {e}")
    
    def parse_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Parse a file and extract meaningful information"""
        ext = os.path.splitext(file_path)[1]
        language = self._get_language_from_extension(ext)
        
        # Split content into chunks for embedding
        chunks = self._chunk_content(content, language)
        
        return {
            'file_path': file_path,
            'language': language,
            'chunks': chunks,
            'total_lines': len(content.split('\n')),
            'functions': self._extract_functions(content, language),
            'classes': self._extract_classes(content, language),
            'imports': self._extract_imports(content, language)
        }
    
    def _chunk_content(self, content: str, language: str, max_chunk_size: int = 500) -> List[Dict]:
        """Split code into semantic chunks"""
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_line = 1
        
        for i, line in enumerate(lines, 1):
            current_chunk.append(line)
            
            # Check if we should create a new chunk
            if len(current_chunk) >= 20 or i == len(lines):
                chunk_content = '\n'.join(current_chunk)
                chunks.append({
                    'content': chunk_content,
                    'start_line': current_line,
                    'end_line': i,
                    'language': language
                })
                current_chunk = []
                current_line = i + 1
        
        return chunks
    
    def _extract_functions(self, content: str, language: str) -> List[Dict]:
        """Extract function definitions"""
        # Simplified - in production, use tree-sitter queries
        functions = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            if 'def ' in line or 'function ' in line or 'func ' in line:
                functions.append({
                    'name': line.strip(),
                    'line': i + 1,
                    'body': self._extract_function_body(lines, i)
                })
        
        return functions
    
    def _extract_classes(self, content: str, language: str) -> List[Dict]:
        """Extract class definitions"""
        classes = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            if 'class ' in line:
                classes.append({
                    'name': line.strip(),
                    'line': i + 1
                })
        
        return classes
    
    def _extract_imports(self, content: str, language: str) -> List[str]:
        """Extract import statements"""
        imports = []
        lines = content.split('\n')
        
        for line in lines:
            if line.startswith(('import ', 'from ', 'require(', '#include')):
                imports.append(line.strip())
        
        return imports
    
    def _extract_function_body(self, lines: List[str], start_line: int) -> str:
        """Extract function body using indentation"""
        body = []
        base_indent = len(lines[start_line]) - len(lines[start_line].lstrip())
        
        for i in range(start_line + 1, len(lines)):
            current_indent = len(lines[i]) - len(lines[i].lstrip())
            if current_indent <= base_indent and lines[i].strip():
                break
            body.append(lines[i])
        
        return '\n'.join(body)
    
    def _get_language_from_extension(self, ext: str) -> str:
        """Map file extension to language"""
        extension_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust'
        }
        return extension_map.get(ext, 'unknown')
    
    def generate_architecture_diagram(self, repo_id: str) -> Dict[str, Any]:
        """Generate architecture diagram data"""
        # Create a graph of modules and their dependencies
        G = nx.DiGraph()
        
        # This would normally come from analyzing all files
        # Simplified example:
        modules = [
            {'id': 'auth', 'name': 'Authentication', 'type': 'service'},
            {'id': 'api', 'name': 'API Gateway', 'type': 'controller'},
            {'id': 'db', 'name': 'Database', 'type': 'model'},
            {'id': 'cache', 'name': 'Cache', 'type': 'service'}
        ]
        
        dependencies = [
            {'from': 'api', 'to': 'auth'},
            {'from': 'auth', 'to': 'db'},
            {'from': 'auth', 'to': 'cache'}
        ]
        
        return {
            'modules': modules,
            'dependencies': dependencies
        }
    
    def map_dependencies(self, repo_id: str) -> Dict[str, Any]:
        """Map dependencies between files"""
        # Simplified implementation
        return {
            'nodes': [
                {'id': 'file1.js', 'dependencies': ['file2.js', 'file3.js']},
                {'id': 'file2.js', 'dependencies': ['file3.js']},
                {'id': 'file3.js', 'dependencies': []}
            ]
        }
    
    def find_potential_bugs(self, repo_id: str) -> List[Dict]:
        """Find potential bugs in the codebase"""
        # Simplified - would use actual analysis
        return [
            {
                'severity': 'high',
                'type': 'security',
                'description': 'Hardcoded secret found',
                'file_path': 'config.js',
                'line_numbers': [10],
                'suggested_fix': 'Use environment variables'
            }
        ]
    