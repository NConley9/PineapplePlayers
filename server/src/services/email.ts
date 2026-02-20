import nodemailer from 'nodemailer';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'nick@nickconley.com';

// Transporter — configure with real SMTP when provider is chosen
// For now, logs to console in development
function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Dev fallback — just log
  return null;
}

export async function sendSuggestionEmail(
  cardType: string,
  cardText: string,
  expansion?: string
): Promise<void> {
  const transporter = getTransporter();

  const subject = `🍍 New Card Suggestion: ${cardType}`;
  const body = [
    `A new card has been suggested for Pineapple Players:`,
    ``,
    `Type: ${cardType}`,
    `Text: ${cardText}`,
    `Suggested Expansion: ${expansion || 'Not specified'}`,
    ``,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');

  if (!transporter) {
    console.log('[DEV EMAIL]', subject);
    console.log(body);
    return;
  }

  await transporter.sendMail({
    from: `"Pineapple Players" <noreply@pineappleplayers.com>`,
    to: NOTIFY_EMAIL,
    subject,
    text: body,
  });
}
