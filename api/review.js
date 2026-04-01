// api/review.js

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html');

  var html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>iMPact Lead Review</title>\n' +
'<style>\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; background: #ECEEF2; color: #1a1a1a; }\n' +
'.header { background: #0F1E3D; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }\n' +
'.header-logo { height: 34px; }\n' +
'.header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }\n' +
'.header-meta { color: rgba(255,255,255,0.55); font-size: 12px; text-align: right; }\n' +
'.container { max-width: 880px; margin: 0 auto; padding: 28px 16px 60px; }\n' +
'.queue-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }\n' +
'.queue-bar h2 { font-size: 24px; font-weight: 700; color: #0F1E3D; }\n' +
'.queue-bar .sub { font-size: 13px; color: #888; margin-top: 3px; }\n' +
'.lead-count-badge { background: #FFA000; color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; box-shadow: 0 2px 8px rgba(255,160,0,0.35); }\n' +
'.card { background: white; border-radius: 18px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); transition: box-shadow 0.2s, transform 0.2s; }\n' +
'.card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.12); transform: translateY(-1px); }\n' +
'.card-top { background: linear-gradient(135deg, #0B1729 0%, #1A3A6E 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }\n' +
'.card-top-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }\n' +
'.company-logo-wrap { width: 48px; height: 48px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }\n' +
'.company-initials { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #FFA000, #E8620A); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; flex-shrink: 0; letter-spacing: 0.5px; }\n' +
'.company-name { font-size: 18px; font-weight: 700; color: white; line-height: 1.2; }\n' +
'.company-location { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px; }\n' +
'.card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }\n' +
'.pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.4px; text-transform: uppercase; }\n' +
'.pill-eng { background: rgba(29,158,117,0.3); color: #6EE7C7; border: 1px solid rgba(110,231,199,0.3); }\n' +
'.pill-acc { background: rgba(99,179,237,0.2); color: #93C5FD; border: 1px solid rgba(147,197,253,0.3); }\n' +
'.pill-it { background: rgba(255,160,0,0.25); color: #FCD34D; border: 1px solid rgba(252,211,77,0.3); }\n' +
'.btn-block-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); cursor: pointer; transition: all 0.2s; white-space: nowrap; }\n' +
'.btn-block-top:hover { background: rgba(255,255,255,0.18); color: white; }\n' +
'.btn-unblock-top { font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(252,75,74,0.5); background: rgba(226,75,74,0.15); color: #FCA5A5; cursor: pointer; white-space: nowrap; }\n' +
'.card-body { padding: 20px 24px; }\n' +
'.job-info-row { display: flex; gap: 14px; margin-bottom: 18px; align-items: stretch; }\n' +
'.job-title-block { flex: 1; background: #F4F6FB; border-radius: 12px; padding: 14px 16px; border-left: 4px solid #FFA000; }\n' +
'.job-title-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; font-weight: 600; }\n' +
'.job-title-value { font-size: 15px; font-weight: 700; color: #0F1E3D; line-height: 1.3; }\n' +
'.cal-block { background: white; border-radius: 12px; overflow: hidden; width: 76px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid #E8ECF4; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }\n' +
'.cal-month { background: #1A4EA2; color: white; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; width: 100%; text-align: center; padding: 5px 0; }\n' +
'.cal-day { font-size: 28px; font-weight: 800; color: #0F1E3D; padding: 6px 0 2px; line-height: 1; }\n' +
'.cal-year { font-size: 10px; color: #aaa; padding-bottom: 8px; font-weight: 500; }\n' +
'.jd-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #1A4EA2; cursor: pointer; margin-bottom: 16px; font-weight: 600; background: #EEF3FF; padding: 5px 12px; border-radius: 6px; border: none; transition: background 0.15s; }\n' +
'.jd-btn:hover { background: #DBEAFE; }\n' +
'.jd-popup-overlay { display: none; position: fixed; inset: 0; background: rgba(10,20,50,0.6); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(3px); }\n' +
'.jd-popup-overlay.open { display: flex; }\n' +
'.jd-popup { background: white; border-radius: 18px; max-width: 660px; width: 92%; max-height: 82vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }\n' +
'.jd-popup-header { padding: 20px 24px 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }\n' +
'.jd-popup-header h3 { font-size: 16px; font-weight: 700; color: #0F1E3D; }\n' +
'.jd-popup-close { width: 28px; height: 28px; border-radius: 50%; background: #f0f2f5; border: none; cursor: pointer; font-size: 14px; color: #666; display: flex; align-items: center; justify-content: center; }\n' +
'.jd-popup-close:hover { background: #e0e3ea; }\n' +
'.jd-popup-body { padding: 20px 24px; overflow-y: auto; font-size: 13px; line-height: 1.75; color: #444; white-space: pre-wrap; }\n' +
'.divider { border: none; border-top: 1px solid #F0F2F5; margin: 16px 0; }\n' +
'.section-label { font-size: 10px; font-weight: 700; color: #AAB0BE; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 12px; }\n' +
'.contact-block { border: 1.5px solid #EEF0F5; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; transition: all 0.2s; background: #FAFBFD; }\n' +
'.contact-block.sent { border-color: #5DCAA5; background: #F0FDF8; }\n' +
'.contact-header { display: flex; align-items: center; gap: 12px; }\n' +
'.avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #1A4EA2, #0F1E3D); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }\n' +
'.avatar-am { background: linear-gradient(135deg, #1D9E75, #085041); }\n' +
'.contact-info { flex: 1; }\n' +
'.contact-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; flex-wrap: wrap; }\n' +
'.contact-name { font-size: 14px; font-weight: 700; color: #0F1E3D; }\n' +
'.contact-title-sub { font-size: 12px; color: #777; }\n' +
'.email-row { display: flex; align-items: center; gap: 6px; margin-top: 5px; flex-wrap: wrap; }\n' +
'.email-placeholder { font-size: 12px; color: #C0C5D0; font-style: italic; }\n' +
'.email-value { font-size: 12px; color: #1A4EA2; font-weight: 600; }\n' +
'.credit-note { font-size: 11px; color: #C0C5D0; margin-top: 2px; }\n' +
'.badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.3px; }\n' +
'.badge-suggested { background: #FEF3C7; color: #92400E; }\n' +
'.badge-added { background: #DBEAFE; color: #1E40AF; }\n' +
'.badge-sent { background: #D1FAE5; color: #065F46; }\n' +
'.contact-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; align-items: center; }\n' +
'.btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #E0E3EA; background: white; color: #333; transition: all 0.15s; }\n' +
'.btn:hover { background: #F5F7FA; border-color: #C8CDD8; }\n' +
'.btn-primary { background: #0F1E3D; color: white; border-color: #0F1E3D; }\n' +
'.btn-primary:hover { background: #1a2f5a; }\n' +
'.btn-li { background: #0A66C2; color: white; border-color: #0A66C2; }\n' +
'.btn-li:hover { background: #0958a8; }\n' +
'.btn-fetch { background: #FEF3C7; color: #92400E; border-color: #F59E0B; }\n' +
'.btn-fetch:hover { background: #FDE68A; }\n' +
'.btn-sent { background: #D1FAE5; color: #065F46; border-color: #5DCAA5; cursor: default; }\n' +
'.btn-ghost { color: #B0B8C8; font-size: 12px; border: none; background: none; cursor: pointer; padding: 4px 6px; font-weight: 500; }\n' +
'.btn-ghost:hover { color: #e24b4a; }\n' +
'.tab-row { display: flex; gap: 6px; margin: 12px 0 8px; }\n' +
'.tab { font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 1.5px solid #E0E3EA; cursor: pointer; color: #666; background: white; font-weight: 500; transition: all 0.15s; }\n' +
'.tab.active { background: #0F1E3D; color: white; border-color: #0F1E3D; }\n' +
'.subject-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; margin-bottom: 6px; }\n' +
'.subject-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'textarea { width: 100%; font-size: 12px; line-height: 1.7; padding: 10px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; resize: vertical; font-family: inherit; min-height: 95px; }\n' +
'textarea:focus { outline: none; border-color: #1A4EA2; }\n' +
'.search-panel { border: 1.5px solid #EEF0F5; border-radius: 12px; padding: 14px; background: #F8F9FC; margin-bottom: 12px; }\n' +
'.search-panel-label { font-size: 12px; color: #777; margin-bottom: 8px; font-weight: 600; }\n' +
'.search-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1.5px solid #E0E3EA; border-radius: 8px; background: white; color: #1a1a1a; font-family: inherit; }\n' +
'.search-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'.search-results { margin-top: 8px; border: 1.5px solid #E0E3EA; border-radius: 10px; overflow: hidden; background: white; }\n' +
'.search-result-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #F5F5F5; display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; }\n' +
'.search-result-item:last-child { border-bottom: none; }\n' +
'.search-result-item:hover { background: #F5F7FA; }\n' +
'.search-add-btn { font-size: 11px; font-weight: 700; color: #1A4EA2; background: #EEF3FF; padding: 3px 10px; border-radius: 6px; }\n' +
'.card-footer { display: flex; gap: 10px; align-items: center; padding: 14px 24px; border-top: 1px solid #F0F2F5; background: #F8F9FC; }\n' +
'.btn-skip { color: #B0B8C8; font-size: 13px; border: none; background: none; cursor: pointer; font-weight: 500; }\n' +
'.btn-skip:hover { color: #e24b4a; }\n' +
'.view-posting-link { font-size: 12px; color: #1A4EA2; text-decoration: none; font-weight: 600; background: #EEF3FF; padding: 5px 12px; border-radius: 8px; }\n' +
'.view-posting-link:hover { background: #DBEAFE; }\n' +
'.loading { text-align: center; padding: 80px; color: #888; font-size: 15px; }\n' +
'.empty { text-align: center; padding: 80px; }\n' +
'.empty h3 { font-size: 18px; margin-bottom: 8px; color: #444; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<div class="header" style="position:relative;">\n' +
'  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact">\n' +
'  <div class="header-center">Lead Review</div>\n' +
'  <div class="header-meta" id="header-date"></div>\n' +
'</div>\n' +
'\n' +
'<div class="jd-popup-overlay" id="jd-overlay" onclick="closeJD(event)">\n' +
'  <div class="jd-popup">\n' +
'    <div class="jd-popup-header">\n' +
'      <h3 id="jd-popup-title">Job Description</h3>\n' +
'      <button class="jd-popup-close" onclick="closeJDBtn()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div class="jd-popup-body" id="jd-popup-body"></div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="container">\n' +
'  <div class="queue-bar">\n' +
'    <div>\n' +
'      <h2>Good morning, Mark</h2>\n' +
'      <div class="sub" id="queue-sub"></div>\n' +
'    </div>\n' +
'    <div class="lead-count-badge" id="lead-count"></div>\n' +
'  </div>\n' +
'  <div id="leads-container"><div class="loading">Loading leads...</div></div>\n' +
'</div>\n' +
'\n' +
'<script>\n' +
'var AM = { name: \'Mark Sapoznikov\', email: \'msapoznikov@impactbusinessgroup.com\' };\n' +
'var leads = [];\n' +
'var blocklist = { companies: [], titles: [] };\n' +
'var contactCounters = {};\n' +
'var logoCache = {};\n' +
'\n' +
'function getSafeId(id) {\n' +
'  return id.replace(/[^a-zA-Z0-9]/g, \'_\');\n' +
'}\n' +
'\n' +
'async function fetchLogo(company, website, safeId) {\n' +
'  var cacheKey = company.toLowerCase();\n' +
'  if (logoCache[cacheKey] !== undefined) {\n' +
'    applyLogo(safeId, logoCache[cacheKey]);\n' +
'    return;\n' +
'  }\n' +
'  var domain = \'\';\n' +
'  if (website) {\n' +
'    try { domain = new URL(website).hostname.replace(\'www.\', \'\'); } catch(e) {}\n' +
'  }\n' +
'  if (!domain) {\n' +
'    domain = company.toLowerCase().replace(/[^a-z0-9]/g, \'\').slice(0, 20) + \'.com\';\n' +
'  }\n' +
'  try {\n' +
'    var res = await fetch(\'/api/logo?domain=\' + encodeURIComponent(domain));\n' +
'    var data = await res.json();\n' +
'    var url = data.url || null;\n' +
'    logoCache[cacheKey] = url;\n' +
'    applyLogo(safeId, url);\n' +
'  } catch(e) {\n' +
'    logoCache[cacheKey] = null;\n' +
'    applyLogo(safeId, null);\n' +
'  }\n' +
'}\n' +
'\n' +
'function applyLogo(safeId, url) {\n' +
'  var wrap = document.getElementById(\'logo-\' + safeId);\n' +
'  var ini = document.getElementById(\'ini-\' + safeId);\n' +
'  if (!wrap) return;\n' +
'  if (url) {\n' +
'    var img = document.createElement(\'img\');\n' +
'    img.src = url;\n' +
'    img.style.cssText = \'width:100%;height:100%;object-fit:contain;padding:4px;\';\n' +
'    img.onerror = function() {\n' +
'      wrap.style.display = \'none\';\n' +
'      if (ini) ini.style.display = \'flex\';\n' +
'    };\n' +
'    wrap.innerHTML = \'\';\n' +
'    wrap.appendChild(img);\n' +
'    wrap.style.display = \'flex\';\n' +
'    if (ini) ini.style.display = \'none\';\n' +
'  } else {\n' +
'    wrap.style.display = \'none\';\n' +
'    if (ini) ini.style.display = \'flex\';\n' +
'  }\n' +
'}\n' +
'\n' +
'async function init() {\n' +
'  var today = new Date();\n' +
'  document.getElementById(\'header-date\').textContent = today.toLocaleDateString(\'en-US\', { weekday: \'long\', month: \'long\', day: \'numeric\' });\n' +
'  document.getElementById(\'queue-sub\').textContent = \'All pending leads\';\n' +
'  try {\n' +
'    var results = await Promise.all([\n' +
'      fetch(\'/api/leads\').then(function(r) { return r.json(); }),\n' +
'      fetch(\'/api/blocklist\').then(function(r) { return r.json(); })\n' +
'    ]);\n' +
'    leads = results[0].leads || [];\n' +
'    blocklist = { companies: results[1].companies || [], titles: results[1].titles || [] };\n' +
'    document.getElementById(\'lead-count\').textContent = leads.length + \' pending leads\';\n' +
'    renderLeads();\n' +
'    leads.forEach(function(lead) {\n' +
'      var safeId = getSafeId(lead.id);\n' +
'      fetchLogo(lead.company, lead.employerWebsite || \'\', safeId);\n' +
'    });\n' +
'  } catch(e) {\n' +
'    console.error(\'Init error:\', e);\n' +
'    document.getElementById(\'leads-container\').innerHTML = \'<div class="loading">Error loading leads. Check console.</div>\';\n' +
'  }\n' +
'}\n' +
'\n' +
'function categoryPill(cat) {\n' +
'  if (cat === \'accounting\') return \'<span class="pill pill-acc">Accounting</span>\';\n' +
'  if (cat === \'it\') return \'<span class="pill pill-it">IT</span>\';\n' +
'  return \'<span class="pill pill-eng">Engineering</span>\';\n' +
'}\n' +
'\n' +
'function initials(name) {\n' +
'  return name.split(\' \').map(function(n) { return n[0]; }).join(\'\').toUpperCase().slice(0, 2);\n' +
'}\n' +
'\n' +
'function companyInitials(name) {\n' +
'  var words = name.trim().split(/\\s+/);\n' +
'  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();\n' +
'  return (words[0][0] + words[1][0]).toUpperCase();\n' +
'}\n' +
'\n' +
'function isCompanyBlocked(company) {\n' +
'  return blocklist.companies.some(function(c) { return c.toLowerCase() === company.toLowerCase(); });\n' +
'}\n' +
'\n' +
'function formatPostDate(lead) {\n' +
'  var d = lead.createdAt ? new Date(lead.createdAt) : new Date();\n' +
'  return {\n' +
'    month: d.toLocaleString(\'en-US\', { month: \'short\' }).toUpperCase(),\n' +
'    day: d.getDate(),\n' +
'    year: d.getFullYear()\n' +
'  };\n' +
'}\n' +
'\n' +
'function renderLeads() {\n' +
'  var container = document.getElementById(\'leads-container\');\n' +
'  if (!leads.length) {\n' +
'    container.innerHTML = \'<div class="empty"><h3>No pending leads</h3><p style="color:#aaa;font-size:13px;">Check back after the morning fetch runs.</p></div>\';\n' +
'    return;\n' +
'  }\n' +
'  container.innerHTML = leads.map(function(lead) { return renderCard(lead); }).join(\'\');\n' +
'}\n' +
'\n' +
'function renderCard(lead) {\n' +
'  var blocked = isCompanyBlocked(lead.company);\n' +
'  var cat = lead.category || \'engineering\';\n' +
'  var dates = formatPostDate(lead);\n' +
'  var hasJD = lead.description && lead.description.length > 0;\n' +
'  var ini = companyInitials(lead.company);\n' +
'  var safeId = getSafeId(lead.id);\n' +
'  var companyEsc = lead.company.replace(/\x27/g, "\x5c\x5c\x27").replace(/"/g, \x27&quot;\x27);\n' +
'\n' +
'  return \'<div class="card" id="card-\' + safeId + \'">\' +\n' +
'    \'<div class="card-top">\' +\n' +
'      \'<div class="card-top-left">\' +\n' +
'        \'<div class="company-logo-wrap" id="logo-\' + safeId + \'" style="display:none;"></div>\' +\n' +
'        \'<div class="company-initials" id="ini-\' + safeId + \'">\' + ini + \'</div>\' +\n' +
'        \'<div>\' +\n' +
'          \'<div class="company-name">\' + lead.company + \'</div>\' +\n' +
'          \'<div class="company-location">\' + (lead.location || \'\') + \'</div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div class="card-top-right">\' +\n' +
'        categoryPill(cat) +\n' +
'        \'<button class="\' + (blocked ? \'btn-unblock-top\' : \'btn-block-top\') + \'" onclick="toggleBlockCompany(\\\'\' + companyEsc + \'\\\', this)">\' +\n' +
'          (blocked ? \'Unblock\' : \'Block company\') +\n' +
'        \'</button>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="card-body">\' +\n' +
'      \'<div class="job-info-row">\' +\n' +
'        \'<div class="job-title-block">\' +\n' +
'          \'<div class="job-title-label">Job posting</div>\' +\n' +
'          \'<div class="job-title-value">\' + lead.jobTitle + \'</div>\' +\n' +
'        \'</div>\' +\n' +
'        \'<div class="cal-block">\' +\n' +
'          \'<div class="cal-month">\' + dates.month + \'</div>\' +\n' +
'          \'<div class="cal-day">\' + dates.day + \'</div>\' +\n' +
'          \'<div class="cal-year">\' + dates.year + \'</div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'      (hasJD ? \'<button class="jd-btn" onclick="openJD(\\\'\' + safeId + \'\\\')">&#9654; View job description</button>\' : \'\') +\n' +
'      \'<div class="divider"></div>\' +\n' +
'      \'<div class="section-label">Contacts</div>\' +\n' +
'      \'<div id="contacts-\' + safeId + \'"></div>\' +\n' +
'      \'<div class="search-panel">\' +\n' +
'        \'<div class="search-panel-label">Add contact from SmartSearch &middot; \' + lead.company + \'</div>\' +\n' +
'        \'<input class="search-input" type="text" placeholder="Search contacts or type to filter..." oninput="filterSS(this,\\\'\' + safeId + \'\\\')" onfocus="showSS(\\\'\' + safeId + \'\\\')">\' +\n' +
'        \'<div class="search-results" id="ss-\' + safeId + \'" style="display:none;">\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Sarah Johnson\\\',\\\'HR Director\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;">Sarah Johnson</div><div style="font-size:11px;color:#888;">HR Director</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Mike Williams\\\',\\\'Engineering Manager\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;">Mike Williams</div><div style="font-size:11px;color:#888;">Engineering Manager</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Tom Baker\\\',\\\'Plant Manager\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;">Tom Baker</div><div style="font-size:11px;color:#888;">Plant Manager</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="card-footer">\' +\n' +
'      \'<button class="btn-skip" onclick="skipLead(\\\'\' + safeId + \'\\\',\\\'\' + lead.id + \'\\\')">Skip this lead</button>\' +\n' +
'      \'<div style="flex:1;"></div>\' +\n' +
'      (lead.jobUrl ? \'<a class="view-posting-link" href="\' + lead.jobUrl + \'" target="_blank">View job posting &#8599;</a>\' : \'\') +\n' +
'    \'</div>\' +\n' +
'  \'</div>\';\n' +
'}\n' +
'\n' +
'function openJD(safeId) {\n' +
'  var lead = leads.find(function(l) { return getSafeId(l.id) === safeId; });\n' +
'  if (!lead) return;\n' +
'  document.getElementById(\'jd-popup-title\').textContent = lead.company + \' \\u2013 \' + lead.jobTitle;\n' +
'  document.getElementById(\'jd-popup-body\').textContent = lead.description || \'No description available.\';\n' +
'  document.getElementById(\'jd-overlay\').classList.add(\'open\');\n' +
'}\n' +
'\n' +
'function closeJD(e) {\n' +
'  if (e.target === document.getElementById(\'jd-overlay\')) {\n' +
'    document.getElementById(\'jd-overlay\').classList.remove(\'open\');\n' +
'  }\n' +
'}\n' +
'\n' +
'function closeJDBtn() {\n' +
'  document.getElementById(\'jd-overlay\').classList.remove(\'open\');\n' +
'}\n' +
'\n' +
'document.addEventListener(\'click\', function(e) {\n' +
'  if (!e.target.classList.contains(\'search-input\')) {\n' +
'    document.querySelectorAll(\'[id^="ss-"]\').forEach(function(el) {\n' +
'      if (!el.contains(e.target)) el.style.display = \'none\';\n' +
'    });\n' +
'  }\n' +
'});\n' +
'\n' +
'function showSS(safeId) {\n' +
'  var el = document.getElementById(\'ss-\' + safeId);\n' +
'  if (el) el.style.display = \'block\';\n' +
'}\n' +
'\n' +
'function filterSS(input, safeId) {\n' +
'  var val = input.value.toLowerCase();\n' +
'  var results = document.getElementById(\'ss-\' + safeId);\n' +
'  if (!results) return;\n' +
'  results.style.display = \'block\';\n' +
'  results.querySelectorAll(\'.search-result-item\').forEach(function(item) {\n' +
'    var name = item.querySelector(\'div > div\').textContent.toLowerCase();\n' +
'    item.style.display = name.includes(val) ? \'flex\' : \'none\';\n' +
'  });\n' +
'}\n' +
'\n' +
'function addContact(safeId, name, title) {\n' +
'  if (!contactCounters[safeId]) contactCounters[safeId] = 0;\n' +
'  contactCounters[safeId]++;\n' +
'  var cid = safeId + \'_c\' + contactCounters[safeId];\n' +
'  var ini = initials(name);\n' +
'  var firstName = name.split(\' \')[0];\n' +
'\n' +
'  var block = document.createElement(\'div\');\n' +
'  block.className = \'contact-block\';\n' +
'  block.id = \'cb-\' + cid;\n' +
'  block.innerHTML =\n' +
'    \'<div class="contact-header">\' +\n' +
'      \'<div class="avatar avatar-am">\' + ini + \'</div>\' +\n' +
'      \'<div class="contact-info">\' +\n' +
'        \'<div class="contact-name-row">\' +\n' +
'          \'<span class="contact-name">\' + name + \'</span>\' +\n' +
'          \'<span class="badge badge-added">Added from SS</span>\' +\n' +
'        \'</div>\' +\n' +
'        \'<div class="contact-title-sub">\' + title + \'</div>\' +\n' +
'        \'<div class="email-row">\' +\n' +
'          \'<span class="email-placeholder" id="ep-\' + cid + \'">No email fetched yet</span>\' +\n' +
'          \'<span class="email-value" id="ev-\' + cid + \'" style="display:none;"></span>\' +\n' +
'        \'</div>\' +\n' +
'        \'<div class="credit-note" id="cn-\' + cid + \'">Fetching email uses 2 credits</div>\' +\n' +
'      \'</div>\' +\n' +
'      \'<button class="btn-ghost" onclick="removeContact(\\\'\' + cid + \'\\\')">&times;</button>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="contact-actions">\' +\n' +
'      \'<button class="btn btn-fetch" id="fb-\' + cid + \'" onclick="fetchEmail(\\\'\' + cid + \'\\\',\\\'\' + name + \'\\\',\\\'\' + title + \'\\\')">Fetch email (2 credits)</button>\' +\n' +
'      \'<a href="https://www.google.com/search?q=\' + encodeURIComponent(name + \' \' + title + \' LinkedIn\') + \'" target="_blank" class="btn">LinkedIn &#8599;</a>\' +\n' +
'      \'<button class="btn-ghost" onclick="removeContact(\\\'\' + cid + \'\\\')">Remove</button>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div id="draft-\' + cid + \'" style="display:none;">\' +\n' +
'      \'<div class="tab-row">\' +\n' +
'        \'<button class="tab active" onclick="switchTab(\\\'\' + cid + \'\\\',\\\'email\\\',this)">Email</button>\' +\n' +
'        \'<button class="tab" onclick="switchTab(\\\'\' + cid + \'\\\',\\\'linkedin\\\',this)">LinkedIn</button>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div id="email-pane-\' + cid + \'">\' +\n' +
'        \'<input class="subject-input" type="text" id="subj-\' + cid + \'" placeholder="Subject line">\' +\n' +
'        \'<textarea id="edraft-\' + cid + \'"></textarea>\' +\n' +
'        \'<div class="contact-actions">\' +\n' +
'          \'<button class="btn btn-primary" id="send-\' + cid + \'" onclick="openOutlook(\\\'\' + cid + \'\\\')">Open in Outlook</button>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div id="li-pane-\' + cid + \'" style="display:none;">\' +\n' +
'        \'<textarea id="lidraft-\' + cid + \'"></textarea>\' +\n' +
'        \'<div class="contact-actions">\' +\n' +
'          \'<button class="btn btn-li" onclick="copyLI(\\\'\' + cid + \'\\\',this)">Copy for LinkedIn</button>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\';\n' +
'\n' +
'  document.getElementById(\'contacts-\' + safeId).appendChild(block);\n' +
'  document.getElementById(\'ss-\' + safeId).style.display = \'none\';\n' +
'}\n' +
'\n' +
'function removeContact(cid) {\n' +
'  var el = document.getElementById(\'cb-\' + cid);\n' +
'  if (el) { el.style.opacity = \'0\'; el.style.transition = \'opacity 0.2s\'; setTimeout(function() { el.remove(); }, 200); }\n' +
'}\n' +
'\n' +
'function fetchEmail(cid, name, title) {\n' +
'  var btn = document.getElementById(\'fb-\' + cid);\n' +
'  btn.textContent = \'Fetching...\';\n' +
'  btn.disabled = true;\n' +
'  setTimeout(function() {\n' +
'    var fn = name.split(\' \')[0].toLowerCase();\n' +
'    var ln = name.split(\' \').slice(-1)[0].toLowerCase();\n' +
'    var email = fn + \'.\' + ln + \'@company.com\';\n' +
'    document.getElementById(\'ep-\' + cid).style.display = \'none\';\n' +
'    document.getElementById(\'ev-\' + cid).style.display = \'inline\';\n' +
'    document.getElementById(\'ev-\' + cid).textContent = email;\n' +
'    document.getElementById(\'cn-\' + cid).textContent = \'2 credits used\';\n' +
'    btn.textContent = \'Email fetched\';\n' +
'    btn.className = \'btn btn-sent\';\n' +
'    document.getElementById(\'subj-\' + cid).value = \'Partnering on your search\';\n' +
'    document.getElementById(\'edraft-\' + cid).value = \'Hi \' + name.split(\' \')[0] + \',\\n\\nI noticed your company is actively hiring and wanted to reach out. At iMPact Business Group we specialize in placing top talent in Engineering, Manufacturing, Accounting, and IT roles across the region.\\n\\nWould you be open to a quick 15-minute call?\\n\\n[Calendly link]\\n\\nMark Sapoznikov\\niMPact Business Group\';\n' +
'    document.getElementById(\'lidraft-\' + cid).value = \'Hi \' + name.split(\' \')[0] + \', I noticed your company is actively hiring and wanted to connect. At iMPact Business Group we place top talent across Engineering, Accounting, and IT. Would you be open to a quick chat? [Calendly link] - Mark\';\n' +
'    document.getElementById(\'draft-\' + cid).style.display = \'block\';\n' +
'  }, 400);\n' +
'}\n' +
'\n' +
'function switchTab(cid, tab, btn) {\n' +
'  document.querySelectorAll(\'#cb-\' + cid + \' .tab\').forEach(function(t) { t.classList.remove(\'active\'); });\n' +
'  btn.classList.add(\'active\');\n' +
'  document.getElementById(\'email-pane-\' + cid).style.display = tab === \'email\' ? \'block\' : \'none\';\n' +
'  document.getElementById(\'li-pane-\' + cid).style.display = tab === \'linkedin\' ? \'block\' : \'none\';\n' +
'}\n' +
'\n' +
'function openOutlook(cid) {\n' +
'  var email = document.getElementById(\'ev-\' + cid).textContent;\n' +
'  var subject = encodeURIComponent(document.getElementById(\'subj-\' + cid).value);\n' +
'  var body = encodeURIComponent(document.getElementById(\'edraft-\' + cid).value);\n' +
'  window.location.href = \'mailto:\' + email + \'?subject=\' + subject + \'&body=\' + body;\n' +
'  document.getElementById(\'send-\' + cid).textContent = \'Sent\';\n' +
'  document.getElementById(\'send-\' + cid).className = \'btn btn-sent\';\n' +
'  document.getElementById(\'cb-\' + cid).classList.add(\'sent\');\n' +
'}\n' +
'\n' +
'function copyLI(cid, btn) {\n' +
'  navigator.clipboard.writeText(document.getElementById(\'lidraft-\' + cid).value).then(function() {\n' +
'    btn.textContent = \'Copied!\';\n' +
'    setTimeout(function() { btn.textContent = \'Copy for LinkedIn\'; }, 2000);\n' +
'  });\n' +
'}\n' +
'\n' +
'async function toggleBlockCompany(company, btn) {\n' +
'  var blocked = btn.classList.contains(\'btn-unblock-top\');\n' +
'  await fetch(\'/api/blocklist\', {\n' +
'    method: blocked ? \'DELETE\' : \'POST\',\n' +
'    headers: { \'Content-Type\': \'application/json\' },\n' +
'    body: JSON.stringify({ type: \'companies\', value: company })\n' +
'  });\n' +
'  if (blocked) {\n' +
'    blocklist.companies = blocklist.companies.filter(function(c) { return c !== company; });\n' +
'    btn.textContent = \'Block company\';\n' +
'    btn.className = \'btn-block-top\';\n' +
'  } else {\n' +
'    blocklist.companies.push(company);\n' +
'    btn.textContent = \'Unblock\';\n' +
'    btn.className = \'btn-unblock-top\';\n' +
'  }\n' +
'}\n' +
'\n' +
'async function skipLead(safeId, realId) {\n' +
'  await fetch(\'/api/leads\', {\n' +
'    method: \'PATCH\',\n' +
'    headers: { \'Content-Type\': \'application/json\' },\n' +
'    body: JSON.stringify({ id: realId, updates: { status: \'skipped\' } })\n' +
'  });\n' +
'  var card = document.getElementById(\'card-\' + safeId);\n' +
'  if (card) { card.style.opacity = \'0\'; card.style.transition = \'opacity 0.2s\'; setTimeout(function() { card.remove(); }, 200); }\n' +
'  leads = leads.filter(function(l) { return l.id !== realId; });\n' +
'  document.getElementById(\'lead-count\').textContent = leads.length + \' pending leads\';\n' +
'}\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';

  res.status(200).send(html);
};
