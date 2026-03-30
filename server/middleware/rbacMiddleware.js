

const PERMISSIONS = {
  admin: [
    'view:dashboard', 'view:products', 'view:categories', 'view:suppliers', 'view:production', 'view:reports',
    'view:orders', 'view:sales', 'view:alerts', 'view:users',
    'create:products', 'create:categories', 'create:suppliers',
    'create:orders', 'create:sales',
    'edit:products', 'edit:categories', 'edit:suppliers',
    'edit:orders', 'edit:sales', 'edit:users',
    'delete:products', 'delete:categories', 'delete:suppliers',
    'delete:orders', 'delete:sales',
    'receive:orders', 'dispatch:sales',
    'manage:alerts', 'manage:reorder', 'generate:pdf',
  ],

  orders: [
    'view:dashboard', 'view:products', 'view:categories',
    'view:suppliers', 'view:orders', 'view:alerts',
    'create:orders', 'edit:orders', 'receive:orders',
    'manage:alerts', 'generate:pdf',
  ],

  sales: [
    'view:dashboard', 'view:products', 'view:categories',
    'view:sales', 'view:alerts',
    'create:sales', 'edit:sales', 'dispatch:sales',
    'manage:alerts', 'generate:pdf',
  ],


  manager: [
    'view:dashboard', 'view:products', 'view:categories',
    'view:suppliers', 'view:orders', 'view:sales', 'view:alerts',
    'create:products', 'create:categories', 'create:suppliers',
    'create:orders', 'create:sales',
    'edit:products', 'edit:categories', 'edit:suppliers',
    'edit:orders', 'edit:sales',
    'delete:products', 'delete:categories', 'delete:suppliers',
    'receive:orders', 'dispatch:sales',
    'manage:alerts', 'manage:reorder', 'generate:pdf',
  ],


  staff: [
    'view:dashboard', 'view:products', 'view:categories',
    'view:suppliers', 'view:orders', 'view:sales', 'view:alerts',
  ],
};


const authorize = (...requiredPerms) => (req, res, next) => {
  const role     = req.user?.role;
  const userPerms = PERMISSIONS[role] || [];
  const hasAll   = requiredPerms.every(p => userPerms.includes(p));

  if (!role)   return res.status(401).json({ message: 'Not authenticated' });
  if (!hasAll) return res.status(403).json({
    message: `Access denied — role "${role}" lacks: ${requiredPerms.join(', ')}`,
  });

  next();
};

const getPermissions  = (role) => PERMISSIONS[role] || [];
const attachPermissions = (req, res, next) => {
  req.permissions = PERMISSIONS[req.user?.role] || [];
  next();
};

module.exports = { authorize, attachPermissions, getPermissions, PERMISSIONS };
