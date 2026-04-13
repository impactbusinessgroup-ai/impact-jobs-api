// api/cron.js
// Runs every minute via cron-job.org
// Checks Upstash Redis for sessions inactive 10+ minutes and fires alert emails

const nodemailer = require('nodemailer');

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- Upstash Redis helpers using REST API directly ---
async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  try {
    let value = data.result;
    while (typeof value === 'string') {
      value = JSON.parse(value);
    }
    // Unwrap outer {value, ex} wrapper if present
    if (value && typeof value.value === 'string') {
      value = JSON.parse(value.value);
    }
    return value;
  } catch (e) {
    console.error('redisGet parse error:', e.message);
    return null;
  }
}

async function redisSet(key, value, exSeconds) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: exSeconds }),
  });
}

async function redisKeys(pattern) {
  const url = `${process.env.KV_REST_API_URL}/keys/${encodeURIComponent(pattern)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  return data.result || [];
}

// --- Send alert email via Gmail ---
async function sendAlert(subscriber, pages) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const name = `${subscriber.merge_fields.FNAME} ${subscriber.merge_fields.LNAME}`.trim() || subscriber.email_address;
  const company = subscriber.merge_fields.COMPANY || 'Unknown Company';
  const title = subscriber.merge_fields.JOBTITLE || '';
  const accountManager = subscriber.merge_fields.REPNAME || '';
  const email = subscriber.email_address || '';
  const phone = subscriber.merge_fields.PHNUMBER || '';

  // Clean cid parameter from page URLs
  const cleanPages = pages.map(p => ({
    ...p,
    page: p.page.replace(/[?&]cid=[^&]*/g, '')
  }));

  const pageList = cleanPages
    .map(p => `<li><a href="https://www.impactbusinessgroup.com${p.page}" style="color:#1A4EA2;">${'https://www.impactbusinessgroup.com' + p.page}</a> &mdash; ${new Date(p.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}</li>`)
    .join('');

  const html = `
    <h2>Client Visit Alert</h2>
    <p>
      <strong>${name}</strong>${title ? `, ${title}` : ''}<br>
      ${company}<br>
      ${email ? `Email: <a href="mailto:${email}">${email}</a><br>` : ''}
      ${phone ? `Phone: ${phone}<br>` : ''}
      ${accountManager ? `Account Manager: ${accountManager}` : ''}
    </p>
    <h3>Pages visited:</h3>
    <ul>${pageList}</ul>
    <p style="color:#999;font-size:12px;">iMPact client tracker &mdash; ${new Date().toLocaleDateString()}</p>
  `;

const repEmail = subscriber.merge_fields.REPEMAIL || '';

  await transporter.sendMail({
    from: `"iMPact Tracker" <${process.env.GMAIL_USER}>`,
    to: repEmail || 'info@impactbusinessgroup.com',
    cc: repEmail ? 'info@impactbusinessgroup.com' : '',
    subject: `Client Visit: ${name} (${company})`,
    html,
  });
}

// --- Round robin config ---
const ROUND_ROBIN = {
  engineering: ['Paul Kujawski', 'Dan Teliczan', 'Steve Betteley', 'Doug Koetsier'],
  it: ['Doug Koetsier', 'Jamie Drajka', 'Dan Teliczan', 'Curt Willbrandt', 'Trish Wangler', 'Steve Betteley'],
  accounting: ['Lauren Sylvester', 'Matt Peal'],
  other: ['Lauren Sylvester', 'Trish Wangler'],
};
const TAMPA_AMS = ['Mark Herman', 'Drew Bentsen'];
const ESCALATION_AM = 'Matt Peal';

const AM_EMAIL_MAP = {
  'Doug Koetsier': 'dkoetsier@impactbusinessgroup.com',
  'Paul Kujawski': 'pkujawski@impactbusinessgroup.com',
  'Matt Peal': 'mpeal@impactbusinessgroup.com',
  'Lauren Sylvester': 'lsylvester@impactbusinessgroup.com',
  'Dan Teliczan': 'dteliczan@impactbusinessgroup.com',
  'Curt Willbrandt': 'cwillbrandt@impactbusinessgroup.com',
  'Trish Wangler': 'twangler@impactbusinessgroup.com',
  'Mark Herman': 'mherman@impactbusinessgroup.com',
  'Jamie Drajka': 'jdrajka@impactbusinessgroup.com',
  'Drew Bentsen': 'dbentsen@impactbusinessgroup.com',
  'Steve Betteley': 'sbetteley@impactbusinessgroup.com',
};

const CALENDLY_MAP = {
  'cwillbrandt@impactbusinessgroup.com': 'https://calendly.com/cwillbrandt/phone-call',
  'dbentsen@impactbusinessgroup.com': 'https://calendly.com/dbentsen',
  'dkoetsier@impactbusinessgroup.com': 'https://calendly.com/dkoetsier/',
  'dteliczan@impactbusinessgroup.com': 'https://calendly.com/dteliczan-impactbusinessgroup',
  'jdrajka@impactbusinessgroup.com': 'https://calendly.com/jdrajka',
  'lsylvester@impactbusinessgroup.com': 'https://calendly.com/lsylvester',
  'mherman@impactbusinessgroup.com': 'https://calendly.com/markherman',
  'mpeal@impactbusinessgroup.com': 'https://calendly.com/mattpeal/15min',
  'pkujawski@impactbusinessgroup.com': 'https://calendly.com/pkujawski',
  'sbetteley@impactbusinessgroup.com': 'https://calendly.com/sbetteley',
  'tray@impactbusinessgroup.com': 'https://calendly.com/tray-impactbusinessgroup',
  'twangler@impactbusinessgroup.com': 'https://calendly.com/twangler-impactbusinessgroup/15min',
  'msapoznikov@impactbusinessgroup.com': 'https://calendly.com/msapoznikov',
};

function businessDaysBetween(dateA, dateB) {
  const a = new Date(dateA); const b = new Date(dateB);
  let count = 0;
  const d = new Date(a);
  while (d < b) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function getNextRoundRobin(category, location, currentAM) {
  const isTampa = (location || '').toLowerCase().includes('tampa');
  if (isTampa) {
    const idx = TAMPA_AMS.indexOf(currentAM);
    return TAMPA_AMS[(idx + 1) % TAMPA_AMS.length];
  }
  const pool = ROUND_ROBIN[category] || ROUND_ROBIN.engineering;
  const idx = pool.indexOf(currentAM);
  return pool[(idx + 1) % pool.length];
}

// --- Lead inactivity rerouting ---
async function checkInactiveLeads() {
  const keys = await redisKeys('lead:*');
  let rerouted = 0;
  const now = new Date();

  for (const key of keys) {
    const lead = await redisGet(key);
    if (!lead) continue;
    if (lead.status !== 'new' && lead.status !== 'pending') continue;

    // Check if any outreach logged
    const hasOutreach = lead.outreach_log && Object.keys(lead.outreach_log).length > 0;
    if (hasOutreach) continue;

    const assignedAt = lead.assignedAt || lead.createdAt;
    if (!assignedAt) continue;

    const bizDays = businessDaysBetween(new Date(typeof assignedAt === 'number' ? assignedAt : assignedAt), now);
    if (bizDays < 2) continue;

    if (!lead.assignment_history) lead.assignment_history = [];
    const reassignCount = lead.assignment_history.length;

    let newAM;
    if (reassignCount >= 1) {
      newAM = ESCALATION_AM;
    } else {
      newAM = getNextRoundRobin(lead.category || 'engineering', lead.location || '', lead.assignedAM || '');
    }

    const newEmail = AM_EMAIL_MAP[newAM] || '';
    lead.assignment_history.push({ am_name: lead.assignedAM || '', am_email: lead.assignedAMEmail || '', assigned_at: assignedAt, reassign_reason: 'inactivity_2bd' });
    lead.assignedAM = newAM;
    lead.assignedAMEmail = newEmail;
    lead.assignedAt = now.toISOString();

    await redisSet(key, lead, 60 * 60 * 24 * 14);

    // Update Mailchimp rep for company contacts
    try {
      const mcApiKey = process.env.MAILCHIMP_API_KEY;
      const mcDc = mcApiKey.split('-')[1];
      const audienceId = process.env.MAILCHIMP_CLIENT_AUDIENCE_ID;
      // Fire and forget Mailchimp update
      fetch(`https://${mcDc}.api.mailchimp.com/3.0/search-members?query=${encodeURIComponent(lead.company)}&list_id=${audienceId}`, {
        headers: { Authorization: `Bearer ${mcApiKey}` },
      }).then(r => r.json()).then(data => {
        const members = (data.exact_matches && data.exact_matches.members) || [];
        for (const m of members) {
          const co = (m.merge_fields && m.merge_fields.COMPANY || '').toLowerCase();
          if (co !== lead.company.toLowerCase()) continue;
          const hash = require('crypto').createHash('md5').update(m.email_address.toLowerCase()).digest('hex');
          fetch(`https://${mcDc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${hash}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${mcApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ merge_fields: { REPNAME: newAM, REPEMAIL: newEmail, CALENDLY: CALENDLY_MAP[newEmail] || '' } }),
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) { console.error('MC reroute error:', e.message); }

    rerouted++;
    console.log(`Rerouted ${lead.company} from ${lead.assignment_history[lead.assignment_history.length - 1].am_name} to ${newAM}`);
  }
  return rerouted;
}

// --- Reminder firing ---
async function fireReminders() {
  const keys = await redisKeys('lead:*');
  let reminded = 0;
  const now = new Date();

  for (const key of keys) {
    const lead = await redisGet(key);
    if (!lead) continue;
    if (lead.status !== 'awaiting_followup') continue;

    const lastDate = lead.last_reminder_date || lead.completedAt;
    if (!lastDate) continue;

    const bizDays = businessDaysBetween(new Date(lastDate), now);
    if (bizDays < 3) continue;

    lead.reminder_stage = (lead.reminder_stage || 0) + 1;
    lead.last_reminder_date = now.toISOString();
    lead.status = 'pending';

    await redisSet(key, lead, 60 * 60 * 24 * 14);
    reminded++;
    console.log(`Reminder ${lead.reminder_stage} fired for ${lead.company}`);
  }
  return reminded;
}

// --- Main handler ---
module.exports = async function handler(req, res) {
  // Disable caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  // Security check
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Session alerts ---
  const keys = await redisKeys('session:*');
  let alerted = 0;

  for (const key of keys) {
    const session = await redisGet(key);
    if (!session || session.alerted) continue;

    const inactive = Date.now() - Number(session.lastSeen);

    if (inactive >= SESSION_TIMEOUT_MS) {
      try {
        await sendAlert(session.subscriber, session.pages);
        session.alerted = true;
        await redisSet(key, session, 3600);
        alerted++;
      } catch (err) {
        console.error(`Failed to send alert for ${key}:`, err.message);
      }
    }
  }

  // --- Lead inactivity rerouting ---
  let rerouted = 0;
  try { rerouted = await checkInactiveLeads(); } catch (e) { console.error('Inactivity check error:', e.message); }

  // --- Reminder firing ---
  let reminded = 0;
  try { reminded = await fireReminders(); } catch (e) { console.error('Reminder firing error:', e.message); }

  return res.status(200).json({ ok: true, checked: keys.length, alerted, rerouted, reminded });
};
