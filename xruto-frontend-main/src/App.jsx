import React, { useState, useEffect, useCallback, useMemo, startTransition, useRef } from 'react';
import MyAdmin from './components/MyAdmin';
import Orders from './components/Orders';
import DriverRoutes from './components/DriverRoutes_IMPROVED';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { AppShell } from './components/layout/AppShell';
import { Card as UiCard } from './ui/Card';
import { Button } from './ui/Button';
import { Page } from './ui/Page';
import { SlideToConfirm } from './ui/SlideToConfirm';
import { Skeleton } from './ui/Skeleton';
import { useToast } from './ui/ToastContext.jsx';
import { BrandLogo } from './ui/BrandLogo.jsx';
import { ChevronLeft } from 'lucide-react';
import { AnalyticsCharts } from './components/AnalyticsCharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // fallback for local dev
/** If false (default), Analytics never fetches get-routes — that JSON alone can block the main thread for seconds. */
const LEGACY_ANALYTICS = import.meta.env.VITE_LEGACY_ANALYTICS === 'true';
const MAX_SNAPSHOT_TEXT = 500_000;
const MAX_GET_ROUTES_TEXT = 1_200_000;

/** Fetch wrapper: auto-clears session and reloads on 401 (expired/invalid token). */
async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('xruto_token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    localStorage.removeItem('xruto_token');
    localStorage.removeItem('xruto_user');
    window.location.reload();
    return new Response('{}', { status: 401 });
  }
  return res;
}

const Ico = ({ d, className = 'w-5 h-5', fill = false }) => (
  <svg className={className} fill={fill ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={fill ? 'none' : 'currentColor'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  eyeOff: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  route: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7',
  settings: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevronR: 'M9 5l7 7-7 7',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  chart: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  truck: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
};

// Standalone input field — must be outside LoginScreen to avoid remount on every keystroke
const LoginInputField = ({ icon, type = 'text', value, onChange, placeholder, showToggle, onToggle, isPassword }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xr-muted"><Ico d={icon} className="w-4.5 h-4.5" /></div>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full rounded-control border border-white/10 bg-xr-bg/50 py-3.5 pl-11 pr-11 text-sm text-xr-text placeholder-xr-muted backdrop-blur-sm transition focus:border-xr-brand/40 focus:outline-none focus:ring-2 focus:ring-xr-brand/20" />
    {showToggle && (
      <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-xr-muted hover:text-xr-text">
        <Ico d={isPassword ? ICONS.eyeOff : ICONS.eye} className="w-4.5 h-4.5" />
      </button>
    )}
  </div>
);

// Login Screen — centered card on desktop, full-screen on mobile
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).get('reset_token') ? 'reset' : 'login');
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token') || '');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const doLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      localStorage.setItem('xruto_token', data.token);
      localStorage.setItem('xruto_user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const doForgot = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
      setSuccessMsg(data.message);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const doReset = async () => {
    if (!newPw || !confirmPw) { setError('Please fill in both fields'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, new_password: newPw }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Reset failed');
      setSuccessMsg(data.message);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => { setView('login'); setSuccessMsg(''); }, 2500);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const switchView = (v) => { setView(v); setError(''); setSuccessMsg(''); };



  return (
    <div className="relative flex min-h-screen items-center justify-center bg-xr-bg px-4 py-10 md:px-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid opacity-[0.35] animate-fade-in delay-200" />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-noise animate-fade-in" />
      <UiCard variant="glass" className="relative z-10 w-full max-w-sm p-6 shadow-panel md:max-w-md md:p-10 animate-scale-up-sm">
        <div className="flex flex-col items-center">
          <div className="mb-8 w-full text-center">
            <div className="inline-flex flex-col items-center animate-fade-up delay-100">
              <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-card border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.2)] bg-gradient-to-b from-white/[0.08] to-transparent animate-glow-once">
                <BrandLogo className="h-12 w-12" alt="xRuto" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">xRuto</h1>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-xr-brand">Logistics Intelligence</p>
            </div>
          </div>
          {view === 'login' && (
            <div className="w-full animate-fade-up delay-200">
              <h2 className="mb-6 text-center text-lg font-semibold text-white">Sign in to your account</h2>
              {error && (
                <div className="mb-4 w-full rounded-control border border-xr-danger/25 bg-xr-danger/10 px-4 py-3 text-center text-sm text-red-200">{error}</div>
              )}
              <div className="w-full space-y-4">
                <LoginInputField icon={ICONS.user} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your Email Address" />
                <LoginInputField icon={ICONS.lock} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your Password" showToggle onToggle={() => setShowPw(v => !v)} isPassword={showPw} />
                <SlideToConfirm label="Slide to sign in" onConfirm={doLogin} loading={loading} />
                <Button type="button" variant="ghost" size="sm" className="mx-auto w-full text-xr-muted hover:text-xr-text mt-2" onClick={() => switchView('forgot')}>
                  Forgot password?
                </Button>
              </div>
            </div>
          )}
          {view === 'forgot' && (
            <>
              <h2 className="mb-2 text-center text-lg font-semibold text-white">Reset password</h2>
              <p className="mb-8 text-center text-sm text-xr-muted">Enter your email to receive a reset link</p>
              {error && (
                <div className="mb-4 w-full rounded-control border border-xr-danger/25 bg-xr-danger/10 px-4 py-3 text-center text-sm text-red-200">{error}</div>
              )}
              {successMsg && (
                <div className="mb-4 w-full rounded-control border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">{successMsg}</div>
              )}
              <div className="w-full space-y-4">
                <LoginInputField icon={ICONS.user} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your Email Address" />
                <SlideToConfirm label="Slide to send link" onConfirm={doForgot} loading={loading} />
                <Button type="button" variant="ghost" size="sm" className="mx-auto w-full gap-1 text-xr-muted hover:text-xr-text" onClick={() => switchView('login')}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </div>
            </>
          )}
          {view === 'reset' && (
            <>
              <h2 className="mb-2 text-center text-lg font-semibold text-white">Set new password</h2>
              <p className="mb-8 text-center text-sm text-xr-muted">Enter your new password below</p>
              {error && (
                <div className="mb-4 w-full rounded-control border border-xr-danger/25 bg-xr-danger/10 px-4 py-3 text-center text-sm text-red-200">{error}</div>
              )}
              {successMsg && (
                <div className="mb-4 w-full rounded-control border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">{successMsg}</div>
              )}
              <div className="w-full space-y-4">
                <LoginInputField icon={ICONS.lock} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New Password (min 6 chars)" />
                <LoginInputField icon={ICONS.lock} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm Password" />
                <SlideToConfirm label="Slide to reset password" onConfirm={doReset} loading={loading} />
                <Button type="button" variant="ghost" size="sm" className="mx-auto w-full gap-1 text-xr-muted hover:text-xr-text" onClick={() => switchView('login')}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </div>
            </>
          )}
        </div>
      </UiCard>
    </div>
  );
};

