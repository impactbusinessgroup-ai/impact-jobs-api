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

// --- Morning email ---
async function sendMorningEmail() {
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

  const keys = await redisKeys('lead:*');
  const AM_LIST = [
    { email: 'msapoznikov@impactbusinessgroup.com', name: 'Mark', reviewUrl: 'https://impact-jobs-api.vercel.app/review' },
    { email: 'cwillbrandt@impactbusinessgroup.com', name: 'Curt', reviewUrl: 'https://impact-jobs-api.vercel.app/review?am=cwillbrandt' },
  ];

  const allLeads = [];
  const allFollowups = [];
  for (const key of keys) {
    const lead = await redisGet(key);
    if (!lead) continue;
    if ((lead.status === 'new' || lead.status === 'pending') && lead.contacts && lead.contacts.length > 0) {
      allLeads.push(lead);
    }
    if (lead.status === 'awaiting_followup') {
      const lastDate = lead.last_reminder_date || lead.completedAt;
      if (lastDate && businessDaysBetween(new Date(lastDate), today) >= 3) allFollowups.push(lead);
    }
  }

  if (!allLeads.length && !allFollowups.length) { console.log('No leads for morning email'); return false; }

  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const dateNum = today.getDate();

  const CAT_COLORS = { engineering: '#E8620A', it: '#3B82F6', accounting: '#10B981', other: '#8B5CF6' };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  let sentCount = 0;
  for (const am of AM_LIST) {
    const newLeads = allLeads.filter(l => (l.assignedAMEmail || '') === am.email);
    const followupCount = allFollowups.filter(l => (l.assignedAMEmail || '') === am.email).length;
    if (!newLeads.length && !followupCount) continue;

    let totalContacts = 0;
    const catCounts = { engineering: 0, it: 0, accounting: 0, other: 0 };
    for (const lead of newLeads) {
      const cat = lead.category || 'engineering';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      totalContacts += (lead.contacts || []).length;
    }

    const leadCards = newLeads.map(function(lead) {
      const cat = lead.category || 'engineering';
      const catColor = CAT_COLORS[cat] || '#E8620A';
      const contactCount = (lead.contacts || []).length;
      const posted = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      return '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border-left:4px solid ' + catColor + ';"><tr><td style="padding:14px 16px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:15px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">' + (lead.jobTitle || '') + '</td></tr><tr><td style="font-size:13px;color:' + catColor + ';font-weight:600;padding-top:2px;font-family:Arial,sans-serif;">' + (lead.company || '') + '</td></tr><tr><td style="font-size:12px;color:#999;padding-top:4px;font-family:Arial,sans-serif;">' + (lead.location || '') + (posted ? ' &middot; Posted ' + posted : '') + '</td></tr><tr><td style="padding-top:8px;"><table cellpadding="0" cellspacing="0"><tr><td style="font-size:11px;color:#666;font-family:Arial,sans-serif;">' + contactCount + ' contact' + (contactCount !== 1 ? 's' : '') + ' found</td><td style="padding-left:12px;"><span style="display:inline-block;font-size:10px;font-weight:700;color:' + catColor + ';background:' + catColor + '15;padding:2px 8px;border-radius:10px;text-transform:uppercase;font-family:Arial,sans-serif;">' + cat + '</span></td></tr></table></td></tr></table></td></tr></table></td></tr>';
    }).join('');

    const followupRow = followupCount > 0 ? '<tr><td style="padding:0 0 20px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFA000;border-radius:8px;"><tr><td style="padding:12px 20px;text-align:center;font-size:14px;font-weight:600;color:#1a1a1a;font-family:Arial,sans-serif;">You have ' + followupCount + ' lead' + (followupCount !== 1 ? 's' : '') + ' to follow up on today</td></tr></table></td></tr>' : '';

    const html = '<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e8e8;"><tr><td align="center" style="padding:20px 0;"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;">' +
      '<tr><td style="background:#0F1E3D;padding:16px 24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><img src="https://impactbusinessgroup.com/wp-content/uploads/2017/04/cropped-Logo512.png" width="40" height="40" style="display:block;" alt="iMPact"></td><td style="text-align:right;font-size:12px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">' + dayName + ', ' + monthName + ' ' + dateNum + '</td></tr></table></td></tr>' +
      '<tr><td style="background:#1A4EA2;padding:28px 24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:24px;font-weight:700;color:white;font-family:Arial,sans-serif;">Good morning, ' + am.name + '</td></tr><tr><td style="font-size:14px;color:rgba(255,255,255,0.75);padding-top:6px;font-family:Arial,sans-serif;">Your new leads for today are ready for review</td></tr></table></td></tr>' +
      '<tr><td style="padding:20px 24px;">' + followupRow +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:8px;margin-bottom:20px;"><tr>' +
      '<td style="text-align:center;padding:14px 0;border-right:1px solid #e0e0e0;width:20%;"><div style="font-size:22px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">' + newLeads.length + '</div><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">New Leads</div></td>' +
      '<td style="text-align:center;padding:14px 0;border-right:1px solid #e0e0e0;width:20%;"><div style="font-size:22px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">' + totalContacts + '</div><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Contacts</div></td>' +
      '<td style="text-align:center;padding:14px 0;border-right:1px solid #e0e0e0;width:20%;"><div style="font-size:22px;font-weight:700;color:#E8620A;font-family:Arial,sans-serif;">' + (catCounts.engineering || 0) + '</div><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Engineering</div></td>' +
      '<td style="text-align:center;padding:14px 0;border-right:1px solid #e0e0e0;width:20%;"><div style="font-size:22px;font-weight:700;color:#3B82F6;font-family:Arial,sans-serif;">' + (catCounts.it || 0) + '</div><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">IT</div></td>' +
      '<td style="text-align:center;padding:14px 0;width:20%;"><div style="font-size:22px;font-weight:700;color:#10B981;font-family:Arial,sans-serif;">' + (catCounts.accounting || 0) + '</div><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Accounting</div></td>' +
      '</tr></table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:1px solid #e0e0e0;font-family:Arial,sans-serif;">Today\'s Leads</td></tr></table>' +
      '<table width="100%" cellpadding="0" cellspacing="0">' + leadCards + '</table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="padding-top:8px;"><tr><td align="center"><a href="' + am.reviewUrl + '" style="display:inline-block;background:#E8620A;color:white;font-size:15px;font-weight:700;padding:14px 40px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif;">Review All Leads</a></td></tr></table>' +
      '</td></tr></table></td></tr></table>';

    await transporter.sendMail({
      from: '"iMPact Lead Review" <' + process.env.GMAIL_USER + '>',
      to: am.email,
      subject: 'iMPact Lead Review - ' + newLeads.length + ' New Leads - ' + dayName + ', ' + monthName + ' ' + dateNum,
      html,
    });
    console.log('Morning email sent to ' + am.name + ' with ' + newLeads.length + ' leads');
    sentCount++;
  }

  await redisSet(dateKey, true, 86400);
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
