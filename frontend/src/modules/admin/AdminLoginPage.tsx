import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { RootState } from '@/core/store/store';
import { useAppDispatch } from '@/core/hooks/useAppDispatch';
import { loginAdmin, clearError } from '@/core/store/slices/adminSlice';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

function AdminLoginPage() {
  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redux selectors
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.admin);
  const dispatch = useAppDispatch();

  // Custom hooks
  const navigate = useNavigate();

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginAdmin({ email, password }));
  };

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
            Administración
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl">
            Iniciar Sesión
          </h1>
        </div>

        <DecorativeDivider className="my-6" />

        <div className="mx-auto max-w-md">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-rose-soft bg-warm-white p-6"
          >
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-rose-soft bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-rose-soft bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

export default AdminLoginPage;
