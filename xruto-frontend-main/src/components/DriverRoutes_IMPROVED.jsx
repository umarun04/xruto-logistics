import React, { useState, useEffect, useCallback } from 'react';
import { Page, PageHeader } from '../ui/Page';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastContext.jsx';
import { EmptyState } from '../ui/EmptyState';
import { Route } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API service
const driverAPI = {
  getAllRoutes: async (date = new Date().toISOString().split('T')[0]) => {
    try {
      const token = localStorage.getItem('xruto_token');
      const authH = token ? { Authorization: `Bearer ${token}` } : {};
      const routesResponse = await fetch(`${API_BASE_URL}/orders/get-routes?date=${date}`, { headers: authH });
      if (routesResponse.ok) {
        const routesResult = await routesResponse.json();
        if (routesResult.success && routesResult.routes.length > 0) {
          return { success: true, routes: routesResult.routes };
        }
      }
      const response = await fetch(`${API_BASE_URL}/orders/eligible?date=${date}`, { headers: authH });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return { success: true, orders: result.orders || [], routes: [] };
    } catch (error) {
      throw new Error(`Failed to fetch routes: ${error.message}`);
    }
  },
  updateDeliveryStatus: async (orderId, status) => {
    const token = localStorage.getItem('xruto_token');
    const response = await fetch(`${API_BASE_URL}/orders/delivery-status/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, timestamp: new Date().toISOString() })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }
};

const fmtDuration = (m) => { if (!m) return '0 min'; if (m < 60) return `${Math.round(m)} min`; return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`; };
const fmtDist = (km) => { if (!km) return '0 km'; return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`; };

const ZONE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Zone Card — single accent (brand) for a calmer, consistent look
const orderIsDelivered = (o) =>
  o?.status === 'delivered' || o?.delivery_status === 'delivered';

const ZoneCard = ({ route, index, onNavigate, onOrderNav, onOrderStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const allOrders = route.route_segments?.flatMap((s) => s.orders || []) || [];
  const completed = allOrders.filter(orderIsDelivered).length;
  const failed = allOrders.filter((o) => o.status === 'failed' || o.delivery_status === 'failed').length;
  const total = allOrders.length || route.total_orders || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const zoneLetter = ZONE_LABELS[index % ZONE_LABELS.length];

  // API often sends route.status "assigned" / "generated" / "dispatched" while stops are still open; drive UI
  // from per-order delivery status.
  const isCompleted = pct === 100 || String(route.status) === 'completed';
  const inProgressByApi = ['in_progress', 'in_route'].includes(String(route.status || ''));
  const isInProgress = !isCompleted && (pct > 0 || inProgressByApi);

  const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started';
  const statusColor = isCompleted ? 'text-emerald-300 bg-xr-success/15' : isInProgress ? 'text-indigo-200 bg-xr-brand/15' : 'text-red-300 bg-xr-danger/15';

  return (
    <Card variant="glass" className="overflow-hidden border-l-2 border-l-xr-brand/35 animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="text-base font-semibold text-white">Zone {zoneLetter}</span>
            <span className="text-xs text-xr-muted">Delivery route</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 bg-xr-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-xr-brand to-indigo-500/90 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-xr-muted tabular-nums">{pct}%</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {fmtDuration(route.estimated_duration_minutes)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {total} stops
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/></svg>
            {fmtDist(route.total_distance_km)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="primary"
            className="flex-1 min-h-11"
            onClick={() => onNavigate(route)}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Navigate
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1 min-h-11"
            onClick={() => setExpanded((v) => !v)}
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide orders' : 'Show orders'}
          </Button>
        </div>
      </div>

      {/* Expanded orders */}
      {expanded && (
        <div className="border-t border-xr-line bg-xr-surface p-4 space-y-2">
          {allOrders.map((order, idx) => {
            const isDone = orderIsDelivered(order) || order.status === 'failed' || order.delivery_status === 'failed';
            return (
              <div key={order.id || idx} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl ${isDone ? 'bg-xr-surface/50' : 'bg-xr-surface'} border border-white/5 shadow-soft hover:shadow-panel transition-all animate-fade-up`} style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isDone ? 'bg-white/[0.06] text-emerald-300' : 'bg-white/[0.06] text-xr-secondary'
                  }`}
                >
                  {isDone ? '\u2713' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'text-xr-subtle line-through' : 'text-white'}`}>{order.customer_name}</p>
                  <p className="text-xs text-xr-subtle truncate">{order.delivery_address}</p>
                </div>
                <div className="shrink-0 flex flex-wrap items-center sm:justify-end gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button type="button" size="sm" variant="ghost" onClick={() => onOrderNav(order)}>
                    Go
                  </Button>
                  {!isDone && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="border border-emerald-500/20 text-emerald-200"
                        onClick={() => onOrderStatus(order.id, 'delivered')}
                      >
                        Done
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => onOrderStatus(order.id, 'failed')}>
                        Fail
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCompleted && (
        <div className="border-t border-xr-line/80 px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-300/90">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Route completed
          </div>
        </div>
      )}
    </Card>
  );
};

