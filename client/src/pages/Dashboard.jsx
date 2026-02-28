import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const StatCard = ({ label, value, sub, color = 'hive', icon }) => {
  const colors = {
    hive:  { bar: 'from-hive-400 to-hive-600',   val: 'text-hive-400',  bg: 'bg-hive-500/5'  },
    red:   { bar: 'from-red-400 to-red-600',     val: 'text-red-400',   bg: 'bg-red-500/5'   },
    amber: { bar: 'from-amber-400 to-amber-600', val: 'text-amber-400', bg: 'bg-amber-500/5' },
    green: { bar: 'from-green-400 to-green-600', val: 'text-green-400', bg: 'bg-green-500/5' },
  }[color];
  return (
    <div className={`${colors.bg} border border-dark-800 rounded-xl p-5 relative overflow-hidden group hover:border-dark-700 transition-all`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-black ${colors.bar} rounded-l-xl`} />
      <div className="text-[9px] font-mono text-dark-500 tracking-widest uppercase mb-2 pl-2">{label}</div>
      <div className={`text-4xl font-extrabold font-mono ${colors.val} pl-2`}>{value}</div>
      <div className="text-xs text-dark-500 mt-1 pl-2">{sub}</div>
      <div className="absolute top-4 right-4 text-2xl opacity-10 group-hover:opacity-20 transition-opacity">{icon}</div>
    </div>
  );
};

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red:   'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:  'bg-hive-500/10 text-hive-400 border-hive-500/20',
    gray:  'bg-dark-700 text-dark-400 border-dark-600',
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${c}`}>{children}</span>;
};

const statusBadge = (s) => {
  const map = { Pending: 'amber', Partial: 'blue', Received: 'green', Cancelled: 'red' };
  return <Badge color={map[s] || 'gray'}>{s}</Badge>;
};

const Dashboard = () => {
  const [stats, setStats]             = useState(null);
  const [lowStock, setLowStock]       = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/products/alerts/low-stock'),
      api.get('/orders'),
      api.get('/sales'),
    ]).then(([products, alerts, orders, sales]) => {
      setStats({
        totalMaterials: products.data.filter(p => p.itemType === 'Raw Material').length,
        totalChips:     products.data.filter(p => p.itemType === 'Finished Goods').length,
        lowStockCount:  alerts.data.count,
        totalOrders:    orders.data.length,
        pendingSales:   sales.data.filter(s => s.dispatchStatus === 'Pending').length,
      });
      setLowStock(alerts.data.items.slice(0, 6));
      setRecentOrders(orders.data.slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-dark-500 text-sm font-mono">
      <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
      Loading StockHive…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Overview</h1>
        <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
          Polytime Industries · Real-time inventory
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Raw Materials"    value={stats?.totalMaterials ?? 0} sub="Active polymer grades"  color="hive"  icon="◈" />
        <StatCard label="Chips / FG"       value={stats?.totalChips ?? 0}     sub="Finished goods SKUs"   color="green" icon="⬡" />
        <StatCard label="Low Stock Alerts" value={stats?.lowStockCount ?? 0}  sub="Below threshold"       color="red"   icon="⚡" />
        <StatCard label="Pending Dispatch" value={stats?.pendingSales ?? 0}   sub="Awaiting dispatch"     color="amber" icon="◐" />
      </div>

      {/* Two panel grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Low stock */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-sm">⚡</span>
              <span className="text-sm font-semibold text-dark-100">Low Stock — Materials &amp; Chips</span>
            </div>
            <Link to="/alerts" className="text-[10px] font-mono text-hive-400 hover:text-hive-300 transition">View all →</Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-dark-500">
              <span className="text-3xl mb-2">✓</span>
              <span className="text-sm">All stock levels healthy</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Material / Grade</th>
                  <th className="text-right px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Available (T)</th>
                  <th className="text-right px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, i) => (
                  <tr key={i} className="border-b border-dark-800/50 hover:bg-dark-800/40 transition">
                    <td className="px-5 py-3 text-sm font-medium text-dark-100">{item.product?.itemName || 'Unknown'}</td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-red-400">
                      {item.totalAvailable} T
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge color={item.totalAvailable === 0 ? 'red' : 'amber'}>
                        {item.totalAvailable === 0 ? 'OUT' : 'LOW'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent POs */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <div className="flex items-center gap-2">
              <span className="text-hive-400 text-sm">⬡</span>
              <span className="text-sm font-semibold text-dark-100">Recent Purchase Orders</span>
            </div>
            <Link to="/orders" className="text-[10px] font-mono text-hive-400 hover:text-hive-300 transition">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-dark-500">
              <span className="text-sm">No orders yet</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Supplier</th>
                  <th className="text-left px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Date</th>
                  <th className="text-right px-5 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o._id} className="border-b border-dark-800/50 hover:bg-dark-800/40 transition">
                    <td className="px-5 py-3 text-sm font-medium text-dark-100">{o.supplierId?.supplierName || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm font-mono text-dark-400">
                      {new Date(o.orderDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right">{statusBadge(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
