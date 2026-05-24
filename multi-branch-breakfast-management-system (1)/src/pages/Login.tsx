import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useAuthStore } from '../store';
import { mockUsers, mockBranches } from '../data/mockData';
import type { UserRole } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('kasir');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();

  const roles = [
    { value: 'kasir', label: 'Kasir' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'owner_cabang', label: 'Owner Cabang' },
    { value: 'area_manager', label: 'Area Manager' },
    { value: 'hq_admin', label: 'HQ Admin' },
    { value: 'ceo', label: 'CEO' },
    { value: 'investor', label: 'Investor' },
    { value: 'supplier', label: 'Supplier' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo login - find user by role or create mock user
    const user = mockUsers.find(u => u.role === selectedRole) || {
      id: 'demo-user',
      email: email || 'demo@smp.id',
      phone: '081234567890',
      name: `Demo ${roles.find(r => r.value === selectedRole)?.label}`,
      role: selectedRole as UserRole,
      branch_id: 'branch-001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const branch = mockBranches.find(b => b.id === (user.branch_id || 'branch-001'));

    login(user, branch);
    setIsLoading(false);
  };

  const handleQuickLogin = (role: string) => {
    setSelectedRole(role);
    const user = {
      id: `demo-${role}`,
      email: `${role}@smp.id`,
      phone: '081234567890',
      name: `Demo ${roles.find(r => r.value === role)?.label}`,
      role: role as UserRole,
      branch_id: 'branch-001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const branch = mockBranches[0];
    login(user, branch);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🍳</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SMP</h1>
              <p className="text-orange-100">Sarapan Murah Pagi</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Sistem Manajemen<br />Bisnis F&B<br />Multi-Cabang
          </h2>
          <p className="text-orange-100 text-lg">
            Platform all-in-one untuk mengelola operasional bisnis sarapan dengan model konsinyasi.
          </p>
          
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">100+</p>
              <p className="text-orange-100 text-sm">Cabang</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-orange-100 text-sm">Supplier</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-orange-100 text-sm">Produk</p>
            </div>
          </div>
        </div>

        <div className="text-orange-100 text-sm">
          © 2025 SMP - Sarapan Murah Pagi. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🍳</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMP</h1>
              <p className="text-gray-500">Sarapan Murah Pagi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Selamat Datang! 👋</h2>
              <p className="text-gray-500 mt-2">Masuk ke akun SMP Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <Select
                label="Role / Jabatan"
                options={roles}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              />

              <Input
                label="Email"
                type="email"
                placeholder="email@smp.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} />}
              />

              <div className="relative">
                <Input
                  label="Password / PIN"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Masuk
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-center text-gray-500 text-sm mb-4">
                Quick Login (Demo)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('kasir')}
                >
                  🧑‍💼 Kasir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('supervisor')}
                >
                  👨‍💼 Supervisor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('ceo')}
                >
                  👔 CEO
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('supplier')}
                >
                  🚚 Supplier
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Butuh bantuan? Hubungi <a href="#" className="text-orange-500">support@smp.id</a>
          </p>
        </div>
      </div>
    </div>
  );
};
