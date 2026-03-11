const User = require('../models/User');
const { getPermissions } = require('../middleware/rbacMiddleware');
const jwt = require('jsonwebtoken');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).sort('name');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createUser = async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateUser = async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot deactivate yourself' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyPermissions = (req, res) => {
  const perms = getPermissions(req.user.role);
  res.json({ role: req.user.role, permissions: perms });
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getMyPermissions };