const formatISODate = (d) => d.toISOString().split('T')[0];

const addDays = (isoDate, delta) => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return formatISODate(d);
};

const eachDayISO = (startISO, endISO) => {
  const out = [];
  if (!startISO || !endISO || startISO > endISO) return out;
  let cur = startISO;
  for (let n = 0; n < 40 && cur <= endISO; n += 1) {
    out.push(cur);
    const next = addDays(cur, 1);
    if (next === cur) break;
    cur = next;
  }
  return out;
};

/** Prefer route-level counts (from slim=1) to avoid scanning every nested order (keeps the tab responsive). */
const summarizeRoutes = (routes) => {
  const r = routes || [];
  if (r.length === 0) {
    return { totalRoutes: 0, delivered: 0, totalStops: 0, avgDuration: 0, dispatched: 0, completed: 0 };
  }
  const canUseAgg = r.every((rt) => rt.total_orders != null && rt.completed_orders != null);
  let delivered;
  let totalStops;
  if (canUseAgg) {
    totalStops = r.reduce((s, rt) => s + (Number(rt.total_orders) || 0), 0);
    delivered = r.reduce((s, rt) => s + (Number(rt.completed_orders) || 0), 0);
  } else {
    // Cap work — a single route with tens of thousands of order objects was freezing the tab
    const MAX_STOPS = 15000;
    const allStops = [];
    outer: for (const rt of r) {
      for (const seg of rt.route_segments || []) {
        for (const o of seg.orders || []) {
          allStops.push(o);
          if (allStops.length >= MAX_STOPS) break outer;
        }
      }
    }
    delivered = allStops.filter((o) => o.status === 'delivered').length;
    totalStops = allStops.length;
  }
  const avgDuration =
    r.length > 0
      ? r.reduce(
          (sum, x) => sum + (x.estimated_duration_minutes ?? x.estimated_duration ?? x.total_time ?? 0),
          0
        ) / r.length
      : 0;
  const activeStatuses = new Set(['dispatched', 'in_progress', 'in_route', 'assigned']);
  const dispatched = r.filter((x) => activeStatuses.has(x.status)).length;
  const completed = r.filter((x) => x.status === 'completed').length;
  return { totalRoutes: r.length, delivered, totalStops, avgDuration, dispatched, completed };
};

