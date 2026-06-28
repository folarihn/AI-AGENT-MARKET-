export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'AgentMarket <noreply@agentmarket.dev>';

function logToConsole(payload: EmailPayload): void {
  console.log(
    '\n[EMAIL — dev console fallback]\n' +
    'To:      ' + payload.to + '\n' +
    'Subject: ' + payload.subject + '\n' +
    '---\n' + payload.html.replace(/<[^>]+>/g, '') + '\n---\n'
  );
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Resend API error: ' + res.status + ' ' + body);
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(payload);
    } else {
      logToConsole(payload);
    }
  } catch (err) {
    console.error('[email] Failed to send email to ' + payload.to + ':', err);
  }
}

export function verificationEmail(opts: {
  name: string;
  verifyUrl: string;
}): Pick<EmailPayload, 'subject' | 'html'> {
  return {
    subject: 'Verify your email for AgentMarket',
    html:
      '<h2>Welcome' + (opts.name ? ', ' + opts.name : '') + '!</h2>' +
      '<p>Confirm your email address to finish setting up your AgentMarket account.</p>' +
      '<p style="margin:24px 0;">' +
      '<a href="' + opts.verifyUrl + '" style="background:#6a5acd;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Verify email</a>' +
      '</p>' +
      '<p style="color:#6b7280;font-size:13px;">Or paste this link into your browser:<br/>' + opts.verifyUrl + '</p>' +
      '<p style="color:#6b7280;font-size:12px;">This link expires in 24 hours. If you didn&rsquo;t create an account, you can ignore this email.</p>',
  };
}

export function agentApprovedEmail(opts: {
  creatorName: string;
  agentName: string;
  agentSlug: string;
  siteUrl: string;
}): Pick<EmailPayload, 'subject' | 'html'> {
  const url = opts.siteUrl + '/agent/' + opts.agentSlug;
  return {
    subject: 'Your agent "' + opts.agentName + '" has been approved!',
    html:
      '<h2>Great news, ' + opts.creatorName + '!</h2>' +
      '<p>Your agent <strong>' + opts.agentName + '</strong> has been reviewed and is now <strong>live</strong> on AgentMarket.</p>' +
      '<p><a href="' + url + '">View your listing</a></p>' +
      '<p>Thank you for contributing to the marketplace.</p>' +
      '<p style="color:#6b7280;font-size:12px;">AgentMarket &mdash; Safe, verified AI agents</p>',
  };
}

export function agentRejectedEmail(opts: {
  creatorName: string;
  agentName: string;
  reason?: string;
  siteUrl: string;
}): Pick<EmailPayload, 'subject' | 'html'> {
  return {
    subject: 'Action needed: "' + opts.agentName + '" was not approved',
    html:
      '<h2>Hi ' + opts.creatorName + ',</h2>' +
      '<p>After review, your agent <strong>' + opts.agentName + '</strong> was not approved for the marketplace.</p>' +
      (opts.reason
        ? '<p><strong>Reason:</strong> ' + opts.reason + '</p>'
        : '') +
      '<p>Please address the issues above and re-submit a new version from your Creator Dashboard.</p>' +
      '<p style="color:#6b7280;font-size:12px;">AgentMarket &mdash; Safe, verified AI agents</p>',
  };
}
