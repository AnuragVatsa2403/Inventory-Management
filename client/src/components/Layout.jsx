import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NAV = [
  { to: '/',            icon: '▣', label: 'Dashboard',       perm: 'view:dashboard' },
  { to: '/products',    icon: '◈', label: 'Products',        perm: 'view:products' },
  { to: '/categories',  icon: '◉', label: 'Categories',      perm: 'view:categories' },
  { to: '/suppliers',   icon: '◎', label: 'Suppliers',       perm: 'view:suppliers' },
  { to: '/orders',      icon: '⬡', label: 'Purchase Orders', perm: 'view:orders' },
  { to: '/sales',       icon: '◐', label: 'Sales Orders',    perm: 'view:sales' },
  { to: '/production',  icon: '⚙', label: 'Production',      perm: 'view:production' },
  { to: '/gst',         icon: '🧾', label: 'GST Report',      perm: 'view:reports' },
  { to: '/alerts',      icon: '⚡', label: 'Alerts',          perm: 'view:alerts' },
  { to: '/users',       icon: '◑', label: 'Users',           perm: 'view:users' },
];

const PAGE_TITLES = {
  '/': 'Dashboard', '/products': 'Products', '/categories': 'Categories',
  '/suppliers': 'Suppliers', '/orders': 'Purchase Orders',
  '/sales': 'Sales Orders', '/alerts': 'Alert Centre', '/users': 'Users',
  '/production': 'Production', '/gst': 'GST Report',
};

const LowStockBell = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.get('/products/alerts/low-stock').then(r => setCount(r.data.count)).catch(() => {});
  }, []);
  if (!count) return null;
  return (
    <div className="relative" title={`${count} low stock alerts`}>
      <span className="text-xl cursor-pointer">🔔</span>
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
};

const Layout = () => {
  const { user, logout, can } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const title = PAGE_TITLES[location.pathname] || 'StockHive';

  return (
    <div className="flex min-h-screen bg-dark-950">
      <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-300 flex flex-col bg-dark-900 border-r border-dark-800 fixed top-0 left-0 h-screen z-50`}>
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-dark-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[linear-gradient(to_bottom_right,#60a5fa,#9333ea)] flex items-center justify-center flex-none shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm font-mono">SH</span>
          </div>
          {!collapsed && (
            <div>
              <div className="font-extrabold text-white text-base tracking-tight">StockHive</div>
              <div className="text-[9px] font-mono text-dark-400 tracking-widest uppercase">Inventory System</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {!collapsed && <div className="px-4 mb-2 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Navigation</div>}
          {NAV.filter(({ perm }) => can(perm)).map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-l-2 ${
                  isActive
                    ? 'bg-hive-500/10 text-hive-400 border-hive-400'
                    : 'text-dark-400 border-transparent hover:text-dark-100 hover:bg-dark-800'
                } ${collapsed ? 'justify-center' : ''}`
              }>
              <span className="text-base w-5 text-center flex-none">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-800">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-hive-500/20 border border-hive-500/40 flex items-center justify-center text-hive-400 font-bold text-xs font-mono flex-none">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-dark-100 truncate">{user?.name}</div>
                <div className="text-[10px] font-mono text-dark-500 capitalize">{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <span>⏻</span>
            {!collapsed && 'Logout'}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 text-dark-400 hover:text-white flex items-center justify-center text-xs z-10">
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <header className="h-14 bg-dark-900/80 backdrop-blur border-b border-dark-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <div className="text-[9px] font-mono text-dark-500 tracking-widest uppercase mb-0.5">
              StockHive / {title.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-dark-100">{title}</div>
          </div>
          <div className="flex items-center gap-4">
            <LowStockBell />
            <div className="text-[10px] font-mono text-dark-500">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
