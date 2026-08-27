import React, { useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';

export default function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer animate-fade-in-scale opacity-0" 
        style={{ animationDelay: '0ms' }}
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative glass-panel-strong rounded-3xl max-w-[420px] w-full p-8 shadow-2xl flex flex-col z-10 animate-fade-in-up opacity-0 glow-indigo">
        
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent rounded-t-3xl"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-white/30 mt-1">
              {isRegister ? 'Sign up to save your preferences' : 'Sign in to your Mingzy account'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all border border-white/[0.06] text-white/40 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Google Button First (Primary Action) */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all disabled:opacity-40 mb-6 group"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
            Continue with Google
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-full h-px bg-white/[0.06]"></div>
          <span className="absolute bg-[#0E0E0E] px-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">or</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-xs mb-5 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-[10px] text-white/25 mb-1.5 uppercase tracking-[0.15em] font-medium ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 focus:outline-none transition-all"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/25 mb-1.5 uppercase tracking-[0.15em] font-medium ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-2xl text-sm font-semibold mt-2 disabled:opacity-40 relative z-10"
          >
            <span className="relative z-10">
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </span>
          </button>
        </form>

        <p className="text-center text-xs text-white/25">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-violet-400 hover:text-violet-300 font-semibold focus:outline-none transition-colors"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
