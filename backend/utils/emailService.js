import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const categoryLabels = {
  road: '🛣️ Road',
  water: '💧 Water',
  garbage: '🗑️ Garbage',
  drainage: '🚿 Drainage',
  power: '⚡ Power',
  other: '📋 Other',
};

function buildEmailHTML(complaint) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const complaintUrl = `${frontendUrl}/complaint/${complaint._id}`;
  const catLabel = categoryLabels[complaint.category] || complaint.category;
  const reportedDate = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const escalatedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1c1410;border-radius:12px 12px 0 0;padding:28px 32px;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em;">
            📍 <span style="background:linear-gradient(90deg,#f97316,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">NeighbourFix</span>
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.5);">Hyperlocal Civic Complaint Tracker</p>
        </td></tr>

        <!-- Alert Banner -->
        <tr><td style="background:#e8500a;padding:18px 32px;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#fff;">
            🚨 URGENT: Civic Complaint Escalated — Ward ${complaint.wardNumber}
          </p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.8);">
            This complaint has reached ${complaint.upvotes} community upvotes and requires immediate attention.
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:24px;border-bottom:1px solid #e2dbd3;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Complaint Title</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#1c1410;">${complaint.title}</p>
              </td>
            </tr>
          </table>

          <!-- Details Grid -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td width="50%" style="padding:12px 16px;background:#f5f2ee;border-radius:8px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Category</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#1c1410;">${catLabel}</p>
              </td>
              <td width="4px"></td>
              <td width="50%" style="padding:12px 16px;background:#f5f2ee;border-radius:8px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Ward Number</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#1c1410;">Ward ${complaint.wardNumber}</p>
              </td>
            </tr>
            <tr><td colspan="3" style="height:8px;"></td></tr>
            <tr>
              <td width="50%" style="padding:12px 16px;background:#fef0ed;border-radius:8px;vertical-align:top;border:1px solid #fcd5c5;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Community Upvotes</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#e8500a;">▲ ${complaint.upvotes}</p>
              </td>
              <td width="4px"></td>
              <td width="50%" style="padding:12px 16px;background:#f5f2ee;border-radius:8px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Date Reported</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#1c1410;">${reportedDate}</p>
              </td>
            </tr>
          </table>

          <!-- Location -->
          <div style="margin:0 0 20px;padding:14px 16px;background:#f5f2ee;border-radius:8px;border-left:3px solid #e8500a;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Location</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1c1410;">📍 ${complaint.address || `Ward ${complaint.wardNumber}`}</p>
            ${complaint.location?.coordinates ? `<p style="margin:4px 0 0;font-size:12px;color:#7a6a5c;font-family:monospace;">GPS: ${complaint.location.coordinates[1].toFixed(5)}, ${complaint.location.coordinates[0].toFixed(5)}</p>` : ''}
          </div>

          <!-- Description -->
          <div style="margin:0 0 28px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#7a6a5c;text-transform:uppercase;letter-spacing:.06em;">Issue Description</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#44382e;background:#f9f7f4;padding:14px 16px;border-radius:8px;">${complaint.description}</p>
          </div>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 28px;">
              <a href="${complaintUrl}"
                style="display:inline-block;background:#e8500a;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:-.01em;">
                View Full Complaint →
              </a>
            </td></tr>
          </table>

          <!-- Notice -->
          <div style="padding:14px 16px;background:#fef0ed;border-radius:8px;border:1px solid #fcd5c5;">
            <p style="margin:0;font-size:13px;color:#b83c10;line-height:1.6;">
              <strong>Action Required:</strong> This complaint has been formally escalated by the NeighbourFix community. The attached PDF contains the official complaint letter. Please investigate and update the complaint status at your earliest convenience.
            </p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f2ee;border-radius:0 0 12px 12px;padding:20px 32px;border-top:1px solid #e2dbd3;">
          <p style="margin:0;font-size:12px;color:#7a6a5c;text-align:center;">
            Escalated on ${escalatedDate} · NeighbourFix — Hyperlocal Civic Complaint Tracker<br/>
            <a href="${frontendUrl}" style="color:#e8500a;">${frontendUrl}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const sendEscalationEmail = async (complaint, pdfPath) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email service not configured, skipping email notification');
    return { message: 'Email service not configured' };
  }

  const recipients = process.env.WARD_OFFICER_EMAILS || 'admin@neighbourfix.local';

  const mailOptions = {
    from: `"NeighbourFix Alerts" <${process.env.EMAIL_USER}>`,
    to: recipients,
    subject: `🚨 URGENT: Civic Complaint Escalated — Ward ${complaint.wardNumber} (${complaint.upvotes} upvotes)`,
    html: buildEmailHTML(complaint),
    attachments: pdfPath ? [{
      filename: `complaint-${complaint._id}.pdf`,
      path: pdfPath,
    }] : [],
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Escalation email sent to ${recipients}`);
    return result;
  } catch (error) {
    console.error('Error sending escalation email:', error.message);
    throw error;
  }
};

export const sendTestEmail = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are not configured');
  }

  const recipients = process.env.WARD_OFFICER_EMAILS || process.env.EMAIL_USER;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"NeighbourFix Alerts" <${process.env.EMAIL_USER}>`,
    to: recipients,
    subject: '✅ NeighbourFix — Email Configuration Test',
    html: `<!DOCTYPE html>
<html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f2ee;margin:0;padding:32px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background:#1c1410;border-radius:12px 12px 0 0;padding:28px 32px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">📍 NeighbourFix</p>
    </td></tr>
    <tr><td style="background:#16a34a;padding:18px 32px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">✅ Email Configuration is Working!</p>
    </td></tr>
    <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
      <p style="font-size:15px;color:#1c1410;">Your email service is correctly configured. Escalation emails will be sent to <strong>${recipients}</strong> when complaints reach the upvote threshold.</p>
      <p style="font-size:13px;color:#7a6a5c;">Sent from: ${process.env.EMAIL_USER}<br/>App URL: <a href="${frontendUrl}" style="color:#e8500a;">${frontendUrl}</a></p>
    </td></tr>
  </table>
</body></html>`,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`Test email sent to ${recipients}`);
  return { success: true, sentTo: recipients, messageId: result.messageId };
};

export default { sendEscalationEmail, sendTestEmail };
