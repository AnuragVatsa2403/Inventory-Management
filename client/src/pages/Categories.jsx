import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const cx = {
  input:  'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600',
  label:  'block text-[10px] font-mono text-dark-400 tracking-widest uppercase mb-1.5',
  th:     'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:     'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP:   'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
  btnR:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition',
};


const SUGGESTED_CATEGORIES = [
  { name: 'Polyolefins',       description: 'PE, PP polymer grades' },
  { name: 'PVC & Vinyl',       description: 'PVC resin, compounds, plasticisers' },
  { name: 'Engineering Plastics', description: 'ABS, PET, Nylon, Acrylic' },
  { name: 'Masterbatch',       description: 'Colour and additive masterbatches' },
  { name: 'Packaging Material',description: 'PP bags, HDPE woven sacks, stretch film' },
  { name: 'Finished Chips',    description: 'Processed plastic chip output' },
  { name: 'Consumables',       description: 'Utility items, machine spares' },
];

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
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

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ name: '', description: '' });
  const [editing, setEditing]       = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then(r => setCategories(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd  = () => { setForm({ name: '', description: '' }); setEditing(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditing(c._id); setModal(true); };
  const applySuggestion = (s) => { setForm({ name: s.name, description: s.description }); setShowSuggestions(false); };

  const handleSave = async () => {
    try {
      editing
        ? await api.put(`/categories/${editing}`, form)
        : await api.post('/categories', form);
      setModal(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || 'Error saving category'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this category? Products linked to it will become uncategorised.')) return;
    try { await api.delete(`/categories/${id}`); fetchCategories(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Categories</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            {categories.length} active · polymer & material groups
          </p>
        </div>
        <button className={cx.btnP} onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? <Spinner /> : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">◉</span>
            <span className="text-sm mb-4">No categories yet — add your polymer groups</span>
            <button className={cx.btnG} onClick={openAdd}>+ Add First Category</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className={cx.th}>#</th>
                <th className={cx.th}>Category Name</th>
                <th className={cx.th}>Description</th>
                <th className={cx.th}>Created</th>
                <th className={cx.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c._id} className="hover:bg-dark-800/40 transition">
                  <td className={`${cx.td} font-mono text-dark-600 text-xs`}>{String(i + 1).padStart(2, '0')}</td>
                  <td className={`${cx.td} font-semibold text-white`}>{c.name}</td>
                  <td className={`${cx.td} text-dark-400`}>{c.description || '—'}</td>
                  <td className={`${cx.td} font-mono text-dark-400 text-xs`}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={cx.td}>
                    <div className="flex gap-2">
                      <button className={cx.btnG} onClick={() => openEdit(c)}>Edit</button>
                      <button className={cx.btnR} onClick={() => handleDelete(c._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cx.label}>Category Name *</label>
                <input
                  className={cx.input}
                  placeholder="e.g. Polyolefins, Finished Chips…"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className={cx.label}>Description</label>
                <input
                  className={cx.input}
                  placeholder="Brief description of what this group covers"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {!editing && (
                <div>
                  <button
                    className="text-[10px] font-mono text-hive-400 hover:text-hive-300 transition"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  >
                    {showSuggestions ? '▴ Hide suggestions' : '▾ Pick from suggested categories'}
                  </button>
                  {showSuggestions && (
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                      {SUGGESTED_CATEGORIES.map(s => (
                        <button
                          key={s.name}
                          onClick={() => applySuggestion(s)}
                          className="w-full text-left px-3 py-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg transition"
                        >
                          <div className="text-xs font-semibold text-dark-100">{s.name}</div>
                          <div className="text-[10px] font-mono text-dark-500 mt-0.5">{s.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(false)}>Cancel</button>
              <button className={cx.btnP} onClick={handleSave}>Save Category</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
