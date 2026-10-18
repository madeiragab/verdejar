import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/common';
import { useDocumentTitle } from '../lib/hooks';

function useAfterAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/contribuir';
  return () => navigate(from, { replace: true });
}

export function Login() {
  useDocumentTitle('Entrar');
  const { login } = useAuth();
  const done = useAfterAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      done();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Bom te ver de novo" subtitle="Entre para enviar e acompanhar suas contribuições.">
      <form onSubmit={submit} className="form">
        {error && <Alert>{error}</Alert>}
        <label className="field">
          <span>E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn-block" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="muted center">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  useDocumentTitle('Criar conta');
  const { register } = useAuth();
  const done = useAfterAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      done();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'Não foi possível criar a conta'));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (k: string) => error?.details?.[k]?.[0];

  return (
    <AuthShell title="Faça parte" subtitle="Com uma conta você pode registrar plantas da sua região.">
      <form onSubmit={submit} className="form">
        {error && !error.details && <Alert>{error.message}</Alert>}
        <label className="field">
          <span>Nome</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldError('name') && <small className="error">{fieldError('name')}</small>}
        </label>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {fieldError('email') && <small className="error">{fieldError('email')}</small>}
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <small className="hint">Pelo menos 8 caracteres</small>
          {fieldError('password') && <small className="error">{fieldError('password')}</small>}
        </label>
        <button className="btn btn-block" disabled={busy}>
          {busy ? 'Criando…' : 'Criar conta'}
        </button>
        <p className="muted center">
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-card card">
        <span className="brand-mark big">
          <Sprout size={26} />
        </span>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
