import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const cx = {
  th:   'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:   'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP: 'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition',
  btnG: 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
};

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const StatCard = ({ label, value, sub, color = 'default' }) => {
  const col = {
    default: 'text-white',
    blue:    'text-hive-400',
    green:   'text-green-400',
    amber:   'text-amber-400',
  }[color];
  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 space-y-1">
      <p className="text-[9px] font-mono text-dark-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-extrabold ${col}`}>{value}</p>
      {sub && <p className="text-[10px] font-mono text-dark-600">{sub}</p>}
    </div>
  );
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const GSTReport = () => {
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [month,    setMonth]    = useState(String(new Date().getMonth() + 1));
  const [year,     setYear]     = useState(String(new Date().getFullYear()));

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/gst/monthly-summary?month=${month}&year=${year}`);
      setSummary(r.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Error fetching GST summary');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, [month, year]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">GST Report</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            Monthly tax summary · Polytime Industries · GSTIN: 06AABCP1234K1ZX
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="bg-dark-800 border border-dark-700 text-dark-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition">
            {MONTHS.map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="bg-dark-800 border border-dark-700 text-dark-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition">
            {[2024,2025,2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <button className={cx.btnG} onClick={fetchSummary}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-dark-500 font-mono text-sm gap-3">
          <div className="w-4 h-4 border-2 border-dark-600 border-t-hive-400 rounded-full animate-spin"/>
          Loading GST data…
        </div>
      ) : !summary ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Taxable Value" value={fmt(summary.totalTaxable)} color="default"/>
            <StatCard label="CGST Collected"      value={fmt(summary.totalCGST)}    color="blue"
              sub="Intrastate 50%"/>
            <StatCard label="SGST Collected"      value={fmt(summary.totalSGST)}    color="blue"
              sub="Intrastate 50%"/>
            <StatCard label="IGST Collected"      value={fmt(summary.totalIGST)}    color="amber"
              sub="Interstate"/>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total Tax Liability"  value={fmt(summary.totalTax)}    color="green"/>
            <StatCard label="Grand Total (w/ GST)" value={fmt(summary.totalValue)}  color="green"/>
            <StatCard label="E-Way Bills Issued"   value={summary.ewayBillCount}    color="amber"
              sub={`out of ${summary.totalSales} invoices`}/>
          </div>

          {/* Invoice-wise breakdown */}
          <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-white">
                Invoice-wise GST Breakdown — {summary.month}
              </p>
              <span className="text-[10px] font-mono text-dark-500">{summary.totalSales} invoices</span>
            </div>
            {summary.orders.length === 0 ? (
              <div className="py-12 text-center text-dark-500 text-sm font-mono">
                No GST-applicable sales orders for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={cx.th}>Invoice No.</th>
                      <th className={cx.th}>Customer</th>
                      <th className={cx.th}>Buyer State</th>
                      <th className={cx.th}>HSN</th>
                      <th className={`${cx.th} text-right`}>Taxable (₹)</th>
                      <th className={cx.th}>GST Type</th>
                      <th className={`${cx.th} text-right`}>CGST (₹)</th>
                      <th className={`${cx.th} text-right`}>SGST (₹)</th>
                      <th className={`${cx.th} text-right`}>IGST (₹)</th>
                      <th className={`${cx.th} text-right`}>Total Tax (₹)</th>
                      <th className={`${cx.th} text-right`}>Grand Total (₹)</th>
                      <th className={cx.th}>E-Way Bill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.orders.map((o, i) => (
                      <tr key={i} className="hover:bg-dark-800/40 transition">
                        <td className={`${cx.td} font-mono text-hive-400 text-xs`}>{o.invoiceNo}</td>
                        <td className={`${cx.td} font-semibold text-white text-xs`}>{o.customer || '—'}</td>
                        <td className={`${cx.td} text-dark-400 text-xs`}>{o.buyerState || '—'}</td>
                        <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{o.hsnCode || '—'}</td>
                        <td className={`${cx.td} text-right font-mono text-xs`}>{fmt(o.taxableValue)}</td>
                        <td className={cx.td}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${
                            o.gstType === 'IGST'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-hive-500/10 text-hive-400 border-hive-500/20'
                          }`}>{o.gstType}</span>
                        </td>
                        <td className={`${cx.td} text-right font-mono text-xs text-dark-400`}>{fmt(o.cgst)}</td>
                        <td className={`${cx.td} text-right font-mono text-xs text-dark-400`}>{fmt(o.sgst)}</td>
                        <td className={`${cx.td} text-right font-mono text-xs text-dark-400`}>{fmt(o.igst)}</td>
                        <td className={`${cx.td} text-right font-mono text-xs text-green-400`}>{fmt(o.totalTax)}</td>
                        <td className={`${cx.td} text-right font-mono text-xs font-bold text-white`}>{fmt(o.totalValue)}</td>
                        <td className={`${cx.td} font-mono text-xs ${o.ewayBill !== '—' ? 'text-green-400' : 'text-dark-600'}`}>
                          {o.ewayBill}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="bg-dark-800">
                      <td colSpan={4} className="px-4 py-3 text-xs font-bold text-white">TOTAL</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-white">{fmt(summary.totalTaxable)}</td>
                      <td/>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-hive-400">{fmt(summary.totalCGST)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-hive-400">{fmt(summary.totalSGST)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-amber-400">{fmt(summary.totalIGST)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-green-400">{fmt(summary.totalTax)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-white">{fmt(summary.totalValue)}</td>
                      <td/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Filing note */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-1">GST Filing Note</p>
            <p className="text-xs text-dark-400">
              CGST + SGST applies to intrastate sales (buyer in Haryana). IGST applies to interstate sales.
              E-way bill is mandatory for consignments above ₹50,000. File GSTR-1 by 11th of next month.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default GSTReport;
