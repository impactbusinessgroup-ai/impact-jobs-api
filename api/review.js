// api/review.js

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>iMPact Lead Review</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #ECEEF2; color: #1a1a1a; }

  .header { background: #0F1E3D; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  .header-logo { height: 34px; }
  .header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
  .header-meta { color: rgba(255,255,255,0.55); font-size: 12px; text-align: right; }

  .container { max-width: 880px; margin: 0 auto; padding: 28px 16px 60px; }

  .queue-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .queue-bar h2 { font-size: 24px; font-weight: 700; color: #0F1E3D; }
  .queue-bar .sub { font-size: 13px; color: #888; margin-top: 3px; }
  .lead-count-badge { background: #FFA000; color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; box-shadow: 0 2px 8px rgba(255,160,0,0.35); }

  .card { background: white; border-radius: 18px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); transition: box-shadow 0.2s, transform 0.2s; }
  .card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.12); transform: translateY(-1px); }

  .card-top { background: linear-gradient(135deg, #0B1729 0%, #1A3A6E 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .card-top-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
  .company-logo-wrap { width: 48px; height: 48px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .company-logo-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
  .company-initials { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #FFA000, #E8620A); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; flex-shrink: 0; letter-spacing: 0.5px; }
  .company-text {}
  .company-name { font-size: 18px; font-weight: 700; color: white; line-height: 1.2; }
  .company-location { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px; }

  .card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }

  .pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.4px; text-transform: uppercase; }
  .pill-eng { background: rgba(29,158,117,0.3); color: #6EE7C7; border: 1px solid rgba(110,231,199,0.3); }
  .pill-acc { background: rgba(99,179,237,0.2); color: #93C5FD; border: 1px solid rgba(147,197,253,0.3); }
  .pill-it { background: rgba(255,160,0,0.25); color: #FCD34D; border: 1px solid rgba(252,211,77,0.3); }

  .btn-block-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-block-top:hover { background: rgba(255,255,255,0.18); color: white; }
  .btn-unblock-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(252,75,74,0.5); background: rgba(226,75,74,0.15); color: #FCA5A5; cursor: pointer; white-space: nowrap; }

  .card-body { padding: 20px 24px; }

  .job-info-row { display: flex; gap: 14px; margin-bottom: 18px; align-items: stretch; }
  .job-title-block { flex: 1; background: #F4F6FB; border-radius: 12px; padding: 14px 16px; border-left: 4px solid #FFA000; }
  .job-title-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; font-weight: 600; }
  .job-title-value { font-size: 15px; font-weight: 700; color: #0F1E3D; line-height: 1.3; }

  .cal-block { background: white; border-radius: 12px; overflow: hidden; width: 76px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid #E8ECF4; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .cal-month { background: #1A4EA2; color: white; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; width: 100%; text-align: center; padding: 5px 0; }
  .cal-day { font-size: 28px; font-weight: 800; color: #0F1E3D; padding: 6px 0 2px; line-height: 1; }
  .cal-year { font-size: 10px; color: #aaa; padding-bottom: 8px; font-weight: 500; }

  .jd-toggle { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #1A4EA2; cursor: pointer; margin-bottom: 16px; font-weight: 600; background: #EEF3FF; padding: 5px 12px; border-radius: 6px; border: none; transition: background 0.15s; }
  .jd-toggle:hover { background: #DBEAFE; }

  .jd-popup-overlay { display: none; position: fixed; inset: 0; background: rgba(10,20,50,0.6); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
  .jd-popup-overlay.open { display: flex; }
  .jd-popup { background: white; border-radius: 18px; max-width: 660px; width: 92%; max-height: 82vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
  .jd-popup-header { padding: 20px 24px 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
  .jd-popup-header h3 { font-size: 16px; font-weight: 700; color: #0F1E3D; }
  .jd-popup-close { width: 28px; height: 28px; border-radius: 50%; background: #f0f2f5; border: none; cursor: pointer; font-size: 14px; color: #666; display: flex; align-items: center; justify-content: center; }
  .jd-popup-close:hover { background: #e0e3ea; }
  .jd-popup-body { padding: 20px 24px; overflow-y: auto; font-size: 13px; line-height: 1.75; color: #444; white-space: pre-wrap; }

  .divider { border: none; border-top: 1px solid #F0F2F5; margin: 16px 0; }
  .section-label { font-size: 10px; font-weight: 700; color: #AAB0BE; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 12px; }

  .contact-block { border: 1.5px solid #EEF0F5; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; transition: all 0.2s; background: #FAFBFD; }
  .contact-block.sent { border-color: #5DCAA5; background: #F0FDF8; }
  .contact-header { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #1A4EA2, #0F1E3D); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }
  .avatar-am { background: linear-gradient(135deg, #1D9E75, #085041); }
  .contact-info { flex: 1; }
  .contact-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; flex-wrap: wrap; }
  .contact-name { font-size: 14px; font-weight: 700; color: #0F1E3D; }
  .contact-title-sub { font-size: 12px; color: #777; }
  .email-row { display: flex; align-items: center; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
  .email-placeholder { font-size: 12px; color: #C0C5D0; font-style: italic; }
  .email-value { font-size: 12px; color: #1A4EA2; font-weight: 600; }
  .credit-note { font-size: 11px; color: #C0C5D0; margin-top: 2px; }

  .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
  .badge-suggested { background: #FEF3C7; color: #92400E; }
  .badge-added { background: #DBEAFE; color: #1E40AF; }
  .badge-sent { background: #D1FAE5; color: #065F46; }

  .contact-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
  .btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #E0E3EA; background: white; color: #333; transition: all 0.15s; }
  .btn:hover { background: #F5F7FA; border-color: #C8CDD8; }
  .btn-primary { background: #0F1E3D; color: white; border-color: #0F1E3D; }
  .btn-primary:hover { background: #1a2f5a; }
  .btn-orange { background: #FFA000; color: white; border-color: #FFA000; }
  .btn-orange:hover { background: #E8620A; border-color: #E8620A; }
  .btn-li { background: #0A66C2; color: white; border-color: #0A66C2; }
  .btn-li:hover { background: #0958a8; }
  .btn-fetch { background: #FEF3C7; color: #92400E; border-color: #F59E0B; }
  .btn-fetch:hover { background: #FDE68A; }
  .btn-sent { background: #D1FAE5; color: #065F46; border-color: #5DCAA5; cursor: default; }
  .btn-ghost { color: #B0B8C8; font-size: 12px; border: none; background: none; cursor: pointer; padding: 4px 6px; font-weight: 500; }
  .btn-ghost:hover { color: #e24b4a; }

  .tab-row { display: flex; gap: 6px; margin: 12px 0 8px; }
  .tab { font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 1.5px solid #E0E3EA; cursor: pointer; color: #666; background: white; font-weight: 500; transition: all 0.15s; }
  .tab.active { background: #0F1E3D; color: white; border-color: #0F1E3D; }

  .subject-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; margin-bottom: 6px; }
  .subject-input:focus { outline: none; border-color: #1A4EA2; }
  textarea { width: 100%; font-size: 12px; line-height: 1.7; padding: 10px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; resize: vertical; font-family: inherit; min-height: 95px; }
  textarea:focus { outline: none; border-color: #1A4EA2; }

  .search-panel { border: 1.5px solid #EEF0F5; border-radius: 12px; padding: 14px; background: #F8F9FC; margin-bottom: 12px; }
  .search-panel-label { font-size: 12px; color: #777; margin-bottom: 8px; font-weight: 600; }
  .search-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; }
  .search-input:focus { outline: none; border-color: #1A4EA2; }
  .search-results { margin-top: 8px; border: 1.5px solid #E0E3EA; border-radius: 10px; overflow: hidden; background: white; }
  .search-result-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #F5F5F5; display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; }
  .search-result-item:last-child { border-bottom: none; }
  .search-result-item:hover { background: #F5F7FA; }
  .search-add-btn { font-size: 11px; font-weight: 700; color: #1A4EA2; background: #EEF3FF; padding: 3px 10px; border-radius: 6px; }

  .card-footer { display: flex; gap: 10px; align-items: center; padding: 14px 24px; border-top: 1px solid #F0F2F5; background: #F8F9FC; }
  .btn-skip { color: #B0B8C8; font-size: 13px; border: none; background: none; cursor: pointer; font-weight: 500; }
  .btn-skip:hover { color: #e24b4a; }
  .view-posting-link { font-size: 12px; color: #1A4EA2; text-decoration: none; font-weight: 600; background: #EEF3FF; padding: 5px 12px; border-radius: 8px; }
  .view-posting-link:hover { background: #DBEAFE; }

  .loading { text-align: center; padding: 80px; color: #888; font-size: 15px; }
  .empty { text-align: center; padding: 80px; }
  .empty h3 { font-size: 18px; margin-bottom: 8px; color: #444; }
</style>
</head>
<body>

<div class="header" style="position:relative;">
  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact">
  <div class="header-center">Lead Review</div>
  <div class="header-meta" id="header-date"></div>
</div>

<div class="jd-popup-overlay" id="jd-overlay" onclick="closeJD(event)">
  <div class="jd-popup">
    <div class="jd-popup-header">
      <h3 id="jd-popup-title">Job Description</h3>
      <button class="jd-popup-close" onclick="closeJDBtn()">&#x2715;</button>
    </div>
    <div class="jd-popup-body" id="jd-popup-body"></div>
  </div>
</div>

<div class="container">
  <div class="queue-bar">
    <div>
      <h2>Good morning, Mark</h2>
      <div class="sub" id="queue-sub"></div>
    </div>
    <div class="lead-count-badge" id="lead-count"></div>
  </div>
  <div id="leads-container"><div class="loading">Loading leads...</div></div>
</div>

<script>
const AM = { name: 'Mark Sapoznikov', email: 'msapoznikov@impactbusinessgroup.com' };
let leads = [];
let blocklist = { companies: [], titles: [] };
let contactCounters = {};
const logoCache = {};

async function fetchLogo(company, website, leadId) {
  const cacheKey = company.toLowerCase();
  if (logoCache[cacheKey] !== undefined) {
    applyLogo(leadId, logoCache[cacheKey]);
    return;
  }

  let domain = '';
  if (website) {
    try { domain = new URL(website).hostname.replace('www.', ''); } catch(e) {}
  }
  if (!domain) {
    domain = company.toLowerCase()
      .replace(/[^a-z0-9\\s]/g, '')
      .replace(/\\s+/g, '')
      .slice(0, 20) + '.com';
  }

  try {
    const res = await fetch('/api/logo?domain=' + encodeURIComponent(domain));
    const data = await res.json();
    const url = data.url || null;
    logoCache[cacheKey] = url;
    applyLogo(leadId, url);
  } catch(e) {
    logoCache[cacheKey] = null;
    applyLogo(leadId, null);
  }
}

function applyLogo(leadId, url) {
  const wrap = document.getElementById('logo-' + leadId);
  if (!wrap) return;
  if (url) {
    wrap.innerHTML = '<img src="' + url + '" alt="" onerror="this.parentElement.style.display=\\'none\\';document.getElementById(\\'ini-' + leadId + '\\').style.display=\\'flex\\'">';
    wrap.style.display = 'flex';
    const ini = document.getElementById('ini-' + leadId);
    if (ini) ini.style.display = 'none';
  } else {
    wrap.style.display = 'none';
    const ini = document.getElementById('ini-' + leadId);
    if (ini) ini.style.display = 'flex';
  }
}

async function init() {
  const today = new Date();
  document.getElementById('header-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('queue-sub').textContent = 'All pending leads';

  const [leadsRes, blockRes] = await Promise.all([
    fetch('/api/leads').then(r => r.json()),
    fetch('/api/blocklist').then(r => r.json()),
  ]);
  leads = leadsRes.leads || [];
  blocklist = { companies: blockRes.companies || [], titles: blockRes.titles || [] };
  document.getElementById('lead-count').textContent = leads.length + ' pending leads';
  renderLeads();

  leads.forEach(lead => {
    fetchLogo(lead.company, lead.employerWebsite || '', lead.id);
  });
}

function categoryPill(cat) {
  if (cat === 'accounting') return '<span class="pill pill-acc">Accounting</span>';
  if (cat === 'it') return '<span class="pill pill-it">IT</span>';
  return '<span class="pill pill-eng">Engineering</span>';
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function companyInitials(name) {
  const words = name.trim().split(/\\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function isCompanyBlocked(company) {
  return blocklist.companies.some(c => c.toLowerCase() === company.toLowerCase());
}

function formatPostDate(lead) {
  const d = lead.createdAt ? new Date(lead.createdAt) : new Date();
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear()
  };
}

function renderLeads() {
  const container = document.getElementById('leads-container');
  if (!leads.length) {
    container.innerHTML = '<div class="empty"><h3>No pending leads</h3><p style="color:#aaa;font-size:13px;">Check back after the morning fetch runs.</p></div>';
    return;
  }
  container.innerHTML = leads.map(lead => renderCard(lead)).join('');
}

function renderCard(lead) {
  const blocked = isCompanyBlocked(lead.company);
  const cat = lead.category || 'engineering';
  const { month, day, year } = formatPostDate(lead);
  const hasJD = lead.description && lead.description.length > 0;
  const ini = companyInitials(lead.company);
  const safeId = lead.id.replace(/[^a-zA-Z0-9]/g, '_');

  return \`
  <div class="card" id="card-\${safeId}">
    <div class="card-top">
      <div class="card-top-left">
        <div class="company-logo-wrap" id="logo-\${safeId}" style="display:none;"></div>
        <div class="company-initials" id="ini-\${safeId}">\${ini}</div>
        <div class="company-text">
          <div class="company-name">\${lead.company}</div>
          <div class="company-location">\${lead.location || ''}</div>
        </div>
      </div>
      <div class="card-top-right">
        \${categoryPill(cat)}
        <button class="\${blocked ? 'btn-unblock-top' : 'btn-block-top'}" onclick="toggleBlockCompany('\${lead.company.replace(/'/g,"\\\\'")}', this)">
          \${blocked ? 'Unblock' : 'Block company'}
        </button>
      </div>
    </div>

    <div class="card-body">
      <div class="job-info-row">
        <div class="job-title-block">
          <div class="job-title-label">Job posting</div>
          <div class="job-title-value">\${lead.jobTitle}</div>
        </div>
        <div class="cal-block">
          <div class="cal-month">\${month}</div>
          <div class="cal-day">\${day}</div>
          <div class="cal-year">\${year}</div>
        </div>
      </div>

      \${hasJD ? \`<button class="jd-toggle" onclick="openJD('\${safeId}', this)">
        &#9654; View job description
      </button>\` : ''}

      <div class="divider"></div>
      <div class="section-label">Contacts</div>
      <div id="contacts-\${safeId}"></div>

      <div class="search-panel">
        <div class="search-panel-label">Add contact from SmartSearch &middot; \${lead.company}</div>
        <input class="search-input" type="text" placeholder="Search contacts or type to filter..." oninput="filterSS(this, '\${safeId}')" onfocus="showSS('\${safeId}')">
        <div class="search-results" id="ss-\${safeId}" style="display:none;">
          <div class="search-result-item" onclick="addContact('\${safeId}', 'Sarah Johnson', 'HR Director')">
            <div><div style="font-size:13px;font-weight:600;">Sarah Johnson</div><div style="font-size:11px;color:#888;">HR Director</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
          <div class="search-result-item" onclick="addContact('\${safeId}', 'Mike Williams', 'Engineering Manager')">
            <div><div style="font-size:13px;font-weight:600;">Mike Williams</div><div style="font-size:11px;color:#888;">Engineering Manager</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
          <div class="search-result-item" onclick="addContact('\${safeId}', 'Tom Baker', 'Plant Manager')">
            <div><div style="font-size:13px;font-weight:600;">Tom Baker</div><div style="font-size:11px;color:#888;">Plant Manager</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-skip" onclick="skipLead('\${safeId}', '\${lead.id}')">Skip this lead</button>
      <div style="flex:1;"></div>
      \${lead.jobUrl ? \`<a class="view-posting-link" href="\${lead.jobUrl}" target="_blank">View job posting &#8599;</a>\` : ''}
    </div>
  </div>\`;
}

function openJD(safeId, btn) {
  const lead = leads.find(l => l.id.replace(/[^a-zA-Z0-9]/g, '_') === safeId);
  if (!lead) return;
  document.getElementById('jd-popup-title').textContent = lead.company + ' \u2013 ' + lead.jobTitle;
  document.getElementById('jd-popup-body').textContent = lead.description || 'No description available.';
  document.getElementById('jd-overlay').classList.add('open');
}
function closeJD(e) { if (e.target === document.getElementById('jd-overlay')) document.getElementById('jd-overlay').classList.remove('open'); }
function closeJDBtn() { document.getElementById('jd-overlay').classList.remove('open'); }

document.addEventListener('click', function(e) {
  if (!e.target.classList.contains('search-input')) {
    document.querySelectorAll('[id^="ss-"]').forEach(el => {
      if (!el.contains(e.target)) el.style.display = 'none';
    });
  }
});

function showSS(safeId) {
  const el = document.getElementById('ss-' + safeId);
  if (el) el.style.display = 'block';
}

function filterSS(input, safeId) {
  const val = input.value.toLowerCase();
  const results = document.getElementById('ss-' + safeId);
  if (!results) return;
  results.style.display = 'block';
  results.querySelectorAll('.search-result-item').forEach(item => {
    const name = item.querySelector('div > div').textContent.toLowerCase();
    item.style.display = name.includes(val) ? 'flex' : 'none';
  });
}

function addContact(safeId, name, title) {
  if (!contactCounters[safeId]) contactCounters[safeId] = 0;
  contactCounters[safeId]++;
  const cid = safeId + '_c' + contactCounters[safeId];
  const ini = initials(name);
  const firstName = name.split(' ')[0];

  const block = document.createElement('div');
  block.className = 'contact-block';
  block.id = 'cb-' + cid;
  block.innerHTML = \`
    <div class="contact-header">
      <div class="avatar avatar-am">\${ini}</div>
      <div class="contact-info">
        <div class="contact-name-row">
          <span class="contact-name">\${name}</span>
          <span class="badge badge-added">Added from SS</span>
        </div>
        <div class="contact-title-sub">\${title}</div>
        <div class="email-row">
          <span class="email-placeholder" id="ep-\${cid}">No email fetched yet</span>
          <span class="email-value" id="ev-\${cid}" style="display:none;"></span>
        </div>
        <div class="credit-note" id="cn-\${cid}">Fetching email uses 2 credits</div>
      </div>
      <button class="btn-ghost" onclick="removeContact('\${cid}')">&times;</button>
    </div>
    <div class="contact-actions">
      <button class="btn btn-fetch" id="fb-\${cid}" onclick="fetchEmail('\${cid}', '\${name}', '\${title}')">Fetch email (2 credits)</button>
      <a href="https://www.google.com/search?q=\${encodeURIComponent(name + ' ' + title + ' LinkedIn')}" target="_blank" class="btn">LinkedIn &#8599;</a>
      <button class="btn-ghost" onclick="removeContact('\${cid}')">Remove</button>
    </div>
    <div id="draft-\${cid}" style="display:none;">
      <div class="tab-row">
        <button class="tab active" onclick="switchTab('\${cid}','email',this)">Email</button>
        <button class="tab" onclick="switchTab('\${cid}','linkedin',this)">LinkedIn</button>
      </div>
      <div id="email-pane-\${cid}">
        <input class="subject-input" type="text" id="subj-\${cid}" placeholder="Subject line">
        <textarea id="edraft-\${cid}"></textarea>
        <div class="contact-actions">
          <button class="btn btn-primary" id="send-\${cid}" onclick="openOutlook('\${cid}')">Open in Outlook</button>
        </div>
      </div>
      <div id="li-pane-\${cid}" style="display:none;">
        <textarea id="lidraft-\${cid}"></textarea>
        <div class="contact-actions">
          <button class="btn btn-li" onclick="copyLI('\${cid}',this)">Copy for LinkedIn</button>
        </div>
      </div>
    </div>
  \`;

  document.getElementById('contacts-' + safeId).appendChild(block);
  document.getElementById('ss-' + safeId).style.display = 'none';
}

function removeContact(cid) {
  const el = document.getElementById('cb-' + cid);
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.2s'; setTimeout(() => el.remove(), 200); }
}

function fetchEmail(cid, name, title) {
  const btn = document.getElementById('fb-' + cid);
  btn.textContent = 'Fetching...';
  btn.disabled = true;
  setTimeout(() => {
    const fn = name.split(' ')[0].toLowerCase();
    const ln = name.split(' ').slice(-1)[0].toLowerCase();
    const email = fn + '.' + ln + '@company.com';
    document.getElementById('ep-' + cid).style.display = 'none';
    document.getElementById('ev-' + cid).style.display = 'inline';
    document.getElementById('ev-' + cid).textContent = email;
    document.getElementById('cn-' + cid).textContent = '2 credits used';
    btn.textContent = 'Email fetched';
    btn.className = 'btn btn-sent';
    document.getElementById('subj-' + cid).value = 'Partnering on your search';
    document.getElementById('edraft-' + cid).value = 'Hi ' + name.split(' ')[0] + ',\\n\\nI noticed your company is actively hiring and wanted to reach out. At iMPact Business Group we specialize in placing top talent in Engineering, Manufacturing, Accounting, and IT roles across the region.\\n\\nWould you be open to a quick 15-minute call?\\n\\n[Calendly link]\\n\\nMark Sapoznikov\\niMPact Business Group';
    document.getElementById('lidraft-' + cid).value = 'Hi ' + name.split(' ')[0] + ', I noticed your company is actively hiring and wanted to connect. At iMPact Business Group we place top talent across Engineering, Accounting, and IT. Would you be open to a quick chat? [Calendly link] - Mark';
    document.getElementById('draft-' + cid).style.display = 'block';
  }, 400);
}

function switchTab(cid, tab, btn) {
  document.querySelectorAll('#cb-' + cid + ' .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('email-pane-' + cid).style.display = tab === 'email' ? 'block' : 'none';
  document.getElementById('li-pane-' + cid).style.display = tab === 'linkedin' ? 'block' : 'none';
}

function openOutlook(cid) {
  const email = document.getElementById('ev-' + cid).textContent;
  const subject = encodeURIComponent(document.getElementById('subj-' + cid).value);
  const body = encodeURIComponent(document.getElementById('edraft-' + cid).value);
  window.location.href = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
  document.getElementById('send-' + cid).textContent = 'Sent';
  document.getElementById('send-' + cid).className = 'btn btn-sent';
  document.getElementById('cb-' + cid).classList.add('sent');
}

function copyLI(cid, btn) {
  navigator.clipboard.writeText(document.getElementById('lidraft-' + cid).value).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy for LinkedIn', 2000);
  });
}

async function toggleBlockCompany(company, btn) {
  const blocked = btn.classList.contains('btn-unblock-top');
  await fetch('/api/blocklist', {
    method: blocked ? 'DELETE' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'companies', value: company }),
  });
  if (blocked) {
    blocklist.companies = blocklist.companies.filter(c => c !== company);
    btn.textContent = 'Block company';
    btn.className = 'btn-block-top';
  } else {
    blocklist.companies.push(company);
    btn.textContent = 'Unblock';
    btn.className = 'btn-unblock-top';
  }
}

async function skipLead(safeId, realId) {
  await fetch('/api/leads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: realId, updates: { status: 'skipped' } }),
  });
  const card = document.getElementById('card-' + safeId);
  if (card) { card.style.opacity = '0'; card.style.transition = 'opacity 0.2s'; setTimeout(() => card.remove(), 200); }
  leads = leads.filter(l => l.id !== realId);
  document.getElementById('lead-count').textContent = leads.length + ' pending leads';
}

init();
</script>
</body>
</html>`;

  res.status(200).send(html);
};