// Analytics — visualization only (data fetch + charts)
const AnalyticsScreen = () => {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [period, setPeriod] = useState('today'); // today | week | month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState({
    totalRoutes: 0,
    delivered: 0,
    totalStops: 0,
    avgDuration: 0,
    dispatched: 0,
    completed: 0,
    pendingOrders: 0,
    totalOrders: 0,
  });

  const range = useMemo(() => {
    const end = formatISODate(new Date());
    if (period === 'today') return { start: end, end };
    if (period === 'week') return { start: addDays(end, -6), end };
    return { start: addDays(end, -29), end };
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const abortTimer = setTimeout(() => ac.abort(), 25000);
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchOpts = { signal: ac.signal, cache: 'no-store' };

        const days = eachDayISO(range.start, range.end);
        // Let the loading skeleton paint before any network/parse work
        await new Promise((r) => {
          requestAnimationFrame(() => r());
        });
        if (cancelled) return;

        const loadSnapshot = async () => {
          const snapUrl = `${API_BASE}/orders/analytics-snapshot?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`;
          const snapReq = await apiFetch(snapUrl, fetchOpts);
          if (cancelled) return { status: 'cancel' };
          if (snapReq.status === 404) return { status: 404 };
          if (!snapReq.ok) {
            throw new Error(
              snapReq.status === 401 ? 'Sign in again to view analytics' : `Analytics failed (${snapReq.status})`
            );
          }
          const snapText = await snapReq.text();
          if (snapText.length > MAX_SNAPSHOT_TEXT) {
            throw new Error('Unexpected analytics response size. Check API_BASE / proxy.');
          }
          try {
            return { status: 'ok', data: JSON.parse(snapText) };
          } catch {
            throw new Error('Invalid JSON from analytics-snapshot. Check VITE_API_URL and backend version.');
          }
        };

        const loadLegacyRoutes = async () => {
          const routesUrl = `${API_BASE}/orders/get-routes?date=${encodeURIComponent(range.end)}&slim=1`;
          const routesReq = await apiFetch(routesUrl, fetchOpts);
          if (cancelled) return null;
          if (!routesReq.ok) {
            throw new Error(
              routesReq.status === 401 ? 'Sign in again to view analytics' : `Routes data failed (${routesReq.status})`
            );
          }
          const routeText = await routesReq.text();
          if (routeText.length > MAX_GET_ROUTES_TEXT) {
            throw new Error('Routes response too large. Use GET /api/orders/analytics-snapshot on the server (turn off VITE_LEGACY_ANALYTICS).');
          }
          let routeRes;
          try {
            routeRes = JSON.parse(routeText);
          } catch {
            throw new Error('Invalid JSON from get-routes');
          }
          await new Promise((res) => {
            requestAnimationFrame(() => res());
          });
          if (cancelled) return null;

          const lastDayISO = range.end;
          const eligUrl = `${API_BASE}/orders/eligible?date=${encodeURIComponent(lastDayISO)}&summary=1`;
          const eligReq = await apiFetch(eligUrl, fetchOpts);
          if (cancelled) return null;
          if (!eligReq.ok) {
            throw new Error(`Eligible count failed (${eligReq.status})`);
          }
          const ordersText = await eligReq.text();
          if (ordersText.length > 200_000) {
            throw new Error('Eligible response too large. Use /eligible?summary=1 on the server.');
          }
          let ordersRes;
          try {
            ordersRes = JSON.parse(ordersText);
          } catch {
            throw new Error('Invalid JSON from eligible');
          }
          if (cancelled) return null;
          return { routeRes, ordersRes };
        };

        let lastS;
        let totalEligible = 0;

        const loaded = await loadSnapshot();
        if (cancelled) return;
        if (loaded?.status === 'cancel') return;

        let snapData = loaded?.status === 'ok' ? loaded.data : null;
        if (loaded?.status === 404) {
          snapData = null;
        }
        if (snapData && snapData.success && snapData.snapshot) {
          const s = snapData.snapshot;
          lastS = {
            totalRoutes: Number(s.totalRoutes) || 0,
            delivered: Number(s.delivered) || 0,
            totalStops: Number(s.totalStops) || 0,
            avgDuration: Number(s.avgDuration) || 0,
            dispatched: Number(s.dispatched) || 0,
            completed: Number(s.completed) || 0,
          };
          totalEligible = Number(snapData.eligibleCount) || 0;
        } else if (LEGACY_ANALYTICS) {
          const leg = await loadLegacyRoutes();
          if (cancelled) return;
          if (!leg) return;
          const lastRoutes = leg.routeRes?.success ? leg.routeRes.routes || [] : [];
          lastS = summarizeRoutes(lastRoutes);
          totalEligible = leg.ordersRes.success ? Number(leg.ordersRes.total_orders) || 0 : 0;
        } else {
          throw new Error(
            'Analytics needs the latest backend (GET /api/orders/analytics-snapshot). Restart the server in /backend, or set VITE_LEGACY_ANALYTICS=true in .env only if you must use the slow route.'
          );
        }

        const rate = lastS.totalStops > 0 ? Math.round((lastS.delivered / lastS.totalStops) * 100) : 0;
        const nextSeries = days.map((d) => ({
          date: d.slice(5),
          delivered: lastS.delivered,
          routes: lastS.totalRoutes,
          dispatched: lastS.dispatched,
          completed: lastS.completed,
          rate,
        }));
        const pending = Math.max(0, totalEligible - lastS.delivered);

        startTransition(() => {
          setSeries(nextSeries);
          setSummary({
            totalRoutes: lastS.totalRoutes,
            delivered: lastS.delivered,
            totalStops: lastS.totalStops,
            avgDuration: lastS.avgDuration,
            dispatched: lastS.dispatched,
            completed: lastS.completed,
            pendingOrders: pending,
            totalOrders: totalEligible,
          });
        });
      } catch (e) {
        if (cancelled || e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(abortTimer);
      ac.abort();
    };
  }, [range.start, range.end]);

  useEffect(() => {
    if (!error) return;
    toastRef.current.error(error);
    setError('');
  }, [error]);

  const deliveryRate = summary.totalStops > 0 ? Math.round((summary.delivered / summary.totalStops) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-xr-muted">
          <span className="text-xr-secondary">{range.start}</span>
          <span className="mx-1.5 text-white/25">—</span>
          <span className="text-xr-secondary">{range.end}</span>
        </p>
        <div className="inline-flex w-full max-w-md overflow-x-auto rounded-control border border-white/10 bg-white/[0.03] p-1 sm:w-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: '7d' },
            { id: 'month', label: '30d' },
          ].map((p) => (
            <Button
              key={p.id}
              variant={period === p.id ? 'primary' : 'ghost'}
              size="sm"
              className={period === p.id ? '' : 'text-xr-secondary'}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <UiCard variant="glass" className="p-5 sm:p-6">
            <Skeleton className="mb-4 h-4 w-56" />
            <Skeleton className="h-[260px] w-full rounded-card" />
          </UiCard>
          <div className="grid gap-4 lg:grid-cols-5">
            <UiCard variant="glass" className="p-5 sm:p-6 lg:col-span-3">
              <Skeleton className="mb-4 h-4 w-48" />
              <Skeleton className="h-[240px] w-full rounded-card" />
            </UiCard>
            <UiCard variant="glass" className="flex min-h-[200px] items-center justify-center p-5 lg:col-span-2">
              <Skeleton className="h-36 w-36 rounded-full" />
            </UiCard>
          </div>
          <UiCard variant="glass" className="p-5 sm:p-6">
            <Skeleton className="mb-4 h-4 w-40" />
            <Skeleton className="h-32 w-full rounded-card" />
          </UiCard>
        </div>
      ) : (
        <AnalyticsCharts
          series={series}
          deliveryRate={deliveryRate}
          snapshot={{
            totalRoutes: summary.totalRoutes,
            dispatched: summary.dispatched,
            completed: summary.completed,
            avgRouteMinutes: summary.avgDuration > 0 ? Math.round(summary.avgDuration) : null,
          }}
        />
      )}
    </div>
  );
};

