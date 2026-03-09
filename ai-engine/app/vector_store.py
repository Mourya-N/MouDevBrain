import os
from typing import List, Dict, Any
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

class VectorStore:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        self.stores = {}  # repo_id -> FAISS index
        self.index_path = "./data/indices"
        
        # Create directory if it doesn't exist
        os.makedirs(self.index_path, exist_ok=True)
    
    def _get_index_dir(self, repo_id):
        return f"{self.index_path}/{repo_id}"
    
    def add_document(self, repo_id: str, parsed_doc: Dict):
        """Add a document's chunks to the vector store"""
        documents = []
        for chunk in parsed_doc.get('chunks', []):
            metadata = {
                'file_path': parsed_doc['file_path'],
                'start_line': chunk['start_line'],
                'end_line': chunk['end_line'],
                'language': chunk['language']
            }
            doc = Document(page_content=chunk['content'], metadata=metadata)
            documents.append(doc)
            
        if not documents:
            return

        if repo_id not in self.stores:
            index_dir = self._get_index_dir(repo_id)
            if os.path.exists(index_dir):
                self.stores[repo_id] = FAISS.load_local(
                    index_dir, self.embeddings,
                    allow_dangerous_deserialization=True
                )
                self.stores[repo_id].add_documents(documents)
            else:
                self.stores[repo_id] = FAISS.from_documents(documents, self.embeddings)
        else:
            self.stores[repo_id].add_documents(documents)
        
        # Save periodically (you might want to do this in background)
        self._save(repo_id)
    
    def similarity_search(self, repo_id: str, query: str, k: int = 5) -> List[Dict]:
        """Search for similar code chunks"""
        if repo_id not in self.stores:
            if not self.load_repository(repo_id):
                return []
        
        # Search
        results = self.stores[repo_id].similarity_search_with_score(query, k=k)
        
        # Format results to match previous interface behavior while using LangChain objects
        formatted_results = []
        for doc, score in results: # score is typically L2 distance
             metadata = doc.metadata.copy()
             metadata['content'] = doc.page_content
             metadata['similarity_score'] = float(score) # lower is better for L2
             formatted_results.append(metadata)
             
        return formatted_results
    
    def _save(self, repo_id):
        """Save index and metadata to disk"""
        if repo_id in self.stores:
            self.stores[repo_id].save_local(self._get_index_dir(repo_id))
    
    def load_repository(self, repo_id: str):
        """Load a repository's index"""
        index_dir = self._get_index_dir(repo_id)
        if os.path.exists(index_dir):
            try:
                self.stores[repo_id] = FAISS.load_local(
                    index_dir, self.embeddings,
                    allow_dangerous_deserialization=True
                )
                return True
            except Exception as e:
                print(f"Failed to load local index for {repo_id}: {e}")
                return False
        return False