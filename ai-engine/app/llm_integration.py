import os
from langchain_groq import ChatGroq
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.output_parsers import StrOutputParser
from typing import List, Dict
import json

class LLMProcessor:
    def __init__(self):
        # Use Groq's free tier with Llama 3 — no billing needed
        # Get free API key at: https://console.groq.com/keys
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            groq_api_key=os.getenv("GROQ_API_KEY")
        )
        
        system_template = "You are an expert software engineer analyzing a codebase. Always provide detailed, accurate answers based on the code context."
        system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
        
        human_template = """
        Context from the codebase:
        {context}
        
        Question: {question}
        
        Include file names, line numbers, and specific code references when relevant.
        """
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        
        self.query_template = ChatPromptTemplate.from_messages([
            system_message_prompt,
            human_message_prompt
        ])
        
        bug_system_template = "You are an expert security and code quality analyst. Return only JSON in the required format."
        bug_system_prompt = SystemMessagePromptTemplate.from_template(bug_system_template)
        
        bug_human_template = """
        Analyze this code for potential bugs, issues, unused variables, security vulnerabilities, inefficient code, and bad patterns:
        
        {code_chunks}
        
        Return a JSON array with objects containing these exact keys:
        - severity (high/medium/low)
        - type (bug/security/performance/style)
        - description
        - file_path
        - line_numbers
        - suggested_fix
        """
        bug_human_prompt = HumanMessagePromptTemplate.from_template(bug_human_template)
        
        self.bug_template = ChatPromptTemplate.from_messages([
            bug_system_prompt,
            bug_human_prompt
        ])
        
        # --- Deep Analytics System Prompts ---
        stats_system = "You are an expert software architect evaluating a codebase. Return only JSON in the exact format requested."
        stats_system_prompt = SystemMessagePromptTemplate.from_template(stats_system)
        
        stats_human = """
        Analyze these code chunks and provide a deep architecture overview:
        
        {code_chunks}
        
        Return a single JSON object with these EXACT keys ONLY:
        - "frameworks": Array of strings (e.g., ["React", "Express", "Spring Boot", "FastAPI"])
        - "efficiency": String describing overall time and space complexity patterns observed.
        - "patterns": Array of strings describing observed design patterns (e.g., ["MVC", "Singleton", "Factory", "Dependency Injection"])
        - "issues": Array of strings listing high-level technical debt, bad practices, or performance bottlenecks observed.
        """
        stats_human_prompt = HumanMessagePromptTemplate.from_template(stats_human)
        self.stats_template = ChatPromptTemplate.from_messages([
            stats_system_prompt,
            stats_human_prompt
        ])
        
        # --- Architecture Diagram Generator ---
        arch_system = "You are an expert system designer. Given a codebase context, extract the high level module dependencies. Return only JSON in the exact format requested."
        arch_system_prompt = SystemMessagePromptTemplate.from_template(arch_system)
        
        arch_human = """
        Analyze these code chunks and provide a map of components and their relationships:
        
        {code_chunks}
        
        Return a single JSON object with these EXACT keys ONLY:
        - "modules": Array of objects like {{"id": "api", "name": "API Service", "type": "backend/frontend/database"}}
        - "dependencies": Array of objects like {{"from": "api", "to": "database", "relationship": "reads/writes"}}
        """
        arch_human_prompt = HumanMessagePromptTemplate.from_template(arch_human)
        self.arch_template = ChatPromptTemplate.from_messages([
            arch_system_prompt,
            arch_human_prompt
        ])
        
        self.chain = self.query_template | self.llm | StrOutputParser()
    
    def process_query(self, question: str, context_chunks: List[Dict]) -> str:
        """Process a natural language query about the codebase"""
        # Fallback if no valid API key is present
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_api_key_here":
            return "**[Demo Mode]** No Groq API key found. Get a free key at https://console.groq.com/keys and set GROQ_API_KEY in ai-engine/.env"
        
        context = "\n\n".join([
            f"File: {chunk.get('file_path', 'unknown')}\nLines: {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')}\nContent:\n{chunk.get('content', '')}"
            for chunk in context_chunks
        ])
        
        try:
            response = self.chain.invoke({"question": question, "context": context})
            return response
        except Exception as e:
            print(f"LLM Error: {e}")
            return f"**[Error]** Failed to query LLM: {str(e)}. Please check your Groq API key."
    
    def _extract_json(self, text: str, is_array: bool = False) -> str:
        """Clean LLM output and extract pure JSON."""
        text = text.strip()
        # Remove markdown code blocks if present
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.rfind("```")
            if end > start:
                text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.rfind("```")
            if end > start:
                text = text[start:end].strip()
                
        start_char = '[' if is_array else '{'
        end_char = ']' if is_array else '}'
        
        start_idx = text.find(start_char)
        end_idx = text.rfind(end_char)
        
        if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
            return text[start_idx:end_idx+1]
            
        return text
    
    def analyze_for_bugs(self, code_chunks: List[Dict]) -> List[Dict]:
        """Analyze code for potential bugs"""
        bug_chain = self.bug_template | self.llm | StrOutputParser()
        
        context = "\n---\n".join([
            f"{chunk.get('file_path', 'unknown')} (lines {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')}):\n{chunk.get('content', '')}"
            for chunk in code_chunks[:10]  # Limit to 10 chunks for token limits
        ])
        
        try:
            response = bug_chain.invoke({"code_chunks": context})
            cleaned_response = self._extract_json(response, is_array=True)
            parsed = json.loads(cleaned_response)
            if isinstance(parsed, dict) and 'error' not in parsed:
                # In case the LLM returned {"bugs": [...]} despite instructions
                return next(iter(parsed.values())) if parsed else []
            return parsed
        except Exception as e:
            error_msg = str(e)
            if "Rate limit reached" in error_msg or "429" in error_msg:
                return {"error": "Groq API Rate Limit Reached. Please wait a moment and try again later. (Free tier limits apply)"}
            return {"error": f"Failed to parse bug analysis: {error_msg}"}
            
    def analyze_stats(self, code_chunks: List[Dict]) -> Dict:
        """Deep Analytics for Frameworks, Issue patterns, time/space efficiency."""
        stats_chain = self.stats_template | self.llm | StrOutputParser()
        
        context = "\n---\n".join([
            f"{chunk.get('file_path', 'unknown')} (lines {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')}):\n{chunk.get('content', '')}"
            for chunk in code_chunks[:20]  # Expand slightly to get better structural representation
        ])
        
        try:
            response = stats_chain.invoke({"code_chunks": context})
            cleaned_response = self._extract_json(response, is_array=False)
            return json.loads(cleaned_response)
        except Exception as e:
            error_msg = str(e)
            if "Rate limit reached" in error_msg or "429" in error_msg:
                return {"error": "Groq API Rate Limit Reached. Please wait a moment and try again later. (Free tier limits apply)"}
            return {"error": f"Failed to parse stats analysis: {error_msg}"}
            
    def analyze_architecture(self, code_chunks: List[Dict]) -> Dict:
        """Generate architectural mapping JSON."""
        arch_chain = self.arch_template | self.llm | StrOutputParser()
        
        context = "\n---\n".join([
            f"{chunk.get('file_path', 'unknown')} (lines {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')}):\n{chunk.get('content', '')}"
            for chunk in code_chunks[:20]
        ])
        
        try:
            response = arch_chain.invoke({"code_chunks": context})
            cleaned_response = self._extract_json(response, is_array=False)
            return json.loads(cleaned_response)
        except Exception as e:
            error_msg = str(e)
            if "Rate limit reached" in error_msg or "429" in error_msg:
                return {"error": "Groq API Rate Limit Reached. Please wait a moment and try again later. (Free tier limits apply)"}
            return {"error": f"Failed to parse architecture analysis: {error_msg}"}