// Settings — account, security, WooCommerce (admin)
const SettingsScreen = ({ user, onLogout, onUserUpdate }) => {
  const { toast } = useToast();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const [panel, setPanel] = useState('home');
  const [displayName, setDisplayName] = useState(user?.name || '');
  useEffect(() => { setDisplayName(user?.name || ''); }, [user?.name]);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [wooStores, setWooStores] = useState([]);
  const [wooForm, setWooForm] = useState({ name: '', url: '', consumer_key: '', consumer_secret: '' });
  const [wooLoading, setWooLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // authHeaders still used for Content-Type on POST/PUT bodies; apiFetch adds the Bearer token automatically
  const authHeaders = { 'Content-Type': 'application/json' };

  const loadWooStores = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin/woo-stores`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setWooStores(data.stores || []);
    } catch { /* noop */ }
  };
  useEffect(() => { if (panel === 'woocommerce' && user?.role === 'admin') loadWooStores(); }, [panel, user?.role]);

  const saveProfileName = () => {
    const name = displayName.trim();
    if (!name) {
      toast.error('Please enter a name');
      return;
    }
    onUserUpdate?.({ name });
    toast.success('Display name saved on this device.');
  };

  const submitPasswordChange = async () => {
    if (!currentPw || !newPw) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
      toast.success('Password updated successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const addWooStore = async () => {
    if (!wooForm.name || !wooForm.url || !wooForm.consumer_key || !wooForm.consumer_secret) {
      toast.error('All fields are required');
      return;
    }
    setWooLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/woo-stores`, { method: 'POST', headers: authHeaders, body: JSON.stringify(wooForm) });
      const data = await res.json();
      if (data.success) {
        setWooForm({ name: '', url: '', consumer_key: '', consumer_secret: '' });
        toast.success('Store added successfully');
        loadWooStores();
      } else {
        toast.error(data.message || 'Failed to add store');
      }
    } catch (e) {
      toast.error(e.message || 'Could not add store');
    } finally {
      setWooLoading(false);
    }
  };

  const removeWooStore = async (storeId) => {
    try {
      const res = await apiFetch(`${API_BASE}/admin/woo-stores/${storeId}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok || res.status === 204) {
        toast.success('Store removed');
        loadWooStores();
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `HTTP ${res.status}`);
    } catch (e) {
      toast.error(e.message || 'Could not remove store');
    }
  };

  const syncWooOrders = async () => {
    setSyncLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/orders/sync-woocommerce`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced ${data.imported_count || 0} orders from ${data.stores_synced || 0} stores`);
      } else {
        toast.error(data.message || 'Sync failed');
      }
    } catch (e) {
      toast.error(e.message || 'Sync request failed');
    } finally {
      setSyncLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-control border border-white/10 bg-xr-bg/60 px-4 py-2.5 text-sm text-xr-text placeholder-xr-muted focus:border-xr-brand/40 focus:outline-none focus:ring-2 focus:ring-xr-brand/20';

  const goHome = () => {
    setPanel('home');
  };

  const BackLink = () => (
    <Button type="button" variant="ghost" size="sm" className="mb-4 -ml-1 gap-1 text-xr-muted hover:text-xr-brand" onClick={goHome}>
      <ChevronLeft className="h-4 w-4" />
      Back
    </Button>
  );

  const MenuRow = ({ icon, label, hint, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-card border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-xr-brand/25 hover:bg-white/[0.05]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-white/10 bg-xr-bg/80 text-xr-secondary">
          <Ico d={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          {hint && <p className="text-xs text-xr-muted">{hint}</p>}
        </div>
      </div>
      <Ico d={ICONS.chevronR} className="h-4 w-4 shrink-0 text-xr-muted" />
    </button>
  );

  return (
    <Page size="sm" className="min-h-0">
      <div className="space-y-6">
        {panel === 'home' && (
          <>
            <p className="text-sm text-xr-muted">Profile, password, and store connections.</p>
            <UiCard variant="glass" className="flex flex-col items-center px-6 py-8 text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-xr-muted">Signed in</div>
              <div className="mt-3 flex h-16 w-16 items-center justify-center rounded-card bg-gradient-to-br from-xr-brand to-amber-600 text-xl font-bold text-black shadow-lg shadow-xr-brand/25">
                {initials}
              </div>
              <p className="mt-3 text-base font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-xr-muted">{user?.role === 'admin' ? 'Administrator' : 'Driver'}</p>
              {user?.email && <p className="mt-2 max-w-full truncate text-xs text-xr-subtle">{user.email}</p>}
            </UiCard>

            <div className="space-y-2">
              <MenuRow icon={ICONS.edit} label="Profile" hint="Display name shown in the app" onClick={() => setPanel('profile')} />
              <MenuRow icon={ICONS.shield} label="Change password" hint="Update your sign-in password" onClick={() => setPanel('password')} />
              <MenuRow icon={ICONS.phone} label="Contact" hint="support@xruto.com · Mon–Fri 9–5" onClick={() => setPanel('contact')} />
              {user?.role === 'admin' && (
                <MenuRow icon={ICONS.orders} label="WooCommerce" hint="Store keys and order sync" onClick={() => setPanel('woocommerce')} />
              )}
            </div>

            <Button type="button" variant="danger" className="w-full gap-2" onClick={onLogout}>
              <Ico d={ICONS.logout} className="h-4 w-4" />
              Log out
            </Button>
          </>
        )}

        {panel === 'profile' && (
          <div>
            <BackLink />
            <h2 className="text-xl font-bold tracking-tight text-white">Profile</h2>
            <p className="mt-1 text-sm text-xr-muted">How you appear in the app.</p>
            <UiCard variant="glass" className="mt-4 space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-1.5 block text-caption font-medium uppercase tracking-wider text-xr-muted">Display name</label>
                <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <p className="text-xs text-xr-subtle">Saved in this browser with your session. For full account changes, contact your admin.</p>
              <Button type="button" variant="primary" className="w-full" onClick={saveProfileName}>
                Save display name
              </Button>
            </UiCard>
          </div>
        )}

        {panel === 'password' && (
          <div>
            <BackLink />
            <h2 className="text-xl font-bold tracking-tight text-white">Security</h2>
            <p className="mt-1 text-sm text-xr-muted">Change your account password.</p>
            <UiCard variant="glass" className="mt-4 space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-1.5 block text-caption font-medium uppercase tracking-wider text-xr-muted">Current password</label>
                <input type="password" className={inputCls} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium uppercase tracking-wider text-xr-muted">New password</label>
                <input type="password" className={inputCls} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium uppercase tracking-wider text-xr-muted">Confirm new password</label>
                <input type="password" className={inputCls} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
              </div>
              <Button type="button" variant="primary" className="w-full" disabled={pwLoading} loading={pwLoading} onClick={submitPasswordChange}>
                Update password
              </Button>
            </UiCard>
          </div>
        )}

        {panel === 'contact' && (
          <div>
            <BackLink />
            <h2 className="text-xl font-bold tracking-tight text-white">Contact</h2>
            <p className="mt-1 text-sm text-xr-muted">We respond within one business day.</p>
            <UiCard variant="glass" className="mt-4 space-y-3 p-5 text-sm text-xr-secondary sm:p-6">
              <p>
                For product support, billing, or technical help, email{' '}
                <a href="mailto:support@xruto.com" className="font-medium text-xr-brand hover:underline">
                  support@xruto.com
                </a>
                .
              </p>
              <p className="text-xs text-xr-muted">Typical response time is one business day.</p>
            </UiCard>
          </div>
        )}

        {panel === 'woocommerce' && user?.role === 'admin' && (
          <div>
            <BackLink />
            <h2 className="text-xl font-bold tracking-tight text-white">WooCommerce</h2>
            <p className="mt-1 text-sm text-xr-muted">Connect stores and sync orders.</p>
            <UiCard variant="glass" className="mt-4 space-y-4 p-5 sm:p-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Connected stores</h3>
                <p className="mt-1 text-xs text-xr-muted">REST API keys from WooCommerce → Settings → Advanced → REST API</p>
              </div>
              {wooStores.length === 0 ? (
                <p className="text-xs text-xr-subtle">No stores yet. Add credentials below.</p>
              ) : (
                <div className="space-y-2">
                  {wooStores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between gap-3 rounded-control border border-white/10 bg-xr-bg/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{store.name}</p>
                        <p className="truncate text-xs text-xr-muted">{store.url}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0 text-red-300 hover:bg-xr-danger/10" onClick={() => removeWooStore(store.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <p className="text-caption font-medium uppercase tracking-wider text-xr-muted">Add store</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Store name" value={wooForm.name} onChange={(e) => setWooForm((f) => ({ ...f, name: e.target.value }))} />
                  <input className={inputCls} placeholder="https://yourstore.com" value={wooForm.url} onChange={(e) => setWooForm((f) => ({ ...f, url: e.target.value }))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Consumer key" value={wooForm.consumer_key} onChange={(e) => setWooForm((f) => ({ ...f, consumer_key: e.target.value }))} />
                  <input
                    className={inputCls}
                    type="password"
                    placeholder="Consumer secret"
                    value={wooForm.consumer_secret}
                    onChange={(e) => setWooForm((f) => ({ ...f, consumer_secret: e.target.value }))}
                  />
                </div>
                <SlideToConfirm label="Slide to add store" onConfirm={addWooStore} loading={wooLoading} />
              </div>
              {wooStores.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <SlideToConfirm label="Slide to sync orders" onConfirm={syncWooOrders} loading={syncLoading} />
                </div>
              )}
            </UiCard>
          </div>
        )}
      </div>
    </Page>
  );
};

// Main App — AppShell: sidebar (md+), bottom tab bar (mobile)
const App = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('admin');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('xruto_token');
    const savedUser = localStorage.getItem('xruto_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.role === 'driver') setCurrentView('routes');
        fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
          .then(r => r.json()).then(data => { if (!data.success) doLogout(); }).catch(() => {});
      } catch { doLogout(); }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setCurrentView(userData.role === 'driver' ? 'routes' : 'admin');
  }, []);

  const doLogout = useCallback(() => {
    localStorage.removeItem('xruto_token');
    localStorage.removeItem('xruto_user');
    setUser(null);
    setCurrentView('admin');
  }, []);

  const updateLocalUser = useCallback((partial) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...partial };
      localStorage.setItem('xruto_user', JSON.stringify(next));
      return next;
    });
  }, []);

  if (!authChecked)
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-xr-bg px-4">
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid opacity-[0.25]" />
        <UiCard variant="glass" className="relative z-10 flex w-full max-w-xs flex-col items-center gap-4 p-8">
          <Skeleton className="h-12 w-12 rounded-card" />
          <div className="w-full space-y-2">
            <Skeleton className="mx-auto h-4 w-28" />
            <Skeleton className="mx-auto h-3 w-36" />
          </div>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-xr-brand/25 border-t-xr-brand" aria-hidden />
        </UiCard>
      </div>
    );
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const isAdmin = user.role === 'admin';

  const renderContent = () => {
    if (!isAdmin && currentView !== 'analytics' && currentView !== 'settings') return <DriverRoutes />;
    switch (currentView) {
      case 'admin':     return <MyAdmin onNavigateToOrders={() => setCurrentView('orders')} />;
      case 'orders':    return <Orders onNavigateBack={() => setCurrentView('admin')} onNavigateToRouteDetail={() => setCurrentView('routes')} />;
      case 'routes':    return <DriverRoutes />;
      case 'analytics': return <AnalyticsScreen />;
      case 'settings':  return <SettingsScreen user={user} onLogout={doLogout} onUserUpdate={updateLocalUser} />;
      default:          return isAdmin ? <MyAdmin onNavigateToOrders={() => setCurrentView('orders')} /> : <DriverRoutes />;
    }
  };

  return (
    <AppShell currentView={currentView} onChangeView={setCurrentView} user={user} onLogout={doLogout}>
      {renderContent()}
      <PWAInstallPrompt />
    </AppShell>
  );
};

export default App;