import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockhive_user')); }
    catch { return null; }
  });
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);


  const loadPermissions = useCallback(() => {
    if (!user) { setPermissions([]); return; }
    setPermLoading(true);
    api.get('/users/me/permissions')
      .then(r => setPermissions(r.data.permissions || []))
      .catch(() => setPermissions([]))
      .finally(() => setPermLoading(false));
  }, [user]);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  const login = (userData, token) => {
    localStorage.setItem('stockhive_token', token);
    localStorage.setItem('stockhive_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('stockhive_token');
    localStorage.removeItem('stockhive_user');
    setUser(null);
    setPermissions([]);
  };


  const can    = (permission)  => permissions.includes(permission);
  const hasAny = (...perms)    => perms.some(p => permissions.includes(p));
  const hasAll = (...perms)    => perms.every(p => permissions.includes(p));
  const isRole = (role)        => user?.role === role;
  const isAdmin = ()           => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      permLoading,
      login,
      logout,
      can,
      hasAny,
      hasAll,
      isRole,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
