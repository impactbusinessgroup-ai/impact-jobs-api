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
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
'<style>\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: Raleway, -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; background: #0F1E3D; color: #e0e4ec; min-height: 100vh; }\n' +
'h1,h2,h3,h4,h5,h6,.section-label,.pill,.cal-month { font-family: Oswald, sans-serif; }\n' +
'.header { background: rgba(10,18,38,0.92); backdrop-filter: blur(16px); padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(26,78,162,0.2); }\n' +
'.header-logo { height: 34px; }\n' +
'.header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-family: Oswald, sans-serif; font-size: 20px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }\n' +
'.header-meta { color: rgba(255,255,255,0.45); font-size: 12px; text-align: right; font-family: Raleway, sans-serif; }\n' +
'.container { max-width: 920px; margin: 0 auto; padding: 28px 16px 60px; }\n' +
'.queue-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }\n' +
'.queue-bar h2 { font-size: 26px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }\n' +
'.queue-bar .sub { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 3px; font-family: Raleway, sans-serif; }\n' +
'.lead-count-badge { background: linear-gradient(135deg, #FFA000, #E8620A); color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; box-shadow: 0 2px 12px rgba(232,98,10,0.35); font-family: Raleway, sans-serif; }\n' +
'.card { background: #1a2744; border-radius: 18px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3); border: 1px solid rgba(26,78,162,0.15); }\n' +
'.card-top { background: linear-gradient(135deg, #0B1729 0%, #162d54 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }\n' +
'.card-top-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }\n' +
'.company-logo-wrap { width: 64px; height: 64px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }\n' +
'.company-initials { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #FFA000, #E8620A); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; flex-shrink: 0; letter-spacing: 0.5px; font-family: Oswald, sans-serif; }\n' +
'.company-name { font-size: 18px; font-weight: 700; color: white; line-height: 1.2; font-family: Oswald, sans-serif; letter-spacing: 0.3px; }\n' +
'.company-location { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px; }\n' +
'.card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }\n' +
'.pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase; }\n' +
'.pill-eng { background: rgba(29,158,117,0.25); color: #6EE7C7; border: 1px solid rgba(110,231,199,0.25); }\n' +
'.pill-acc { background: rgba(99,179,237,0.2); color: #93C5FD; border: 1px solid rgba(147,197,253,0.25); }\n' +
'.pill-it { background: rgba(255,160,0,0.2); color: #FCD34D; border: 1px solid rgba(252,211,77,0.25); }\n' +
'.pill-other { background: rgba(168,130,255,0.2); color: #C4B5FD; border: 1px solid rgba(196,181,253,0.25); }\n' +
'.card-top-job-title { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 500; line-height: 1.3; }\n' +
'.company-links { background: rgba(26,78,162,0.08); padding: 10px 24px; border-bottom: 1px solid rgba(26,78,162,0.12); display: none; gap: 16px; align-items: center; }\n' +
'.company-link { font-size: 12px; color: #63a4ff; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }\n' +
'.company-link:hover { text-decoration: underline; color: #93c5fd; }\n' +
'.card-body { padding: 20px 24px; }\n' +
'.cal-block { background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; width: 62px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.cal-month { background: rgba(26,78,162,0.5); color: white; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; width: 100%; text-align: center; padding: 4px 0; }\n' +
'.cal-day { font-size: 22px; font-weight: 800; color: white; padding: 4px 0 1px; line-height: 1; font-family: Oswald, sans-serif; }\n' +
'.cal-year { font-size: 9px; color: rgba(255,255,255,0.4); padding-bottom: 5px; font-weight: 500; }\n' +
'.divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 16px 0; }\n' +
'.section-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }\n' +

// Contact cards - side by side
'.contacts-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }\n' +
'.contact-card { flex: 1; min-width: 200px; max-width: 320px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; transition: all 0.2s; }\n' +
'.contact-card:hover { border-color: rgba(26,78,162,0.3); background: rgba(255,255,255,0.06); }\n' +
'.contact-card.sent { border-color: rgba(93,202,165,0.4); background: rgba(93,202,165,0.06); }\n' +
'.contact-header { display: flex; align-items: flex-start; gap: 10px; }\n' +
'.avatar { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #1A4EA2, #0F1E3D); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; font-family: Oswald, sans-serif; }\n' +
'.contact-info { flex: 1; min-width: 0; }\n' +
'.contact-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap; }\n' +
'.contact-name { font-size: 13px; font-weight: 700; color: #fff; }\n' +
'.contact-title-sub { font-size: 11px; color: rgba(255,255,255,0.5); }\n' +
'.contact-loc { font-size: 11px; color: rgba(255,255,255,0.35); }\n' +
'.email-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }\n' +
'.email-placeholder { font-size: 11px; color: rgba(255,255,255,0.25); font-style: italic; }\n' +
'.email-value { font-size: 11px; color: #63a4ff; font-weight: 600; }\n' +
'.credit-note { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 2px; }\n' +
'.contact-actions { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; align-items: center; }\n' +
'.badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.3px; }\n' +
'.badge-added { background: rgba(30,64,175,0.2); color: #93C5FD; }\n' +

