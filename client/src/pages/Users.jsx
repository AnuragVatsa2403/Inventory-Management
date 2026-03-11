import React from 'react';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const cx = {
  input:  'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 focus:ring-1 focus:ring-hive-500/30 transition placeholder-dark-600',
  select: 'w-full bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-hive-500 transition',
  label:  'block text-[10px] font-mono text-dark-400 tracking-widest uppercase mb-1.5',
  th:     'text-left px-4 py-2.5 text-[9px] font-mono text-dark-500 tracking-widest uppercase border-b border-dark-800',
  td:     'px-4 py-3 text-sm text-dark-200 border-b border-dark-800/50',
  btnP:   'inline-flex items-center gap-1.5 px-4 py-2 bg-hive-500 hover:bg-hive-400 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-hive-500/20',
  btnG:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium rounded-lg border border-dark-700 transition',
  btnR:   'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition',
};

const ROLES = [
  {
    value:   'admin',
    label:   'Admin',
    color:   'red',
    perms:   ['Full system access', 'User management', 'All modules', 'Alerts & auto-reorder'],
    desc:    'Complete control over StockHive',
  },
  {
    value:   'orders',
    label:   'Purchase / Stores',
    color:   'blue',
    perms:   ['View materials', 'Create & edit POs', 'Record GRNs', 'No sales access'],
    desc:    'Raw material procurement & receiving',
  },
  {
    value:   'sales',
    label:   'Sales / Dispatch',
    color:   'green',
    perms:   ['View products', 'Create sales orders', 'Dispatch chips', 'Generate invoices'],
    desc:    'Finished goods sales & dispatch',
  },
  {
    value:   'manager',
    label:   'Plant Manager',
    color:   'amber',
    perms:   ['All operations access', 'View reports', 'Approve reorders', 'No user management'],
    desc:    'Full ops visibility, no admin rights',
  },
  {
    value:   'staff',
    label:   'Staff / Viewer',
    color:   'gray',
    perms:   ['Read-only access', 'View stock levels', 'No create / edit / delete'],
    desc:    'View-only for floor staff',
  },
];

const DEPARTMENTS = [
  'Management',
  'Raw Materials / Stores',
  'Production',
  'Finished Goods',
  'Sales & Marketing',
  'Dispatch & Logistics',
  'Quality Control',
  'Accounts',
  'IT',
];

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

const roleColor = (r) => ({ admin: 'red', orders: 'blue', sales: 'green', manager: 'amber', staff: 'gray' }[r] || 'gray');
const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r;

const Users = () => {
  const { user: me, can } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'staff', department: '' });
  const [editing, setEditing] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'staff', department: '' });
    setEditing(null);
    setSelectedRole(ROLES.find(r => r.value === 'staff'));
    setModal(true);
  };
  const openEdit = (u) => {
    setForm({ ...u, password: '' });
    setEditing(u._id);
    setSelectedRole(ROLES.find(r => r.value === u.role));
    setModal(true);
  };

  const handleRoleChange = (val) => {
    setForm(f => ({ ...f, role: val }));
    setSelectedRole(ROLES.find(r => r.value === val));
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      editing ? await api.put(`/users/${editing}`, payload) : await api.post('/users', payload);
      setModal(false);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Error saving user'); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user? They will lose access to StockHive.')) return;
    try { await api.delete(`/users/${id}`); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  if (!can('view:users')) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-dark-500">
      <span className="text-5xl">🔒</span>
      <span className="text-base font-semibold text-dark-300">Access Denied</span>
      <span className="text-sm">Your role does not have permission to manage users.</span>
    </div>
  );

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-[10px] font-mono text-dark-500 tracking-widest uppercase mt-0.5">
            Role-based access control · {users.length} users · Polytime Industries
          </p>
        </div>
        {can('edit:users') && (
          <button className={cx.btnP} onClick={openAdd}>+ Add User</button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-dark-900 border border-dark-800 rounded-xl p-3 hover:border-dark-700 transition">
            <div className="mb-2"><Badge color={r.color}>{r.label}</Badge></div>
            <div className="text-[10px] text-dark-500 mb-2">{r.desc}</div>
            <div className="space-y-0.5">
              {r.perms.map(p => (
                <div key={p} className="text-[9px] font-mono text-dark-600">· {p}</div>
              ))}
            </div>
            <div className="mt-2 text-[10px] font-mono text-dark-600">
              {users.filter(u => u.role === r.value).length} user(s)
            </div>
          </div>
        ))}
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? <Spinner /> : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <span className="text-4xl mb-3">◑</span>
            <span className="text-sm">No users found</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className={cx.th}>Name</th>
                <th className={cx.th}>Email</th>
                <th className={cx.th}>Role</th>
                <th className={cx.th}>Department</th>
                <th className={cx.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="hover:bg-dark-800/40 transition">
                  <td className={`${cx.td} font-semibold text-white`}>
                    {u.name}
                    {u._id === me?._id && (
                      <span className="ml-2 text-[9px] font-mono bg-hive-500/20 text-hive-400 border border-hive-500/30 px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className={`${cx.td} font-mono text-dark-400 text-xs`}>{u.email}</td>
                  <td className={cx.td}>
                    <Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                  </td>
                  <td className={`${cx.td} text-dark-400`}>{u.department || '—'}</td>
                  <td className={cx.td}>
                    {can('edit:users') && u._id !== me?._id && (
                      <div className="flex gap-2">
                        <button className={cx.btnG} onClick={() => openEdit(u)}>Edit</button>
                        <button className={cx.btnR} onClick={() => handleDeactivate(u._id)}>Deactivate</button>
                      </div>
                    )}
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
            className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editing ? 'Edit User' : 'Add User'}
              </h2>
              <button className="text-dark-400 hover:text-white text-lg" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Full Name *</label>
                  <input
                    className={cx.input}
                    placeholder="e.g. Rahul Verma"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Email *</label>
                  <input
                    className={cx.input}
                    type="email"
                    placeholder="user@polytime.in"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    disabled={!!editing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input
                    className={cx.input}
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className={cx.label}>Department</label>
                  <select
                    className={cx.select}
                    value={form.department || ''}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={cx.label}>Role *</label>
                <select
                  className={cx.select}
                  value={form.role}
                  onChange={e => handleRoleChange(e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>

              {selectedRole && (
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-3">
                  <div className="text-[9px] font-mono text-dark-500 tracking-widest uppercase mb-2">
                    Access Preview — {selectedRole.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole.perms.map(p => (
                      <Badge key={p} color={roleColor(selectedRole.value)}>{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className={cx.btnG} onClick={() => setModal(false)}>Cancel</button>
              <button className={cx.btnP} onClick={handleSave}>Save User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
