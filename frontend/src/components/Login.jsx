import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token, email: userEmail } = response.data;
            login({ email: userEmail, token });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch user info using access token
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });

                const response = await axios.post('/api/auth/google', {
                    credential: tokenResponse.access_token,
                    email: userInfo.data.email,
                    name: userInfo.data.name
                });

                const { token, email: userEmail, name: userName } = response.data;
                login({ email: userEmail, token, name: userName });
                navigate('/dashboard');
            } catch (err) {
                setIsLoading(false);
                setError('Google login failed. Please try again.');
            }
        },
        onError: () => {
            setError('Google login failed.');
        }
    });

    return (
        <div className="min-h-screen relative flex overflow-hidden">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden auth-gradient-bg">
                {/* Decorative floating elements */}
                <div className="auth-orb auth-orb-1 opacity-50" />
                <div className="auth-orb auth-orb-2 opacity-50" />
                <div className="absolute inset-0 bg-dark-900/40 z-0"></div>

                {/* Logo Area */}
                <div className="relative z-20 flex items-center gap-4 animate-slide-up">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center backdrop-blur-md border border-neon-purple/30 shadow-neon-purple">
                        <Code2 className="w-7 h-7 text-neon-purple" />
                    </div>
                    <span className="text-white text-2xl font-bold tracking-tight">MouCodeBrain</span>
                </div>

                {/* Hero Content */}
                <div className="relative z-20 max-w-lg mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="inline-block px-4 py-1.5 rounded-full border border-neon-purple/30 bg-neon-purple/10 text-neon-purple text-sm font-medium mb-6 backdrop-blur-md shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]">
                        AI-Powered Code Intelligence
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Understand any <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">codebase instantly.</span>
                    </h2>
                    <p className="text-indigo-200/80 text-lg lg:text-xl mb-10 font-light leading-relaxed">
                        Navigate, analyze, and refactor complex projects with our advanced AI engine. Stop reading code, start conversing with it.
                    </p>

                    <div className="glass-panel p-6 rounded-2xl border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-duration-500" />
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                <span className="text-indigo-300 font-bold text-xl">"</span>
                            </div>
                            <p className="text-slate-300 text-sm font-medium italic relative z-10 flex-1">
                                This platform transformed how our team approaches legacy code. It feels like having the original author right next to you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative animate-fade-in">
                {/* Mobile Background Orbs */}
                <div className="auth-orb auth-orb-3 lg:hidden opacity-30" />
                <div className="auth-orb auth-orb-1 lg:hidden opacity-20 -top-20 -right-20" />

                <div className="w-full max-w-md relative z-10 glass-card p-8 sm:p-10 border-white/5 bg-dark-800/60 lg:bg-transparent lg:border-none lg:shadow-none lg:backdrop-blur-none lg:p-0">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden flex-col items-center mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/80 to-neon-blue/80 flex items-center justify-center mb-4 shadow-neon-purple border border-neon-purple/50">
                            <Code2 className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">MouCodeBrain</h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
                        <p className="text-slate-400">Please enter your details to sign in.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="auth-error mb-6 flex items-center gap-3 animate-slide-up">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="w-full mb-8">
                        <button
                            onClick={() => loginWithGoogle()}
                            type="button"
                            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-neon-blue/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all duration-300"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </svg>
                            Sign in with Google
                        </button>
                    </div>

                    <div className="auth-divider">
                        <div className="relative flex justify-center">
                            <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-dark-900 lg:bg-transparent">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="group">
                            <label className="auth-label group-focus-within:text-indigo-400 transition-colors" htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="glass-input"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="group">
                            <div className="flex items-center justify-between mb-2">
                                <label className="auth-label mb-0 group-focus-within:text-indigo-400 transition-colors" htmlFor="login-password">Password</label>
                                <button type="button" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="glass-input pr-11"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-300 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3.5 mt-4 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold text-base tracking-wide">Sign In</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-slate-400 text-sm text-center mt-8">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Create a free account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;