// Buttons
'.btn { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #cdd; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.btn-li { background: rgba(10,102,194,0.2); color: #63a4ff; border-color: rgba(10,102,194,0.3); font-size: 11px; padding: 5px 10px; }\n' +
'.btn-li:hover { background: rgba(10,102,194,0.3); }\n' +
'.btn-fetch { background: rgba(255,160,0,0.15); color: #FCD34D; border-color: rgba(255,160,0,0.3); }\n' +
'.btn-fetch:hover { background: rgba(255,160,0,0.25); }\n' +
'.btn-sent { background: rgba(93,202,165,0.15); color: #6EE7C7; border-color: rgba(93,202,165,0.3); cursor: default; }\n' +
'.btn-outlook { background: rgba(0,120,215,0.15); color: #63a4ff; border-color: rgba(0,120,215,0.25); display: inline-flex; align-items: center; gap: 4px; }\n' +
'.btn-outlook:hover { background: rgba(0,120,215,0.25); }\n' +
'.btn-ghost { color: rgba(255,255,255,0.3); font-size: 11px; border: none; background: none; cursor: pointer; padding: 3px 5px; font-weight: 500; }\n' +
'.btn-ghost:hover { color: #ef6961; }\n' +
'.btn-primary { background: #1A4EA2; color: white; border-color: #1A4EA2; }\n' +
'.btn-primary:hover { background: #2060c0; }\n' +

// Send to all button
'.send-all-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }\n' +
'.btn-send-all { background: rgba(0,120,215,0.15); color: #63a4ff; border: 1px solid rgba(0,120,215,0.25); padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: Raleway, sans-serif; transition: all 0.15s; }\n' +
'.btn-send-all:hover { background: rgba(0,120,215,0.25); }\n' +

// Composer
'.composer { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-top: 14px; }\n' +
'.composer-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-family: Oswald, sans-serif; }\n' +
'.subject-select { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; font-family: Raleway, sans-serif; margin-bottom: 4px; appearance: auto; cursor: pointer; }\n' +
'.subject-select:focus { outline: none; border-color: #1A4EA2; }\n' +
'.subject-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; font-family: Raleway, sans-serif; margin-bottom: 6px; }\n' +
'.subject-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'textarea { width: 100%; font-size: 12px; line-height: 1.7; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; resize: vertical; font-family: Raleway, sans-serif; min-height: 140px; }\n' +
'textarea:focus { outline: none; border-color: #1A4EA2; }\n' +
'.tab-row { display: flex; gap: 6px; margin-bottom: 8px; }\n' +
'.tab { font-size: 11px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; font-weight: 600; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.tab.active { background: #1A4EA2; color: white; border-color: #1A4EA2; }\n' +

// SmartSearch
'.search-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; background: rgba(255,255,255,0.02); margin-bottom: 12px; }\n' +
'.search-panel-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; font-weight: 600; }\n' +
'.search-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; font-family: Raleway, sans-serif; }\n' +
'.search-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'.search-results { margin-top: 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.03); }\n' +
'.search-result-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; }\n' +
'.search-result-item:last-child { border-bottom: none; }\n' +
'.search-result-item:hover { background: rgba(255,255,255,0.04); }\n' +
'.search-add-btn { font-size: 11px; font-weight: 700; color: #63a4ff; background: rgba(26,78,162,0.15); padding: 3px 10px; border-radius: 6px; }\n' +

// Footer
'.card-footer { display: flex; gap: 8px; align-items: center; padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.04); background: rgba(0,0,0,0.1); }\n' +
'.btn-glass { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 28px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); text-decoration: none; font-family: Raleway, sans-serif; }\n' +
'.btn-glass:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.btn-glass-skip { background: rgba(232,98,10,0.15); color: #FFA000; border-color: rgba(232,98,10,0.3); }\n' +
'.btn-glass-skip:hover { background: rgba(232,98,10,0.25); }\n' +
'.btn-glass-block { background: rgba(198,40,40,0.12); color: #ef6961; border-color: rgba(198,40,40,0.25); }\n' +
'.btn-glass-block:hover { background: rgba(198,40,40,0.2); }\n' +
'.jd-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #63a4ff; cursor: pointer; font-weight: 600; background: rgba(26,78,162,0.12); padding: 5px 12px; border-radius: 6px; border: none; transition: background 0.15s; }\n' +
'.jd-btn:hover { background: rgba(26,78,162,0.2); }\n' +

// Popups & toasts
'.jd-popup-overlay { display: none; position: fixed; inset: 0; background: rgba(5,10,25,0.75); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px); }\n' +
'.jd-popup-overlay.open { display: flex; }\n' +
'.jd-popup { background: #1a2744; border: 1px solid rgba(26,78,162,0.2); border-radius: 18px; max-width: 660px; width: 92%; max-height: 82vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }\n' +
'.jd-popup-header { padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }\n' +
'.jd-popup-header h3 { font-size: 16px; font-weight: 600; color: #fff; font-family: Oswald, sans-serif; }\n' +
'.jd-popup-close { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; cursor: pointer; font-size: 14px; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }\n' +
'.jd-popup-close:hover { background: rgba(255,255,255,0.1); }\n' +
'.jd-popup-body { padding: 20px 24px; overflow-y: auto; font-size: 13px; line-height: 1.75; color: rgba(255,255,255,0.7); white-space: pre-wrap; }\n' +
'.toast-container { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(80px); z-index: 300; opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none; }\n' +
'.toast-container.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }\n' +
'.toast { background: linear-gradient(135deg, #E8620A, #d4560a); color: white; border-radius: 28px; padding: 12px 20px; box-shadow: 0 8px 32px rgba(232,98,10,0.4); display: flex; align-items: center; gap: 12px; font-size: 13px; white-space: nowrap; }\n' +
'.toast-undo { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 16px; padding: 4px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s; }\n' +
'.toast-undo:hover { background: rgba(255,255,255,0.25); }\n' +
'.confirm-overlay { display: none; position: fixed; inset: 0; background: rgba(5,10,25,0.75); z-index: 250; align-items: center; justify-content: center; backdrop-filter: blur(4px); }\n' +
'.confirm-overlay.open { display: flex; }\n' +
'.confirm-card { background: #1a2744; border: 1px solid rgba(26,78,162,0.2); border-radius: 18px; max-width: 400px; width: 90%; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; }\n' +
'.confirm-card h3 { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; font-family: Oswald, sans-serif; }\n' +
'.confirm-card p { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 24px; }\n' +
'.confirm-actions { display: flex; gap: 10px; justify-content: center; }\n' +
'.loading { text-align: center; padding: 80px; color: rgba(255,255,255,0.4); font-size: 15px; }\n' +
'.empty { text-align: center; padding: 80px; }\n' +
'.empty h3 { font-size: 18px; margin-bottom: 8px; color: rgba(255,255,255,0.6); font-family: Oswald, sans-serif; }\n' +

