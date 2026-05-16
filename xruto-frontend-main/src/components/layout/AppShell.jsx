import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../ui/cn';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ChevronLeft, ChevronRight, LayoutGrid, Package, BarChart3, Route, Settings, LogOut } from 'lucide-react';
import { BrandLogo } from '../../ui/BrandLogo.jsx';

const VIEW_META = {
  admin:     { label: 'My Admin',  shortLabel: 'Admin',    icon: LayoutGrid, breadcrumb: ['Admin', 'Control center'] },
  orders:    { label: 'Orders',    shortLabel: 'Orders',   icon: Package,    breadcrumb: ['Admin', 'Orders'] },
  analytics: { label: 'Analytics', shortLabel: 'Stats',    icon: BarChart3,  breadcrumb: ['Admin', 'Analytics'] },
  routes:    { label: 'Route',     shortLabel: 'Routes',   icon: Route,      breadcrumb: ['Driver', 'Routes'] },
  settings:  { label: 'Settings',  shortLabel: 'Settings', icon: Settings,   breadcrumb: ['Account', 'Settings'] },
};

function getInitials(name) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

export function AppShell({ currentView, onChangeView, user, onLogout, children }) {
  const isAdmin = user?.role === 'admin';
  const tabs = useMemo(() => {
    const adminTabs  = ['admin', 'orders', 'analytics', 'routes', 'settings'];
    const driverTabs = ['routes', 'analytics', 'settings'];
    return (isAdmin ? adminTabs : driverTabs).map((id) => ({ id, ...VIEW_META[id] }));
  }, [isAdmin]);

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem('xruto_nav_collapsed');
    if (v === '1') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('xruto_nav_collapsed', next ? '1' : '0');
      return next;
    });
  };

  const meta = VIEW_META[currentView] || VIEW_META.admin;
  const initials = getInitials(user?.name);

  return (
    <div className="min-h-screen text-xr-text bg-xr-bg">
      <div className="relative flex min-h-screen">
        {/* ── Sidebar (desktop) ── */}
        <aside
          className={cn(
            'hidden md:flex h-screen sticky top-0 shrink-0 flex-col',
            'border-r border-xr-line',
            'bg-xr-sidebar/95 backdrop-blur-2xl',
            'transition-[width] duration-300 ease-spring z-40',
            collapsed ? 'w-[72px]' : 'w-[240px]'
          )}
        >
          {/* Subtle top accent */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-xr-brand/30 to-transparent" />

          {/* Logo header */}
          <div className={cn('flex items-center justify-between px-4 py-4', collapsed && 'px-3 justify-center')}>
            <div className={cn('flex items-center gap-3 min-w-0 overflow-hidden', collapsed && 'gap-0')}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-control border border-xr-border bg-white transition-shadow hover:shadow-soft">
                <BrandLogo className="h-8 w-8" alt="" />
              </div>
              <div
                className={cn(
                  'min-w-0 overflow-hidden transition-all duration-300',
                  collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                )}
              >
                <div className="truncate text-sm font-bold text-xr-text tracking-tight">xRuto</div>
                <div className="truncate text-[10px] text-xr-muted tracking-wide">Logistics Intelligence</div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                'ml-2 inline-flex h-8 w-8 items-center justify-center rounded-control',
                'border border-xr-line bg-white text-xr-secondary',
                'transition hover:bg-xr-elevated hover:text-xr-text hover:border-xr-border',
                collapsed && 'ml-0'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <ChevronRight className="h-3.5 w-3.5" />
                : <ChevronLeft className="h-3.5 w-3.5" />
              }
            </button>
          </div>

          {/* Section label */}
          {!collapsed && (
            <div className="px-4 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-xr-subtle">
                Navigation
              </p>
            </div>
          )}

          {/* Nav items */}
          <nav className={cn('mt-1 flex-1 px-3 pb-3', collapsed && 'px-2')} aria-label="Primary">
            <div className="space-y-0.5">
              {tabs.map((t) => {
                const active = currentView === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeView(t.id)}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium',
                      'transition-all duration-200 ease-out',
                      collapsed && 'justify-center px-2',
                      active
                        ? 'bg-xr-brand/10 text-xr-brand'
                        : 'text-xr-secondary hover:bg-xr-elevated hover:text-xr-text'
                    )}
                    title={collapsed ? t.label : undefined}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-xr-brand shadow-glow animate-expand-x"
                      />
                    )}

                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-all duration-200',
                        active ? 'text-xr-brand' : 'group-hover:scale-110 group-hover:text-xr-text'
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />

                    <span
                      className={cn(
                        'truncate transition-all duration-300 origin-left',
                        collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'
                      )}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User footer */}
          <div className={cn('border-t border-xr-line p-3', collapsed && 'p-2')}>
            <div
              className={cn(
                'flex items-center gap-3 rounded-control border border-xr-border bg-xr-surface p-2.5 shadow-sm',
                collapsed && 'justify-center p-2'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-xr-elevated border border-xr-border text-[11px] font-bold text-xr-brand">
                {initials}
              </div>
              <div
                className={cn(
                  'min-w-0 flex-1 overflow-hidden transition-all duration-300',
                  collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                )}
              >
                <div className="truncate text-xs font-semibold text-xr-text">{user?.name || 'User'}</div>
                <div className="truncate text-[10px] text-xr-muted">{isAdmin ? 'Administrator' : 'Driver'}</div>
              </div>
              {!collapsed && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex h-8 items-center gap-1.5 rounded-control border border-xr-danger/20 bg-xr-danger/10 px-2.5 text-[11px] font-semibold text-xr-danger transition hover:bg-xr-danger/20 hover:border-xr-danger/35"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Out
                </button>
              )}
            </div>
            {collapsed && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-2 inline-flex w-full items-center justify-center rounded-control border border-xr-danger/20 bg-xr-danger/10 py-2 text-[11px] font-semibold text-xr-danger transition hover:bg-xr-danger/20"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-xr-bg">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-xr-line bg-xr-surface/90 backdrop-blur-xl shadow-sm">
            <div className="mx-auto max-w-section px-4 py-3 sm:px-6 sm:py-3.5">
              <div className="flex min-h-[2.75rem] items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-xr-muted">
                    <span className="font-medium">{meta.breadcrumb?.[0] || 'App'}</span>
                    <span className="opacity-40">/</span>
                    <span className="text-xr-secondary font-medium">{meta.breadcrumb?.[1] || meta.label}</span>
                  </div>
                  <div className="mt-0.5 font-heading text-h2 font-semibold text-xr-text leading-snug">
                    {meta.breadcrumb?.[1] || meta.label}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    {user?.role === 'admin' ? 'Admin' : 'Driver'}
                  </Badge>
                  {/* Mobile logout */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="touch-target md:hidden text-xr-muted hover:text-xr-danger"
                    onClick={onLogout}
                    aria-label="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto w-full max-w-section min-w-0 px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-xr-line bg-xr-surface/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl shadow-[0_-8px_20px_rgba(0,0,0,0.05)]"
        aria-label="Primary navigation"
      >
        <div
          className={cn(
            'mx-auto grid max-w-section px-1',
            isAdmin ? 'grid-cols-5' : 'grid-cols-3'
          )}
        >
          {tabs.map((t) => {
            const active = currentView === t.id;
            const Icon = t.icon;
            const sub = t.shortLabel || t.label;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeView(t.id)}
                className={cn(
                  'relative flex min-h-[3.25rem] flex-col items-center justify-center gap-[3px] rounded-control py-1',
                  'transition-all duration-250 ease-spring',
                  active
                    ? 'text-xr-brand'
                    : 'text-xr-subtle hover:text-xr-muted active:scale-95'
                )}
              >
                {/* Active top indicator */}
                {active && (
                  <div className="absolute -top-px left-0 right-0 flex justify-center">
                    <span
                      aria-hidden
                      className="h-[3px] w-8 rounded-full bg-xr-brand shadow-glow animate-expand-x"
                    />
                  </div>
                )}

                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-control transition-all duration-200',
                  active ? 'bg-xr-brand/12' : ''
                )}>
                  <Icon
                    className={cn('h-[20px] w-[20px] transition-all duration-200', active && 'scale-110')}
                    strokeWidth={active ? 2.3 : 1.8}
                  />
                </div>

                <span
                  className={cn(
                    'max-w-full truncate text-center text-[9.5px] font-semibold tracking-wide transition-colors duration-200',
                    active ? 'text-xr-brand' : 'text-xr-subtle'
                  )}
                >
                  {sub}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
