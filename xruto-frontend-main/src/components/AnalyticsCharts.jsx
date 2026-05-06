import React, { useId, useMemo, useState, useCallback } from 'react';
import { Card as UiCard } from '../ui/Card';

/** Fixed coordinate space for SVGs — no ResizeObserver / layout thrash. */
const W = 900;
const H = 300;
const PAD = { t: 24, r: 28, b: 48, l: 52 };
const PLOT = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };

function niceCeil(n) {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  const u = n / p;
  const nu = u <= 1 ? 1 : u <= 2 ? 2 : u <= 5 ? 5 : 10;
  return nu * p;
}

function pickTicks(maxVal, count = 5) {
  const m = niceCeil(maxVal);
  const step = Math.max(1, niceCeil(m / Math.max(1, count - 1)));
  const ticks = [];
  for (let v = 0; v <= m; v += step) {
    ticks.push(Math.min(m, v));
  }
  if (ticks.length === 0) ticks.push(0, m);
  if (ticks[ticks.length - 1] < m) ticks.push(m);
  return { max: m, ticks: [...new Set(ticks)] };
}

export function AnalyticsCharts({ series, deliveryRate, snapshot }) {
  const gid = useId();
  const [hover, setHover] = useState(null);

  const pendingReview = useMemo(() => {
    if (!snapshot?.totalRoutes && snapshot?.totalRoutes !== 0) return 0;
    return Math.max(0, snapshot.totalRoutes - (snapshot.dispatched || 0) - (snapshot.completed || 0));
  }, [snapshot]);

  const { maxPrimary, tickPrimary, ratePath, rateAreaD, meanRate } = useMemo(() => {
    const dArr = series.map((s) => s.delivered || 0);
    const rArr = series.map((s) => s.routes || 0);
    const gMax = Math.max(1, ...dArr, ...rArr, 0);
    const { max: m, ticks: tickPrimary } = pickTicks(gMax, 5);

    const rateArr = series.map((s) => Math.min(100, Math.max(0, s.rate != null ? s.rate : 0)));
    const meanRate = rateArr.length ? rateArr.reduce((a, b) => a + b, 0) / rateArr.length : 0;
    const nR = series.length;
    const rX = (i) =>
      nR <= 1
        ? PAD.l + PLOT.w / 2
        : PAD.l + (PLOT.w / (nR - 1)) * i;
    const rY = (v) => PAD.t + PLOT.h * (1 - v / 100);
    let path = '';
    let area = '';
    if (nR > 0) {
      const base = PAD.t + PLOT.h;
      if (nR === 1) {
        const x = rX(0);
        const y = rY(rateArr[0]);
        path = `M ${x} ${y} L ${x + 0.5} ${y}`;
        area = `M ${x - 0.5} ${y} L ${x + 0.5} ${y} L ${x + 0.5} ${base} L ${x - 0.5} ${base} Z`;
      } else {
        const pts = rateArr.map((v, i) => ({ x: rX(i), y: rY(v) }));
        path = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
        area = `${path} L ${pts[pts.length - 1].x} ${base} L ${pts[0].x} ${base} Z`;
      }
    }

    return {
      maxPrimary: m,
      tickPrimary,
      ratePath: path,
      rateAreaD: area,
      meanRate,
    };
  }, [series]);

  const statusSeg = useMemo(() => {
    const t = Math.max(0, snapshot?.totalRoutes || 0);
    return {
      t,
      disp: snapshot?.dispatched || 0,
      comp: snapshot?.completed || 0,
      pend: pendingReview,
    };
  }, [snapshot, pendingReview]);

  const onLeave = useCallback(() => setHover(null), []);

  if (!series.length) {
    return (
      <UiCard variant="glass" className="flex min-h-[240px] items-center justify-center p-8">
        <p className="text-sm text-xr-muted">No data for this range yet.</p>
      </UiCard>
    );
  }

  const n = series.length;
  const groupW = PLOT.w / n;
  const barW = Math.max(5, (groupW * 0.3) | 0);
  const barGap = Math.max(2, groupW * 0.12);

  return (
    <div className="space-y-4">
      <UiCard variant="glass" className="overflow-hidden p-0">
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="text-sm font-semibold tracking-tight text-white sm:text-base">Volume &amp; load</h3>
          <p className="mt-0.5 text-xs text-xr-muted sm:text-sm">Delivered stops vs active routes by day (grouped)</p>
        </div>
        <div className="relative p-2 sm:p-4" onMouseLeave={onLeave}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[220px] w-full min-h-[200px] sm:h-[300px] sm:min-h-[300px]"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Grouped bar chart of delivered and routes"
          >
            <defs>
              <linearGradient id={`${gid}-del`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#b45309" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id={`${gid}-rt`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0369a1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {tickPrimary.map((tv) => {
              const y = PAD.t + PLOT.h * (1 - tv / maxPrimary);
              return (
                <g key={`g-${tv}`}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <text x={PAD.l - 8} y={y + 3} textAnchor="end" className="fill-white/35 text-[10px] font-medium">
                    {Number.isInteger(tv) ? tv : tv.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {series.map((row, i) => {
              const cx = PAD.l + i * groupW + groupW / 2;
              const y0 = PAD.t + PLOT.h;
              const d = row.delivered || 0;
              const r = row.routes || 0;
              const hD = (d / maxPrimary) * PLOT.h;
              const hR = (r / maxPrimary) * PLOT.h;
              const leftCx = cx - (barW + barGap) / 2;
              const rightCx = cx + (barW + barGap) / 2;
              return (
                <g key={`b-${row.date}`}>
                  <rect
                    x={leftCx - barW / 2}
                    y={y0 - hD}
                    width={barW}
                    height={hD}
                    fill={`url(#${gid}-del)`}
                    rx={3}
                    className="cursor-crosshair"
                    style={{ opacity: hover?.key === `${i}-d` ? 1 : 0.9 }}
                    onMouseEnter={() =>
                      setHover({ key: `${i}-d`, x: cx, label: row.date, line: 'Delivered', value: d })
                    }
                  />
                  <rect
                    x={rightCx - barW / 2}
                    y={y0 - hR}
                    width={barW}
                    height={hR}
                    fill={`url(#${gid}-rt)`}
                    rx={3}
                    className="cursor-crosshair"
                    style={{ opacity: hover?.key === `${i}-r` ? 1 : 0.9 }}
                    onMouseEnter={() =>
                      setHover({ key: `${i}-r`, x: cx, label: row.date, line: 'Routes', value: r })
                    }
                  />
                </g>
              );
            })}
            {series.map((row, i) => {
              const x = PAD.l + i * groupW + groupW / 2;
              return (
                <text
                  key={`x-${row.date}`}
                  x={x}
                  y={H - 16}
                  textAnchor="middle"
                  className="fill-white/40 text-[9px] sm:text-[10px]"
                >
                  {row.date}
                </text>
              );
            })}
            {hover && (
              <g>
                <line
                  x1={hover.x}
                  y1={PAD.t}
                  x2={hover.x}
                  y2={PAD.t + PLOT.h}
                  stroke="rgba(245,158,11,0.35)"
                  strokeDasharray="4 4"
                />
              </g>
            )}
          </svg>
          {hover && (
            <div
              className="pointer-events-none absolute z-20 rounded-control border border-white/15 bg-xr-surface/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm"
              style={{
                left: `clamp(4px, ${(hover.x / W) * 100}%, calc(100% - 120px))`,
                top: 8,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-[10px] text-xr-muted">{hover.label}</div>
              <div className="mt-0.5 font-semibold text-amber-200/95">
                {hover.line}: {hover.value}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 border-t border-white/10 px-4 py-3 text-xs sm:px-6">
          <span className="inline-flex items-center gap-2 text-xr-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-amber-700 to-amber-300" />
            Delivered
          </span>
          <span className="inline-flex items-center gap-2 text-xr-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
            Routes
          </span>
        </div>
      </UiCard>

      <div className="grid gap-4 lg:grid-cols-5">
        <UiCard variant="glass" className="p-0 lg:col-span-3">
          <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5 sm:py-3.5">
            <h3 className="text-sm font-semibold text-white">Delivery rate trend</h3>
            <p className="mt-0.5 text-xs text-xr-muted">Area + line (0–100%) · mean {meanRate.toFixed(1)}%</p>
          </div>
          <div className="p-2 sm:p-4">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-[200px] w-full min-h-[200px] sm:h-[280px] sm:min-h-[280px]"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Area chart of delivery rate"
            >
              <defs>
                <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map((tv) => {
                const y = PAD.t + PLOT.h * (1 - tv / 100);
                return (
                  <g key={`r-${tv}`}>
                    <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" />
                    <text x={PAD.l - 6} y={y + 3} textAnchor="end" className="fill-white/30 text-[10px]">
                      {tv}%
                    </text>
                  </g>
                );
              })}
              {rateAreaD && (
                <path d={rateAreaD} fill={`url(#${gid}-area)`} fillOpacity="1" />
              )}
              {ratePath && (
                <path
                  d={ratePath}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {Number.isFinite(meanRate) && meanRate > 0 && (
                <line
                  x1={PAD.l}
                  y1={PAD.t + PLOT.h * (1 - meanRate / 100)}
                  x2={W - PAD.r}
                  y2={PAD.t + PLOT.h * (1 - meanRate / 100)}
                  stroke="rgba(16, 185, 129, 0.55)"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                />
              )}
              {series.map((row, i) => {
                const x = n <= 1 ? PAD.l + PLOT.w / 2 : PAD.l + (PLOT.w / (n - 1)) * i;
                return (
                  <text key={`rx-${row.date}`} x={x} y={H - 12} textAnchor="middle" className="fill-white/35 text-[9px]">
                    {row.date}
                  </text>
                );
              })}
            </svg>
          </div>
        </UiCard>

        <UiCard variant="glass" className="flex flex-col p-0 lg:col-span-2">
          <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-white">Service level</h3>
            <p className="mt-0.5 text-xs text-xr-muted">Snapshot delivery success</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6">
            <svg viewBox="0 0 200 200" className="h-40 w-40" aria-hidden>
              <defs>
                <linearGradient id={`${gid}-donut`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
              {(() => {
                const r = 70;
                const c = 2 * Math.PI * r;
                const p = Math.min(100, Math.max(0, deliveryRate)) / 100;
                return (
                  <circle
                    cx="100"
                    cy="100"
                    r={r}
                    fill="none"
                    stroke={`url(#${gid}-donut)`}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${c * p} ${c}`}
                    transform="rotate(-90 100 100)"
                    className="drop-shadow-sm"
                  />
                );
              })()}
              <text x="100" y="96" textAnchor="middle" className="fill-white text-2xl font-bold tabular-nums">
                {deliveryRate}%
              </text>
              <text x="100" y="116" textAnchor="middle" className="fill-white/40 text-[10px] font-medium">
                on-time rate
              </text>
            </svg>
            <p className="text-center text-[11px] text-xr-muted">Stops completed vs total in snapshot</p>
          </div>
        </UiCard>
      </div>

      <UiCard variant="glass" className="p-0">
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="text-sm font-semibold text-white sm:text-base">Route pipeline</h3>
          <p className="mt-0.5 text-xs text-xr-muted sm:text-sm">Distribution across operational states (latest)</p>
        </div>
        <div className="grid gap-6 p-4 sm:grid-cols-2 sm:gap-8 sm:p-6">
          <div>
            <svg
              viewBox="0 0 520 120"
              className="h-28 w-full"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Stacked status bar"
            >
              <rect x="0" y="36" width="520" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
              {statusSeg.t > 0 && (
                <>
                  {statusSeg.disp > 0 && (
                    <rect
                      x="0"
                      y="36"
                      width={(520 * statusSeg.disp) / statusSeg.t}
                      height="32"
                      fill="#0ea5e9"
                      rx="8"
                    />
                  )}
                  {statusSeg.comp > 0 && (
                    <rect
                      x={(520 * statusSeg.disp) / statusSeg.t}
                      y="36"
                      width={(520 * statusSeg.comp) / statusSeg.t}
                      height="32"
                      fill="#10b981"
                    />
                  )}
                  {statusSeg.pend > 0 && (
                    <rect
                      x={(520 * (statusSeg.disp + statusSeg.comp)) / statusSeg.t}
                      y="36"
                      width={(520 * statusSeg.pend) / statusSeg.t}
                      height="32"
                      fill="#f59e0b"
                      rx="8"
                    />
                  )}
                </>
              )}
              <text x="0" y="20" className="fill-white/50 text-[11px] font-medium">
                0
              </text>
              <text x="260" y="20" textAnchor="middle" className="fill-white/40 text-[10px]">
                {statusSeg.t} routes
              </text>
              <text x="520" y="20" textAnchor="end" className="fill-white/50 text-[11px]">
                {statusSeg.t}
              </text>
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { c: 'text-sky-300', b: 'bg-sky-500', t: 'Active / dispatched', v: statusSeg.disp },
                { c: 'text-emerald-300', b: 'bg-emerald-500', t: 'Completed', v: statusSeg.comp },
                { c: 'text-amber-200', b: 'bg-amber-500', t: 'Other', v: statusSeg.pend },
              ].map((row) => (
                <div
                  key={row.t}
                  className="rounded-control border border-white/10 bg-white/[0.03] px-2 py-3"
                >
                  <div className={`mx-auto mb-1.5 h-1.5 w-1.5 rounded-full ${row.b}`} />
                  <div className="text-[10px] text-xr-muted">{row.t}</div>
                  <div className={`text-lg font-bold tabular-nums ${row.c}`}>{row.v}</div>
                </div>
              ))}
            </div>
          </div>
          {snapshot?.avgRouteMinutes != null && (
            <div className="flex flex-col justify-center">
              <div className="text-xs font-medium text-xr-muted">Avg route time (estimate)</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-white">{snapshot.avgRouteMinutes}</span>
                <span className="text-sm text-xr-muted">min</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-700/90 to-amber-400/90"
                  style={{ width: `${Math.min(100, (snapshot.avgRouteMinutes / 90) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-xr-muted/90">Scale 0–90 min (typical long route)</p>
            </div>
          )}
        </div>
      </UiCard>
    </div>
  );
}
