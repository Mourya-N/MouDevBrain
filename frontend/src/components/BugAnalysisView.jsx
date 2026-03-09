import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Bug, Shield, Zap, FileCode } from 'lucide-react';

const BugAnalysisView = () => {
    const { repoId } = useParams();
    const navigate = useNavigate();
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBugs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`/ai/analyze/bugs?repo_id=${repoId}`);
            if (response.data && response.data.error) {
                setError(response.data.error);
            } else if (Array.isArray(response.data)) {
                // If the first object has an error key
                if (response.data.length > 0 && response.data[0].error) {
                    setError(response.data[0].error);
                } else {
                    setBugs(response.data);
                }
            } else {
                setBugs([]);
            }
        } catch (err) {
            console.error('Failed to fetch bug analysis:', err);
            setError('Failed to fetch bug analysis. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [repoId]);

    useEffect(() => {
        fetchBugs();
    }, [fetchBugs]);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'bg-red-900 border-red-500 text-red-200';
            case 'medium': return 'bg-yellow-900 border-yellow-500 text-yellow-200';
            case 'low': return 'bg-blue-900 border-blue-500 text-blue-200';
            default: return 'bg-gray-800 border-gray-600 text-gray-200';
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'security': return <Shield className="w-5 h-5" />;
            case 'performance': return <Zap className="w-5 h-5" />;
            case 'style': return <FileCode className="w-5 h-5" />;
            default: return <Bug className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen relative">
                <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-white/10 z-10 shadow-glass-premium">
                    <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-300 font-medium tracking-wide">Scanning codebase for vulnerabilities & bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 relative font-sans">

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="mb-10">
                    <button
                        onClick={() => navigate(`/repo/${repoId}`)}
                        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Repository
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel p-8 rounded-3xl border border-white/5 bg-dark-900/60 backdrop-blur-2xl">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center tracking-tight">
                                <AlertCircle className="w-8 h-8 mr-4 text-red-500 animate-pulse" />
                                Bug Analysis Report
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">AI-driven code analysis, security scanning, and issue detection.</p>
                        </div>
                        <button
                            onClick={fetchBugs}
                            className="glass-panel hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 transition-colors shrink-0 text-sm font-medium flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400" /> Run Scan Again
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl mb-8 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {bugs.length === 0 && !error ? (
                    <div className="glass-card rounded-3xl p-16 text-center border border-white/5 bg-black/20">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-12 h-12 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">Codebase is Clean!</h2>
                        <p className="text-gray-400 text-lg max-w-md mx-auto">No major security vulnerabilities, bugs, or performance issues were detected.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bugs.map((bug, index) => (
                            <div key={index} className={`glass-card rounded-2xl p-8 border hover:brightness-110 transition-all ${getSeverityColor(bug.severity)} bg-black/30 backdrop-blur-md`}>
                                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-white/10 rounded-xl border border-white/20 shadow-inner">
                                            {getTypeIcon(bug.type)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold capitalize tracking-tight mb-1">{bug.type} Issue</h3>
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-black/40 border border-white/10 opacity-90">{bug.severity} Severity</span>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 px-4 py-2 rounded-xl text-sm font-mono border border-white/10 shrink-0 shadow-inner">
                                        {bug.file_path} {bug.line_numbers ? <span className="opacity-60 ml-2">L:{bug.line_numbers.join(', ')}</span> : ''}
                                    </div>
                                </div>

                                <div className="mb-6 bg-black/20 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Description</h4>
                                    <p className="opacity-90 leading-relaxed text-sm">{bug.description}</p>
                                </div>

                                {bug.suggested_fix && (
                                    <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20 shadow-inner">
                                        <h4 className="font-bold text-sm mb-3 text-emerald-400 flex items-center uppercase tracking-widest">
                                            <Zap className="w-4 h-4 mr-2" /> Suggested Fix
                                        </h4>
                                        <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-emerald-200/90 whitespace-pre-wrap border border-emerald-500/20 overflow-x-auto">
                                            {bug.suggested_fix}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugAnalysisView;
