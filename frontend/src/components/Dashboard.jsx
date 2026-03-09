import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Search, Code2, GitBranch, Plus, Loader, RefreshCw, Settings, LogOut, BarChart, Bug, Terminal, Check, Trash2, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [repoUrl, setRepoUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [repositories, setRepositories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Deep Analysis State
    const [analysisData, setAnalysisData] = useState(null);
    const [activeAnalysisModal, setActiveAnalysisModal] = useState(null); // 'stats', 'architecture', 'bugs', null
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Profile & Settings State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Name Update State
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setSettingsMessage({ type: '', text: '' });

        if (passwords.new !== passwords.confirm) {
            setSettingsMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setIsChangingPassword(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, config);

            setSettingsMessage({ type: 'success', text: 'Password successfully updated' });
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => {
                setIsSettingsOpen(false);
                setSettingsMessage({ type: '', text: '' });
            }, 2000);
        } catch (error) {
            setSettingsMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleUpdateName = async () => {
        if (!editedName.trim() || editedName === user?.name) {
            setIsEditingName(false);
            return;
        }

        setIsUpdatingName(true);
        setSettingsMessage({ type: '', text: '' });

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put('/api/auth/update-profile', { name: editedName }, config);

            // Update auth context manually by grabbing localstorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...storedUser, name: editedName };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Since we're using context, we ideally would have a generic 'updateUser' in AuthContext
            // For now, we'll reload the page gracefully to catch the synced state or rely on next refresh.
            // As a fallback, we can manipulate the window location if we don't want to expand AuthContext right now.
            window.location.reload();

        } catch (error) {
            console.error('Failed to update name:', error);
            setSettingsMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update name'
            });
            setIsUpdatingName(false);
        }
    };

    const loadRepositories = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const response = await axios.get('/api/github/repos', config);
            const repos = response.data.map(repo => ({
                id: repo.id,
                name: repo.repoName,
                owner: repo.owner,
                status: repo.status?.toLowerCase() || 'pending',
                lastAnalyzed: repo.indexedAt ? formatTimeAgo(repo.indexedAt) : 'never',
                totalFiles: repo.totalFiles || 0,
                branch: repo.branch || 'main',
                languages: repo.languages || {}
            }));
            setRepositories(repos);
        } catch (error) {
            console.error('Failed to load repositories:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user.token]);

    const handleDeleteRepo = async (repoId) => {
        if (!window.confirm("Are you sure you want to remove this repository from your workspace?")) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/github/${repoId}`, config);
            loadRepositories();
        } catch (error) {
            console.error('Failed to delete repository:', error);
            alert('Failed to remove repository. Please try again.');
        }
    };

    useEffect(() => {
        loadRepositories();
        const interval = setInterval(() => {
            loadRepositories();
        }, 5000);
        return () => clearInterval(interval);
    }, [loadRepositories]);

    const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    const formatPreciseDate = (dateStr) => {
        const d = new Date(dateStr);
        const dateObj = d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const timeObj = d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${dateObj} at ${timeObj}`;
    };

    const handleAnalyze = async (repoId, type) => {
        setActiveAnalysisModal(type);
        setIsAnalyzing(true);
        setAnalysisData(null);
        try {
            const aiEngineUrl = 'http://localhost:8000';
            let endpoint = `/analyze/${type}`;
            const response = await axios.post(`${aiEngineUrl}${endpoint}?repo_id=${repoId}`);

            const currentRepo = repositories.find(r => r.id === repoId);
            setAnalysisData({
                ...response.data,
                languages: currentRepo?.languages || {}
            });
        } catch (error) {
            console.error(`Failed to analyze ${type}:`, error);
            setAnalysisData({ error: error.message || "Failed to parse analysis" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleConnectRepo = async (e) => {
        e.preventDefault();
        if (!repoUrl.trim()) return;
        setIsConnecting(true);

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const response = await axios.post('/api/github/connect', {
                repoUrl,
                branch: 'main'
            }, config);

            const newRepo = response.data;
            setRepositories(prev => [...prev, {
                id: newRepo.id,
                name: newRepo.repoName || repoUrl.split('/').pop(),
                owner: newRepo.owner,
                status: (newRepo.status || 'indexing').toLowerCase(),
                lastAnalyzed: 'just now',
                totalFiles: 0,
                branch: newRepo.branch || 'main'
            }]);
            setRepoUrl('');
        } catch (error) {
            console.error('Failed to connect repository:', error);
            alert('Failed to connect repository. Make sure it is a valid public GitHub URL.');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans">
            {/* Ambient Background Glow is now handled globally in App.jsx */}

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 glass-panel border-b border-gray-200 dark:border-white/5 border-t-0 border-x-0 rounded-none w-full shadow-glass-premium transition-colors duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-neon-purple">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                            MouCodeBrain
                        </h1>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-5">
                        <button
                            onClick={loadRepositories}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-3 pl-2 pr-4 py-1.5 glass-panel rounded-full hover:border-indigo-500/30 transition-all focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-sm font-bold shadow-sm shadow-indigo-500/30">
                                    <span className="text-white">{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-200 hidden sm:block">
                                    {user?.name?.split(' ')[0] || 'User'}
                                </span>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-56 glass-panel border border-white/10 rounded-2xl shadow-xl py-2 z-50 animate-slide-up transform origin-top-right">
                                        <div className="px-4 py-3 border-b border-white/5 mb-1">
                                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setIsProfileOpen(false); setIsSettingsOpen(true); }}
                                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-gray-400" />
                                            <span>Account Settings</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 text-red-400" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-10 flex-1 relative z-10">

                {/* Dashboard Header & Connect Repo */}
                <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-12">
                    <div className="max-w-xl animate-slide-up">
                        <h2 className="text-4xl font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 dark:from-white dark:to-gray-300">Your Workspaces</h2>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-light">
                            Manage your connected repositories and start analyzing.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto min-w-[340px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <form onSubmit={handleConnectRepo} className="glass-panel p-2 rounded-2xl flex relative overflow-hidden focus-within:ring-2 focus-within:ring-neon-purple/50 transition-all shadow-glass-premium">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 opacity-30 dark:opacity-50"></div>
                            <div className="relative flex-1 flex items-center pl-4 z-10">
                                <Github className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                <input
                                    type="text"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="Paste GitHub URL..."
                                    className="w-full bg-transparent border-none text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isConnecting || !repoUrl.trim()}
                                className="relative z-10 ml-2 btn-primary px-5 py-2 whitespace-nowrap"
                            >
                                {isConnecting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Connecting</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Connect</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <p>Loading your repositories...</p>
                    </div>
                )}

                {/* Repositories Grid */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {repositories.map((repo, idx) => (
                            <div key={repo.id} className="glass-card flex flex-col h-full group animate-slide-up" style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Repo Header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center space-x-3 w-3/4">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                                <Github className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <h3 className="text-gray-900 dark:text-white font-semibold truncate text-lg" title={repo.name}>{repo.name}</h3>
                                        </div>

                                        {/* Status Badge & Delete */}
                                        <div className="flex items-center gap-2">
                                            {repo.status === 'completed' ? (
                                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-bold rounded-full">Ready</span>
                                            ) : repo.status === 'indexing' ? (
                                                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1.5">
                                                    <Loader className="w-3 h-3 animate-spin" />
                                                    <span>Indexing</span>
                                                </span>
                                            ) : repo.status === 'failed' ? (
                                                <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-wider font-bold rounded-full">Failed</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 text-[10px] uppercase tracking-wider font-bold rounded-full">Pending</span>
                                            )}

                                            <button
                                                onClick={() => handleDeleteRepo(repo.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                title="Remove Repository"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Repo Details */}
                                    <div className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                        {repo.status === 'indexing' ? (
                                            <div className="w-full">
                                                <div className="flex justify-between text-xs text-indigo-300 font-medium mb-1.5">
                                                    <span>Analyzing codebase</span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full animate-pulse w-[60%]"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Branch</span>
                                                    <span className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                                                        <GitBranch className="w-3.5 h-3.5 mr-1.5 text-indigo-500 dark:text-indigo-400" />
                                                        {repo.branch}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Files Indexed</span>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{repo.totalFiles}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1"></div>
                                    <div className="text-[11px] text-center text-gray-400 mb-4 bg-white/5 py-1.5 rounded-lg border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                                        <span className="font-semibold tracking-wider uppercase mr-1.5 opacity-60 text-indigo-300">Connected:</span>
                                        {formatPreciseDate(repo.indexedAt || repo.createdAt || new Date())}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/repo/${repo.id}/chat`)}
                                            disabled={repo.status !== 'completed'}
                                            className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            <Terminal className="w-4 h-4" />
                                            <span>Chat</span>
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAnalyze(repo.id, 'stats')}
                                                disabled={repo.status !== 'completed'}
                                                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-indigo-500 dark:text-indigo-300 hover:text-white hover:bg-indigo-500 hover:border-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Codebase Analysis"
                                            >
                                                <BarChart className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAnalyze(repo.id, 'bugs')}
                                                disabled={repo.status !== 'completed'}
                                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-500/20 hover:border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Find Bugs"
                                            >
                                                <Bug className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAnalyze(repo.id, 'architecture')}
                                                disabled={repo.status !== 'completed'}
                                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Architecture"
                                            >
                                                <Search className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-white/5 absolute bottom-0">
                                    <div className="h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center opacity-50"></div>
                                </div>
                            </div>
                        ))
                        }

                        {/* Empty/Add First State */}
                        {
                            !isLoading && repositories.length === 0 && (
                                <div className="col-span-full py-16 text-center animate-fade-in glass-panel rounded-3xl border-dashed">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mx-auto mb-6">
                                        <Github className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">No repositories connected</h3>
                                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                                        Paste a GitHub repository link above to start analyzing code and chatting with our AI.
                                    </p>
                                </div>
                            )
                        }
                    </div >
                )}
            </main >

            {/* Modals Container */}

            {/* Settings Modal */}
            {
                isSettingsOpen && (
                    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-xl flex items-center justify-center z-50 px-4">
                        <div className="glass-panel border-white/10 w-full max-w-md p-8 relative animate-slide-up shadow-2xl">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="absolute top-5 right-5 text-gray-500 hover:text-white transition bg-white/5 p-2 rounded-full"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h2>

                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Profile Info</h3>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col gap-2 relative group transition-colors hover:bg-gray-100 dark:hover:bg-black/30">
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Name</span>

                                        {isEditingName ? (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                    className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 transition-all font-medium"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateName();
                                                        if (e.key === 'Escape') setIsEditingName(false);
                                                    }}
                                                    disabled={isUpdatingName}
                                                />
                                                <button
                                                    onClick={handleUpdateName}
                                                    disabled={isUpdatingName}
                                                    className="p-1.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-500/30 transition-colors"
                                                >
                                                    {isUpdatingName ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingName(false)}
                                                    disabled={isUpdatingName}
                                                    className="p-1.5 bg-gray-500/20 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-500/30 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" /> {/* Or an X icon, reused trash2 for cancel generic shape */}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">{user?.name || 'N/A'}</span>
                                                <button
                                                    onClick={() => {
                                                        setEditedName(user?.name || '');
                                                        setIsEditingName(true);
                                                    }}
                                                    className="text-xs text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold px-2 py-1 bg-indigo-500/5 dark:bg-indigo-500/10 rounded border border-indigo-500/20 hover:bg-indigo-500/20"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col gap-1">
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Email</span>
                                        <span className="text-gray-700 dark:text-gray-200 font-medium">{user?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-8">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Update Password</h3>

                                {settingsMessage.text && (
                                    <div className={`px-4 py-3 rounded-xl text-sm mb-5 font-medium ${settingsMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {settingsMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div className="group">
                                        <label className="auth-label group-focus-within:text-indigo-400">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            className="glass-input text-gray-900 dark:text-gray-200"
                                            required
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="auth-label group-focus-within:text-indigo-400">New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            className="glass-input text-gray-900 dark:text-gray-200"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="auth-label group-focus-within:text-indigo-400">Confirm New</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="glass-input text-gray-900 dark:text-gray-200"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="w-full btn-primary py-3.5 mt-2 text-sm font-semibold flex items-center justify-center space-x-2 disabled:opacity-70"
                                    >
                                        {isChangingPassword ? (
                                            <><Loader className="w-5 h-5 animate-spin" /><span>Updating...</span></>
                                        ) : (
                                            <span>Change Password</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            {/* Analysis Modals */}
            {activeAnalysisModal && (
                <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-xl flex items-center justify-center z-50 px-4">
                    <div className="glass-panel border-white/10 w-full max-w-4xl max-h-[85vh] overflow-y-auto p-8 relative shadow-2xl animate-scale-up">
                        <button
                            onClick={() => { setActiveAnalysisModal(null); setAnalysisData(null); }}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition bg-white/5 p-2 rounded-full"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 flex items-center justify-center border border-indigo-500/30">
                                {activeAnalysisModal === 'stats' ? <BarChart className="w-6 h-6 text-indigo-500 dark:text-indigo-400" /> :
                                    activeAnalysisModal === 'bugs' ? <Bug className="w-6 h-6 text-amber-500 dark:text-amber-400" /> :
                                        <Search className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeAnalysisModal} Analysis</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">AI-generated deep insight report.</p>
                            </div>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader className="w-10 h-10 text-indigo-500 dark:text-indigo-400 animate-spin mb-6" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyzing Codebase</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md text-center text-sm">Deep AI analysis in progress. Reading syntax trees and identifying core patterns...</p>
                            </div>
                        ) : analysisData?.error ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Analysis Failed</h4>
                                    <p className="text-sm opacity-90">{analysisData.error}</p>
                                </div>
                            </div>
                        ) : activeAnalysisModal === 'stats' && analysisData ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                                        <h3 className="text-sm text-indigo-300 font-bold uppercase tracking-widest mb-4">Frameworks Detected</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisData.frameworks?.map((fw, i) => (
                                                <span key={i} className="px-4 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-200 rounded-full text-sm font-medium">{fw}</span>
                                            )) || <span className="text-gray-500 text-sm">None detected</span>}
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                                        <h3 className="text-sm text-indigo-300 font-bold uppercase tracking-widest mb-4">Languages Used</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisData.languages && Object.keys(analysisData.languages).length > 0 ? (
                                                Object.entries(analysisData.languages)
                                                    .sort((a, b) => b[1] - a[1])
                                                    .map(([lang, percentage]) => (
                                                        <div key={lang} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-700 dark:text-white text-sm">
                                                            <span>{lang}</span>
                                                            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{percentage}%</span>
                                                        </div>
                                                    ))
                                            ) : <span className="text-gray-500 text-sm">No languages detected</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                                        <h3 className="text-sm text-indigo-300 font-bold uppercase tracking-widest mb-4">Design Patterns</h3>
                                        <ul className="space-y-3">
                                            {analysisData.patterns?.map((pattern, i) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm font-medium">
                                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                    <span>{pattern}</span>
                                                </li>
                                            )) || <li className="text-gray-500">No distinct patterns mapped.</li>}
                                        </ul>
                                    </div>
                                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                                        <h3 className="text-sm text-red-400 font-bold uppercase tracking-widest mb-4">Architectural Flags</h3>
                                        <ul className="space-y-3">
                                            {analysisData.issues?.map((issue, i) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 mt-1.5 shrink-0" />
                                                    <span>{issue}</span>
                                                </li>
                                            )) || <li className="text-gray-500">No major issues flagged.</li>}
                                        </ul>
                                    </div>
                                </div>

                                <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                                    <h3 className="text-sm text-indigo-500 dark:text-indigo-300 font-bold uppercase tracking-widest mb-3">Efficiency Overview</h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{analysisData.efficiency || "No efficiency data available."}</p>
                                </div>
                            </div>
                        ) : activeAnalysisModal === 'bugs' && analysisData ? (
                            <div className="space-y-5 animate-fade-in">
                                {Array.isArray(analysisData) && analysisData.length > 0 ? (
                                    analysisData.map((bug, i) => (
                                        <div key={i} className="bg-gray-100 dark:bg-black/20 p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-colors">
                                            <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-white/5 pb-3">
                                                <span className={`px-3 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold ${bug.severity === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30' :
                                                    bug.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' :
                                                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30'
                                                    }`}>{bug.severity} Severity</span>
                                                <span className="text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-1 bg-white/5 rounded-md border border-gray-200 dark:border-white/10">{bug.type}</span>
                                            </div>
                                            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">{bug.description}</h4>
                                            <p className="text-sm mb-4 font-mono bg-gray-50 dark:bg-dark-900 inline-block px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                                                <span className="text-indigo-600 dark:text-indigo-400">{bug.file_path}</span>
                                                {bug.line_numbers && <span className="text-gray-500 dark:text-gray-500 ml-2">L: {bug.line_numbers.join(', ')}</span>}
                                            </p>
                                            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                                <h5 className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Suggested Fix</h5>
                                                <p className="text-emerald-700 dark:text-emerald-300/80 text-sm leading-relaxed">{bug.suggested_fix}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                            <Check className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Clean Codebase!</h3>
                                        <p className="text-gray-400">Our AI didn't find any explicit bugs in the selected extract.</p>
                                    </div>
                                )}
                            </div>
                        ) : activeAnalysisModal === 'architecture' && analysisData ? (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h3 className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Code2 className="w-4 h-4" /> Core Modules
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysisData.modules?.map((mod, i) => (
                                            <div key={i} className="bg-gray-100 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors group">
                                                <p className="text-gray-900 dark:text-white font-semibold text-lg">{mod.name}</p>
                                                <div className="flex justify-between items-center mt-3">
                                                    <p className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest font-bold">{mod.type}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">{mod.id}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-b from-transparent to-white/5 rounded-2xl border border-white/5 border-t-0">
                                    <h3 className="text-sm text-blue-400 font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <GitBranch className="w-4 h-4" /> Dependency Graph
                                    </h3>
                                    <div className="space-y-3">
                                        {analysisData.dependencies?.map((dep, i) => (
                                            <div key={i} className="flex items-center text-sm bg-black/40 p-3 rounded-xl border border-white/5">
                                                <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 font-medium rounded-lg text-center border border-indigo-500/30 whitespace-nowrap">{dep.from}</span>
                                                <div className="flex-1 flex flex-col items-center px-4">
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{dep.relationship || "CALLS"}</span>
                                                    <div className="w-full h-px bg-gradient-to-r from-indigo-500/50 via-gray-500 to-blue-500/50 relative">
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-blue-500/50 transform rotate-45"></div>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 font-medium rounded-lg text-center border border-blue-500/30 whitespace-nowrap">{dep.to}</span>
                                            </div>
                                        ))}
                                        {(!analysisData.dependencies || analysisData.dependencies.length === 0) && (
                                            <p className="text-gray-500 text-sm text-center py-4">No mapped dependencies.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;