🧠 MouCodeBrain — AI-Powered Codebase Intelligence

**MouCodeBrain** is a high-performance, full-stack intelligence platform that allows developers to interact with their entire codebase using natural language. Built with a modern microservices architecture, it leverages Large Language Models (LLMs) and Vector Search to provide deep insights into complex projects.

---

## ✨ Core Features

- 💬 **Codebase Chat**: Context-aware natural language interface to ask questions about logic, patterns, and documentation.
- 🏗️ **Architecture Visualization**: Automatically generate interactive system architecture and dependency graphs.
- 🛡️ **AI Guard**: Proactive analysis for bugs, security vulnerabilities (`Snyk`/`OWASP` patterns), and code smells.
- 🔌 **VS Code Extension**: Bring the power of MouCodeBrain directly into your development workflow.
- 📊 **Insight Dashboard**: Real-time statistics on language distribution, framework usage, and repository health.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Vite, React Flow, Monaco Editor |
| **Backend** | Spring Boot 3, Spring Security, JWT, MongoDB Atlas |
| **AI Engine** | Python 3.11, FastAPI, LangChain, OpenAI, FAISS Vector DB |
| **Tooling** | Docker, Docker Compose, Maven, Lucide Icons |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key

### Deployment
1. **Clone & Enter**:
   ```bash
   git clone https://github.com/mouuuryan/MouCodeBrain.git
   cd MouCodeBrain
   ```

2. **Configure Environment**:
   Create a `.env` file in the root with your credentials:
   ```env
   OPENAI_API_KEY=your_key_here
   MONGODB_URI=your_mongo_uri
   ```

3. **Launch with Docker**:
   ```bash
   docker-compose up --build
   ```

The application will be available at `http://localhost:5173`.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

---

*Developed by [mouuuryan](https://github.com/mouuuryan)*
