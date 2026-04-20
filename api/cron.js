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

// Atomic SET NX EX — returns true if lock acquired, false if key already exists
async function redisSetNXEX(key, value, exSeconds) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/EX/${exSeconds}/NX`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  return data.result === 'OK';
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

async function getBalancedAM(category, location, excludeAM, allLeads) {
  const isTampa = (location || '').toLowerCase().includes('tampa');
  const pool = isTampa ? TAMPA_AMS : (ROUND_ROBIN[category] || ROUND_ROBIN.engineering);
  const eligible = pool.filter(am => am !== excludeAM);
  if (!eligible.length) return pool[0];

  // Count active leads per AM
  const counts = {};
  eligible.forEach(am => { counts[am] = 0; });
  for (const lead of allLeads) {
    if (['new', 'pending', 'in_progress'].includes(lead.status) && lead.assignedAM) {
      if (counts[lead.assignedAM] !== undefined) counts[lead.assignedAM]++;
    }
  }

  // Find minimum count
  let minCount = Infinity;
  eligible.forEach(am => { if (counts[am] < minCount) minCount = counts[am]; });

  // Tiebreak by pool order
  for (const am of eligible) {
    if (counts[am] === minCount) return am;
  }
  return eligible[0];
}

// --- Lead inactivity rerouting ---
async function checkInactiveLeads() {
  const now = new Date();
  // Skip on weekends (Saturday=6, Sunday=0) in ET
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = etNow.getDay();
  if (dow === 0 || dow === 6) {
    console.log('Skipping inactivity rerouting on weekend (day ' + dow + ')');
    return 0;
  }
  const keys = await redisKeys('lead:*');
  let rerouted = 0;

  // Load all leads for balanced assignment
  const allLeads = [];
  for (const key of keys) {
    const l = await redisGet(key);
    if (l) allLeads.push({ ...l, _key: key });
  }

  for (const lead of allLeads) {
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
      newAM = await getBalancedAM(lead.category || 'engineering', lead.location || '', lead.assignedAM || '', allLeads);
    }
    const key = lead._key;

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

// --- Morning email HTML builder (Outlook-safe, tables + inline styles only) ---
function buildMorningEmailHtml(ctx) {
  var ORANGE = '#E8620A';
  var BLUE = '#1A4EA2';
  var GREEN = '#00a86b';
  var NAVY = '#0F1E3D';
  var PAGE_BG = '#e8e8e8';
  var CARD_BG = '#ffffff';
  var LABEL_GREY = '#888888';
  var BODY_FONT = 'Arial, Helvetica, sans-serif';

  function statBox(num, label, bg) {
    return '<td align="center" valign="middle" width="33%" style="padding:0 4px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:' + bg + ';border-radius:10px;">' +
        '<tr><td align="center" style="padding:20px 6px;">' +
          '<div style="font-size:30px;font-weight:700;color:#ffffff;font-family:' + BODY_FONT + ';line-height:1;">' + num + '</div>' +
          '<div style="font-size:10px;font-weight:600;color:#ffffff;text-transform:uppercase;letter-spacing:0.6px;font-family:' + BODY_FONT + ';padding-top:10px;">' + label + '</div>' +
        '</td></tr>' +
      '</table>' +
    '</td>';
  }

  return '' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:' + PAGE_BG + ';">' +
      '<tr><td align="center" style="padding:24px 12px;">' +
        '<table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:' + CARD_BG + ';border-radius:12px;overflow:hidden;">' +
          '<tr><td align="center" style="background:' + NAVY + ';padding:24px;">' +
            '<img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" width="160" alt="iMPact Business Group" style="display:block;border:0;outline:none;text-decoration:none;">' +
          '</td></tr>' +
          '<tr><td align="center" style="padding:30px 24px 6px;">' +
            '<div style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:' + BODY_FONT + ';">Good morning, ' + ctx.firstName + '</div>' +
          '</td></tr>' +
          '<tr><td align="center" style="padding:0 24px 26px;">' +
            '<div style="font-size:13px;color:' + LABEL_GREY + ';font-family:' + BODY_FONT + ';">' + ctx.todayLabel + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:0 20px 28px;">' +
            '<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>' +
              statBox(ctx.newToday, 'New Today', GREEN) +
              statBox(ctx.totalPending, 'Total Pending', BLUE) +
              statBox(ctx.followupsDue, 'Follow-ups Due', ORANGE) +
            '</tr></table>' +
          '</td></tr>' +
          '<tr><td align="center" style="padding:0 24px 34px;">' +
            '<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="' + ORANGE + '" style="border-radius:6px;">' +
              '<a href="' + ctx.reviewUrl + '" style="display:inline-block;padding:14px 32px;color:#ffffff;font-family:Raleway,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;">Review My Leads</a>' +
            '</td></tr></table>' +
          '</td></tr>' +
          '<tr><td align="center" style="padding:18px 24px 24px;border-top:1px solid #eeeeee;">' +
            '<div style="font-size:12px;color:' + LABEL_GREY + ';font-family:' + BODY_FONT + ';">iMPact Business Group | Grand Rapids, MI &amp; Tampa, FL</div>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>';
}

// --- Morning email ---
async function sendMorningEmail() {
  // Stagger concurrent invocations by up to 3s to reduce race contention
  await new Promise(r => setTimeout(r, Math.random() * 3000));

  const today = new Date();

  // Skip on weekends (Saturday=6, Sunday=0) in ET
  const etNow = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = etNow.getDay();
  if (dow === 0 || dow === 6) {
    console.log('Skipping morning email on weekend (day ' + dow + ')');
    return false;
  }

  const dateStr = today.toISOString().split('T')[0];
  const lockKey = 'morning_email_lock_' + dateStr;
  const lockAcquired = await redisSetNXEX(lockKey, '1', 60);
  if (!lockAcquired) {
    console.log('Morning email lock held by another instance, skipping');
    return false;
  }

  const dateKey = 'cron_email_sent_' + dateStr;
  const alreadySent = await redisGet(dateKey);
  if (alreadySent) { console.log('Morning email already sent today'); return false; }

  // Reserve the day-level guard immediately so any later instance that
  // acquires the short lock still short-circuits on the alreadySent check.
  await redisSet(dateKey, true, 86400);

  const APPROVED_AMS = [
    { email: 'msapoznikov@impactbusinessgroup.com', fullName: 'Mark Sapoznikov' },
    { email: 'cwillbrandt@impactbusinessgroup.com', fullName: 'Curt Willbrandt' },
  ];
  const REVIEW_URL = 'https://impact-jobs-api.vercel.app/review';

  const keys = await redisKeys('lead:*');
  const allLeads = [];
  for (const key of keys) {
    const lead = await redisGet(key);
    if (lead) allLeads.push(lead);
  }

  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  let sentCount = 0;
  for (const am of APPROVED_AMS) {
    const amEmailLower = am.email.toLowerCase();
    const mine = allLeads.filter(l => (l.assignedAMEmail || '').toLowerCase() === amEmailLower);
    const pending = mine.filter(l =>
      (l.status === 'new' || l.status === 'pending') &&
      Array.isArray(l.contacts) && l.contacts.length > 0
    );

    if (!pending.length) { console.log('No pending leads for ' + am.email + ', skipping'); continue; }

    const newToday = pending.filter(l =>
      l.date === dateStr ||
      (typeof l.id === 'string' && l.id.indexOf('lead:' + dateStr + ':') === 0)
    ).length;
    const totalPending = pending.length;
    const followupsDue = mine.filter(l => {
      if (l.status !== 'awaiting_followup') return false;
      const lastDate = l.last_reminder_date || l.completedAt;
      if (!lastDate) return false;
      return businessDaysBetween(new Date(lastDate), today) >= 3;
    }).length;

    const firstName = (am.fullName || '').split(' ')[0] || '';
    const html = buildMorningEmailHtml({
      firstName,
      todayLabel,
      newToday,
      totalPending,
      followupsDue,
      reviewUrl: REVIEW_URL,
    });

    await transporter.sendMail({
      from: '"iMPact Lead Review" <' + process.env.GMAIL_USER + '>',
      to: am.email,
      subject: 'iMPact Lead Review, ' + todayLabel,
      html,
    });
    console.log('Morning email sent to ' + am.email +
      ' (newToday=' + newToday + ', pending=' + totalPending +
      ', followups=' + followupsDue + ')');
    sentCount++;
  }

  console.log('Morning emails sent: ' + sentCount + ' AMs');
  return true;
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

  // --- Morning email (7:45 AM ET window: 7:40-7:50, or force=true) ---
  let emailSent = false;
  try {
    const forceEmail = req.query && req.query.force === 'true';
    const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hr = etNow.getHours();
    const min = etNow.getMinutes();
    if (forceEmail || (hr === 7 && min >= 40 && min <= 50)) {
      emailSent = await sendMorningEmail();
    }
  } catch (e) { console.error('Morning email error:', e.message); }

  return res.status(200).json({ ok: true, checked: keys.length, alerted, rerouted, reminded, emailSent });
};
