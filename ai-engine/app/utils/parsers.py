import re
from typing import List, Dict, Any

class CodeParsers:
    """Utility parsers for different code languages"""
    
    @staticmethod
    def parse_python(content: str) -> Dict[str, Any]:
        """Parse Python code"""
        result = {
            'imports': [],
            'functions': [],
            'classes': [],
            'decorators': []
        }
        
        lines = content.split('\n')
        in_function = False
        current_function = None
        
        for i, line in enumerate(lines):
            # Find imports
            if line.startswith(('import ', 'from ')):
                result['imports'].append(line.strip())
            
            # Find functions
            if line.strip().startswith('def '):
                func_name = re.search(r'def\s+(\w+)', line)
                if func_name:
                    result['functions'].append({
                        'name': func_name.group(1),
                        'line': i + 1,
                        'decorators': CodeParsers._extract_decorators(lines, i)
                    })
            
            # Find classes
            if line.strip().startswith('class '):
                class_name = re.search(r'class\s+(\w+)', line)
                if class_name:
                    result['classes'].append({
                        'name': class_name.group(1),
                        'line': i + 1
                    })
        
        return result
    
    @staticmethod
    def parse_javascript(content: str) -> Dict[str, Any]:
        """Parse JavaScript code"""
        result = {
            'imports': [],
            'functions': [],
            'classes': [],
            'exports': []
        }
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            # Find imports
            if line.startswith(('import ', 'const ')) and 'from' in line:
                result['imports'].append(line.strip())
            
            # Find functions
            if 'function ' in line or '=>' in line:
                result['functions'].append({
                    'line': i + 1,
                    'content': line.strip()
                })
            
            # Find exports
            if line.startswith('export '):
                result['exports'].append(line.strip())
        
        return result
    
    @staticmethod
    def parse_java(content: str) -> Dict[str, Any]:
        """Parse Java code"""
        result = {
            'imports': [],
            'classes': [],
            'methods': [],
            'annotations': []
        }
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            # Find imports
            if line.startswith('import '):
                result['imports'].append(line.strip())
            
            # Find annotations
            if line.strip().startswith('@'):
                result['annotations'].append({
                    'name': line.strip(),
                    'line': i + 1
                })
            
            # Find class declarations
            if 'class ' in line and '{' in line:
                result['classes'].append({
                    'line': i + 1,
                    'content': line.strip()
                })
        
        return result
    
    @staticmethod
    def _extract_decorators(lines: List[str], func_line: int) -> List[str]:
        """Extract decorators above a function"""
        decorators = []
        i = func_line - 1
        
        while i >= 0 and lines[i].strip().startswith('@'):
            decorators.append(lines[i].strip())
            i -= 1
        
        return decorators