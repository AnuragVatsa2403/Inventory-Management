import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="fixed top-24 left-24 w-80 h-80 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-16 right-16 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="w-full max-w-sm relative z-10">
      
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', boxShadow: '0 8px 32px rgba(14,165,233,0.25)' }}>
            <span className="text-white font-bold text-xl font-mono">SH</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">StockHive</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-[0.2em] uppercase mt-1">
            Polytime Industries · Inventory System
          </p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-sm font-semibold text-dark-200 mb-5">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2.5 mb-4 font-mono">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-dark-500 tracking-[0.15em] uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@polytime.in"
                className="w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-dark-500 tracking-[0.15em] uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-white font-semibold text-sm rounded-lg py-2.5 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 20px rgba(14,165,233,0.2)' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-[10px] font-mono text-dark-700 tracking-[0.2em] uppercase">
          StockHive · Polytime Industries · v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
