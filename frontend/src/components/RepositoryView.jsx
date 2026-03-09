import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, GitBranch, AlertCircle, FileJson, ArrowLeft, Activity } from 'lucide-react';
import axios from 'axios';

const RepositoryView = () => {
    const { repoId } = useParams();
    const navigate = useNavigate();
    const [repo, setRepo] = useState(null);
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalLines: 0,
        languages: {},
        issues: []
    });

    useEffect(() => {
        fetchRepositoryData();
    }, [repoId]);

    const fetchRepositoryData = async () => {
        try {
            const response = await axios.get(`/api/repository/${repoId}`);
            setRepo(response.data);
            // Fetch stats
            const statsResponse = await axios.post(`/ai/analyze/stats?repo_id=${repoId}`);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Failed to fetch repository:', error);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans">
            {/* Ambient Glow is now handled globally in App.jsx */}

            {/* Header */}
            <div className="glass-panel border-b border-t-0 border-x-0 border-white/5 p-6 relative z-10 shadow-glass-premium">
                <div className="container mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-gray-400 hover:text-white transition-colors mb-4 group text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">{repo?.name || 'Loading Repository...'}</h1>
                    <p className="text-gray-400">{repo?.description || 'Repository details overview'}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="container mx-auto p-6 relative z-10 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="glass-card rounded-2xl p-6 hover:border-neon-blue/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <FileJson className="w-8 h-8 text-neon-blue" />
                            <span className="text-3xl font-bold text-white">{stats.totalFiles}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Files</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <GitBranch className="w-8 h-8 text-emerald-400" />
                            <span className="text-3xl font-bold text-white">{stats.totalLines}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lines of Code</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 hover:border-neon-purple/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <Activity className="w-8 h-8 text-neon-purple" />
                            <span className="text-3xl font-bold text-white">{Object.keys(stats.languages).length}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Languages</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 hover:border-amber-500/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <AlertCircle className="w-8 h-8 text-amber-400" />
                            <span className="text-3xl font-bold text-white">{stats.issues.length}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Issues Found</p>
                    </div>
                </div>

                {/* Action Cards */}
                <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neon-purple" /> Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => navigate(`/repo/${repoId}/chat`)}
                        className="glass-card group relative overflow-hidden rounded-2xl p-8 cursor-pointer hover:border-neon-blue/50 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-indigo-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 mb-5 shadow-neon-blue">
                                <MessageSquare className="w-7 h-7 text-neon-blue" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">Chat Interface</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Ask questions about your code in natural language and get AI responses.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate(`/repo/${repoId}/architecture`)}
                        className="glass-card group relative overflow-hidden rounded-2xl p-8 cursor-pointer hover:border-neon-purple/50 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-fuchsia-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30 mb-5 shadow-neon-purple">
                                <Activity className="w-7 h-7 text-neon-purple" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-purple transition-colors">Architecture</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">View auto-generated interactive system architecture and dependency diagrams.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate(`/repo/${repoId}/bugs`)}
                        className="glass-card group relative overflow-hidden rounded-2xl p-8 cursor-pointer hover:border-amber-500/50 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 mb-5">
                                <AlertCircle className="w-7 h-7 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Bug Finder</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">AI-powered deep code analysis, anomaly pattern recognition and issue detection.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepositoryView;