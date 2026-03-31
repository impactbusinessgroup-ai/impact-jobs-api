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
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a1a; }

  .header { background: #0F1E3D; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .header-logo { height: 36px; }
  .header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
  .header-meta { color: rgba(255,255,255,0.6); font-size: 13px; }

  .container { max-width: 860px; margin: 0 auto; padding: 28px 16px; }

  .queue-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .queue-bar h2 { font-size: 22px; font-weight: 600; color: #0F1E3D; }
  .queue-bar .sub { font-size: 13px; color: #888; margin-top: 2px; }
  .lead-count { background: #0F1E3D; color: white; font-size: 13px; font-weight: 500; padding: 6px 16px; border-radius: 20px; }

  .card { background: white; border-radius: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow 0.2s; }
  .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.11); }

  .card-top { background: linear-gradient(135deg, #0F1E3D 0%, #1A4EA2 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .card-top-left {}
  .company-name { font-size: 20px; font-weight: 700; color: white; margin-bottom: 4px; }
  .company-location { font-size: 13px; color: rgba(255,255,255,0.65); }
  .card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

  .pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.3px; }
  .pill-eng { background: rgba(29,158,117,0.25); color: #7FFFDC; border: 1px solid rgba(93,202,165,0.4); }
  .pill-acc { background: rgba(26,78,162,0.4); color: #93C5FD; border: 1px solid rgba(147,197,253,0.4); }
  .pill-it { background: rgba(239,159,39,0.25); color: #FCD34D; border: 1px solid rgba(252,211,77,0.3); }

  .btn-block-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); cursor: pointer; transition: all 0.2s; }
  .btn-block-top:hover { background: rgba(255,255,255,0.2); color: white; }
  .btn-unblock-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(226,75,74,0.6); background: rgba(226,75,74,0.15); color: #FCA5A5; cursor: pointer; }

  .card-body { padding: 20px 24px; }

  .job-info-row { display: flex; gap: 12px; margin-bottom: 18px; align-items: stretch; }
  .job-title-block { flex: 1; background: #f8f9fc; border-radius: 12px; padding: 14px 16px; border-left: 4px solid #1A4EA2; }
  .job-title-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .job-title-value { font-size: 15px; font-weight: 600; color: #0F1E3D; }

  .cal-block { background: #f8f9fc; border-radius: 12px; overflow: hidden; width: 80px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
  .cal-month { background: #1A4EA2; color: white; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 100%; text-align: center; padding: 5px 0; }
  .cal-day { font-size: 26px; font-weight: 700; color: #0F1E3D; padding: 6px 0 4px; }
  .cal-year { font-size: 10px; color: #999; padding-bottom: 6px; }

  .jd-toggle { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #1A4EA2; cursor: pointer; margin-bottom: 16px; font-weight: 500; }
  .jd-toggle svg { transition: transform 0.2s; }
  .jd-toggle.open svg { transform: rotate(180deg); }

  .jd-popup-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center; }
  .jd-popup-overlay.open { display: flex; }
  .jd-popup { background: white; border-radius: 16px; max-width: 640px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
  .jd-popup-header { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
  .jd-popup-header h3 { font-size: 16px; font-weight: 600; color: #0F1E3D; }
  .jd-popup-close { font-size: 20px; color: #999; cursor: pointer; line-height: 1; background: none; border: none; }
  .jd-popup-body { padding: 20px 24px; overflow-y: auto; font-size: 13px; line-height: 1.7; color: #444; white-space: pre-wrap; }

  .section-label { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

  .contact-block { border: 1px solid #eef0f4; border-radius: 12px; padding: 16px; margin-bottom: 10px; transition: all 0.2s; background: #fafbfd; }
  .contact-block.sent { border-color: #5DCAA5; background: #f0fdf8; }
  .contact-header { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #1A4EA2, #0F1E3D); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }
  .avatar-am { background: linear-gradient(135deg, #1D9E75, #085041); }
  .contact-info { flex: 1; }
  .contact-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
  .contact-name { font-size: 14px; font-weight: 600; color: #0F1E3D; }
  .contact-title-sub { font-size: 12px; color: #666; }
  .email-row { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
  .email-placeholder { font-size: 12px; color: #bbb; font-style: italic; }
  .email-value { font-size: 12px; color: #1A4EA2; font-weight: 500; }
  .credit-note { font-size: 11px; color: #bbb; }

  .badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
  .badge-suggested { background: #FEF3C7; color: #92400E; }
  .badge-added { background: #DBEAFE; color: #1E40AF; }
  .badge-sent { background: #D1FAE5; color: #065F46; }

  .contact-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
  .btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #e0e3ea; background: white; color: #333; transition: all 0.15s; }
  .btn:hover { background: #f5f7fa; }
  .btn-primary { background: #0F1E3D; color: white; border-color: #0F1E3D; }
  .btn-primary:hover { background: #1a2f5a; }
  .btn-li { background: #0A66C2; color: white; border-color: #0A66C2; }
  .btn-li:hover { background: #0958a8; }
  .btn-fetch { background: #FEF3C7; color: #92400E; border-color: #F59E0B; }
  .btn-fetch:hover { background: #FDE68A; }
  .btn-sent { background: #D1FAE5; color: #065F46; border-color: #5DCAA5; cursor: default; }
  .btn-ghost { color: #999; font-size: 12px; border: none; background: none; cursor: pointer; padding: 4px 8px; }
  .btn-ghost:hover { color: #e24b4a; }

  .tab-row { display: flex; gap: 6px; margin: 12px 0 8px; }
  .tab { font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 1px solid #e0e3ea; cursor: pointer; color: #666; background: white; transition: all 0.15s; }
  .tab.active { background: #0F1E3D; color: white; border-color: #0F1E3D; }

  .subject-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid #e0e3ea; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; margin-bottom: 6px; }
  .subject-input:focus { outline: none; border-color: #1A4EA2; }
  textarea { width: 100%; font-size: 12px; line-height: 1.65; padding: 10px 12px; border: 1px solid #e0e3ea; border-radius: 8px; background: white; color: #1a1a1a; resize: vertical; font-family: inherit; min-height: 95px; }
  textarea:focus { outline: none; border-color: #1A4EA2; }

  .search-panel { border: 1px solid #eef0f4; border-radius: 12px; padding: 14px; background: #f8f9fc; margin-bottom: 12px; }
  .search-panel-label { font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500; }
  .search-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid #e0e3ea; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; }
  .search-input:focus { outline: none; border-color: #1A4EA2; }
  .search-results { margin-top: 6px; border: 1px solid #e0e3ea; border-radius: 10px; overflow: hidden; background: white; }
  .search-result-item { padding: 10px 14px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f5f5f5; display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; }
  .search-result-item:last-child { border-bottom: none; }
  .search-result-item:hover { background: #f5f7fa; }
  .search-add-btn { font-size: 11px; font-weight: 600; color: #1A4EA2; background: #EFF6FF; padding: 3px 10px; border-radius: 6px; }

  .card-footer { display: flex; gap: 8px; align-items: center; padding: 16px 24px; border-top: 1px solid #f0f2f5; background: #fafbfc; }
  .btn-skip { color: #999; font-size: 13px; border: none; background: none; cursor: pointer; }
  .btn-skip:hover { color: #e24b4a; }
  .view-posting-link { font-size: 12px; color: #1A4EA2; text-decoration: none; font-weight: 500; }
  .view-posting-link:hover { text-decoration: underline; }

  .loading { text-align: center; padding: 80px; color: #888; font-size: 15px; }
  .empty { text-align: center; padding: 80px; color: #888; }
  .empty h3 { font-size: 18px; margin-bottom: 8px; color: #444; }

  .divider { border: none; border-top: 1px solid #f0f2f5; margin: 16px 0; }
</style>
</head>
<body>

<div class="header" style="position:relative;">
  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact Business Group">
  <div class="header-center">Lead Review</div>
  <div class="header-meta" id="header-date"></div>
</div>

<!-- JD Popup -->
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
    <div class="lead-count" id="lead-count"></div>
  </div>
  <div id="leads-container"><div class="loading">Loading leads...</div></div>
</div>

<script>
const AM = { name: 'Mark Sapoznikov', email: 'msapoznikov@impactbusinessgroup.com' };
let leads = [];
let blocklist = { companies: [], titles: [] };
let contactCounters = {};

async function init() {
  const today = new Date();
  document.getElementById('header-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('queue-sub').textContent = 'All pending leads · ' + today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const [leadsRes, blockRes] = await Promise.all([
    fetch('/api/leads').then(r => r.json()),
    fetch('/api/blocklist').then(r => r.json()),
  ]);
  leads = leadsRes.leads || [];
  blocklist = { companies: blockRes.companies || [], titles: blockRes.titles || [] };
  document.getElementById('lead-count').textContent = leads.length + ' leads today';
  renderLeads();
}

function categoryPill(cat) {
  if (cat === 'accounting') return '<span class="pill pill-acc">Accounting</span>';
  if (cat === 'it') return '<span class="pill pill-it">IT</span>';
  return '<span class="pill pill-eng">Engineering</span>';
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function isCompanyBlocked(company) {
  return blocklist.companies.some(c => c.toLowerCase() === company.toLowerCase());
}

function formatPostDate(lead) {
  const d = lead.createdAt ? new Date(lead.createdAt) : new Date();
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return { month, day, year };
}

function renderLeads() {
  const container = document.getElementById('leads-container');
  if (!leads.length) {
    container.innerHTML = '<div class="empty"><h3>No leads today</h3><p>Check back after the morning fetch runs.</p></div>';
    return;
  }
  container.innerHTML = leads.map((lead, idx) => renderCard(lead, idx)).join('');
}

function renderCard(lead, idx) {
  const blocked = isCompanyBlocked(lead.company);
  const cat = lead.category || 'engineering';
  const { month, day, year } = formatPostDate(lead);
  const hasJD = lead.description && lead.description.length > 0;

  return \`
  <div class="card" id="card-\${lead.id}">
    <div class="card-top">
      <div class="card-top-left">
        <div class="company-name">\${lead.company}</div>
        <div class="company-location">\${lead.location || ''}</div>
      </div>
      <div class="card-top-right">
        \${categoryPill(cat)}
        <button class="\${blocked ? 'btn-unblock-top' : 'btn-block-top'}" onclick="toggleBlockCompany('\${lead.company}', this)">
          \${blocked ? 'Unblock company' : 'Block company'}
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

      \${hasJD ? \`<span class="jd-toggle" onclick="openJD('\${lead.id}', '\${lead.company}', this)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        View job description
      </span>\` : ''}

      <div class="divider"></div>
      <div class="section-label">Contacts</div>
      <div id="contacts-\${lead.id}"></div>

      <div class="search-panel">
        <div class="search-panel-label">Add contact from SmartSearch &middot; \${lead.company}</div>
        <input class="search-input" type="text" placeholder="Search contacts or type to filter..." oninput="filterSS(this, '\${lead.id}')" onfocus="showSS('\${lead.id}')">
        <div class="search-results" id="ss-\${lead.id}" style="display:none;">
          <div class="search-result-item" onclick="addContact('\${lead.id}', 'Sarah Johnson', 'HR Director')">
            <div><div style="font-size:13px;font-weight:500;">Sarah Johnson</div><div style="font-size:11px;color:#888;">HR Director</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
          <div class="search-result-item" onclick="addContact('\${lead.id}', 'Mike Williams', 'Engineering Manager')">
            <div><div style="font-size:13px;font-weight:500;">Mike Williams</div><div style="font-size:11px;color:#888;">Engineering Manager</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
          <div class="search-result-item" onclick="addContact('\${lead.id}', 'Tom Baker', 'Plant Manager')">
            <div><div style="font-size:13px;font-weight:500;">Tom Baker</div><div style="font-size:11px;color:#888;">Plant Manager</div></div>
            <span class="search-add-btn">+ Add</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-skip" onclick="skipLead('\${lead.id}')">Skip this lead</button>
      \${lead.jobUrl ? \`<a class="view-posting-link" href="\${lead.jobUrl}" target="_blank">View job posting &#8599;</a>\` : ''}
    </div>
  </div>\`;
}

// JD popup
const jdData = {};
function openJD(leadId, company, toggleEl) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;
  document.getElementById('jd-popup-title').textContent = company + ' \u2013 Job Description';
  document.getElementById('jd-popup-body').textContent = lead.description || 'No description available.';
  document.getElementById('jd-overlay').classList.add('open');
}
function closeJD(e) { if (e.target === document.getElementById('jd-overlay')) document.getElementById('jd-overlay').classList.remove('open'); }
function closeJDBtn() { document.getElementById('jd-overlay').classList.remove('open'); }

// Close SS dropdown on outside click
document.addEventListener('click', function(e) {
  document.querySelectorAll('[id^="ss-"]').forEach(el => {
    if (!el.parentElement.contains(e.target)) el.style.display = 'none';
  });
});

function showSS(leadId) {
  const el = document.getElementById('ss-' + leadId);
  if (el) el.style.display = 'block';
}

function filterSS(input, leadId) {
  const val = input.value.toLowerCase();
  const results = document.getElementById('ss-' + leadId);
  if (!results) return;
  results.style.display = 'block';
  results.querySelectorAll('.search-result-item').forEach(item => {
    const name = item.querySelector('div > div').textContent.toLowerCase();
    item.style.display = name.includes(val) ? 'flex' : 'none';
  });
}

function addContact(leadId, name, title) {
  if (!contactCounters[leadId]) contactCounters[leadId] = 0;
  contactCounters[leadId]++;
  const cid = leadId + '-c' + contactCounters[leadId];
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
      <button class="btn-ghost" onclick="removeContact('\${cid}')" title="Remove">&#x2715;</button>
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

  document.getElementById('contacts-' + leadId).appendChild(block);
  document.getElementById('ss-' + leadId).style.display = 'none';
}

function removeContact(cid) {
  const el = document.getElementById('cb-' + cid);
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.25s'; setTimeout(() => el.remove(), 250); }
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
    const cat = 'Engineering';
    document.getElementById('subj-' + cid).value = 'Partnering on your ' + cat + ' search';
    document.getElementById('edraft-' + cid).value = 'Hi ' + name.split(' ')[0] + ',\\n\\nI noticed your company is actively hiring and wanted to reach out. At iMPact Business Group we specialize in placing top ' + cat + ' talent across the region and have helped similar companies reduce time-to-hire significantly.\\n\\nWould you be open to a quick 15-minute call?\\n\\n[Calendly link]\\n\\nMark Sapoznikov\\niMPact Business Group';
    document.getElementById('lidraft-' + cid).value = 'Hi ' + name.split(' ')[0] + ', I noticed your company is actively hiring and wanted to connect. At iMPact Business Group we place top ' + cat + ' talent across the region. Would you be open to a quick chat? [Calendly link] - Mark';
    document.getElementById('draft-' + cid).style.display = 'block';
  }, 500);
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
  const btn = document.getElementById('send-' + cid);
  btn.textContent = 'Sent';
  btn.className = 'btn btn-sent';
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
    btn.textContent = 'Unblock company';
    btn.className = 'btn-unblock-top';
  }
}

async function skipLead(leadId) {
  await fetch('/api/leads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: leadId, updates: { status: 'skipped' } }),
  });
  const card = document.getElementById('card-' + leadId);
  card.style.opacity = '0';
  card.style.transition = 'opacity 0.25s';
  setTimeout(() => card.remove(), 250);
  leads = leads.filter(l => l.id !== leadId);
  document.getElementById('lead-count').textContent = leads.length + ' leads today';
}

init();
</script>
</body>
</html>`;

  res.status(200).send(html);
};
