import React, { useState, useEffect, useRef, useCallback } from 'react';
import PDFUpload from './PDFUpload';
import TextBulkUpload from './TextBulkUpload';
import { Modal } from '../ui/Modal';
import { Card as UiCard, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/ToastContext.jsx';
import { Upload, Filter, ClipboardList, Send, RotateCcw, ListOrdered, Lightbulb } from 'lucide-react';

// SlideToConfirm moved to ui/SlideToConfirm

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Read token and build auth headers for every orders API call. */
const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('xruto_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

/** Fetch with auth + 401 auto-logout. */
const authFetch = async (url, opts = {}) => {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...opts.headers } });
  if (res.status === 401) {
    localStorage.removeItem('xruto_token');
    localStorage.removeItem('xruto_user');
    window.location.reload();
    return new Response('{"success":false}', { status: 401 });
  }
  return res;
};

const ordersAPI = {
  getEligibleOrders: async (date) => {
    const r = await authFetch(`${API_BASE_URL}/orders/eligible?date=${date}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  generateClusters: async (selectedPostcodes, maxZones = 5) => {
    const r = await authFetch(`${API_BASE_URL}/orders/generate-clusters`, {
      method: 'POST',
      body: JSON.stringify({ selected_postcodes: selectedPostcodes, clustering_algorithm: 'kmeans', max_zones: maxZones, date: new Date().toISOString().split('T')[0] })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  generateRoutes: async (zones) => {
    const r = await authFetch(`${API_BASE_URL}/orders/generate-routes`, {
      method: 'POST',
      body: JSON.stringify({ zones, date: new Date().toISOString().split('T')[0] })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  getAvailableDrivers: async () => {
    const r = await authFetch(`${API_BASE_URL}/orders/available-drivers`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  autoAssignDrivers: async (routes) => {
    const r = await authFetch(`${API_BASE_URL}/orders/auto-assign-drivers`, {
      method: 'POST',
      body: JSON.stringify({ routes, method: 'round_robin' })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  assignDriver: async (routeId, driverId) => {
    const r = await authFetch(`${API_BASE_URL}/orders/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ route_id: routeId, driver_id: driverId })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  dispatchRoutes: async (routeIds) => {
    const r = await authFetch(`${API_BASE_URL}/orders/dispatch-routes`, {
      method: 'POST',
      body: JSON.stringify({ route_ids: routeIds })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  resetOrders: async () => {
    const r = await authFetch(`${API_BASE_URL}/orders/reset`, { method: 'DELETE' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
  getRoutes: async (date) => {
    const r = await authFetch(`${API_BASE_URL}/orders/get-routes?date=${encodeURIComponent(date)}`);
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `HTTP ${r.status}`); }
    return r.json();
  },
};

const ZONE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];
const fmtDur = m => { if (!m) return '0 min'; if (m < 60) return `${Math.round(m)} min`; return `${Math.floor(m/60)}h ${Math.round(m%60)}m`; };

/** Label for which depot the map URL uses: driver depot once assigned, else zone preview depot from generate-routes. */
const mapStartDepotLabel = (route) => {
  if (route?.driver_id && route?.maps_depot_name) return route.maps_depot_name;
  if (route?.depot_start_name) return route.depot_start_name;
  if (route?.maps_depot_name) return route.maps_depot_name;
  return null;
};

const SummaryTile = ({ label, value, tone = 'neutral' }) => {
  const valueCls =
    tone === 'brand'   ? 'text-amber-300' :
    tone === 'success' ? 'text-emerald-300' :
    tone === 'info'    ? 'text-blue-300' :
    tone === 'danger'  ? 'text-red-300'   : 'text-white';
  const bgCls =
    tone === 'brand'   ? 'bg-amber-500/8 border-amber-500/20' :
    tone === 'success' ? 'bg-emerald-500/8 border-emerald-500/20' :
    tone === 'info'    ? 'bg-blue-500/8 border-blue-500/20' :
    tone === 'danger'  ? 'bg-red-500/8 border-red-500/20' :
    'bg-xr-elevated/30 border-xr-line';
  return (
    <div className={`group rounded-card border backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-elevated-soft ${bgCls}`}>
      <div className="text-caption uppercase tracking-wider text-xr-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums ${valueCls}`}>{value}</div>
    </div>
  );
};

const Card = ({ title, subtitle, right, children, className = '', variant = 'glass' }) => (
  <UiCard variant={variant} className={className}>
    {(title || subtitle || right) && (
      <CardHeader>
        <div className="min-w-0">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs text-xr-muted">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </CardHeader>
    )}
    <CardBody>{children}</CardBody>
  </UiCard>
);

const SoftButton = ({ tone = 'neutral', className = '', children, ...props }) => {
  const variant = tone === 'danger' ? 'danger' : tone === 'primary' ? 'primary' : tone === 'blue' ? 'secondary' : 'secondary';
  return (
    <Button variant={variant} size="sm" className={className} {...props}>
      {children}
    </Button>
  );
};

// Old stepper + metric blocks removed (single workflow strip + single summary used)

const Orders = ({ onNavigateBack, onNavigateToRouteDetail }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [uploadMethod, setUploadMethod] = useState('text');
  const [excelFile, setExcelFile] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelResult, setExcelResult] = useState(null);
  const [postcodeQuery, setPostcodeQuery] = useState('');
  const [maxZones, setMaxZones] = useState(5);
  const [selectedPostcodes, setSelectedPostcodes] = useState([]);
  const [availablePostcodes, setAvailablePostcodes] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [previewZones, setPreviewZones] = useState([]);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState('Processing…');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [demoSet, setDemoSet] = useState(null);

  useEffect(() => { loadInitialData(); }, []);

  // Keep map links in sync with server (driver’s depot, not just primary) when opening Review
  useEffect(() => {
    if (activeTab !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const date = new Date().toISOString().split('T')[0];
        const j = await ordersAPI.getRoutes(date);
        if (cancelled || !j?.success || !j.routes?.length) return;
        setGeneratedRoutes((prev) => {
          if (!prev.length) return prev;
          const byId = new Map(j.routes.map((x) => [x.route_id, x]));
          return prev.map((rt) => {
            const srv = byId.get(rt.route_id);
            if (!srv) return rt;
            return {
              ...rt,
              navigation_url: srv.navigation_url != null && srv.navigation_url !== '' ? srv.navigation_url : rt.navigation_url,
              driver_id: srv.driver_id ?? rt.driver_id,
              driver_name: srv.driver_name ?? rt.driver_name,
              status: srv.status ?? rt.status,
              maps_depot_name: srv.maps_depot_name ?? rt.maps_depot_name,
            };
          });
        });
      } catch { /* keep local state */ }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    setLoadingHint("Loading today's orders…");
    setError('');
    try {
      const od = await ordersAPI.getEligibleOrders(new Date().toISOString().split('T')[0]);
      if (od.success) { setEligibleOrders(od.orders); setAvailablePostcodes(od.postcode_options); }
      else throw new Error(od.message || 'Failed');
      const dd = await ordersAPI.getAvailableDrivers();
      if (dd.success) setAvailableDrivers(dd.drivers);
    } catch (e) { setError(`Failed to load: ${e.message}`); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const handleOrdersUploaded = async (newOrders) => {
    setSuccess(`Uploaded ${newOrders.length} orders`);
    await loadInitialData();
    setActiveTab(1);
  };

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError('');
  }, [error, toast]);

  useEffect(() => {
    if (!success) return;
    toast.success(success);
    setSuccess('');
  }, [success, toast]);

  const handlePostcodeToggle = (pc) => setSelectedPostcodes(prev => prev.includes(pc) ? prev.filter(p => p !== pc) : [...prev, pc]);

  const previewClustering = async () => {
    if (!selectedPostcodes.length) { setError('Select at least one postcode'); return; }
    setLoading(true);
    setLoadingHint('Building zone clusters…');
    setError('');
    try {
      const r = await ordersAPI.generateClusters(selectedPostcodes, maxZones);
      if (r.success) { setPreviewZones(r.zones); setSuccess(`${r.zones.length} zones from ${r.total_orders} orders`); }
      else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const generateRoutesFromZones = async () => {
    if (!previewZones.length) { setError('Generate clusters first'); return; }
    setLoading(true);
    setLoadingHint('Optimizing routes…');
    setError('');
    try {
      const r = await ordersAPI.generateRoutes(previewZones);
      if (r.success) { setGeneratedRoutes(r.routes); setSuccess(`${r.routes.length} routes generated`); setActiveTab(2); }
      else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const assignDriverToRoute = async (routeId, driverId) => {
    if (!driverId) return;
    setLoading(true);
    setLoadingHint('Assigning driver…');
    setError('');
    try {
      const r = await ordersAPI.assignDriver(routeId, driverId);
      if (r.success) {
        const nav = r.navigation_url || r.route?.navigation_url;
        const mdn = r.maps_depot_name ?? r.route?.maps_depot_name;
        setGeneratedRoutes(prev => prev.map(rt => rt.route_id === routeId ? {
          ...rt,
          driver_id: driverId,
          driver_name: r.driver.name,
          status: 'assigned',
          ...(nav ? { navigation_url: nav } : {}),
          ...(mdn != null && mdn !== '' ? { maps_depot_name: mdn } : {}),
        } : rt));
        setSuccess('Driver assigned');
      } else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const autoAssignAllDrivers = async () => {
    if (!generatedRoutes.length) return;
    setLoading(true);
    setLoadingHint('Auto-assigning drivers…');
    setError('');
    try {
      const r = await ordersAPI.autoAssignDrivers(generatedRoutes);
      if (r.success) { setGeneratedRoutes(r.routes); setSuccess('Drivers auto-assigned'); }
      else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const confirmRoutes = () => {
    const un = generatedRoutes.filter(r => !r.driver_id);
    if (un.length) { setError(`${un.length} routes need drivers`); return; }
    setActiveTab(3); setSuccess('Routes confirmed');
  };

  const dispatchAllRoutes = async () => {
    const ids = generatedRoutes.map(r => r.route_id);
    if (!ids.length) return;
    setLoading(true);
    setLoadingHint('Dispatching routes…');
    setError('');
    try {
      const r = await ordersAPI.dispatchRoutes(ids);
      if (r.success) {
        setGeneratedRoutes(prev => prev.map(rt => ({ ...rt, status: 'dispatched', dispatched_at: new Date().toISOString() })));
        setSuccess(`${ids.length} routes dispatched!`);
      } else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally {
      setLoading(false);
      setLoadingHint('Processing…');
    }
  };

  const handleResetOrders = async () => {
    setResetting(true);
    setError('');
    try {
      const r = await ordersAPI.resetOrders();
      if (r.success) { setSuccess(`Reset ${r.deletedCount} orders`); await loadInitialData(); setShowResetConfirm(false); }
      else throw new Error(r.message);
    } catch (e) { setError(e.message); }
    finally { setResetting(false); }
  };

  const tabs = [
    { id: 0, label: 'Upload' },
    { id: 1, label: 'Filter' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Confirm' },
  ];

  const pipelineHelp = [
    { title: 'Upload', blurb: 'Bring orders in from text, PDF, or Excel. Every later step uses this pool.' },
    { title: 'Filter', blurb: 'Choose postcode areas, generate clusters, then build routes from those zones.' },
    { title: 'Review', blurb: 'Assign drivers to each route. Use auto-assign when your roster is ready.' },
    { title: 'Confirm', blurb: 'Dispatch sends routes to drivers—last check before go-live.' },
  ];
  const pipelineTips = [
    'Import early so postcodes and volumes stabilize before clustering.',
    'Start with a small set of postcodes to validate travel times and zones.',
    'Confirm each route has a driver before moving to the dispatch step.',
    'After dispatch, drivers see work in the Route view on their account.',
  ];

  const canProceedToFilter = eligibleOrders.length > 0;
  const canProceedToReview = previewZones.length > 0;
  const canProceedToConfirm = generatedRoutes.length > 0 && generatedRoutes.every(r => r.driver_id);
  const dispatchedCount = generatedRoutes.filter(r => r.status === 'dispatched').length;
  const filteredPostcodes = availablePostcodes
    .filter(pc => (postcodeQuery ? pc.toLowerCase().includes(postcodeQuery.toLowerCase()) : true))
    .slice(0, 200);

  const selectedRoute = selectedRouteId ? generatedRoutes.find(r => r.route_id === selectedRouteId) : null;

  return (
    <div className="space-y-5">
      {/* Control strip */}
      <UiCard variant="soft" className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tab bar */}
          <div className="inline-flex w-full overflow-x-auto scrollbar-thin rounded-control border border-xr-line bg-xr-elevated/40 backdrop-blur-md p-1 sm:w-auto">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.id === 0 ? Upload : t.id === 1 ? Filter : t.id === 2 ? ClipboardList : Send;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white/[0.08] text-white shadow-inner-bright ring-1 ring-inset ring-xr-brand/25'
                      : 'text-xr-secondary hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${ active ? 'text-xr-brand' : ''}`} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-xr-brand opacity-40 animate-ping-sm" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-xr-brand" />
              </span>
              {eligibleOrders.length} eligible today
            </Badge>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting || loading}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </UiCard>

      {/* Pipeline step header */}
      <UiCard variant="glass" className="relative overflow-hidden border-xr-brand/15 px-5 py-5 sm:px-7 sm:py-6">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-8 h-56 w-56 rounded-full bg-xr-brand/8 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-0 bottom-0 h-32 w-64 rounded-full bg-blue-500/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-xr-brand text-[10px] font-bold text-black">
              {activeTab + 1}
            </span>
            <p className="text-caption font-semibold uppercase tracking-wider text-xr-brand">Step {activeTab + 1} of 4</p>
          </div>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-white sm:text-[1.6rem]">
            {pipelineHelp[activeTab].title}
          </h2>
          <p className="mt-1.5 max-w-readable text-sm text-xr-muted sm:text-body leading-relaxed">
            {pipelineHelp[activeTab].blurb}
          </p>
        </div>
      </UiCard>

      {/* Today's snapshot */}
      <UiCard variant="glass" className="p-5 sm:p-6 animate-fade-up delay-100">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-heading text-sm font-semibold text-white">Today's snapshot</div>
            <div className="mt-0.5 text-xs text-xr-muted">Orders → zones → routes → dispatch</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="Orders" value={eligibleOrders.length} tone="info" />
          <SummaryTile label="Zones" value={previewZones.length} tone="success" />
          <SummaryTile label="Routes" value={generatedRoutes.length} tone="brand" />
          <SummaryTile label="Dispatched" value={dispatchedCount} tone="success" />
        </div>
      </UiCard>

      {loading && (
        <div className="flex items-center gap-3 rounded-control border border-xr-brand/20 bg-xr-brand/[0.06] px-4 py-3 animate-fade-in">
          <div className="h-4 w-4 shrink-0 rounded-full border-2 border-xr-brand/30 border-t-xr-brand animate-spin" />
          <span className="text-sm font-medium text-amber-200">{loadingHint}</span>
        </div>
      )}

      <Modal
        open={showResetConfirm}
        title="Reset All Orders?"
        description="This will permanently delete all orders and cannot be undone."
        onClose={() => setShowResetConfirm(false)}
      >
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setShowResetConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleResetOrders} disabled={resetting} loading={resetting}>
            Reset all
          </Button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
        <main className="space-y-5 lg:col-span-8">
        {activeTab === 0 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-6">
            <Card
                title="Import source"
                subtitle="Choose text, PDF, or Excel. Drag & drop supported."
                right={<span className="rounded-full border border-xr-line bg-xr-elevated/30 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-xr-muted">UPLOAD</span>}
                className="animate-fade-up"
              >
                {/* Segmented control */}
                <div className="relative rounded-2xl border border-xr-line bg-xr-elevated/30 backdrop-blur-md p-1">
                  <div
                    aria-hidden
                    className="absolute top-1 bottom-1 w-1/3 rounded-xl bg-xr-brand transition-all duration-150"
                    style={{
                      left: uploadMethod === 'text' ? '4px' : uploadMethod === 'pdf' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 0px)',
                    }}
                  />
                  <div className="relative grid grid-cols-3 gap-1">
                    {[
                      { id: 'text', label: 'Text', icon: 'Aa' },
                      { id: 'pdf', label: 'PDF', icon: 'PDF' },
                      { id: 'excel', label: 'Excel', icon: 'XLS' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setUploadMethod(m.id)}
                        className={`h-11 rounded-xl px-3 text-xs font-semibold transition-all duration-150 ${
                          uploadMethod === m.id ? 'text-black' : 'text-xr-secondary hover:text-white'
                        }`}
                      >
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-black/10 text-[11px] font-bold">
                          {m.icon}
                        </span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs text-xr-subtle transition duration-150 hover:border-xr-brand/25 hover:bg-xr-brand/[0.06]">
                  Drop files here (PDF/Excel), then use the import panel below for your selected format.
                </div>
            </Card>

            <div className="min-w-0 space-y-4 animate-fade-up">
              {uploadMethod === 'text' && <TextBulkUpload onOrdersUploaded={handleOrdersUploaded} />}
              {uploadMethod === 'pdf' && <PDFUpload onOrdersUploaded={handleOrdersUploaded} />}
              {uploadMethod === 'excel' && (
                <Card title="Excel upload" subtitle=".xlsx / .xls — Order ID, Customer Name, Address, Lat, Lon, Meal Qty">
                  <label className="block w-full cursor-pointer rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center transition duration-150 hover:border-xr-brand/30 hover:bg-xr-brand/[0.06]">
                    <span className="text-sm text-xr-secondary">{excelFile ? excelFile.name : 'Choose Excel file'}</span>
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { setExcelFile(e.target.files[0] || null); setExcelResult(null); }} />
                  </label>
                  {excelFile && (
                    <div className="mt-4">
                      <SlideToConfirm label="Slide to upload" loadingLabel="Uploading..." loading={excelUploading} onConfirm={async () => {
                        setExcelUploading(true); setExcelResult(null);
                        try {
                          const form = new FormData(); form.append('excelFile', excelFile);
                          const token = localStorage.getItem('xruto_token');
                          const res = await fetch(`${API_BASE_URL}/orders/upload-excel`, {
                            method: 'POST',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                            body: form,
                          });
                          const data = await res.json();
                          if (data.success) { setExcelResult({ ok: true, msg: data.message }); setExcelFile(null); if (handleOrdersUploaded) handleOrdersUploaded(data.orders); }
                          else setExcelResult({ ok: false, msg: data.message });
                        } catch (e) { setExcelResult({ ok: false, msg: e.message }); }
                        setExcelUploading(false);
                      }} />
                    </div>
                  )}
                  {excelResult && <div className={`mt-3 rounded-2xl border p-3 text-xs ${excelResult.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>{excelResult.msg}</div>}
                </Card>
              )}
            </div>

            <Card
              title="Quick demo"
              subtitle="Load a dataset to explore clustering and routes."
              className="relative animate-fade-up"
            >
              <div className="mb-3 rounded-xl border-l-4 border-xr-brand bg-xr-brand/[0.08] px-3 py-2 text-xs text-amber-200/90">
                ⚡ Great for showcasing the product — no PDF needed.
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { id:'london', label:'London', flag:'🇬🇧', count:10, desc:'Central London deliveries' },
                  { id:'pakistan', label:'Pakistan', flag:'🇵🇰', count:10, desc:'Lahore, Karachi, Islamabad' },
                  { id:'uae', label:'UAE', flag:'🇦🇪', count:5, desc:'Dubai & Abu Dhabi' },
                  { id:'usa', label:'USA', flag:'🇺🇸', count:5, desc:'New York City metro' },
                ].map((d, idx) => (
                  <button key={d.id} type="button" onClick={() => setDemoSet(d.id)}
                    className={`p-4 rounded-xl text-center transition-all duration-300 transform animate-fade-up ${demoSet === d.id ? 'bg-xr-brand/15 border-xr-brand text-white shadow-glow scale-[1.02]' : 'bg-xr-elevated/40 border-xr-line text-xr-secondary hover:border-xr-brand/40 hover:bg-xr-elevated hover:-translate-y-1'}`} style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="text-3xl mb-2 filter drop-shadow-sm">{d.flag}</div>
                    <div className="text-body font-semibold">{d.label}</div>
                    <div className="text-[10px] text-xr-muted mt-1">{d.count} orders</div>
                  </button>
                ))}
              </div>
              <button onClick={async () => {
                const today = new Date().toISOString().split('T')[0];
                const DEMO_DATA = {
                  london: [
                    { customer_name:'James Wilson', delivery_address:'12 Baker Street, Marylebone', postcode:'W1U 3BW', city:'London', latitude:51.5237, longitude:-0.1585, order_value:34.50, weight:2.1, delivery_date:today },
                    { customer_name:'Sarah Mitchell', delivery_address:'88 Commercial Road, Whitechapel', postcode:'E1 1NH', city:'London', latitude:51.5145, longitude:-0.0594, order_value:27.80, weight:1.5, delivery_date:today },
                    { customer_name:'Oliver Brown', delivery_address:'5 Greenwich High Road', postcode:'SE10 8JL', city:'London', latitude:51.4769, longitude:-0.0005, order_value:42.00, weight:3.2, delivery_date:today },
                    { customer_name:'Emily Clark', delivery_address:'33 Brixton Road, Lambeth', postcode:'SW9 6DE', city:'London', latitude:51.4613, longitude:-0.1156, order_value:19.90, weight:0.8, delivery_date:today },
                    { customer_name:'Daniel Taylor', delivery_address:'71 Camden High Street', postcode:'NW1 7JL', city:'London', latitude:51.5392, longitude:-0.1426, order_value:55.20, weight:4.0, delivery_date:today },
                    { customer_name:'Charlotte Evans', delivery_address:'14 Kensington Church St', postcode:'W8 4EP', city:'London', latitude:51.5015, longitude:-0.1928, order_value:31.40, weight:1.9, delivery_date:today },
                    { customer_name:'Liam Hughes', delivery_address:'29 Peckham Rye', postcode:'SE15 3NX', city:'London', latitude:51.4683, longitude:-0.0665, order_value:23.60, weight:2.4, delivery_date:today },
                    { customer_name:'Amelia Roberts', delivery_address:'52 Holloway Road, Islington', postcode:'N7 8JL', city:'London', latitude:51.5518, longitude:-0.1162, order_value:38.75, weight:2.8, delivery_date:today },
                    { customer_name:'Harry Walker', delivery_address:'8 Lewisham High Street', postcode:'SE13 5JR', city:'London', latitude:51.4535, longitude:-0.0120, order_value:15.50, weight:0.6, delivery_date:today },
                    { customer_name:'Sophia Green', delivery_address:'45 Stratford Broadway', postcode:'E15 4BQ', city:'London', latitude:51.5414, longitude:0.0031, order_value:47.30, weight:3.5, delivery_date:today },
                  ],
                  pakistan: [
                    { customer_name:'Ahmed Raza', delivery_address:'Block 5, Gulberg III', postcode:'54660', city:'Lahore', latitude:31.5204, longitude:74.3587, order_value:2500, weight:1.8, delivery_date:today },
                    { customer_name:'Fatima Khan', delivery_address:'DHA Phase 6, Bukhari Commercial', postcode:'75500', city:'Karachi', latitude:24.8049, longitude:67.0654, order_value:1800, weight:1.2, delivery_date:today },
                    { customer_name:'Usman Ali', delivery_address:'F-7 Markaz, Jinnah Super', postcode:'44000', city:'Islamabad', latitude:33.7215, longitude:73.0433, order_value:3200, weight:2.5, delivery_date:today },
                    { customer_name:'Ayesha Malik', delivery_address:'Johar Town, Block J2', postcode:'54782', city:'Lahore', latitude:31.4697, longitude:74.2728, order_value:1500, weight:0.9, delivery_date:today },
                    { customer_name:'Hassan Iqbal', delivery_address:'Clifton Block 9', postcode:'75600', city:'Karachi', latitude:24.8138, longitude:67.0300, order_value:4100, weight:3.0, delivery_date:today },
                    { customer_name:'Zainab Noor', delivery_address:'Blue Area, Fazal-ul-Haq Road', postcode:'44000', city:'Islamabad', latitude:33.7104, longitude:73.0558, order_value:2750, weight:2.2, delivery_date:today },
                    { customer_name:'Bilal Tariq', delivery_address:'Model Town Extension', postcode:'54700', city:'Lahore', latitude:31.4836, longitude:74.3193, order_value:1950, weight:1.4, delivery_date:today },
                    { customer_name:'Sana Javed', delivery_address:'North Nazimabad, Block H', postcode:'74700', city:'Karachi', latitude:24.9420, longitude:67.0319, order_value:3600, weight:2.8, delivery_date:today },
                    { customer_name:'Imran Sheikh', delivery_address:'G-9 Markaz', postcode:'44090', city:'Islamabad', latitude:33.6938, longitude:73.0300, order_value:2200, weight:1.6, delivery_date:today },
                    { customer_name:'Maryam Aslam', delivery_address:'Bahria Town Phase 4', postcode:'54810', city:'Lahore', latitude:31.3640, longitude:74.1855, order_value:2900, weight:2.0, delivery_date:today },
                  ],
                  uae: [
                    { customer_name:'Mohammed Al-Rashid', delivery_address:'Sheikh Zayed Road, Tower 1', postcode:'00000', city:'Dubai', latitude:25.2048, longitude:55.2708, order_value:185, weight:1.5, delivery_date:today },
                    { customer_name:'Sara Al-Maktoum', delivery_address:'Marina Walk, JBR', postcode:'00000', city:'Dubai', latitude:25.0800, longitude:55.1400, order_value:220, weight:2.3, delivery_date:today },
                    { customer_name:'Khalid Hassan', delivery_address:'Corniche Road, Al Markaziyah', postcode:'00000', city:'Abu Dhabi', latitude:24.4539, longitude:54.3773, order_value:310, weight:3.1, delivery_date:today },
                    { customer_name:'Layla Ibrahim', delivery_address:'Downtown Dubai, Burj Khalifa Blvd', postcode:'00000', city:'Dubai', latitude:25.1972, longitude:55.2744, order_value:145, weight:0.8, delivery_date:today },
                    { customer_name:'Omar Farooq', delivery_address:'Al Reem Island, Sun Tower', postcode:'00000', city:'Abu Dhabi', latitude:24.4979, longitude:54.4070, order_value:275, weight:2.6, delivery_date:today },
                  ],
                  usa: [
                    { customer_name:'Michael Johnson', delivery_address:'350 5th Avenue, Midtown', postcode:'10118', city:'New York', latitude:40.7484, longitude:-73.9857, order_value:52.00, weight:2.0, delivery_date:today },
                    { customer_name:'Jennifer Smith', delivery_address:'200 Broadway, Financial District', postcode:'10038', city:'New York', latitude:40.7104, longitude:-74.0091, order_value:38.50, weight:1.5, delivery_date:today },
                    { customer_name:'David Williams', delivery_address:'1000 5th Ave, Upper East Side', postcode:'10028', city:'New York', latitude:40.7794, longitude:-73.9632, order_value:67.80, weight:3.2, delivery_date:today },
                    { customer_name:'Jessica Brown', delivery_address:'85-01 Queens Blvd, Elmhurst', postcode:'11373', city:'New York', latitude:40.7360, longitude:-73.8783, order_value:29.90, weight:1.1, delivery_date:today },
                    { customer_name:'Robert Davis', delivery_address:'620 Atlantic Ave, Brooklyn', postcode:'11217', city:'New York', latitude:40.6845, longitude:-73.9780, order_value:44.20, weight:2.4, delivery_date:today },
                  ],
                };
                const orders = DEMO_DATA[demoSet];
                if (!orders) { setError('Select a demo set first'); return; }
                setLoading(true); setError('');
                try {
                  const token = localStorage.getItem('xruto_token');
                  const r = await fetch(`${API_BASE_URL}/orders/upload-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ orders }),
                  });
                  const data = await r.json();
                  if (data.success) handleOrdersUploaded(data.orders);
                  else throw new Error(data.message || 'Upload failed');
                } catch (e) { setError(e.message); }
                finally { setLoading(false); }
              }} disabled={loading || !demoSet}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-xr-brand to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition disabled:opacity-50">
                {demoSet ? `Load ${demoSet.charAt(0).toUpperCase() + demoSet.slice(1)} Demo Orders` : 'Select a Demo Set Above'}
              </button>
            </Card>

            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-6">
              <Card
                title="Delivery areas"
                subtitle="Select postcode groups for clustering."
                right={(
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-300">{selectedPostcodes.length} selected</span>
                    {availablePostcodes.length > 0 && (
                      <SoftButton
                        tone="neutral"
                        onClick={() => setSelectedPostcodes(selectedPostcodes.length === availablePostcodes.length ? [] : [...availablePostcodes])}
                      >
                        {selectedPostcodes.length === availablePostcodes.length ? 'Clear' : 'Select all'}
                      </SoftButton>
                    )}
                  </div>
                )}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-xr-line bg-xr-elevated px-3 py-2.5">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-xr-muted/70">Search</label>
                    <input
                      value={postcodeQuery}
                      onChange={(e) => setPostcodeQuery(e.target.value)}
                      placeholder="Type a postcode prefix…"
                      className="mt-1 w-full bg-transparent text-sm text-xr-text placeholder-xr-muted/70 focus:outline-none"
                    />
                  </div>
                  <div className="rounded-xl border border-xr-line bg-xr-elevated px-3 py-2.5">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-xr-muted/70">Max zones</label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={maxZones}
                        onChange={(e) => setMaxZones(parseInt(e.target.value, 10))}
                        className="h-2 w-full accent-orange-500"
                      />
                      <span className="w-10 text-right text-sm font-semibold tabular-nums text-white">{maxZones}</span>
                    </div>
                  </div>
                </div>

                {availablePostcodes.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon={<Filter className="h-7 w-7" strokeWidth={1.5} />}
                      title="No postcode areas yet"
                      description="Upload orders in the previous step so we can detect postcodes and build cluster options."
                      action={
                        <Button type="button" variant="secondary" size="sm" className="min-h-11" onClick={() => setActiveTab(0)}>
                          Go to upload
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {filteredPostcodes.map((pc, idx) => {
                      const sel = selectedPostcodes.includes(pc);
                      const cnt = eligibleOrders.filter(o => o.postcode?.startsWith(pc)).length;
                      return (
                        <button
                          key={pc}
                          type="button"
                          onClick={() => handlePostcodeToggle(pc)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition animate-fade-up ${
                            sel
                              ? 'border-indigo-500/40 bg-indigo-500/15 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'border-xr-line bg-xr-elevated text-xr-secondary hover:border-orange-500/25 hover:text-xr-text'
                          }`}
                          style={{ animationDelay: `${Math.min(idx * 20, 500)}ms` }}
                        >
                          {pc} <span className="ml-1 text-[11px] opacity-70">({cnt})</span>
                        </button>
                      );
                    })}
                    {filteredPostcodes.length === 0 && (
                      <span className="text-xs text-xr-muted">No matches.</span>
                    )}
                  </div>
                )}
              </Card>

              {previewZones.length > 0 && (
                <Card title="Cluster preview" subtitle="Review zones before generating routes.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewZones.map((zone, i) => (
                      <div key={zone.zone_id} className="rounded-xl border border-xr-line bg-xr-elevated p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color_hex || ZONE_COLORS[i % 5] }} />
                            <span className="truncate text-sm font-semibold text-white">{zone.zone_name}</span>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-xr-secondary">
                            {zone.total_orders} orders
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-xr-muted">
                          <span>{zone.route_distance_km?.toFixed(1) || '?'} km</span>
                          <span>{fmtDur(zone.estimated_duration)}</span>
                          <span>{zone.depot_returns_needed || 0} returns</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Actions" subtitle="Generate zones and routes">
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/5 bg-xr-elevated/60 p-3 text-xs text-xr-muted">
                    Select at least one area, then generate clusters. You can adjust max zones any time.
                  </div>
                  <SlideToConfirm
                    onConfirm={previewClustering}
                    disabled={!selectedPostcodes.length}
                    loading={loading}
                    label="Slide to generate clusters"
                    loadingLabel="Clustering…"
                  />
                  <div className="pt-1">
                    <SlideToConfirm
                      onConfirm={generateRoutesFromZones}
                      disabled={!previewZones.length}
                      loading={loading}
                      label="Slide to generate routes"
                      loadingLabel="Optimizing…"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-6">
              <Card
                title="Route review"
                subtitle="Assign drivers and confirm."
                right={(
                  <div className="flex flex-wrap items-center gap-2">
                    <SoftButton onClick={autoAssignAllDrivers} disabled={loading || !availableDrivers.length} tone="primary">
                      Auto-assign
                    </SoftButton>
                    <SoftButton onClick={confirmRoutes} disabled={loading || generatedRoutes.some(r => !r.driver_id)} tone="blue">
                      Confirm
                    </SoftButton>
                  </div>
                )}
              >
                {generatedRoutes.length === 0 ? (
                  <div className="rounded-card border border-dashed border-white/10 bg-xr-elevated/40 p-6 text-center text-sm text-xr-muted">
                    No routes yet. Generate routes from the Filter step.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedRoutes.map((route, i) => {
                      const isSelected = selectedRouteId === route.route_id;
                      const statusCls =
                        route.status === 'assigned'   ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' :
                        route.status === 'dispatched' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                        'bg-white/[0.05] text-xr-secondary border border-white/8';
                      return (
                        <button
                          key={route.route_id}
                          type="button"
                          onClick={() => setSelectedRouteId(route.route_id)}
                          className={`group text-left rounded-card border p-4 transition-all duration-200 ${
                            isSelected
                              ? 'border-amber-500/40 bg-amber-500/[0.08] shadow-glow-brand'
                              : 'border-xr-line bg-xr-elevated hover:border-white/15 hover:-translate-y-[2px] hover:shadow-elevated-soft'
                          }`}
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: route.zone_color || ZONE_COLORS[i % 5] }} />
                                <p className="truncate text-sm font-semibold text-white">{route.route_name}</p>
                              </div>
                              <p className="mt-1.5 text-xs text-xr-muted">
                                {route.total_orders} stops &middot; {route.total_distance_km?.toFixed(1)} km &middot; {fmtDur(route.estimated_duration_minutes)}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusCls}`}>
                              {route.status || 'draft'}
                            </span>
                          </div>

                          {route.depot_returns_count > 0 && (
                            <div className="mt-3 rounded-control border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-medium text-amber-300">
                              {route.depot_returns_count} depot return(s)
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-1 text-xs">
                            <span className="text-xr-muted">Driver:</span>
                            <span className={route.driver_name ? 'text-xr-secondary' : 'text-amber-400/80'}>
                              {route.driver_name || 'Unassigned'}
                            </span>
                          </div>
                          {mapStartDepotLabel(route) && (
                            <span className="mt-0.5 block text-[11px] text-xr-muted/70">
                              Map: {mapStartDepotLabel(route)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card title="Assignment" subtitle="Select a route to manage its driver.">
                {!selectedRoute ? (
                  <div className="rounded-card border border-dashed border-white/10 bg-xr-elevated/40 p-5 text-center text-sm text-xr-muted">
                    Tap a route card above to manage its driver.
                  </div>
                ) : (
                  <div className="space-y-3 animate-slide-up-fade">
                    <div className="rounded-card border border-xr-brand/20 bg-xr-brand/[0.06] p-3.5">
                      <p className="text-sm font-semibold text-white">{selectedRoute.route_name}</p>
                      <p className="mt-1 text-xs text-xr-muted">
                        {selectedRoute.total_orders} stops &middot; {selectedRoute.total_distance_km?.toFixed(1)} km &middot; £{selectedRoute.estimated_fuel_cost}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-xr-muted">Assign driver</label>
                      <select
                        value={selectedRoute.driver_id || ''}
                        onChange={e => assignDriverToRoute(selectedRoute.route_id, e.target.value)}
                        disabled={loading}
                        className="select-base"
                      >
                        <option value="">Select driver…</option>
                        {availableDrivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.mpg} MPG)
                          </option>
                        ))}
                      </select>
                    </div>

                    {mapStartDepotLabel(selectedRoute) && (
                      <p className="text-[11px] text-xr-muted">
                        {selectedRoute.driver_id ? 'Map start (driver depot)' : 'Map preview (zone depot)'}:{' '}
                        <span className="text-xr-secondary">{mapStartDepotLabel(selectedRoute)}</span>
                      </p>
                    )}

                    {selectedRoute.navigation_url && (
                      <a
                        href={selectedRoute.navigation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-card border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15 hover:border-amber-500/35"
                      >
                        Open route map
                      </a>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-6">
              <Card title="Dispatch summary" subtitle="Ready to push routes to drivers">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <SummaryTile label="Ready" value={generatedRoutes.length} tone="info" />
                  <SummaryTile label="Dispatched" value={dispatchedCount} tone="success" />
                </div>
                <div className="mt-4 rounded-xl border border-white/5 bg-xr-elevated/60 p-3 text-xs text-xr-muted">
                  When you dispatch, each driver receives their assigned route.
                </div>
                <div className="mt-4">
                  {generatedRoutes.every(r => r.status === 'dispatched') ? (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-center">
                      <p className="text-sm font-semibold text-emerald-200">All routes dispatched</p>
                      <p className="mt-0.5 text-xs text-emerald-200/70">Drivers have been notified.</p>
                    </div>
                  ) : (
                    <SlideToConfirm onConfirm={dispatchAllRoutes} loading={loading} label="Slide to dispatch all routes" loadingLabel="Dispatching…" />
                  )}
                </div>
              </Card>

              <Card title="Routes" subtitle="Live status overview">
                {generatedRoutes.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-xr-elevated/60 p-4 text-center text-sm text-xr-muted">
                    No routes ready. Confirm routes first.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedRoutes.map((route, i) => {
                      const progress = route.progress_percentage || (route.status === 'dispatched' ? 100 : 0);
                      const statusTone = route.status === 'dispatched' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300';
                      return (
                        <div key={route.route_id} className="rounded-2xl border border-xr-line bg-xr-elevated p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: route.zone_color || ZONE_COLORS[i % 5] }} />
                                <p className="truncate text-sm font-semibold text-white">{route.route_name}</p>
                              </div>
                              <p className="mt-1 text-xs text-xr-muted">Driver: <span className="text-xr-secondary">{route.driver_name || 'N/A'}</span> · {route.total_orders} stops</p>
                              {mapStartDepotLabel(route) && (
                                <p className="mt-0.5 text-[11px] text-xr-muted">Map: {mapStartDepotLabel(route)}</p>
                              )}
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone}`}>
                              {route.status || 'ready'}
                            </span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden border border-xr-line/50">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-xr-muted/70">
                            <span>{progress}%</span>
                            <span>{fmtDur(route.estimated_duration_minutes)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
        </main>

        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          {/* Pipeline steps */}
          <UiCard variant="soft" className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="h-4 w-4 text-xr-brand" />
              <span className="text-caption font-semibold uppercase tracking-wider text-xr-muted">Pipeline</span>
            </div>
            <ol className="space-y-1.5">
              {tabs.map((t, i) => {
                const isActive = i === activeTab;
                const isDone = i < activeTab;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex w-full items-start gap-3 rounded-control px-2 py-2 text-left transition-all duration-200 ${
                        isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isActive ? 'bg-xr-brand text-black scale-110' :
                          isDone  ? 'bg-emerald-500/25 text-emerald-300' :
                          'bg-white/[0.06] text-xr-muted'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className={`text-sm font-semibold leading-none ${ isActive ? 'text-white' : isDone ? 'text-xr-secondary' : 'text-xr-muted'}`}>
                          {t.label}
                        </p>
                        {isActive && (
                          <p className="mt-1.5 text-xs leading-relaxed text-xr-muted animate-fade-in">
                            {pipelineHelp[i].blurb}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </UiCard>

          {/* Tip card */}
          <UiCard variant="soft" className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-300/80" />
              <span className="text-caption font-semibold uppercase tracking-wider text-xr-muted">Tip</span>
            </div>
            <p className="text-sm leading-relaxed text-xr-secondary">{pipelineTips[activeTab]}</p>
          </UiCard>
        </aside>
      </div>
    </div>
  );
};

export default Orders;
