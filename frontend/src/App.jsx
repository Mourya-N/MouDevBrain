import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RepositoryView from './components/RepositoryView';
import ChatInterface from './components/ChatInterface';
import ArchitectureView from './components/ArchitectureView';
import Login from './components/Login';
import Signup from './components/Signup';
import BugAnalysisView from './components/BugAnalysisView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

function HomeRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}

function MainApp() {
    const { theme } = useTheme();
    return (
        <div className="relative min-h-screen bg-white dark:bg-dark-900 text-gray-900 dark:text-white selection:bg-neon-purple/30 overflow-hidden font-sans transition-colors duration-300">
            {/* Ultra-Premium Background Assets */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Base Grid */}
                <div className="absolute inset-0 bg-premium-grid opacity-[0.05] dark:opacity-20 mask-radial-faded"></div>

                {/* Cinematic Orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-neon-purple/10 dark:bg-neon-purple/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-neon-cyan/5 dark:bg-neon-cyan/10 rounded-full blur-[130px] mix-blend-screen" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite both' }}></div>
                <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] bg-neon-blue/10 dark:bg-neon-blue/15 rounded-full blur-[90px] mix-blend-screen" style={{ animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite both' }}></div>

                {/* Film Grain Noise */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay bg-premium-noise pointer-events-none"></div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full min-h-screen">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/repo/:repoId" element={<ProtectedRoute><RepositoryView /></ProtectedRoute>} />
                    <Route path="/repo/:repoId/chat" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
                    <Route path="/repo/:repoId/architecture" element={<ProtectedRoute><ArchitectureView /></ProtectedRoute>} />
                    <Route path="/repo/:repoId/bugs" element={<ProtectedRoute><BugAnalysisView /></ProtectedRoute>} />
                    <Route path="/" element={<HomeRedirect />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <MainApp />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;