const appUrl = process.env.APP_URL ?? "https://athena-pov.com";

export function welcomeEmailHtml({ displayName }: { displayName: string }) {
  return {
    subject: "Welcome to Athena!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding:40px 32px;text-align:center;">
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Welcome to Athena, ${displayName}!</h1>
        <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">
          You're all set to start your SAT prep journey. Athena uses AI-powered lessons, quizzes, and tutoring to help you reach your target score.
        </p>
        <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
          Go to Dashboard
        </a>
        <p style="margin:24px 0 0;font-size:14px;color:#9ca3af;">
          If you have any questions, just open the Mentor chat in the app.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

export function sessionReminderHtml({
  displayName,
  startTime,
}: {
  displayName: string;
  startTime: string;
}) {
  return {
    subject: `Your study session starts at ${startTime}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding:40px 32px;text-align:center;">
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Hey ${displayName}!</h1>
        <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">
          Your study session is coming up at <strong>${startTime}</strong>. Jump in and keep your streak going!
        </p>
        <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
          Start Session
        </a>
        <p style="margin:24px 0 0;font-size:14px;color:#9ca3af;">
          Consistency is the key to SAT success. You've got this!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
