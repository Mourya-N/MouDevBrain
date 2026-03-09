import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, Eye, EyeOff, Loader2, ArrowRight, Check, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const passwordChecks = useMemo(() => ({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
    }), [password]);

    const passwordStrength = useMemo(() => {
        const passed = Object.values(passwordChecks).filter(Boolean).length;
        if (passed === 0) return { level: 0, label: '', color: '' };
        if (passed === 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
        if (passed === 2) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
        return { level: 3, label: 'Strong', color: 'bg-green-500' };
    }, [passwordChecks]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
            setError('Password does not meet the requirements.');
            return;
        }

        setIsLoading(true);

        try {
            await axios.post('/api/auth/register', { name, email, password });

            // Auto-login after successful registration
            const loginResponse = await axios.post('/api/auth/login', { email, password });
            const { token, email: userEmail } = loginResponse.data;
            login({ email: userEmail, name, token });

            setSuccess('Account created successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const signupWithGoogle = useGoogleLogin({
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
                setError('Google sign-in failed. Please try again.');
            }
        },
        onError: () => {
            setError('Google sign-in failed.');
        }
    });

    const CheckItem = ({ passed, label }) => (
        <div className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${passed ? 'text-green-400' : 'text-slate-500'}`}>
            {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {label}
        </div>
    );

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
                        Join the Revolution
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Transform how you <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">build software.</span>
                    </h2>
                    <p className="text-indigo-200/80 text-lg lg:text-xl mb-10 font-light leading-relaxed">
                        Sign up today and give your entire codebase a brain. Identify bugs, generate documentation, and refactor code in seconds.
                    </p>

                    {/* Features list instead of a quote for signup */}
                    <div className="space-y-4">
                        {[
                            'Chat interface for your repositories',
                            'Automated bug detection & analysis',
                            'Architectural visualizations'
                        ].map((feature, idx) => (
                            <div key={idx} className="flex gap-3 items-center text-slate-300 font-medium animate-slide-up" style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}>
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Check className="w-3 h-3 text-indigo-400" />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="w-full h-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative animate-fade-in overflow-y-auto min-h-screen">
                {/* Mobile Background Orbs */}
                <div className="auth-orb auth-orb-3 lg:hidden opacity-30 fixed" />

                <div className="w-full max-w-md relative z-10 glass-card p-8 sm:p-10 border-white/5 bg-dark-800/60 lg:bg-transparent lg:border-none lg:shadow-none lg:backdrop-blur-none lg:p-0 my-auto">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/80 to-neon-blue/80 flex items-center justify-center mb-4 shadow-neon-purple border border-neon-purple/50">
                            <Code2 className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">MouCodeBrain</h1>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-slate-400">Join us to start analyzing with AI.</p>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className="auth-error mb-6 flex items-center gap-3 animate-slide-up">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <X className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="auth-success mb-6 flex items-center gap-3 animate-slide-up">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-sm font-medium">{success}</span>
                        </div>
                    )}

                    {/* Social Signup */}
                    <div className="w-full mb-6">
                        <button
                            onClick={() => signupWithGoogle()}
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
                                Or sign up with email
                            </span>
                        </div>
                    </div>

                    {/* Signup Form */}
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="group">
                            <label className="auth-label group-focus-within:text-indigo-400 transition-colors" htmlFor="signup-name">Full Name</label>
                            <input
                                id="signup-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="glass-input"
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className="group">
                            <label className="auth-label group-focus-within:text-indigo-400 transition-colors" htmlFor="signup-email">Email Address</label>
                            <input
                                id="signup-email"
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
                            <label className="auth-label group-focus-within:text-indigo-400 transition-colors" htmlFor="signup-password">Password</label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="glass-input pr-11"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-300 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {password && (
                                <div className="mt-3 space-y-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 flex gap-1">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`password-strength-bar flex-1 h-1.5 ${passwordStrength.level >= level
                                                        ? passwordStrength.color
                                                        : 'bg-slate-700/50'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className={`text-xs font-semibold ${passwordStrength.level === 3 ? 'text-green-400' :
                                            passwordStrength.level === 2 ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <CheckItem passed={passwordChecks.length} label="8+ chars" />
                                        <CheckItem passed={passwordChecks.uppercase} label="Uppercase" />
                                        <CheckItem passed={passwordChecks.number} label="Number" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="group">
                            <label className="auth-label group-focus-within:text-indigo-400 transition-colors" htmlFor="signup-confirm-password">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="signup-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className={`glass-input pr-11 ${confirmPassword && password !== confirmPassword
                                        ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'
                                        : confirmPassword && password === confirmPassword
                                            ? 'border-green-500/50 focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]'
                                            : ''
                                        }`}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-300 transition-colors p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Passwords do not match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || (confirmPassword && password !== confirmPassword)}
                            className="w-full btn-primary py-3.5 mt-5 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold text-base tracking-wide">Create Account</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-slate-400 text-sm text-center mt-8 pb-8 lg:pb-0">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Sign in to continue
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
