import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEscalationEmail = async (complaint, pdfPath) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email service not configured, skipping email notification');
    return { message: 'Email service not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.WARD_OFFICER_EMAILS || 'admin@neighbourfix.local',
    subject: `URGENT: Civic Complaint Escalated - Ward ${complaint.wardNumber}`,
    html: `
      <h2>Official Complaint Escalation</h2>
      <p>A complaint has received ${complaint.upvotes} upvotes and requires immediate attention.</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Ward:</strong> ${complaint.wardNumber}</p>
      <p><strong>Description:</strong> ${complaint.description}</p>
      <p>Please find the official complaint letter attached.</p>
      <br>
      <p>View on NeighbourFix: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/complaint/${complaint._id}</p>
    `,
    attachments: pdfPath ? [
      {
        filename: `complaint-${complaint._id}.pdf`,
        path: pdfPath
      }
    ] : []
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending escalation email:', error.message);
    throw error;
  }
};

export default { sendEscalationEmail };