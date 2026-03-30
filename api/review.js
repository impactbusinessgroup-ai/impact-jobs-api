// api/review.js
// AM lead review dashboard

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
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #1a1a1a; }
  .header { background: #0F1E3D; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 16px; font-weight: 500; }
  .header .meta { font-size: 13px; opacity: 0.7; }
  .container { max-width: 820px; margin: 0 auto; padding: 24px 16px; }
  .queue-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .queue-bar h2 { font-size: 15px; font-weight: 500; }
  .queue-bar .count { font-size: 13px; color: #666; }
  .pill { display: inline-block; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; margin-left: 6px; }
  .pill-eng { background: #E1F5EE; color: #085041; }
  .pill-acc { background: #E6F1FB; color: #0C447C; }
  .pill-it { background: #FAEEDA; color: #633806; }
  .pill-ss { background: #EAF3DE; color: #27500A; }
  .card { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .card.skipped { opacity: 0.4; pointer-events: none; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .company-name { font-size: 17px; font-weight: 600; }
  .company-meta { font-size: 13px; color: #666; margin-top: 3px; }
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .meta-item { background: #f8f8f8; border-radius: 8px; padding: 8px 12px; }
  .meta-item .label { font-size: 11px; color: #888; margin-bottom: 2px; }
  .meta-item .value { font-size: 13px; font-weight: 500; }
  .divider { border: none; border-top: 1px solid #f0f0f0; margin: 14px 0; }
  .section-label { font-size: 11px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .contact-block { border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px; margin-bottom: 10px; transition: border-color 0.2s; }
  .contact-block.sent { border-color: #5DCAA5; background: #f8fdfb; }
  .contact-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: #E6F1FB; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #0C447C; flex-shrink: 0; }
  .contact-name { font-size: 14px; font-weight: 500; }
  .contact-meta { font-size: 12px; color: #666; margin-top: 2px; }
  .email-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; min-height: 22px; }
  .email-placeholder { font-size: 12px; color: #aaa; font-style: italic; }
  .email-value { font-size: 12px; color: #1A4EA2; font-weight: 500; }
  .credit-note { font-size: 11px; color: #aaa; margin-top: 2px; }
  .badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; }
  .badge-suggested { background: #FAEEDA; color: #633806; }
  .badge-added { background: #E6F1FB; color: #0C447C; }
  .badge-sent { background: #E1F5EE; color: #085041; }
  textarea { width: 100%; font-size: 12px; line-height: 1.6; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; color: #1a1a1a; resize: vertical; font-family: inherit; min-height: 100px; margin-top: 8px; }
  textarea:focus { outline: none; border-color: #1A4EA2; background: white; }
  .subject-row { margin-bottom: 6px; }
  .subject-row input { width: 100%; font-size: 13px; padding: 7px 10px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; color: #1a1a1a; font-family: inherit; }
  .subject-row input:focus { outline: none; border-color: #1A4EA2; background: white; }
  .tab-row { display: flex; gap: 6px; margin-bottom: 8px; }
  .tab { font-size: 12px; padding: 4px 12px; border-radius: 20px; border: 1px solid #e0e0e0; cursor: pointer; color: #666; background: transparent; }
  .tab.active { background: #f0f0f0; color: #1a1a1a; font-weight: 500; border-color: #ccc; }
  .btn-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; align-items: center; }
  .btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #ddd; background: transparent; color: #1a1a1a; }
  .btn:hover { background: #f5f5f5; }
  .btn-primary { background: #0F1E3D; color: white; border-color: #0F1E3D; }
  .btn-primary:hover { background: #1a2d52; }
  .btn-linkedin { background: #0A66C2; color: white; border-color: #0A66C2; }
  .btn-linkedin:hover { background: #0958a8; }
  .btn-fetch { background: #FAEEDA; color: #633806; border-color: #EF9F27; }
  .btn-fetch:hover { background: #f5e0c0; }
  .btn-sent { background: #E1F5EE; color: #085041; border-color: #5DCAA5; cursor: default; }
  .btn-danger { color: #999; font-size: 12px; border: none; background: none; cursor: pointer; }
  .btn-danger:hover { color: #e24b4a; }
  .btn-block { font-size: 11px; padding: 4px 10px; border-radius: 6px; border: 1px solid #e0e0e0; background: transparent; color: #888; cursor: pointer; }
  .btn-block:hover { border-color: #e24b4a; color: #e24b4a; }
  .btn-unblock { font-size: 11px; padding: 4px 10px; border-radius: 6px; border: 1px solid #e24b4a; background: #fef2f2; color: #e24b4a; cursor: pointer; }
  .search-panel { border: 1px solid #e5e5e5; border-radius: 10px; padding: 12px; background: #f8f8f8; margin-bottom: 10px; }
  .search-panel .label { font-size: 12px; color: #666; margin-bottom: 6px; }
  .search-panel input { width: 100%; font-size: 13px; padding: 7px 10px; border: 1px solid #e0e0e0; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; }
  .search-panel input:focus { outline: none; border-color: #1A4EA2; }
  .search-results { margin-top: 6px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; background: white; display: none; }
  .search-result-item { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
  .search-result-item:last-child { border-bottom: none; }
  .search-result-item:hover { background: #f5f5f5; }
  .card-footer { display: flex; gap: 8px; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f0f0f0; }
  .block-row { display: flex; gap: 6px; margin-top: 8px; }
  .loading { text-align: center; padding: 60px; color: #888; font-size: 14px; }
  .empty { text-align: center; padding: 60px; color: #888; }
  .empty h3 { font-size: 16px; margin-bottom: 8px; }
  .empty p { font-size: 13px; }
  .jd-toggle { font-size: 12px; color: #1A4EA2; cursor: pointer; text-decoration: underline; margin-top: 4px; display: inline-block; }
  .jd-text { font-size: 12px; color: #555; line-height: 1.6; margin-top: 8px; background: #f8f8f8; padding: 10px; border-radius: 8px; display: none; white-space: pre-wrap; }
</style>
</head>
<body>

<div class="header">
  <h1>iMPact · Lead Review</h1>
  <span class="meta" id="header-meta">Loading...</span>
</div>

<div class="container">
  <div class="queue-bar">
    <h2>Good morning, Mark</h2>
    <span class="count" id="queue-count"></span>
  </div>
  <div id="leads-container"><div class="loading">Loading leads...</div></div>
</div>

<script>
const AM = { name: 'Mark Sapoznikov', email: 'msapoznikov@impactbusinessgroup.com' };
let leads = [];
let blocklist = { companies: [], titles: [] };
let contactCounters = {};

async function init() {
  const [leadsRes, blockRes] = await Promise.all([
    fetch('/api/leads').then(r => r.json()),
    fetch('/api/blocklist').then(r => r.json()),
  ]);
  leads = leadsRes.leads || [];
  blocklist = { companies: blockRes.companies || [], titles: blockRes.titles || [] };

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('header-meta').textContent = date;
  document.getElementById('queue-count').textContent = leads.length + ' leads today';

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
  const jd = lead.description ? lead.description.slice(0, 600) : '';

  return \`
  <div class="card" id="card-\${lead.id}">
    <div class="card-header">
      <div>
        <div class="company-name">\${lead.company} \${categoryPill(cat)}</div>
        <div class="company-meta">\${lead.location || ''}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="\${blocked ? 'btn-unblock' : 'btn-block'}" onclick="toggleBlockCompany('\${lead.company}', this)">
          \${blocked ? 'Unblock company' : 'Block company'}
        </button>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><div class="label">Job posting</div><div class="value">\${lead.jobTitle}</div></div>
      <div class="meta-item"><div class="label">Posted</div><div class="value">Today · \${lead.source || 'JSearch'}</div></div>
      <div class="meta-item"><div class="label">Category</div><div class="value">\${cat.charAt(0).toUpperCase() + cat.slice(1)}</div></div>
    </div>

    \${jd ? \`<span class="jd-toggle" onclick="toggleJD('\${lead.id}')">View job description</span>
    <div class="jd-text" id="jd-\${lead.id}">\${jd}\${lead.description && lead.description.length > 600 ? '...' : ''}</div>\` : ''}

    <div class="divider"></div>
    <div class="section-label">Contacts</div>
    <div id="contacts-\${lead.id}"></div>

    <div class="search-panel">
      <div class="label">Add contact from SmartSearch · \${lead.company}</div>
      <input type="text" placeholder="Search by name..." oninput="filterSS(this, '\${lead.id}')" onfocus="showSS('\${lead.id}')">
      <div class="search-results" id="ss-\${lead.id}">
        <div class="search-result-item" onclick="addContact('\${lead.id}', 'Sarah Johnson', 'HR Director')">
          <div><div style="font-weight:500;">Sarah Johnson</div><div style="font-size:12px;color:#888;">HR Director</div></div>
          <span style="font-size:12px;color:#888;">Add</span>
        </div>
        <div class="search-result-item" onclick="addContact('\${lead.id}', 'Mike Williams', 'Engineering Manager')">
          <div><div style="font-weight:500;">Mike Williams</div><div style="font-size:12px;color:#888;">Engineering Manager</div></div>
          <span style="font-size:12px;color:#888;">Add</span>
        </div>
        <div class="search-result-item" onclick="addContact('\${lead.id}', 'Tom Baker', 'Plant Manager')">
          <div><div style="font-weight:500;">Tom Baker</div><div style="font-size:12px;color:#888;">Plant Manager</div></div>
          <span style="font-size:12px;color:#888;">Add</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn btn-danger" onclick="skipLead('\${lead.id}')">Skip this lead</button>
      \${lead.jobUrl ? \`<a href="\${lead.jobUrl}" target="_blank" style="font-size:12px;color:#1A4EA2;">View job posting</a>\` : ''}
    </div>
  </div>\`;
}

function toggleJD(leadId) {
  const el = document.getElementById('jd-' + leadId);
  const toggle = el.previousElementSibling;
  if (el.style.display === 'block') {
    el.style.display = 'none';
    toggle.textContent = 'View job description';
  } else {
    el.style.display = 'block';
    toggle.textContent = 'Hide job description';
  }
}

function addContact(leadId, name, title) {
  if (!contactCounters[leadId]) contactCounters[leadId] = 0;
  contactCounters[leadId]++;
  const cid = leadId + '-c' + contactCounters[leadId];
  const ini = initials(name);

  const block = document.createElement('div');
  block.className = 'contact-block';
  block.id = 'cb-' + cid;
  block.innerHTML = \`
    <div class="contact-header">
      <div class="avatar">\${ini}</div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="contact-name">\${name}</span>
          <span class="badge badge-added">Added from SS</span>
        </div>
        <div class="contact-meta">\${title}</div>
        <div class="email-row">
          <span class="email-placeholder" id="ep-\${cid}">No email fetched yet</span>
          <span class="email-value" id="ev-\${cid}" style="display:none;"></span>
        </div>
        <div class="credit-note" id="cn-\${cid}">Fetching email uses 2 credits</div>
      </div>
      <button class="btn-danger" onclick="removeContact('\${cid}')">Remove</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button class="btn btn-fetch" id="fb-\${cid}" onclick="fetchEmail('\${cid}', '\${name}', '\${title}')">Fetch email (2 credits)</button>
      <a href="https://www.google.com/search?q=\${encodeURIComponent(name + ' ' + title + ' LinkedIn')}" target="_blank" class="btn">LinkedIn</a>
      <button class="btn-danger" onclick="removeContact('\${cid}')">Remove contact</button>
    </div>
    <div id="draft-section-\${cid}" style="display:none;">
      <div class="tab-row">
        <button class="tab active" onclick="switchTab('\${cid}','email',this)">Email</button>
        <button class="tab" onclick="switchTab('\${cid}','linkedin',this)">LinkedIn</button>
      </div>
      <div id="email-pane-\${cid}">
        <div class="subject-row"><input type="text" id="subj-\${cid}" value="Partnering on your search"></div>
        <textarea id="email-draft-\${cid}"></textarea>
        <div class="btn-row">
          <button class="btn btn-primary" id="send-btn-\${cid}" onclick="openOutlook('\${cid}')">Open in Outlook</button>
        </div>
      </div>
      <div id="li-pane-\${cid}" style="display:none;">
        <textarea id="li-draft-\${cid}"></textarea>
        <div class="btn-row">
          <button class="btn btn-linkedin" onclick="copyLI('\${cid}', this)">Copy for LinkedIn</button>
        </div>
      </div>
    </div>
  \`;

  document.getElementById('contacts-' + leadId).appendChild(block);
  document.getElementById('ss-' + leadId).style.display = 'none';
}

function removeContact(cid) {
  const el = document.getElementById('cb-' + cid);
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }
}

function fetchEmail(cid, name, title) {
  const btn = document.getElementById('fb-' + cid);
  btn.textContent = 'Fetching...';
  btn.disabled = true;

  setTimeout(() => {
    const firstName = name.split(' ')[0].toLowerCase();
    const lastName = name.split(' ').slice(-1)[0].toLowerCase();
    const email = firstName + '.' + lastName + '@company.com';

    document.getElementById('ep-' + cid).style.display = 'none';
    document.getElementById('ev-' + cid).style.display = 'inline';
    document.getElementById('ev-' + cid).textContent = email;
    document.getElementById('cn-' + cid).textContent = '2 credits used';
    btn.textContent = 'Email fetched';
    btn.className = 'btn btn-sent';

    const emailDraft = \`Hi \${name.split(' ')[0]},\\n\\nI noticed your company is actively hiring and wanted to reach out. At iMPact Business Group we specialize in placing top talent in \${title.toLowerCase().includes('account') ? 'Accounting & Finance' : title.toLowerCase().includes('it') || title.toLowerCase().includes('tech') ? 'IT' : 'Engineering & Manufacturing'} roles across the region.\\n\\nWould you be open to a quick 15-minute call to learn how we work?\\n\\n[Calendly link]\\n\\nMark Sapoznikov\\niMPact Business Group\`;
    const liDraft = \`Hi \${name.split(' ')[0]}, I noticed your company is actively hiring and wanted to connect. At iMPact Business Group we specialize in placing top talent in your space. Would you be open to a quick chat? [Calendly link] - Mark\`;

    document.getElementById('email-draft-' + cid).value = emailDraft;
    document.getElementById('li-draft-' + cid).value = liDraft;
    document.getElementById('draft-section-' + cid).style.display = 'block';
  }, 600);
}

function switchTab(cid, tab, btn) {
  document.querySelectorAll(\`#cb-\${cid} .tab\`).forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('email-pane-' + cid).style.display = tab === 'email' ? 'block' : 'none';
  document.getElementById('li-pane-' + cid).style.display = tab === 'linkedin' ? 'block' : 'none';
}

function openOutlook(cid) {
  const email = document.getElementById('ev-' + cid).textContent;
  const subject = encodeURIComponent(document.getElementById('subj-' + cid).value);
  const body = encodeURIComponent(document.getElementById('email-draft-' + cid).value);
  window.location.href = \`mailto:\${email}?subject=\${subject}&body=\${body}\`;
  document.getElementById('send-btn-' + cid).textContent = 'Sent';
  document.getElementById('send-btn-' + cid).className = 'btn btn-sent';
  document.getElementById('cb-' + cid).classList.add('sent');
}

function copyLI(cid, btn) {
  navigator.clipboard.writeText(document.getElementById('li-draft-' + cid).value).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy for LinkedIn', 2000);
  });
}

function showSS(leadId) {
  document.getElementById('ss-' + leadId).style.display = 'block';
}

function filterSS(input, leadId) {
  const val = input.value.toLowerCase();
  const results = document.getElementById('ss-' + leadId);
  results.style.display = 'block';
  results.querySelectorAll('.search-result-item').forEach(item => {
    const name = item.querySelector('div > div').textContent.toLowerCase();
    item.style.display = name.includes(val) ? 'flex' : 'none';
  });
}

async function toggleBlockCompany(company, btn) {
  const blocked = btn.classList.contains('btn-unblock');
  const method = blocked ? 'DELETE' : 'POST';
  await fetch('/api/blocklist', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'companies', value: company }),
  });
  if (blocked) {
    blocklist.companies = blocklist.companies.filter(c => c !== company);
    btn.textContent = 'Block company';
    btn.className = 'btn-block';
  } else {
    blocklist.companies.push(company);
    btn.textContent = 'Unblock company';
    btn.className = 'btn-unblock';
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
  card.style.transition = 'opacity 0.3s';
  setTimeout(() => card.remove(), 300);
  leads = leads.filter(l => l.id !== leadId);
  document.getElementById('queue-count').textContent = leads.length + ' leads today';
}

init();
</script>
</body>
</html>`;

  res.status(200).send(html);
};
