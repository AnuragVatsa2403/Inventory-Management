import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const cx = {
  btnP: 'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG: 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
};

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red:   'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:  'bg-hive-500/10 text-hive-400 border-hive-500/20',
    gray:  'bg-dark-700/60 text-dark-400 border-dark-600',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${c}`}>
      {children}
    </span>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-dark-500 text-sm font-mono">
    <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin" />
    Loading…
  </div>
);

const Alerts = () => {
  const [alerts, setAlerts]   = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter]   = useState({ isResolved: 'false', severity: '' });
  const [toast, setToast]     = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAlerts = useCallback(() => {
    const p = new URLSearchParams();
    if (filter.isResolved !== '') p.set('isResolved', filter.isResolved);
    if (filter.severity)          p.set('severity', filter.severity);
    setLoading(true);
    Promise.all([
      api.get(`/alerts?${p}`),
      api.get('/alerts/summary'),
    ])
      .then(([a, s]) => { setAlerts(a.data.alerts); setSummary(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data } = await api.post('/alerts/scan');
      showToast(`Scan complete — ${data.results.created} new alerts, ${data.results.resolved} resolved`);
      fetchAlerts();
    } catch {
      showToast('Scan failed — check server connection', false);
    } finally { setScanning(false); }
  };

  const handleMarkRead    = async (id) => { await api.put(`/alerts/${id}/read`);   fetchAlerts(); };
  const handleMarkAllRead = async ()   => { await api.put('/alerts/read-all');       showToast('All alerts marked as read'); fetchAlerts(); };
  const handleResolve     = async (id) => { await api.put(`/alerts/${id}/resolve`); showToast('Alert resolved'); fetchAlerts(); };

  const timeAgo = (date) => {
    const d = Date.now() - new Date(date);
    const m = Math.floor(d / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeLabel = (t) => ({
    LOW_STOCK:          'Low Stock',
    OUT_OF_STOCK:       'Out of Stock',
    REORDER_SUGGESTED:  'Reorder Suggested',
  }[t] || t);

  const typeBadgeColor = (t) => ({
    OUT_OF_STOCK:       'red',
    LOW_STOCK:          'amber',
    REORDER_SUGGESTED:  'blue',
  }[t] || 'gray');

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl animate-fade-up ${
          toast.ok
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Alert Centre</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            Raw material &amp; Finished goods stock monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <button className={cx.btnG} onClick={handleMarkAllRead}>✓ Mark All Read</button>
          <button className={cx.btnP} onClick={handleScan} disabled={scanning}>
            {scanning ? '⟳ Scanning…' : '⟳ Run Scan'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Critical',    value: summary.critical ?? 0,  color: 'text-red-400',   bg: 'bg-red-500/5 border-red-500/20',    sub: 'Out of stock' },
          { label: 'Warnings',    value: summary.warnings ?? 0,  color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', sub: 'Low stock' },
          { label: 'Unread',      value: summary.unread ?? 0,    color: 'text-hive-400',  bg: 'bg-hive-500/5 border-hive-500/20',  sub: 'Needs attention' },
          { label: 'Resolved',    value: summary.resolved ?? 0,  color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20', sub: 'This month' },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
            <div className="text-[9px] font-mono text-dark-500 tracking-widest uppercase mb-1">{c.label}</div>
            <div className={`text-3xl font-extrabold font-mono ${c.color}`}>{c.value}</div>
            <div className="text-[10px] font-mono text-dark-600 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[['false', 'Active'], ['true', 'Resolved']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilter(f => ({ ...f, isResolved: val }))}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              filter.isResolved === val
                ? 'bg-hive-500 border-hive-500 text-white'
                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            {lbl}
          </button>
        ))}
        <button
          onClick={() => setFilter(f => ({ ...f, severity: f.severity === 'critical' ? '' : 'critical' }))}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            filter.severity === 'critical'
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
          }`}
        >
          🔴 Critical Only
        </button>
      </div>

      {/* Alert list */}
      {loading ? <Spinner /> : alerts.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">{filter.isResolved === 'true' ? '✓' : '🔔'}</span>
            <span className="text-sm">
              {filter.isResolved === 'true' ? 'No resolved alerts' : 'All raw material & chip stocks are healthy!'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert._id}
              className={`bg-dark-900 border rounded-xl p-4 transition-all ${
                alert.severity === 'critical'
                  ? 'border-l-2 border-l-red-500/60 border-r border-t border-b border-dark-800'
                  : 'border-l-2 border-l-amber-500/60 border-r border-t border-b border-dark-800'
              } ${alert.isRead ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Badge row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge color={alert.severity === 'critical' ? 'red' : 'amber'}>
                      {alert.severity === 'critical' ? '⚠ CRITICAL' : '⚠ WARNING'}
                    </Badge>
                    <Badge color={typeBadgeColor(alert.type)}>{typeLabel(alert.type)}</Badge>
                    {!alert.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-hive-400 animate-pulse" />
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-sm font-semibold text-white mb-1.5">{alert.message}</p>

                  {/* Meta */}
                  <div className="flex gap-4 flex-wrap text-[10px] font-mono text-dark-500">
                    <span>Material: <span className="text-dark-300">{alert.itemId?.itemName || 'N/A'}</span></span>
                    <span>Type: <span className="text-dark-300">{alert.itemId?.itemType || '—'}</span></span>
                    {alert.availableQty !== undefined && (
                      <span>
                        Available:{' '}
                        <span className={alert.severity === 'critical' ? 'text-red-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {alert.availableQty} {alert.itemId?.unit || 'T'}
                        </span>
                      </span>
                    )}
                    {alert.threshold && (
                      <span>Threshold: <span className="text-dark-300">{alert.threshold} T</span></span>
                    )}
                    <span>{timeAgo(alert.createdAt)}</span>
                    {alert.isResolved && (
                      <span className="text-green-400">✓ Resolved {timeAgo(alert.resolvedAt)}</span>
                    )}
                  </div>
                </div>

        
                {!alert.isResolved && (
                  <div className="flex gap-2 flex-none">
                    {!alert.isRead && (
                      <button className={cx.btnG} onClick={() => handleMarkRead(alert._id)}>
                        Mark Read
                      </button>
                    )}
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg border border-green-500/20 transition"
                      onClick={() => handleResolve(alert._id)}
                    >
                      ✓ Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
