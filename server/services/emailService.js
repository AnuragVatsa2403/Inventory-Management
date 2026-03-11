const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const FROM = process.env.SMTP_FROM || '"InvenTrack Alerts" <alerts@inventrck.com>';


const sendLowStockEmail = async (alerts) => {
  if (!process.env.SMTP_USER) {
    console.log('[Email] SMTP not configured — skipping email');
    return;
  }
  if (!alerts || alerts.length === 0) return;

  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');

  const rows = alerts.map(a => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;font-weight:600;">${a.itemId?.itemName || 'Unknown'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;font-family:monospace;">${a.availableQty ?? 0} ${a.itemId?.unit || 'units'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;font-family:monospace;">${a.threshold}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;">
        <span style="background:${a.severity === 'critical' ? '#7f1d1d' : '#78350f'};color:${a.severity === 'critical' ? '#ef4444' : '#f59e0b'};padding:2px 8px;border-radius:2px;font-size:11px;font-family:monospace;">
          ${a.severity.toUpperCase()}
        </span>
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#0f1117;color:#e2e8f8;padding:32px;max-width:600px;margin:0 auto;border-radius:8px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <div style="background:#3d7eff;color:#fff;width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">IV</div>
        <div>
          <div style="font-size:16px;font-weight:700;">InvenTrack Alert</div>
          <div style="font-size:11px;color:#7a88b0;font-family:monospace;letter-spacing:0.1em;">STOCK ALERT NOTIFICATION</div>
        </div>
      </div>

      <div style="background:${critical.length > 0 ? '#7f1d1d' : '#78350f'};border:1px solid ${critical.length > 0 ? '#ef4444' : '#f59e0b'};border-radius:6px;padding:14px 16px;margin-bottom:24px;">
        <strong style="color:${critical.length > 0 ? '#ef4444' : '#f59e0b'};">
          ${critical.length > 0 ? '⚠ CRITICAL' : '⚠ WARNING'}: ${alerts.length} stock alert${alerts.length > 1 ? 's' : ''} require attention
        </strong>
        <div style="color:#e2e8f8;font-size:13px;margin-top:4px;">
          ${critical.length} critical · ${warnings.length} warnings
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;background:#181c27;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#1e2436;">
            <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#7a88b0;">PRODUCT</th>
            <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#7a88b0;">AVAILABLE</th>
            <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#7a88b0;">THRESHOLD</th>
            <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#7a88b0;">SEVERITY</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e2436;font-size:11px;color:#4a5580;font-family:monospace;">
        Sent by InvenTrack · ${new Date().toLocaleString()} · Auto-generated alert
      </div>
    </div>
  `;

  const to = process.env.ALERT_EMAIL_RECIPIENTS || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `[InvenTrack] ${critical.length > 0 ? '🔴 CRITICAL' : '⚠ WARNING'}: ${alerts.length} Stock Alert${alerts.length > 1 ? 's' : ''}`,
    html,
  });

  console.log(`[Email] Alert email sent to ${to} — ${alerts.length} alerts`);
};

const sendReorderEmail = async (orders) => {
  if (!process.env.SMTP_USER || !orders?.length) return;

  const rows = orders.map(o => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;font-weight:600;">${o.product}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;">${o.supplier}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2436;font-family:monospace;">${o.quantity}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#0f1117;color:#e2e8f8;padding:32px;max-width:600px;margin:0 auto;border-radius:8px;">
      <div style="margin-bottom:20px;font-size:16px;font-weight:700;">🔄 Auto-Reorder Triggered</div>
      <p style="color:#7a88b0;margin-bottom:16px;">The following Purchase Orders were automatically created due to low stock levels:</p>
      <table style="width:100%;border-collapse:collapse;background:#181c27;border-radius:6px;">
        <thead><tr style="background:#1e2436;">
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;color:#7a88b0;">PRODUCT</th>
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;color:#7a88b0;">SUPPLIER</th>
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:10px;color:#7a88b0;">QTY ORDERED</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:12px;color:#4a5580;font-family:monospace;">Please review and approve these orders in InvenTrack.</p>
    </div>
  `;

  const to = process.env.ALERT_EMAIL_RECIPIENTS || process.env.SMTP_USER;
  await getTransporter().sendMail({
    from: FROM, to,
    subject: `[InvenTrack] 🔄 ${orders.length} Auto-Reorder PO${orders.length > 1 ? 's' : ''} Created`,
    html,
  });
  console.log(`[Email] Reorder email sent — ${orders.length} POs`);
};

module.exports = { sendLowStockEmail, sendReorderEmail };
