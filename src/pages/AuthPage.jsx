import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, KeyRound, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { authMessage, useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useSystem } from '../context/SystemContext';

const MODES = {
  signin: { title: 'Sign In', cta: 'Enter the Gate', alt: 'signup' },
  signup: { title: 'Awaken', cta: 'Begin as E-Rank', alt: 'signin' },
  reset: { title: 'Recover Access', cta: 'Send Reset Link', alt: 'signin' },
};

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, reportAuthError, redirectError } = useAuth();
  const { toast } = useSystem();

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);
  // A failed redirect sign-in has no local error to show, so fall back to it.
  const error = localError || (redirectError ? authMessage(redirectError) : null);
  const setError = setLocalError;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password);
      } else if (mode === 'signup') {
        if (form.password.length < 6) throw { code: 'auth/weak-password' };
        await signUp(form.email, form.password, form.displayName);
      } else {
        await resetPassword(form.email);
        toast('Reset link sent. Check your inbox.', { tone: 'success' });
        setMode('signin');
      }
    } catch (err) {
      reportAuthError(err);
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      reportAuthError(err);
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const config = MODES[mode];

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden bg-void-950 px-4 py-10">
      {/* Ambient gate light behind the panel. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(38,189,255,0.4), transparent 65%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-7 text-center">
          <svg viewBox="0 0 64 64" className="mx-auto mb-4 h-14 w-14">
            <defs>
              <linearGradient id="auth-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5fd3ff" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M32 7 55 19v14c0 12-9.6 20.6-23 25C18.6 53.6 9 45 9 33V19L32 7Z"
              fill="none"
              stroke="url(#auth-g)"
              strokeWidth="2.4"
            />
            <path d="M22 21h20l-2.6 6H27.2l-1 4.6h11l-2.5 6h-9.8L23 46h-6.4L22 21Z" fill="url(#auth-g)" />
          </svg>
          <h1 className="font-display text-3xl font-bold tracking-[0.24em] text-slate-100">FITOMI</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-system-400">
            Arise. Every set counts.
          </p>
        </div>

        <div className="panel panel-accent clip-notch p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck size={16} className="accent-text" />
            <h2 className="font-display text-lg font-semibold tracking-wide text-slate-100">{config.title}</h2>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <TextField
                label="Hunter Name"
                icon={User}
                value={form.displayName}
                onChange={set('displayName')}
                placeholder="Sung Jin-Woo"
                autoComplete="name"
                required
              />
            )}

            <TextField
              label="Email"
              type="email"
              icon={AtSign}
              value={form.email}
              onChange={set('email')}
              placeholder="hunter@association.com"
              autoComplete="email"
              required
            />

            {mode !== 'reset' && (
              <TextField
                label="Password"
                type="password"
                icon={Lock}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                hint={mode === 'signup' ? 'At least 6 characters.' : undefined}
                required
              />
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-blood-500/40 bg-blood-500/10 px-3 py-2 text-sm text-blood-300"
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
              {config.cta}
            </Button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="hud-label">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <Button variant="ghost" size="lg" className="w-full" onClick={google} disabled={busy}>
                <GoogleMark />
                Continue with Google
              </Button>
            </>
          )}

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            {mode === 'signin' && (
              <>
                <button onClick={() => setMode('signup')} className="text-slate-400 transition hover:text-slate-100">
                  No account yet? <span className="accent-text font-semibold">Awaken as a hunter</span>
                </button>
                <button onClick={() => setMode('reset')} className="text-xs text-slate-500 transition hover:text-slate-300">
                  Forgot your password?
                </button>
              </>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-slate-400 transition hover:text-slate-100">
                Already awakened? <span className="accent-text font-semibold">Sign in</span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-600">
          Your training data is stored privately under your account and is never shared.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}
