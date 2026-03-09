import React, { useState, useRef, useEffect } from 'react';
import { Send, Code2, File, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ChatInterface = () => {
    const { repoId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'system',
            content: 'Hello! I\'m your AI assistant. Ask me anything about your codebase.',
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [repoDetails, setRepoDetails] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchRepoDetails = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                const response = await axios.get(`/api/github/${repoId}`, config);
                setRepoDetails(response.data);
            } catch (err) {
                console.error("Failed to fetch repo details:", err);
            }
        };
        if (user?.token) {
            fetchRepoDetails();
        }
    }, [repoId, user]);

    const handleFileClick = async (filePath) => {
        if (!repoDetails) return;

        setSelectedFile(filePath);
        setIsLoadingFile(true);
        setFileContent('');

        try {
            const rawUrl = `https://raw.githubusercontent.com/${repoDetails.owner}/${repoDetails.repoName}/${repoDetails.branch}/${filePath}`;
            const response = await axios.get(rawUrl);
            setFileContent(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error("Failed to fetch file content:", error);
            setFileContent('// Error loading file content. It may be too large or unavailable.');
        } finally {
            setIsLoadingFile(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/ai/query', {
                repo_id: repoId,
                query: input
            });

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: response.data.response,
                sources: response.data.sources,
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Failed to get response:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'error',
                content: 'Sorry, I encountered an error processing your request.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReadme = async () => {
        if (isLoading) return;

        const systemMessageId = Date.now();
        const prompt = "Please generate a comprehensive README.md for this repository. Include an overview of the architecture, the tech stack (languages and frameworks), and a summary of any potential bugs, inefficiencies, or technical debt you notice. Format it as a professional markdown README.";

        const promptMessage = {
            id: systemMessageId,
            type: 'user',
            content: "Generate a comprehensive analysis README for this repository.",
        };

        setMessages(prev => [...prev, promptMessage]);
        setIsLoading(true);

        try {
            const response = await axios.post('/ai/query', {
                repo_id: repoId,
                query: prompt
            });

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: response.data.response,
                sources: response.data.sources,
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Failed to generate README:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'error',
                content: 'Sorry, I encountered an error generating the README.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getFileExtension = (filename) => {
        return filename.split('.').pop();
    };

    return (
        <div className="flex h-screen relative overflow-hidden font-sans">
            {/* Ambient Background Glow is now handled globally in App.jsx */}

            {/* Sidebar */}
            <div className="w-80 glass-panel border-r border-t-0 border-b-0 border-l-0 border-white/5 flex flex-col shrink-0 z-10 relative shadow-glass-premium">
                {/* Back to Dashboard & Header */}
                <div className="p-5 border-b border-white/5">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center border border-neon-purple/30 shadow-neon-purple">
                            <Code2 className="w-5 h-5 text-neon-purple" />
                        </div>
                        <h2 className="text-gray-900 dark:text-white font-bold text-lg truncate" title={repoDetails?.repoName || 'Repository Files'}>
                            {repoDetails?.repoName || 'Loading Repo...'}
                        </h2>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto space-y-1 p-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-3 mt-1">Files</div>
                    {!repoDetails || repoDetails?.status === 'indexing' ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm space-y-3">
                            <div className="w-5 h-5 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin"></div>
                            <span>Scanning files...</span>
                        </div>
                    ) : repoDetails?.filePaths && repoDetails.filePaths.length > 0 ? (
                        repoDetails.filePaths.map((file) => (
                            <div
                                key={file}
                                onClick={() => handleFileClick(file)}
                                className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all ${selectedFile === file ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'}`}
                                title={file}
                            >
                                <File className={`w-4 h-4 shrink-0 ${selectedFile === file ? 'text-neon-purple' : 'text-gray-400 dark:text-gray-500'}`} />
                                <span className="text-sm truncate font-medium">{file.split('/').pop()}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm space-y-3 opacity-60">
                            <AlertCircle className="w-6 h-6 text-gray-400" />
                            <span className="text-center px-4 leading-relaxed">No file data available.<br />Try reconnecting the repository.</span>
                        </div>
                    )}
                </div>

                {/* Repository Stats */}
                {repoDetails && (
                    <div className="p-5 border-t border-white/5 bg-black/20 shrink-0">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 font-bold">Repository Overview</div>

                        <div className="flex items-center justify-between mb-4 text-sm bg-white/50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Files Indexed</span>
                            <span className="text-indigo-600 dark:text-indigo-300 font-bold">{repoDetails.totalFiles}</span>
                        </div>

                        {(!repoDetails.languages || Object.keys(repoDetails.languages).length === 0) && (
                            <div className="text-gray-500 text-xs text-center border border-white/5 rounded-lg p-3 bg-black/10">
                                Language breakdown unavailable.<br />Reconnect repository to sync data.
                            </div>
                        )}
                        {repoDetails.languages && Object.keys(repoDetails.languages).length > 0 && (
                            <div className="space-y-3">
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Languages</span>
                                {Object.entries(repoDetails.languages)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([lang, percentage]) => (
                                        <div key={lang} className="mt-1">
                                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{lang}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 shrink-0">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-1.5 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Generate README Button */}
                        <div className="mt-6 pt-5 border-t border-white/5">
                            <button
                                onClick={handleGenerateReadme}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium group"
                            >
                                <File className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>Generate README</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex relative z-10 w-full">

                {/* Chat Area */}
                <div className={`flex flex-col h-full transition-all duration-300 relative ${selectedFile ? 'w-full lg:w-1/2 border-r border-white/5' : 'w-full'}`}>

                    {/* Chat Header */}
                    <div className="glass-panel border-b border-t-0 border-x-0 border-gray-200 dark:border-white/5 px-6 py-4 shrink-0 flex items-center justify-between z-20 sticky top-0 shadow-glass-premium">
                        <div>
                            <h1 className="text-gray-900 dark:text-white font-bold flex items-center gap-2 text-lg">
                                <Sparkles className="w-5 h-5 text-neon-purple" />
                                AI Code Assistant
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light tracking-wide">Ask questions, request refactors, or explain selected code.</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                            >
                                <div
                                    className={`relative max-w-3xl rounded-2xl p-5 ${message.type === 'user'
                                        ? 'bg-gradient-to-br from-neon-purple to-neon-blue text-white shadow-neon-purple'
                                        : message.type === 'system'
                                            ? 'glass-card border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                                            : message.type === 'error'
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-100 shadow-xl'
                                                : 'glass-card border-gray-200 dark:border-white/5 bg-white dark:bg-dark-800/80 text-gray-800 dark:text-gray-200 shadow-glass-premium'
                                        }`}
                                >
                                    {message.type === 'ai' && (
                                        <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-white/5">
                                            <div className="w-6 h-6 rounded bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30 shadow-neon-purple">
                                                <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                                            </div>
                                            <span className="text-sm font-bold text-neon-purple tracking-wide">Assistant</span>
                                        </div>
                                    )}

                                    <div className="prose prose-invert prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-a:text-indigo-400 max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>

                                    {message.sources && (
                                        <div className="mt-5 pt-4 border-t border-white/10">
                                            <div className="flex items-center text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                                                <File className="w-3 h-3 mr-1.5" />
                                                Referenced Context
                                            </div>
                                            <div className="space-y-2">
                                                {message.sources.map((source, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3 rounded-lg cursor-pointer hover:border-indigo-500/30 hover:bg-gray-200 dark:hover:bg-white/5 transition-all group"
                                                        onClick={() => handleFileClick(source.file_path)}
                                                    >
                                                        <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mb-1.5 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{source.file_path}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono line-clamp-2 overflow-hidden text-ellipsis leading-relaxed">{source.content}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="glass-card bg-white dark:bg-dark-800/80 text-gray-800 dark:text-gray-200 rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-glass-premium">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-6 h-6 rounded bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30 mr-2 shadow-neon-purple">
                                            <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        <span className="ml-2 text-xs font-medium text-neon-purple/70 tracking-wide uppercase">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 sm:p-6 bg-gradient-to-t from-dark-900 via-dark-900 to-transparent shrink-0">
                        <div className="max-w-4xl mx-auto relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-50 dark:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-end glass-panel bg-white/90 dark:bg-dark-800/90 rounded-2xl border border-gray-200 dark:border-white/10 p-2 focus-within:border-neon-purple/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all shadow-glass-premium">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask anything about the codebase..."
                                    className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none text-gray-900 dark:text-white px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm resize-none scrollbar-thin overflow-y-auto"
                                    disabled={isLoading}
                                    rows={1}
                                    style={{ height: 'auto' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="m-1 p-2.5 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue text-white hover:shadow-neon-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                                </button>
                            </div>
                            <div className="mt-2 text-center text-[10px] text-gray-500 tracking-wide">
                                Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded mx-0.5 font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-white/5 rounded mx-0.5 font-mono">Shift + Enter</kbd> for new line. AI can make mistakes.
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Viewer Side Panel */}
                {selectedFile && (
                    <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 lg:relative flex flex-col bg-white dark:bg-[#0d1117] h-full shadow-[-20px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none z-30 animate-in slide-in-from-right-8 duration-300 border-l border-gray-200 dark:border-white/5">
                        <div className="glass-panel border-b border-t-0 border-x-0 border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between shrink-0 z-20 sticky top-0 shadow-glass-premium">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <File className="w-4 h-4 text-neon-purple shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 text-sm font-mono truncate font-medium" title={selectedFile}>{selectedFile}</span>
                            </div>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0 ml-3"
                                title="Close viewer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0d1117] p-5 text-sm font-mono text-gray-800 dark:text-gray-300 relative scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {isLoadingFile ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <div className="w-8 h-8 border-2 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
                                    <div className="text-sm font-sans tracking-wide">Fetching code from repository...</div>
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap break-words">
                                    <code className={`language-${getFileExtension(selectedFile)} font-mono leading-relaxed`}>
                                        {fileContent || '// Empty file'}
                                    </code>
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;