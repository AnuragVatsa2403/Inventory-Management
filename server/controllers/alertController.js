const Alert = require('../models/Alert');
const { runStockAlertScan, checkProductAlert } = require('../services/alertService');


const getAlerts = async (req, res) => {
  try {
    const { isRead, severity, isResolved = 'false', limit = 50 } = req.query;
    const filter = {};

    if (isRead     !== undefined) filter.isRead     = isRead === 'true';
    if (severity)                 filter.severity   = severity;
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';

    const alerts = await Alert.find(filter)
      .populate('itemId', 'itemName itemType unit department lowStockThreshold')
      .sort({ severity: 1, createdAt: -1 }) 
      .limit(Number(limit));

    const unreadCount = await Alert.countDocuments({ isRead: false, isResolved: false });
    const criticalCount = await Alert.countDocuments({ severity: 'critical', isResolved: false });

    res.json({ alerts, unreadCount, criticalCount, total: alerts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const markRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id, { isRead: true }, { new: true }
    ).populate('itemId', 'itemName');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const markAllRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false, isResolved: false }, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    ).populate('itemId', 'itemName');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const triggerScan = async (req, res) => {
  try {
    const results = await runStockAlertScan();
    res.json({ message: 'Stock scan complete', results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkProduct = async (req, res) => {
  try {
    await checkProductAlert(req.params.productId);
    res.json({ message: 'Product alert check complete' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAlertSummary = async (req, res) => {
  try {
    const [total, unread, critical, resolved] = await Promise.all([
      Alert.countDocuments({ isResolved: false }),
      Alert.countDocuments({ isRead: false, isResolved: false }),
      Alert.countDocuments({ severity: 'critical', isResolved: false }),
      Alert.countDocuments({ isResolved: true }),
    ]);
    res.json({ total, unread, critical, warnings: total - critical, resolved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAlerts, markRead, markAllRead, resolveAlert, triggerScan, checkProduct, getAlertSummary };