// Outlook SVG icon inline
'.outlook-icon { width: 14px; height: 14px; vertical-align: middle; }\n' +
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
'<div class="toast-container" id="toast-container"><div class="toast" id="toast-inner"></div></div>\n' +
'\n' +
'<div class="confirm-overlay" id="confirm-overlay" onclick="if(event.target===this)closeConfirm()">\n' +
'  <div class="confirm-card">\n' +
'    <h3 id="confirm-title"></h3>\n' +
'    <p id="confirm-sub"></p>\n' +
'    <div class="confirm-actions">\n' +
'      <button class="btn-glass" onclick="closeConfirm()">Cancel</button>\n' +
'      <button class="btn-glass btn-glass-block" id="confirm-action-btn"></button>\n' +
'    </div>\n' +
'  </div>\n' +
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
'var OUTLOOK_SVG = \'<svg class="outlook-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>\';\n' +
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
'async function fetchLogo(company, website, location, safeId, apolloLogo) {\n' +
'  var cacheKey = company.toLowerCase();\n' +
'  if (logoCache[cacheKey] !== undefined) {\n' +
'    applyLogo(safeId, logoCache[cacheKey]);\n' +
'    return;\n' +
'  }\n' +
'  var domain = \'\';\n' +
'  if (website) {\n' +
'    var wsUrl = website;\n' +
'    if (wsUrl.indexOf(\'http\') !== 0) wsUrl = \'https://\' + wsUrl;\n' +
'    try { domain = new URL(wsUrl).hostname.replace(\'www.\', \'\'); } catch(e) {}\n' +
'  }\n' +
'  if (!domain) {\n' +
'    domain = company.toLowerCase().replace(/[^a-z0-9]/g, \'\').slice(0, 20) + \'.com\';\n' +
'  }\n' +
'  try {\n' +
'    var logoUrl = \'/api/logo?domain=\' + encodeURIComponent(domain);\n' +
'    if (apolloLogo) logoUrl += \'&apollo_logo=\' + encodeURIComponent(apolloLogo);\n' +
'    var res = await fetch(logoUrl);\n' +
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
'    img.style.cssText = \'width:100%;height:100%;object-fit:cover;padding:0;\';\n' +
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
'      fetchLogo(lead.company, lead.company_website || lead.employerWebsite || \'\', lead.location || \'\', safeId, lead.company_logo_apollo || \'\');\n' +
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
'  if (cat === \'other\') return \'<span class="pill pill-other">Other</span>\';\n' +
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
'function escHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;"); }\n' +
'\n' +
'function renderLeads() {\n' +
'  var container = document.getElementById(\'leads-container\');\n' +
'  if (!leads.length) {\n' +
'    container.innerHTML = \'<div class="empty"><h3>No pending leads</h3><p style="color:rgba(255,255,255,0.35);font-size:13px;">Check back after the morning fetch runs.</p></div>\';\n' +
'    return;\n' +
'  }\n' +
'  container.innerHTML = leads.map(function(lead) { return renderCard(lead); }).join(\'\');\n' +
'  leads.forEach(function(lead) {\n' +
'    if (lead.contacts && lead.contacts.length > 0) {\n' +
'      var safeId = getSafeId(lead.id);\n' +
'      lead.contacts.forEach(function(c) {\n' +
'        addContact(safeId, c.full_name || c.name || \'\', c.job_title || c.title || \'\', lead.company, lead.location || \'\', c.apollo_id || c.prospect_id || \'\', {\n' +
'          suggested: true,\n' +
'          locationMatch: c.locationMatch || \'\',\n' +
'          city: c.city || \'\',\n' +
'          region: c.region_name || c.region || c.state || \'\',\n' +
'          linkedin: c.linkedin || \'\',\n' +
'          fromCache: c.fromCache || false,\n' +
'          email: c.email || \'\',\n' +
'          previousJobs: c.previousJobs || []\n' +
'        });\n' +
'      });\n' +
'      populateComposer(safeId);\n' +
'    }\n' +
'  });\n' +
'}\n' +
'\n' +
'function populateComposer(safeId) {\n' +
'  var lead = leads.find(function(l) { return getSafeId(l.id) === safeId; });\n' +
'  if (!lead) return;\n' +
'  var subjSelect = document.getElementById(\'subj-select-\' + safeId);\n' +
'  var subjInput = document.getElementById(\'subj-\' + safeId);\n' +
'  var bodyEl = document.getElementById(\'ebody-\' + safeId);\n' +
'  if (subjSelect) subjSelect.value = subjSelect.options[0].value;\n' +
'  if (subjInput) subjInput.value = subjSelect ? subjSelect.options[0].value : \'\';\n' +
'  if (bodyEl) {\n' +
'    var firstName = \'there\';\n' +
'    if (lead.contacts && lead.contacts.length > 0) {\n' +
'      firstName = (lead.contacts[0].full_name || lead.contacts[0].name || \'\').split(\' \')[0] || \'there\';\n' +
'    }\n' +
'    bodyEl.value = \'Hi \' + firstName + \',\\n\\nI noticed \' + lead.company + \' is looking for a \' + lead.jobTitle + \' and wanted to reach out. At iMPact Business Group, we specialize in connecting companies with top talent in engineering, IT, accounting, and business professional roles.\\n\\nWe have a strong track record of placing quality candidates quickly. You can see some of our recent success stories here: https://impactbusinessgroup.com/case-studies/?cid=*|UNIQID|*\\n\\nIf you are open to it, I would love to connect and learn more about what you are looking for in this role.\';\n' +
'  }\n' +
'}\n' +
'\n' +
'function onSubjectSelect(safeId) {\n' +
'  var sel = document.getElementById(\'subj-select-\' + safeId);\n' +
'  var inp = document.getElementById(\'subj-\' + safeId);\n' +
'  if (sel && inp) inp.value = sel.value;\n' +
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
'  var jobTitle = lead.jobTitle || \'\';\n' +
'\n' +
'  var subj1 = \'Question about your \' + jobTitle + \' search\';\n' +
'  var subj2 = \'Your \' + jobTitle + \' opening at \' + lead.company;\n' +
'  var subj3 = jobTitle + \' candidates - iMPact Business Group\';\n' +
'  var subj4 = \'Following up on your \' + jobTitle + \' position\';\n' +
'\n' +
'  return \'<div class="card" id="card-\' + safeId + \'">\' +\n' +
'    \'<div class="card-top">\' +\n' +
'      \'<div class="card-top-left">\' +\n' +
'        \'<div class="company-logo-wrap" id="logo-\' + safeId + \'" style="display:none;"></div>\' +\n' +
'        \'<div class="company-initials" id="ini-\' + safeId + \'">\' + ini + \'</div>\' +\n' +
'        \'<div>\' +\n' +
'          \'<div class="card-top-job-title">\' + jobTitle + \'</div>\' +\n' +
'          \'<div class="company-name">\' + lead.company + \'</div>\' +\n' +
'          \'<div class="company-location">\' + (lead.location || \'\') + \'</div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div class="card-top-right">\' +\n' +
'        \'<div class="cal-block">\' +\n' +
'          \'<div class="cal-month">\' + dates.month + \'</div>\' +\n' +
'          \'<div class="cal-day">\' + dates.day + \'</div>\' +\n' +
'          \'<div class="cal-year">\' + dates.year + \'</div>\' +\n' +
'        \'</div>\' +\n' +
'        categoryPill(cat) +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    (function() {\n' +
'      var lhtml = \'\';\n' +
'      if (lead.company_website) {\n' +
'        var wUrl = lead.company_website;\n' +
'        if (wUrl.indexOf(\'http\') !== 0) wUrl = \'https://\' + wUrl;\n' +
'        var wHost = \'\';\n' +
'        try { wHost = new URL(wUrl).hostname.replace(\'www.\', \'\'); } catch(e) { wHost = lead.company_website; }\n' +
'        lhtml += \'<a class="company-link" href="\' + wUrl + \'" target="_blank"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> \' + wHost + \'</a>\';\n' +
'      }\n' +
'      if (lead.company_linkedin) {\n' +
'        var liUrl = lead.company_linkedin;\n' +
'        if (liUrl.indexOf(\'http\') !== 0) liUrl = \'https://\' + liUrl;\n' +
'        lhtml += \'<a class="company-link" href="\' + liUrl + \'" target="_blank" style="color:#63a4ff;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</a>\';\n' +
'      }\n' +
'      if (lead.company_domain) {\n' +
'        lhtml += \'<a class="company-link" href="https://\' + lead.company_domain + \'" target="_blank"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> Website</a>\';\n' +
'      }\n' +
'      return lhtml ? \'<div class="company-links" style="display:flex;">\' + lhtml + \'</div>\' : \'\';\n' +
'    })() +\n' +
'    \'<div class="card-body">\' +\n' +
'      \'<div class="divider"></div>\' +\n' +
'      \'<div class="section-label">Contacts</div>\' +\n' +
'      \'<div class="send-all-bar" id="send-all-bar-\' + safeId + \'" style="display:none;"><button class="btn-send-all" onclick="sendToAll(\\\'\' + safeId + \'\\\')">\' + OUTLOOK_SVG + \' Send to All in Outlook</button></div>\' +\n' +
'      \'<div class="contacts-row" id="contacts-\' + safeId + \'"></div>\' +\n' +
'      \'<div class="composer" id="composer-\' + safeId + \'">\' +\n' +
'        \'<div class="composer-label">Email Composer</div>\' +\n' +
'        \'<div class="tab-row">\' +\n' +
'          \'<button class="tab active" onclick="switchCardTab(\\\'\' + safeId + \'\\\',\\\'email\\\',this)">Email</button>\' +\n' +
'          \'<button class="tab" onclick="switchCardTab(\\\'\' + safeId + \'\\\',\\\'linkedin\\\',this)">LinkedIn</button>\' +\n' +
'        \'</div>\' +\n' +
'        \'<div id="email-pane-\' + safeId + \'">\' +\n' +
'          \'<select class="subject-select" id="subj-select-\' + safeId + \'" onchange="onSubjectSelect(\\\'\' + safeId + \'\\\')">\' +\n' +
'            \'<option value="\' + escHtml(subj1) + \'">\' + escHtml(subj1) + \'</option>\' +\n' +
'            \'<option value="\' + escHtml(subj2) + \'">\' + escHtml(subj2) + \'</option>\' +\n' +
'            \'<option value="\' + escHtml(subj3) + \'">\' + escHtml(subj3) + \'</option>\' +\n' +
'            \'<option value="\' + escHtml(subj4) + \'">\' + escHtml(subj4) + \'</option>\' +\n' +
'          \'</select>\' +\n' +
'          \'<input class="subject-input" type="text" id="subj-\' + safeId + \'" placeholder="Subject line (editable)">\' +\n' +
'          \'<textarea id="ebody-\' + safeId + \'"></textarea>\' +\n' +
'        \'</div>\' +\n' +
'        \'<div id="li-pane-\' + safeId + \'" style="display:none;">\' +\n' +
'          \'<textarea id="libody-\' + safeId + \'" placeholder="LinkedIn message..."></textarea>\' +\n' +
'          \'<div style="margin-top:6px;"><button class="btn btn-li" onclick="copyLICard(\\\'\' + safeId + \'\\\',this)">Copy for LinkedIn</button></div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div class="search-panel">\' +\n' +
'        \'<div class="search-panel-label">Add contact from SmartSearch</div>\' +\n' +
'        \'<input class="search-input" type="text" placeholder="Search contacts..." oninput="filterSS(this,\\\'\' + safeId + \'\\\')" onfocus="showSS(\\\'\' + safeId + \'\\\')">\' +\n' +
'        \'<div class="search-results" id="ss-\' + safeId + \'" style="display:none;">\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Sarah Johnson\\\',\\\'HR Director\\\',\\\'\' + companyEsc + \'\\\',\\\'\' + (lead.location||\'\').replace(/\x27/g,\'\') + \'\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;color:#fff;">Sarah Johnson</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">HR Director</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Mike Williams\\\',\\\'Engineering Manager\\\',\\\'\' + companyEsc + \'\\\',\\\'\' + (lead.location||\'\').replace(/\x27/g,\'\') + \'\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;color:#fff;">Mike Williams</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">Engineering Manager</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'          \'<div class="search-result-item" onclick="addContact(\\\'\' + safeId + \'\\\',\\\'Tom Baker\\\',\\\'Plant Manager\\\',\\\'\' + companyEsc + \'\\\',\\\'\' + (lead.location||\'\').replace(/\x27/g,\'\') + \'\\\')">\' +\n' +
'            \'<div><div style="font-size:13px;font-weight:600;color:#fff;">Tom Baker</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">Plant Manager</div></div>\' +\n' +
'            \'<span class="search-add-btn">+ Add</span>\' +\n' +
'          \'</div>\' +\n' +
'        \'</div>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="card-footer">\' +\n' +
'      \'<button class="btn-glass btn-glass-skip" onclick="skipLead(\\\'\' + safeId + \'\\\',\\\'\' + lead.id + \'\\\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg> Skip</button>\' +\n' +
'      \'<button class="btn-glass btn-glass-block" onclick="toggleBlockCompany(\\\'\' + companyEsc + \'\\\', this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> \' + (blocked ? \'Unblock\' : \'Block company\') + \'</button>\' +\n' +
'      \'<div style="flex:1;"></div>\' +\n' +
'      (hasJD ? \'<button class="btn-glass" onclick="openJD(\\\'\' + safeId + \'\\\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Job description</button>\' : \'\') +\n' +
'      (lead.jobUrl ? \'<a class="btn-glass" href="\' + lead.jobUrl + \'" target="_blank"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> View posting</a>\' : \'\') +\n' +
'    \'</div>\' +\n' +
'  \'<script>window._leadJobTitles=window._leadJobTitles||{};window._leadCategories=window._leadCategories||{};window._leadRedisIds=window._leadRedisIds||{};window._leadJobTitles["\' + safeId + \'"]=\' + JSON.stringify(lead.jobTitle || \'\') + \';window._leadCategories["\' + safeId + \'"]=\' + JSON.stringify(lead.category || \'engineering\') + \';window._leadRedisIds["\' + safeId + \'"]=\' + JSON.stringify(lead.id || \'\') + \';<\\/script>\' +\n' +
'  \'</div>\';\n' +
'}\n' +
'\n' +
'function openJD(safeId) {\n' +
'  var lead = leads.find(function(l) { return getSafeId(l.id) === safeId; });\n' +
'  if (!lead) return;\n' +
'  document.getElementById(\'jd-popup-title\').textContent = lead.company + \' - \' + lead.jobTitle;\n' +
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
'function switchCardTab(safeId, tab, btn) {\n' +
'  var card = document.getElementById(\'card-\' + safeId);\n' +
'  if (!card) return;\n' +
'  card.querySelectorAll(\'.composer .tab\').forEach(function(t) { t.classList.remove(\'active\'); });\n' +
'  btn.classList.add(\'active\');\n' +
'  document.getElementById(\'email-pane-\' + safeId).style.display = tab === \'email\' ? \'block\' : \'none\';\n' +
'  document.getElementById(\'li-pane-\' + safeId).style.display = tab === \'linkedin\' ? \'block\' : \'none\';\n' +
'}\n' +
'\n' +
'function copyLICard(safeId, btn) {\n' +
'  var text = document.getElementById(\'libody-\' + safeId).value;\n' +
'  navigator.clipboard.writeText(text).then(function() {\n' +
'    btn.textContent = \'Copied!\';\n' +
'    setTimeout(function() { btn.textContent = \'Copy for LinkedIn\'; }, 2000);\n' +
'  });\n' +
'}\n' +
'\n' +
'function addContact(safeId, name, title, companyName, location, prospectId, opts) {\n' +
'  opts = opts || {};\n' +
'  if (!contactCounters[safeId]) contactCounters[safeId] = 0;\n' +
'  contactCounters[safeId]++;\n' +
'  var cid = safeId + \'_c\' + contactCounters[safeId];\n' +
'  var ini = initials(name);\n' +
'  var badgeHtml = \'\';\n' +
'  if (!opts.suggested) {\n' +
'    badgeHtml = \'<span class="badge badge-added">Added</span>\';\n' +
'  }\n' +
'  var cityStateHtml = \'\';\n' +
'  if (opts.city || opts.region) {\n' +
'    cityStateHtml = \'<div class="contact-loc">\' + (opts.city || \'\') + (opts.city && opts.region ? \', \' : \'\') + (opts.region || \'\') + \'</div>\';\n' +
'  }\n' +
'  var linkedinUrl = opts.linkedin || \'\';\n' +
'  if (linkedinUrl && linkedinUrl.indexOf(\'http\') !== 0) linkedinUrl = \'https://\' + linkedinUrl;\n' +
'  var linkedinHref = linkedinUrl ? linkedinUrl : \'https://www.google.com/search?q=\' + encodeURIComponent(name + \' \' + title + \' LinkedIn\');\n' +
'  var isFromCache = opts.fromCache && opts.email;\n' +
'  var emailRowHtml = \'\';\n' +
'  if (isFromCache) {\n' +
'    emailRowHtml = \'<span class="email-value" id="ev-\' + cid + \'">\' + opts.email + \'</span>\';\n' +
'  } else {\n' +
'    emailRowHtml = \'<span class="email-placeholder" id="ep-\' + cid + \'"></span>\' +\n' +
'      \'<span class="email-value" id="ev-\' + cid + \'" style="display:none;"></span>\';\n' +
'  }\n' +
'  var prevJobHtml = \'\';\n' +
'  if (isFromCache && opts.previousJobs && opts.previousJobs.length > 0) {\n' +
'    var pj = opts.previousJobs[opts.previousJobs.length - 1];\n' +
'    prevJobHtml = \'<div style="font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;margin-top:1px;">Previously: \' + (pj.jobTitle || \'\') + (pj.date ? \' (\' + pj.date + \')\' : \'\') + \'</div>\';\n' +
'  }\n' +
'\n' +
'  var card = document.createElement(\'div\');\n' +
'  card.className = \'contact-card\';\n' +
'  card.id = \'cb-\' + cid;\n' +
'  if (prospectId) card.setAttribute(\'data-prospect-id\', prospectId);\n' +
'  card.innerHTML =\n' +
'    \'<div class="contact-header">\' +\n' +
'      \'<div class="avatar">\' + ini + \'</div>\' +\n' +
'      \'<div class="contact-info">\' +\n' +
'        \'<div class="contact-name-row">\' +\n' +
'          \'<span class="contact-name">\' + name + \'</span>\' +\n' +
'          badgeHtml +\n' +
'          (isFromCache ? \' <span class="badge" style="background:rgba(46,125,50,0.15);color:#6EE7C7;">Cached</span>\' : \'\') +\n' +
'        \'</div>\' +\n' +
'        \'<div class="contact-title-sub">\' + title + \'</div>\' +\n' +
'        prevJobHtml +\n' +
'        cityStateHtml +\n' +
'        \'<div class="email-row">\' + emailRowHtml + \'</div>\' +\n' +
'        (isFromCache ? \'\' : \'<div class="credit-note" id="cn-\' + cid + \'">1 credit to reveal email</div>\') +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="contact-actions">\' +\n' +
'      (isFromCache ? \'\' : \'<button class="btn btn-fetch" id="fb-\' + cid + \'" onclick="fetchEmail(\\\'\' + cid + \'\\\',\\\'\' + safeId + \'\\\',\\\'\' + name.replace(/\'/g,"") + \'\\\',\\\'\' + title.replace(/\'/g,"") + \'\\\',\\\'\' + (companyName||"").replace(/\'/g,"") + \'\\\',\\\'\' + (location||"").replace(/\'/g,"") + \'\\\',\\\'\' + (prospectId||"") + \'\\\')">Fetch email</button>\') +\n' +
'      \'<a href="\' + linkedinHref + \'" target="_blank" class="btn btn-li">LinkedIn</a>\' +\n' +
'      (isFromCache ? \'<button class="btn btn-outlook" onclick="openOutlookContact(\\\'\' + cid + \'\\\',\\\'\' + safeId + \'\\\')">\' + OUTLOOK_SVG + \'</button>\' : \'\') +\n' +
'      \'<button class="btn-ghost" onclick="removeContact(\\\'\' + cid + \'\\\')">Remove</button>\' +\n' +
'    \'</div>\';\n' +
'\n' +
'  document.getElementById(\'contacts-\' + safeId).appendChild(card);\n' +
'  document.getElementById(\'ss-\' + safeId).style.display = \'none\';\n' +
'  // Show Send to All bar if any contact has email\n' +
'  updateSendAllBar(safeId);\n' +
'}\n' +
'\n' +
'function updateSendAllBar(safeId) {\n' +
'  var row = document.getElementById(\'contacts-\' + safeId);\n' +
'  var bar = document.getElementById(\'send-all-bar-\' + safeId);\n' +
'  if (!row || !bar) return;\n' +
'  var hasAnyEmail = false;\n' +
'  row.querySelectorAll(\'.email-value\').forEach(function(el) {\n' +
'    if (el.textContent && el.style.display !== \'none\') hasAnyEmail = true;\n' +
'  });\n' +
'  bar.style.display = hasAnyEmail ? \'flex\' : \'none\';\n' +
'}\n' +
'\n' +
'function openOutlookContact(cid, safeId) {\n' +
'  var email = document.getElementById(\'ev-\' + cid).textContent;\n' +
'  if (!email) return;\n' +
'  var subject = encodeURIComponent(document.getElementById(\'subj-\' + safeId).value);\n' +
'  var body = encodeURIComponent(document.getElementById(\'ebody-\' + safeId).value);\n' +
'  window.location.href = \'mailto:\' + email + \'?subject=\' + subject + \'&body=\' + body;\n' +
'  document.getElementById(\'cb-\' + cid).classList.add(\'sent\');\n' +
'}\n' +
'\n' +
'function sendToAll(safeId) {\n' +
'  var row = document.getElementById(\'contacts-\' + safeId);\n' +
'  if (!row) return;\n' +
'  var emails = [];\n' +
'  row.querySelectorAll(\'.email-value\').forEach(function(el) {\n' +
'    if (el.textContent && el.style.display !== \'none\') emails.push(el.textContent);\n' +
'  });\n' +
'  if (!emails.length) return;\n' +
'  var subject = encodeURIComponent(document.getElementById(\'subj-\' + safeId).value);\n' +
'  var body = encodeURIComponent(document.getElementById(\'ebody-\' + safeId).value);\n' +
'  window.location.href = \'mailto:\' + emails.join(\',\') + \'?subject=\' + subject + \'&body=\' + body;\n' +
'}\n' +
'\n' +
'function removeContact(cid) {\n' +
'  var el = document.getElementById(\'cb-\' + cid);\n' +
'  if (el) { el.style.opacity = \'0\'; el.style.transition = \'opacity 0.2s\'; setTimeout(function() { el.remove(); }, 200); }\n' +
'}\n' +
'\n' +
'async function fetchEmail(cid, safeId, name, title, companyName, location, prospectId) {\n' +
'  var btn = document.getElementById(\'fb-\' + cid);\n' +
'  btn.textContent = \'Fetching...\';\n' +
'  btn.disabled = true;\n' +
'  if (!prospectId) {\n' +
'    var block = document.getElementById(\'cb-\' + cid);\n' +
'    if (block) prospectId = block.getAttribute(\'data-prospect-id\') || \'\';\n' +
'  }\n' +
'  try {\n' +
'    var leadRedisId = (window._leadRedisIds && window._leadRedisIds[safeId]) || \'\';\n' +
'    var enrichPayload = { contactName: name, contactTitle: title, companyName: companyName, location: location, leadId: leadRedisId };\n' +
'    if (prospectId) enrichPayload.apollo_id = prospectId;\n' +
'    var enrichRes = await fetch(\'/api/enrich\', {\n' +
'      method: \'POST\',\n' +
'      headers: { \'Content-Type\': \'application/json\' },\n' +
'      body: JSON.stringify(enrichPayload)\n' +
'    });\n' +
'    var enrichData = await enrichRes.json();\n' +
'    var email = enrichData.email || null;\n' +
'    if (email) {\n' +
'      var epEl = document.getElementById(\'ep-\' + cid);\n' +
'      if (epEl) epEl.style.display = \'none\';\n' +
'      var evEl = document.getElementById(\'ev-\' + cid);\n' +
'      evEl.style.display = \'inline\';\n' +
'      evEl.textContent = email;\n' +
'      var cnEl = document.getElementById(\'cn-\' + cid);\n' +
'      if (cnEl) cnEl.textContent = \'1 credit used\';\n' +
'      btn.textContent = \'Email fetched\';\n' +
'      btn.className = \'btn btn-sent\';\n' +
'      btn.disabled = true;\n' +
'      // Add Outlook button\n' +
'      var outlookBtn = document.createElement(\'button\');\n' +
'      outlookBtn.className = \'btn btn-outlook\';\n' +
'      outlookBtn.innerHTML = OUTLOOK_SVG;\n' +
'      outlookBtn.onclick = function() { openOutlookContact(cid, safeId); };\n' +
'      btn.parentNode.insertBefore(outlookBtn, btn.nextSibling);\n' +
'      // Persist email to Redis on the lead contact\n' +
'      if (leadRedisId) {\n' +
'        var leadObj = leads.find(function(l) { return l.id === leadRedisId; });\n' +
'        if (leadObj && leadObj.contacts) {\n' +
'          var contactIdx = leadObj.contacts.findIndex(function(c) { return (c.apollo_id || \'\') === prospectId; });\n' +
'          if (contactIdx >= 0) leadObj.contacts[contactIdx].email = email;\n' +
'          fetch(\'/api/leads\', {\n' +
'            method: \'PATCH\',\n' +
'            headers: { \'Content-Type\': \'application/json\' },\n' +
'            body: JSON.stringify({ id: leadRedisId, updates: { contacts: leadObj.contacts } })\n' +
'          }).catch(function() {});\n' +
'        }\n' +
'      }\n' +
'      updateSendAllBar(safeId);\n' +
'    } else {\n' +
'      btn.textContent = \'Not found\';\n' +
'      btn.disabled = true;\n' +
'      var epEl2 = document.getElementById(\'ep-\' + cid);\n' +
'      if (epEl2) epEl2.textContent = \'Email not found\';\n' +
'    }\n' +
'  } catch(e) {\n' +
'    btn.textContent = \'Lookup failed\';\n' +
'    btn.disabled = false;\n' +
'  }\n' +
'}\n' +
'\n' +
'var _skipTimer = null;\n' +
'var _skipUndone = false;\n' +
'\n' +
'function showToast(html, duration) {\n' +
'  var container = document.getElementById(\'toast-container\');\n' +
'  document.getElementById(\'toast-inner\').innerHTML = html;\n' +
'  container.classList.add(\'show\');\n' +
'  return setTimeout(function() { container.classList.remove(\'show\'); }, duration || 5000);\n' +
'}\n' +
'\n' +
'function hideToast() {\n' +
'  document.getElementById(\'toast-container\').classList.remove(\'show\');\n' +
'}\n' +
'\n' +
'function showConfirm(title, sub, btnLabel, onConfirm) {\n' +
'  document.getElementById(\'confirm-title\').textContent = title;\n' +
'  document.getElementById(\'confirm-sub\').textContent = sub;\n' +
'  var btn = document.getElementById(\'confirm-action-btn\');\n' +
'  btn.textContent = btnLabel;\n' +
'  btn.onclick = function() { closeConfirm(); onConfirm(); };\n' +
'  document.getElementById(\'confirm-overlay\').classList.add(\'open\');\n' +
'}\n' +
'\n' +
'function closeConfirm() {\n' +
'  document.getElementById(\'confirm-overlay\').classList.remove(\'open\');\n' +
'}\n' +
'\n' +
'function toggleBlockCompany(company, btn) {\n' +
'  var isBlocked = isCompanyBlocked(company);\n' +
'  if (isBlocked) {\n' +
'    fetch(\'/api/blocklist\', {\n' +
'      method: \'DELETE\',\n' +
'      headers: { \'Content-Type\': \'application/json\' },\n' +
'      body: JSON.stringify({ type: \'companies\', value: company })\n' +
'    });\n' +
'    blocklist.companies = blocklist.companies.filter(function(c) { return c.toLowerCase() !== company.toLowerCase(); });\n' +
'    btn.innerHTML = \'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Block company\';\n' +
'    return;\n' +
'  }\n' +
'  showConfirm(\'Block \' + company + \'?\', \'This company won\\\'t appear in future leads.\', \'Block\', function() {\n' +
'    fetch(\'/api/blocklist\', {\n' +
'      method: \'POST\',\n' +
'      headers: { \'Content-Type\': \'application/json\' },\n' +
'      body: JSON.stringify({ type: \'companies\', value: company })\n' +
'    });\n' +
'    blocklist.companies.push(company);\n' +
'    var cardsToRemove = [];\n' +
'    leads.forEach(function(l) {\n' +
'      if (l.company.toLowerCase() === company.toLowerCase()) {\n' +
'        cardsToRemove.push(getSafeId(l.id));\n' +
'      }\n' +
'    });\n' +
'    leads = leads.filter(function(l) { return l.company.toLowerCase() !== company.toLowerCase(); });\n' +
'    cardsToRemove.forEach(function(sid) {\n' +
'      var card = document.getElementById(\'card-\' + sid);\n' +
'      if (card) { card.style.opacity = \'0\'; card.style.transition = \'opacity 0.3s\'; setTimeout(function() { card.remove(); }, 300); }\n' +
'    });\n' +
'    document.getElementById(\'lead-count\').textContent = leads.length + \' pending leads\';\n' +
'  });\n' +
'}\n' +
'\n' +
'function skipLead(safeId, realId) {\n' +
'  if (_skipTimer) { clearTimeout(_skipTimer); hideToast(); }\n' +
'  _skipUndone = false;\n' +
'  var lead = leads.find(function(l) { return l.id === realId; });\n' +
'  var companyName = lead ? lead.company : \'\';\n' +
'  var card = document.getElementById(\'card-\' + safeId);\n' +
'  var cardHTML = card ? card.outerHTML : null;\n' +
'  var cardParent = card ? card.parentNode : null;\n' +
'  var cardNext = card ? card.nextSibling : null;\n' +
'  if (card) { card.style.opacity = \'0\'; card.style.transition = \'opacity 0.2s\'; setTimeout(function() { if (!_skipUndone) card.remove(); }, 200); }\n' +
'  leads = leads.filter(function(l) { return l.id !== realId; });\n' +
'  document.getElementById(\'lead-count\').textContent = leads.length + \' pending leads\';\n' +
'  var toastHTML = \'Lead skipped: \' + companyName + \' \' +\n' +
'    \'<button class="toast-undo" onclick="undoSkip()">Undo</button>\';\n' +
'  _skipTimer = showToast(toastHTML, 5000);\n' +
'  var pendingRealId = realId;\n' +
'  var pendingLead = lead;\n' +
'  window._skipUndo = function() {\n' +
'    _skipUndone = true;\n' +
'    clearTimeout(_skipTimer);\n' +
'    hideToast();\n' +
'    if (pendingLead) leads.push(pendingLead);\n' +
'    document.getElementById(\'lead-count\').textContent = leads.length + \' pending leads\';\n' +
'    if (cardHTML && cardParent) {\n' +
'      var temp = document.createElement(\'div\');\n' +
'      temp.innerHTML = cardHTML;\n' +
'      var restored = temp.firstChild;\n' +
'      restored.style.opacity = \'0\';\n' +
'      restored.style.transition = \'opacity 0.3s\';\n' +
'      if (cardNext && cardNext.parentNode === cardParent) {\n' +
'        cardParent.insertBefore(restored, cardNext);\n' +
'      } else {\n' +
'        cardParent.appendChild(restored);\n' +
'      }\n' +
'      setTimeout(function() { restored.style.opacity = \'1\'; }, 10);\n' +
'      var rSafeId = getSafeId(pendingLead.id);\n' +
'      fetchLogo(pendingLead.company, pendingLead.employerWebsite || \'\', pendingLead.location || \'\', rSafeId);\n' +
'    }\n' +
'  };\n' +
'  setTimeout(function() {\n' +
'    if (!_skipUndone) {\n' +
'      fetch(\'/api/leads\', {\n' +
'        method: \'PATCH\',\n' +
'        headers: { \'Content-Type\': \'application/json\' },\n' +
'        body: JSON.stringify({ id: pendingRealId, updates: { status: \'skipped\' } })\n' +
'      });\n' +
'    }\n' +
'  }, 5200);\n' +
'}\n' +
'\n' +
'function undoSkip() {\n' +
'  if (window._skipUndo) window._skipUndo();\n' +
'}\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';

  res.status(200).send(html);
};
