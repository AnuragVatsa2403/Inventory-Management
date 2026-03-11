const { runStockAlertScan }    = require('./alertService');
const { runReorderAutomation } = require('./reorderService');
const { sendLowStockEmail }    = require('./emailService');

let intervalId = null;

const startAlertScheduler = (intervalMinutes = 30) => {
  const ms = intervalMinutes * 60 * 1000;
  console.log(`  Scheduler → alert scan every ${intervalMinutes} min`);

  
  runScan();
  intervalId = setInterval(runScan, ms);
};

const runScan = async () => {
  console.log(`[Scheduler] Stock scan — ${new Date().toISOString()}`);
  try {
    const results = await runStockAlertScan();
    console.log(
      `[Scheduler] Done — scanned: ${results.scanned}, ` +
      `alerts: ${results.created} (${results.critical} critical, ${results.warnings} warnings), ` +
      `resolved: ${results.resolved}`
    );

 
    if (results.created > 0 && process.env.SMTP_USER) {
      const Alert = require('../models/Alert');
      const freshAlerts = await Alert.find({ isResolved: false })
        .populate('itemId', 'itemName unit')
        .sort({ severity: 1 })
        .limit(20);
      sendLowStockEmail(freshAlerts).catch(console.error);
    }


    if (process.env.AUTO_REORDER === 'true') {
      const r = await runReorderAutomation();
      console.log(`[Scheduler] Reorder — created: ${r.created}, skipped: ${r.skipped}`);
    }
  } catch (err) {
    console.error('[Scheduler] Scan error:', err.message);
  }
};

const stopAlertScheduler = () => {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  console.log('[Scheduler] Stopped');
};

module.exports = { startAlertScheduler, stopAlertScheduler, runScan };
