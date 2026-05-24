import { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { authenticate, User } from '../auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Secret audit mode — activated by URL ?mode=audit or tapping logo 5x
  const [auditMode, setAuditMode] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);

  useEffect(() => {
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'audit') {
      setAuditMode(true);
    }
  }, []);

  useEffect(() => {
    // 5 taps on logo = audit mode
    if (logoTaps >= 5) {
      setAuditMode(true);
      setLogoTaps(0);
    }
    // Reset taps after 3 seconds
    if (logoTaps > 0 && logoTaps < 5) {
      const timer = setTimeout(() => setLogoTaps(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [logoTaps]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const user = authenticate(username, password);
      if (user) {
        // If audit mode, only allow auditor role
        if (auditMode && user.role !== 'auditor' && user.role !== 'owner') {
          setError('Akses ditolak');
          setIsLoading(false);
          return;
        }
        onLogin(user);
      } else {
        setError('Username atau password salah');
      }
      setIsLoading(false);
    }, 500);
  };

  // ── Audit Mode Login ──
  if (auditMode) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600/20 rounded-2xl mb-4 border border-rose-500/30">
              <Shield size={32} className="text-rose-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-200">Audit Access</h1>
            <p className="text-gray-600 text-xs mt-1">Restricted area</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder:text-gray-600"
                  placeholder="ID"
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 pr-10 placeholder:text-gray-600"
                  placeholder="Access code"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <div className="text-rose-500 text-xs text-center">{error}</div>
              )}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium text-sm hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield size={16} />}
                {isLoading ? '' : 'Login'}
              </button>
            </form>
            <button onClick={() => setAuditMode(false)}
              className="w-full mt-3 text-xs text-gray-700 hover:text-gray-500 text-center">
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal Login ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo — tap 5x to enter audit mode */}
        <div className="text-center mb-8">
          <button
            onClick={() => setLogoTaps(prev => prev + 1)}
            className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-4 focus:outline-none active:scale-95 transition-transform"
          >
            <span className="text-6xl">🍳</span>
          </button>
          <h1 className="text-4xl font-bold text-white">SMP</h1>
          <p className="text-orange-100 text-lg">Sarapan Murah Pagi</p>
          <p className="text-orange-200 text-sm mt-1">Serba 10 Ribu — Target 100 Cabang</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Selamat Datang!</h2>
          <p className="text-gray-500 text-sm text-center mb-6">Masuk ke sistem manajemen SMP</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
                placeholder="Masukkan username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm pr-10 transition-all"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-70">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Masuk</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Hubungi owner jika belum memiliki akun</p>
          </div>
        </div>

        <p className="text-center text-orange-100 text-xs mt-6">© 2024 SMP - Sarapan Murah Pagi</p>
      </div>
    </div>
  );
}
