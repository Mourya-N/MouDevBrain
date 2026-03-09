## 🧠 MouCodeBrain — AI-Powered Codebase Intelligence

**MouCodeBrain** is a high-performance, full-stack intelligence platform that allows developers to interact with their entire codebase using natural language. Built with a modern microservices architecture, it leverages Large Language Models (LLMs) and Vector Search to provide deep insights into complex projects.

---

## ✨ Core Features

- 💬 **Codebase Chat**: Context-aware natural language interface to ask questions about logic, patterns, and documentation.
- 🏗️ **Architecture Visualization**: Automatically generate interactive system architecture and dependency graphs.
- 🛡️ **AI Guard**: Proactive analysis for bugs, security vulnerabilities (`Snyk`/`OWASP` patterns), and code smells.
- 📊 **Insight Dashboard**: Real-time statistics on language distribution, framework usage, and repository health.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Vite, React Flow |
| **Backend** | Spring Boot 3, Spring Security, JWT |
| **AI Engine** | Python 3.11, FastAPI, LangChain, groqAI, FAISS Vector DB |
| **Tooling** | Docker, Docker Compose, Maven |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- groqAI API Key

### Deployment
1. **Clone & Enter**:
   ```bash
   git clone https://github.com/mouuuryan/MouCodeBrain.git
   cd MouCodeBrain
   ```

2. **Configure Environment**:
   Create a `.env` file in the root with your credentials:
   ```env
   GROQAI_API_KEY=your_key_here
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

*Developed with love by [mouuuryan](https://github.com/moouuuurya)*