// Main Component
const DriverRoutes = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await driverAPI.getAllRoutes();
      if (result.success) {
        if (result.routes && result.routes.length > 0) {
          const savedUser = localStorage.getItem('xruto_user');
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          let filtered = result.routes;
          if (currentUser && currentUser.role === 'driver') {
            filtered = result.routes.filter(r =>
              r.driver_email && currentUser.email &&
              r.driver_email.toLowerCase() === currentUser.email.toLowerCase()
            );
          }
          setRoutes(filtered);
        } else if (result.orders && result.orders.length > 0) {
          const byPC = result.orders.reduce((a, o) => {
            const pc = o.postcode.split(' ')[0];
            (a[pc] = a[pc] || []).push(o);
            return a;
          }, {});
          setRoutes(Object.entries(byPC).map(([pc, orders], i) => {
            const comp = orders.filter(o => o.status === 'delivered').length;
            return {
              id: `route-${i + 1}`, route_name: `Route ${ZONE_LABELS[i]} - ${pc}`,
              status: comp === orders.length ? 'completed' : comp > 0 ? 'in_route' : 'assigned',
              total_orders: orders.length, completed_orders: comp,
              estimated_duration_minutes: orders.length * 10,
              total_distance_km: orders.reduce((s, o) => s + (o.distance_from_depot_km || 5), 0),
              depot_returns_needed: Math.ceil(orders.length / 10),
              route_segments: [{ orders: orders.map(o => ({ ...o, status: o.status || 'pending' })),
                return_to_depot: true }]
            };
          }));
        } else { setRoutes([]); }
        setLastRefresh(new Date());
      }
    } catch (e) { setError(e.message); setRoutes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);
  useEffect(() => { if (!liveUpdate) return; const id = setInterval(loadRoutes, 30000); return () => clearInterval(id); }, [liveUpdate, loadRoutes]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error, toast]);

  const navRoute = (route) => {
    if (route.navigation_url) {
      const url = typeof route.navigation_url === 'object' ? route.navigation_url.url : route.navigation_url;
      if (url?.startsWith('http')) { window.open(url, '_blank'); return; }
    }
    const orders = route.route_segments?.flatMap(s => s.orders || []) || [];
    const valid = orders.filter(o => o.latitude && o.longitude && !isNaN(o.latitude) && !isNaN(o.longitude));
    if (!valid.length) {
      toast.error('No valid coordinates for this route');
      return;
    }
    const wps = valid.map(o => `${o.latitude},${o.longitude}`).join('/');
    window.open(`https://www.google.com/maps/dir/${wps}/?travelmode=driving`, '_blank');
  };

  const navStop = (order) => {
    if (!order.latitude || !order.longitude) {
      toast.error('No coordinates for this stop');
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}&travelmode=driving`, '_blank');
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await driverAPI.updateDeliveryStatus(orderId, newStatus);
      setRoutes((prev) =>
        prev.map((route) => {
          const routeSegments = route.route_segments?.map((seg) => ({
            ...seg,
            orders:
              seg.orders?.map((o) =>
                String(o.id) === String(orderId)
                  ? { ...o, status: newStatus, delivery_status: newStatus }
                  : o
              ) || [],
          }));
          const flat = routeSegments?.flatMap((s) => s.orders || []) || [];
          const done = flat.filter(orderIsDelivered).length;
          const tot = flat.length || route.total_orders || 0;
          const nextCompleted = tot > 0 ? Math.round((done / tot) * 100) === 100 : false;
          return {
            ...route,
            route_segments: routeSegments,
            completed_orders: done,
            status: nextCompleted ? 'completed' : route.status,
          };
        })
      );
      toast.success(newStatus === 'delivered' ? 'Marked delivered' : 'Status updated');
    } catch (e) {
      toast.error(e.message || 'Could not update status');
    }
  };

  const totalOrders = routes.reduce((s, r) => s + (r.total_orders || 0), 0);
  const completedOrders = routes.reduce((s, r) => {
    return s + (r.route_segments?.flatMap((seg) => seg.orders || []) || []).filter(orderIsDelivered).length;
  }, 0);
  const overallPct = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  if (loading && routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-xr-brand/30 border-t-xr-brand" />
        <p className="text-sm text-xr-muted">Loading routes…</p>
      </div>
    );
  }

  if (error && routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <p className="text-white font-semibold">Failed to Load Routes</p>
        <p className="text-sm text-xr-subtle">{error}</p>
        <Button variant="primary" onClick={loadRoutes}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        kicker="XRUTO · DRIVER"
        title="Routes"
        subtitle={`${routes.length} route${routes.length !== 1 ? 's' : ''} · ${totalOrders} orders`}
        right={(
          <>
            <button
              onClick={() => setLiveUpdate(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                liveUpdate
                  ? 'bg-xr-success/15 text-emerald-300 border border-xr-success/30'
                  : 'bg-xr-panel text-xr-subtle border border-xr-line'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveUpdate ? 'bg-emerald-300 animate-pulse' : 'bg-xr-subtle'}`} />
              Live
            </button>
            <Button variant="primary" size="sm" loading={loading} onClick={loadRoutes}>
              Refresh
            </Button>
          </>
        )}
      />

      <Page size="lg">
        {/* Overall Progress */}
        {totalOrders > 0 && (
          <div className="bg-xr-panel border border-xr-line rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">Today's Progress</span>
              <span className="text-sm font-bold text-indigo-200">{overallPct}%</span>
            </div>
            <div className="h-2 bg-xr-bg rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-xr-brand to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-xs text-xr-subtle mt-2">{completedOrders} delivered &middot; {totalOrders - completedOrders} remaining</p>
          </div>
        )}

        {/* Empty state */}
        {routes.length === 0 && (
          <EmptyState
            className="border-xr-line bg-xr-panel/50 py-16"
            icon={<Route className="h-8 w-8" strokeWidth={1.5} />}
            title="No routes yet"
            description="When dispatch assigns work to your vehicle, it appears here. Pull to refresh or check back after the admin sends routes."
            action={
              <Button variant="primary" className="min-h-11" onClick={loadRoutes} loading={loading}>
                Refresh
              </Button>
            }
          />
        )}

        {/* Zone Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {routes.map((route, i) => (
            <ZoneCard key={route.id || route.route_id} route={route} index={i}
              onNavigate={navRoute} onOrderNav={navStop} onOrderStatus={updateStatus} />
          ))}
        </div>

        {liveUpdate && (
          <div className="mt-4 text-center">
            <span className="text-xs text-green-400/70 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Auto-refreshing &middot; {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        )}
      </Page>
    </div>
  );
};

export default DriverRoutes;