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
'body { font-family: Raleway, -apple-system, BlinkMacSystemFont, sans-serif; background: #080f1a; color: #e0e4ec; min-height: 100vh; }\n' +
'h1,h2,h3,h4,h5,h6,.section-label,.pill,.cal-month { font-family: Oswald, sans-serif; }\n' +
'.header { background: rgba(10,18,38,0.95); backdrop-filter: blur(16px); padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(26,78,162,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }\n' +
'.header-logo { height: 34px; }\n' +
'.header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-family: Oswald, sans-serif; font-size: 20px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }\n' +
'.header-meta { color: rgba(255,255,255,0.45); font-size: 12px; text-align: right; }\n' +
'.container { max-width: 920px; margin: 0 auto; padding: 28px 16px 60px; }\n' +
'.queue-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }\n' +
'.queue-bar h2 { font-size: 26px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }\n' +
'.queue-bar .sub { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 3px; }\n' +
'.lead-count-badge { background: linear-gradient(135deg, #FFA000, #E8620A); color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; box-shadow: 0 2px 12px rgba(232,98,10,0.35); }\n' +
'.card { background: linear-gradient(180deg, #1e2e48 0%, #1a2744 100%); border-radius: 18px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05); border: 1px solid rgba(26,78,162,0.18); }\n' +
'.card-top { background: linear-gradient(135deg, #0e1d36 0%, #1a3358 80%, #1e3860 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }\n' +
'.card-top-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }\n' +
'.company-logo-wrap { width: 64px; height: 64px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }\n' +
'.company-initials { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #FFA000, #E8620A); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; flex-shrink: 0; font-family: Oswald, sans-serif; }\n' +
'.company-name { font-size: 18px; font-weight: 700; color: white; line-height: 1.2; font-family: Oswald, sans-serif; }\n' +
'.company-location { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px; }\n' +
'.card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }\n' +
'.pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase; }\n' +
'.pill-eng { background: rgba(29,158,117,0.07); color: #6EE7C7; border: 1px solid rgba(110,231,199,0.35); }\n' +
'.pill-acc { background: rgba(99,179,237,0.06); color: #93C5FD; border: 1px solid rgba(147,197,253,0.35); }\n' +
'.pill-it { background: rgba(255,160,0,0.06); color: #FCD34D; border: 1px solid rgba(252,211,77,0.35); }\n' +
'.pill-other { background: rgba(168,130,255,0.06); color: #C4B5FD; border: 1px solid rgba(196,181,253,0.35); }\n' +
'.card-top-job-title { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 500; line-height: 1.3; }\n' +
// Links bar between header and body
'.links-bar { display: flex; justify-content: space-between; align-items: center; padding: 8px 24px; border-bottom: 1px solid transparent; border-image: linear-gradient(to right, transparent, rgba(26,78,162,0.2), transparent) 1; background: rgba(0,0,0,0.08); }\n' +
'.links-bar-left, .links-bar-right { display: flex; gap: 12px; align-items: center; }\n' +
'.link-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); cursor: pointer; text-decoration: none; transition: all 0.15s; }\n' +
'.link-icon:hover { background: rgba(255,255,255,0.1); color: #63a4ff; border-color: rgba(26,78,162,0.3); }\n' +
'.link-icon svg { width: 15px; height: 15px; }\n' +
'.card-body { padding: 20px 24px; background: rgba(255,255,255,0.01); }\n' +
'.cal-block { background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; width: 62px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.cal-month { background: rgba(26,78,162,0.5); color: white; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; width: 100%; text-align: center; padding: 4px 0; }\n' +
'.cal-day { font-size: 22px; font-weight: 800; color: white; padding: 4px 0 1px; line-height: 1; font-family: Oswald, sans-serif; }\n' +
'.cal-year { font-size: 9px; color: rgba(255,255,255,0.4); padding-bottom: 5px; }\n' +
'.divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 16px 0; }\n' +
'.section-label { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #E8620A; }\n' +
// Contact cards
'.contacts-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }\n' +
'.contact-card { flex: 1; min-width: 200px; max-width: 320px; background: #2a3a5c; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 14px; transition: all 0.2s; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.15); }\n' +
'.contact-card:hover { border-color: rgba(26,78,162,0.4); background: #2f4065; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.2); }\n' +
'.contact-card.active { border-color: rgba(93,202,165,0.7); background: #283d58; box-shadow: 0 0 16px rgba(93,202,165,0.25), 0 0 32px rgba(93,202,165,0.08), 0 4px 16px rgba(0,0,0,0.2); }\n' +
'.contact-card.sent { border-color: rgba(93,202,165,0.4); background: rgba(93,202,165,0.06); }\n' +
'.contact-header { display: flex; align-items: flex-start; gap: 10px; }\n' +
'.avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1A4EA2, #0F1E3D); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; font-family: Oswald, sans-serif; overflow: hidden; }\n' +
'.avatar img { width: 100%; height: 100%; object-fit: cover; }\n' +
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
// Buttons
'.btn { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #cdd; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.btn-li { background: rgba(10,102,194,0.2); color: #63a4ff; border-color: rgba(10,102,194,0.3); padding: 5px 8px; }\n' +
'.btn-li:hover { background: rgba(10,102,194,0.3); }\n' +
'.btn-fetch { background: rgba(255,160,0,0.15); color: #FCD34D; border-color: rgba(255,160,0,0.3); }\n' +
'.btn-fetch:hover { background: rgba(255,160,0,0.25); }\n' +
'.btn-sent { background: rgba(93,202,165,0.15); color: #6EE7C7; border-color: rgba(93,202,165,0.3); cursor: default; }\n' +
'.btn-select { background: rgba(93,202,165,0.1); color: rgba(255,255,255,0.6); border-color: rgba(93,202,165,0.2); }\n' +
'.btn-select:hover { background: rgba(93,202,165,0.2); color: #6EE7C7; }\n' +
'.btn-select.active { background: rgba(93,202,165,0.2); color: #6EE7C7; border-color: rgba(93,202,165,0.4); }\n' +
'.btn-outlook { background: rgba(0,120,215,0.15); color: #63a4ff; border-color: rgba(0,120,215,0.25); display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px; }\n' +
'.btn-outlook:hover { background: rgba(0,120,215,0.25); }\n' +
'.btn-outlook.disabled { opacity: 0.3; cursor: default; pointer-events: none; }\n' +
'.btn-ghost { color: rgba(255,255,255,0.3); font-size: 11px; border: none; background: none; cursor: pointer; padding: 3px 5px; font-weight: 500; }\n' +
'.btn-ghost:hover { color: #ef6961; }\n' +
'.btn-primary { background: #1A4EA2; color: white; border-color: #1A4EA2; }\n' +
'.btn-primary:hover { background: #2060c0; }\n' +
'.btn-more-contacts { background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 16px; font-size: 12px; color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }\n' +
'.btn-more-contacts:hover { background: rgba(255,255,255,0.08); color: #63a4ff; border-color: rgba(26,78,162,0.3); }\n' +
// Composer
'.composer { background: #1e2e4a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 14px; }\n' +
'.composer-label { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-family: Oswald, sans-serif; padding-left: 10px; border-left: 3px solid #E8620A; }\n' +
'.composer-disabled { text-align: center; padding: 24px; color: rgba(255,255,255,0.25); font-size: 13px; font-style: italic; }\n' +
'.subject-select { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; background: #243352; color: #e0e4ec; font-family: Raleway, sans-serif; margin-bottom: 4px; appearance: auto; cursor: pointer; }\n' +
'.subject-select:focus { outline: none; border-color: #1A4EA2; }\n' +
'.subject-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; background: #243352; color: #e0e4ec; font-family: Raleway, sans-serif; margin-bottom: 6px; }\n' +
'.subject-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'textarea { width: 100%; font-size: 12px; line-height: 1.7; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; resize: vertical; font-family: monospace; min-height: 180px; }\n' +
'textarea:focus { outline: none; border-color: #1A4EA2; }\n' +
'.tab-row { display: flex; gap: 6px; margin-bottom: 8px; }\n' +
'.tab { font-size: 11px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; font-weight: 600; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.tab.active { background: #1A4EA2; color: white; border-color: #1A4EA2; }\n' +
// Search panel
'.search-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; background: rgba(255,255,255,0.02); margin-bottom: 12px; }\n' +
'.search-panel-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; font-weight: 600; }\n' +
'.search-input { width: 100%; font-size: 13px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #e0e4ec; font-family: Raleway, sans-serif; }\n' +
'.search-input:focus { outline: none; border-color: #1A4EA2; }\n' +
'.search-results { margin-top: 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.03); }\n' +
'.search-result-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; }\n' +
'.search-result-item:last-child { border-bottom: none; }\n' +
'.search-result-item:hover { background: rgba(255,255,255,0.04); }\n' +
'.search-add-btn { font-size: 11px; font-weight: 700; color: #63a4ff; background: rgba(26,78,162,0.15); padding: 3px 10px; border-radius: 6px; cursor: pointer; border: none; }\n' +
// Footer
'.card-footer { display: flex; gap: 8px; align-items: center; padding: 14px 24px; border-top: 1px solid transparent; border-image: linear-gradient(to right, transparent, rgba(26,78,162,0.2), transparent) 1; background: rgba(0,0,0,0.1); }\n' +
'.btn-glass { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 28px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); text-decoration: none; font-family: Raleway, sans-serif; }\n' +
'.btn-glass:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.btn-glass-skip { background: rgba(232,98,10,0.15); color: #FFA000; border-color: rgba(232,98,10,0.3); }\n' +
'.btn-glass-skip:hover { background: rgba(232,98,10,0.25); }\n' +
'.btn-glass-block { background: rgba(198,40,40,0.12); color: #ef6961; border-color: rgba(198,40,40,0.25); }\n' +
'.btn-glass-block:hover { background: rgba(198,40,40,0.2); }\n' +
// Modal
'.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(5,10,25,0.8); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px); }\n' +
'.modal-overlay.open { display: flex; }\n' +
'.modal { background: linear-gradient(180deg, #1e2e48 0%, #1a2744 100%); border: 1px solid rgba(26,78,162,0.25); border-radius: 20px; max-width: 560px; width: 92%; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05); }\n' +
'.modal-header { padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }\n' +
'.modal-header h3 { font-size: 16px; font-weight: 600; color: #fff; font-family: Oswald, sans-serif; }\n' +
'.modal-close { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; cursor: pointer; font-size: 14px; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }\n' +
'.modal-close:hover { background: rgba(255,255,255,0.1); }\n' +
'.modal-body { padding: 16px 24px; overflow-y: auto; }\n' +
'.modal-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }\n' +
'.modal-row:last-child { border-bottom: none; }\n' +
'.modal-row-name { font-size: 13px; font-weight: 600; color: #fff; }\n' +
'.modal-row-title { font-size: 11px; color: rgba(255,255,255,0.45); }\n' +
// Toast & confirm
'.toast-container { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(80px); z-index: 300; opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none; }\n' +
'.toast-container.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }\n' +
'.toast { background: linear-gradient(135deg, #E8620A, #d4560a); color: white; border-radius: 28px; padding: 12px 20px; box-shadow: 0 8px 32px rgba(232,98,10,0.4); display: flex; align-items: center; gap: 12px; font-size: 13px; white-space: nowrap; }\n' +
'.toast-undo { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 16px; padding: 4px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }\n' +
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
'.btn-send-email { display: inline-flex; align-items: center; gap: 10px; padding: 12px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg, #0078D4, #005a9e); color: white; font-family: Raleway, sans-serif; transition: all 0.25s ease; box-shadow: 0 2px 12px rgba(0,120,212,0.35); margin-top: 10px; letter-spacing: 0.3px; }\n' +
'.btn-send-email:hover { background: linear-gradient(135deg, #1a8ae6, #0078D4); box-shadow: 0 4px 20px rgba(0,120,212,0.5), 0 0 30px rgba(0,120,212,0.2); transform: translateY(-2px); }\n' +
'.btn-send-email.disabled { opacity: 0.35; cursor: default; pointer-events: none; }\n' +
'.btn-glass-complete { background: rgba(29,158,117,0.15); color: #6EE7C7; border-color: rgba(29,158,117,0.3); }\n' +
'.btn-glass-complete:hover { background: rgba(29,158,117,0.25); }\n' +
'.btn-glass-reassign { background: rgba(99,164,255,0.12); color: #93C5FD; border-color: rgba(99,164,255,0.25); }\n' +
'.btn-glass-reassign:hover { background: rgba(99,164,255,0.2); }\n' +
'.reassign-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); transition: all 0.15s; border-radius: 8px; margin: 2px 0; }\n' +
'.reassign-item:last-child { border-bottom: none; }\n' +
'.reassign-item:hover { background: rgba(26,78,162,0.12); color: #fff; }\n' +
'.reassign-btn { font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 6px; border: 1px solid rgba(29,158,117,0.3); background: rgba(29,158,117,0.12); color: #6EE7C7; cursor: pointer; transition: all 0.15s; }\n' +
'.reassign-btn:hover { background: rgba(29,158,117,0.25); box-shadow: 0 0 8px rgba(29,158,117,0.2); }\n' +
'.remove-wrap { position: relative; display: inline-block; }\n' +
'.remove-dd { display: none; position: absolute; bottom: 100%; right: 0; background: #1a2744; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; min-width: 190px; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.4); overflow: hidden; margin-bottom: 4px; }\n' +
'.remove-dd.open { display: block; }\n' +
'.remove-dd-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; color: rgba(255,255,255,0.6); }\n' +
'.remove-dd-item:last-child { border-bottom: none; }\n' +
'.remove-dd-btn { font-size: 10px; font-weight: 600; color: #ef6961; background: rgba(198,40,40,0.12); border: 1px solid rgba(198,40,40,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; }\n' +
'.remove-dd-btn:hover { background: rgba(198,40,40,0.25); }\n' +
// Neon glow button animations
'.btn-fetch:hover { box-shadow: 0 0 14px rgba(255,160,0,0.4), 0 0 28px rgba(255,160,0,0.15); transform: translateY(-2px); }\n' +
'.btn-send-email.pulse { animation: sendPulse 2s ease-in-out infinite; }\n' +
'@keyframes sendPulse { 0%,100% { box-shadow: 0 2px 12px rgba(0,120,212,0.35); } 50% { box-shadow: 0 4px 24px rgba(0,120,212,0.6), 0 0 40px rgba(0,120,212,0.2); } }\n' +
'.btn-glass-skip:hover { box-shadow: 0 0 14px rgba(232,98,10,0.4), 0 0 28px rgba(232,98,10,0.15); }\n' +
'.btn-glass-block:hover { box-shadow: 0 0 14px rgba(239,105,97,0.35), 0 0 28px rgba(198,40,40,0.15); }\n' +
'.btn-glass-complete:hover { box-shadow: 0 0 14px rgba(29,158,117,0.35), 0 0 28px rgba(29,158,117,0.15); }\n' +
'.btn-glass-reassign:hover { box-shadow: 0 0 12px rgba(99,164,255,0.3), 0 0 24px rgba(99,164,255,0.12); }\n' +
'.btn-glass:hover { box-shadow: 0 0 10px rgba(255,255,255,0.08); }\n' +
'.link-icon:hover { box-shadow: 0 0 10px rgba(99,164,255,0.3); }\n' +
'.btn-li:hover { box-shadow: 0 0 10px rgba(10,102,194,0.35); }\n' +
// Gradient bottom line on hover for glass buttons
'.btn-glass::after { content: ""; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(to right, transparent, currentColor, transparent); opacity: 0; transition: opacity 0.25s ease; }\n' +
'.btn-glass { position: relative; overflow: hidden; }\n' +
'.btn-glass:hover::after { opacity: 0.3; }\n' +
// Rich text editor
'.rich-editor { width: 100%; font-size: 13px; line-height: 1.7; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; background: #243352; color: #e0e4ec; min-height: 180px; overflow-y: auto; font-family: Raleway, sans-serif; outline: none; white-space: pre-wrap; }\n' +
'.rich-editor:focus { border-color: #1A4EA2; }\n' +
'.rich-editor a { color: #63a4ff; text-decoration: underline; }\n' +
// Outlook toggle
'.outlook-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.45); }\n' +
'.outlook-toggle-btns { display: inline-flex; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.outlook-toggle-btn { padding: 2px 10px; font-size: 10px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.4); transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.outlook-toggle-btn.active { background: rgba(26,78,162,0.4); color: white; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<div class="header">\n' +
'  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact">\n' +
'  <div class="header-center">Lead Review</div>\n' +
'  <div style="display:flex;align-items:center;gap:14px;">\n' +
'    <div class="outlook-toggle"><span>Outlook:</span><div class="outlook-toggle-btns"><button class="outlook-toggle-btn active" id="ol-classic" onclick="setOutlookPref(\\\'classic\\\')">Classic</button><button class="outlook-toggle-btn" id="ol-new" onclick="setOutlookPref(\\\'new\\\')">New</button></div></div>\n' +
'    <div class="header-meta" id="header-date"></div>\n' +
'  </div>\n' +
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
'<div class="modal-overlay" id="jd-overlay" onclick="if(event.target===this)closeJDBtn()">\n' +
'  <div class="modal">\n' +
'    <div class="modal-header">\n' +
'      <h3 id="jd-popup-title">Job Description</h3>\n' +
'      <button class="modal-close" onclick="closeJDBtn()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div class="modal-body" id="jd-popup-body" style="font-size:13px;line-height:1.75;color:rgba(255,255,255,0.7);white-space:pre-wrap;"></div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="ac-overlay" onclick="if(event.target===this)closeACModal()">\n' +
'  <div class="modal">\n' +
'    <div class="modal-header">\n' +
'      <h3 id="ac-title">Additional Contacts</h3>\n' +
'      <button class="modal-close" onclick="closeACModal()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div class="modal-body" id="ac-body"></div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="reassign-overlay" onclick="if(event.target===this)closeReassignModal()">\n' +
'  <div class="modal">\n' +
'    <div class="modal-header">\n' +
'      <h3 id="reassign-title">Reassign Lead</h3>\n' +
'      <button class="modal-close" onclick="closeReassignModal()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div class="modal-body" id="reassign-body"></div>\n' +
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
'var SVG_GLOBE = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>\';\n' +
'var SVG_LINKEDIN = \'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>\';\n' +
'var SVG_DOC = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>\';\n' +
'var SVG_LINK = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>\';\n' +
'var SVG_MAIL = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>\';\n' +
'var SVG_PLUS = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\';\n' +
'var SVG_OUTLOOK_LOGO = \'<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="22" height="18" rx="3" fill="#0078D4"/><path d="M2 6l10 7 10-7" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>\';\n' +
'var SVG_CHECK = \'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>\';\n' +
'var SVG_REASSIGN = \'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>\';\n' +
'var AM_NAMES = ["Doug Koetsier","Paul Kujawski","Matt Peal","Lauren Sylvester","Dan Teliczan","Curt Willbrandt","Trish Wangler","Tyler Ray","Mark Herman","Jamie Drajka","Drew Bentsen","Steve Betteley"];\n' +
'\n' +
'var AM = { name: "Mark Sapoznikov", email: "msapoznikov@impactbusinessgroup.com" };\n' +
'var leads = [];\n' +
'var blocklist = { companies: [], titles: [] };\n' +
'var contactCounters = {};\n' +
'var logoCache = {};\n' +
'var activeContacts = {};\n' +
'var composerState = {};\n' +
'\n' +
'function getSafeId(id) { return id.replace(/[^a-zA-Z0-9]/g, "_"); }\n' +
'function escHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\\\'/g,"&#39;"); }\n' +
'function initials(name) { return name.split(" ").map(function(n){return n[0]||"";}).join("").toUpperCase().slice(0,2); }\n' +
'function companyInitials(name) { var w=name.trim().split(/\\s+/); return w.length===1?w[0].slice(0,2).toUpperCase():(w[0][0]+w[1][0]).toUpperCase(); }\n' +
'function isCompanyBlocked(c) { return blocklist.companies.some(function(b){return b.toLowerCase()===c.toLowerCase();}); }\n' +
'function formatPostDate(lead) { var d=lead.createdAt?new Date(lead.createdAt):new Date(); return {month:d.toLocaleString("en-US",{month:"short"}).toUpperCase(),day:d.getDate(),year:d.getFullYear()}; }\n' +
'function categoryPill(cat) {\n' +
'  if(cat==="accounting") return \'<span class="pill pill-acc">Accounting</span>\';\n' +
'  if(cat==="it") return \'<span class="pill pill-it">IT</span>\';\n' +
'  if(cat==="other") return \'<span class="pill pill-other">Other</span>\';\n' +
'  return \'<span class="pill pill-eng">Engineering</span>\';\n' +
'}\n' +
'\n' +
'function getEmailTemplate(lead, firstName, uniqid) {\n' +
'  var uid = uniqid || "*|UNIQID|*";\n' +
'  return "Hi " + firstName + ",<br><br>" +\n' +
'    "I noticed " + lead.company + " is looking for a " + lead.jobTitle + " and wanted to reach out. At iMPact Business Group, we specialize in connecting companies with top talent in engineering, IT, accounting, and business professional roles.<br><br>" +\n' +
'    "We have a strong track record of placing quality candidates quickly. You can see some of our recent success stories here: <a href=\\"https://impactbusinessgroup.com/case-studies/?cid=" + uid + "\\">View Case Studies</a><br><br>" +\n' +
'    "If you are open to it, I would love to connect and learn more about what you are looking for in this role.<br><br>" +\n' +
'    "<a href=\\"https://impactbusinessgroup.com/?cid=" + uid + "\\">Visit our website</a>";\n' +
'}\n' +
'\n' +
'function getLITemplate(lead, firstName, uniqid) {\n' +
'  var uid = uniqid || "*|UNIQID|*";\n' +
'  return "Hi " + firstName + ", I saw " + lead.company + " is hiring for a " + lead.jobTitle + " and thought I would reach out. We help companies find top talent fast. Happy to connect: https://impactbusinessgroup.com/?cid=" + uid;\n' +
'}\n' +
'\n' +
// Logo functions
'async function fetchLogo(company, website, location, safeId, apolloLogo) {\n' +
'  var ck=company.toLowerCase(); if(logoCache[ck]!==undefined){applyLogo(safeId,logoCache[ck]);return;}\n' +
'  var domain=""; if(website){var w=website;if(w.indexOf("http")!==0)w="https://"+w;try{domain=new URL(w).hostname.replace("www.","");}catch(e){}}\n' +
'  if(!domain) domain=company.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,20)+".com";\n' +
'  try{var u="/api/logo?domain="+encodeURIComponent(domain);if(apolloLogo)u+="&apollo_logo="+encodeURIComponent(apolloLogo);var r=await fetch(u);var d=await r.json();var url=d.url||null;logoCache[ck]=url;applyLogo(safeId,url);}catch(e){logoCache[ck]=null;applyLogo(safeId,null);}\n' +
'}\n' +
'function applyLogo(safeId, url) {\n' +
'  var wrap=document.getElementById("logo-"+safeId),ini=document.getElementById("ini-"+safeId);if(!wrap)return;\n' +
'  if(url){var img=document.createElement("img");img.src=url;img.style.cssText="width:100%;height:100%;object-fit:cover;";img.onerror=function(){wrap.style.display="none";if(ini)ini.style.display="flex";};wrap.innerHTML="";wrap.appendChild(img);wrap.style.display="flex";if(ini)ini.style.display="none";}else{wrap.style.display="none";if(ini)ini.style.display="flex";}\n' +
'}\n' +
'\n' +
'async function init() {\n' +
'  var today=new Date();\n' +
'  document.getElementById("header-date").textContent=today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});\n' +
'  document.getElementById("queue-sub").textContent="All pending leads";\n' +
'  try{\n' +
'    var results=await Promise.all([fetch("/api/leads").then(function(r){return r.json();}),fetch("/api/blocklist").then(function(r){return r.json();})]);\n' +
'    leads=results[0].leads||[];blocklist={companies:results[1].companies||[],titles:results[1].titles||[]};\n' +
'    document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'    renderLeads();\n' +
'    leads.forEach(function(lead){var sid=getSafeId(lead.id);fetchLogo(lead.company,lead.company_website||lead.employerWebsite||"",lead.location||"",sid,lead.company_logo_apollo||"");});\n' +
'  }catch(e){console.error("Init error:",e);document.getElementById("leads-container").innerHTML=\'<div class="loading">Error loading leads.</div>\';}\n' +
'}\n' +
'\n' +
'function renderLeads() {\n' +
'  var container=document.getElementById("leads-container");\n' +
'  if(!leads.length){container.innerHTML=\'<div class="empty"><h3>No pending leads</h3><p style="color:rgba(255,255,255,0.35);font-size:13px;">Check back after the morning fetch runs.</p></div>\';return;}\n' +
'  container.innerHTML=leads.map(function(lead){return renderCard(lead);}).join("");\n' +
'  leads.forEach(function(lead){\n' +
'    if(lead.contacts&&lead.contacts.length>0){\n' +
'      var safeId=getSafeId(lead.id);\n' +
'      lead.contacts.forEach(function(c){\n' +
'        addContact(safeId,c.full_name||c.name||"",c.job_title||c.title||"",lead.company,lead.location||"",c.apollo_id||c.prospect_id||"",{\n' +
'          suggested:true,city:c.city||"",region:c.region_name||c.region||c.state||"",linkedin:c.linkedin||"",\n' +
'          fromCache:c.fromCache||false,email:c.email||"",previousJobs:c.previousJobs||[],uniqid:c.uniqid||"",photo_url:c.photo_url||""\n' +
'        });\n' +
'      });\n' +
'    }\n' +
'  });\n' +
'}\n' +
'\n' +
'function renderCard(lead) {\n' +
'  var blocked=isCompanyBlocked(lead.company);\n' +
'  var cat=lead.category||"engineering";\n' +
'  var dates=formatPostDate(lead);\n' +
'  var hasJD=lead.description&&lead.description.length>0;\n' +
'  var ini=companyInitials(lead.company);\n' +
'  var safeId=getSafeId(lead.id);\n' +
'  var companyEsc=lead.company.replace(/\x27/g,"\x5c\x5c\x27").replace(/"/g,\x27&quot;\x27);\n' +
'  var jobTitle=lead.jobTitle||"";\n' +
'  var subj1="Question about your "+jobTitle+" position search";\n' +
'  var subj2="Your "+jobTitle+" position at "+lead.company;\n' +
'  var subj3=jobTitle+" position - iMPact Business Group";\n' +
'  var subj4="Following up on your "+jobTitle+" position";\n' +
'  var hasAllContacts=lead.allContacts&&lead.allContacts.length>0;\n' +
'\n' +
'  var linksLeft="";\n' +
'  if(lead.company_domain){\n' +
'    linksLeft+=\'<a class="link-icon" href="https://\'+lead.company_domain+\'" target="_blank" title="Website">\'+SVG_GLOBE+\'</a>\';\n' +
'  } else if(lead.company_website){\n' +
'    var wUrl=lead.company_website;if(wUrl.indexOf("http")!==0)wUrl="https://"+wUrl;\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+wUrl+\'" target="_blank" title="Website">\'+SVG_GLOBE+\'</a>\';\n' +
'  }\n' +
'  if(lead.company_linkedin){\n' +
'    var liUrl=lead.company_linkedin;if(liUrl.indexOf("http")!==0)liUrl="https://"+liUrl;\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+liUrl+\'" target="_blank" title="LinkedIn">\'+SVG_LINKEDIN+\'</a>\';\n' +
'  }\n' +
'  var linksRight="";\n' +
'  if(hasJD) linksRight+=\'<a class="link-icon" href="#" onclick="openJD(\\\'\'+safeId+\'\\\');return false;" title="Job Description">\'+SVG_DOC+\'</a>\';\n' +
'  if(lead.jobUrl) linksRight+=\'<a class="link-icon" href="\'+lead.jobUrl+\'" target="_blank" title="View Posting">\'+SVG_LINK+\'</a>\';\n' +
'\n' +
'  return \'<div class="card" id="card-\'+safeId+\'">\'+\n' +
'    \'<div class="card-top">\'+\n' +
'      \'<div class="card-top-left">\'+\n' +
'        \'<div class="company-logo-wrap" id="logo-\'+safeId+\'" style="display:none;"></div>\'+\n' +
'        \'<div class="company-initials" id="ini-\'+safeId+\'">\'+ini+\'</div>\'+\n' +
'        \'<div>\'+\n' +
'          \'<div class="card-top-job-title">\'+jobTitle+\'</div>\'+\n' +
'          \'<div class="company-name">\'+lead.company+\'</div>\'+\n' +
'          \'<div class="company-location">\'+(lead.location||"")+\'</div>\'+\n' +
'        \'</div>\'+\n' +
'      \'</div>\'+\n' +
'      \'<div class="card-top-right">\'+\n' +
'        \'<div class="cal-block">\'+\n' +
'          \'<div class="cal-month">\'+dates.month+\'</div>\'+\n' +
'          \'<div class="cal-day">\'+dates.day+\'</div>\'+\n' +
'          \'<div class="cal-year">\'+dates.year+\'</div>\'+\n' +
'        \'</div>\'+\n' +
'        categoryPill(cat)+\n' +
'      \'</div>\'+\n' +
'    \'</div>\'+\n' +
'    ((linksLeft||linksRight)?\'<div class="links-bar"><div class="links-bar-left">\'+linksLeft+\'</div><div class="links-bar-right">\'+linksRight+\'</div></div>\':"")+\n' +
'    \'<div class="card-body">\'+\n' +
'      \'<div class="section-label">Contacts</div>\'+\n' +
'      \'<div class="contacts-row" id="contacts-\'+safeId+\'"></div>\'+\n' +
'      (hasAllContacts?\'<div style="margin-bottom:14px;"><button class="btn-more-contacts" onclick="openACModal(\\\'\'+safeId+\'\\\')"><span style="width:14px;height:14px;display:inline-flex;">\'+SVG_PLUS+\'</span> Additional Contacts (\'+lead.allContacts.length+\')</button></div>\':"") +\n' +
'      \'<div class="composer" id="composer-\'+safeId+\'">\'+\n' +
'        \'<div class="composer-label">Email Composer</div>\'+\n' +
'        \'<div class="composer-disabled" id="composer-prompt-\'+safeId+\'">Select a contact to compose an email.</div>\'+\n' +
'        \'<div id="composer-active-\'+safeId+\'" style="display:none;">\'+\n' +
'          \'<div class="tab-row">\'+\n' +
'            \'<button class="tab active" onclick="switchCardTab(\\\'\'+safeId+\'\\\',\\\'email\\\',this)">Email</button>\'+\n' +
'            \'<button class="tab" onclick="switchCardTab(\\\'\'+safeId+\'\\\',\\\'linkedin\\\',this)">LinkedIn</button>\'+\n' +
'          \'</div>\'+\n' +
'          \'<div id="email-pane-\'+safeId+\'">\'+\n' +
'            \'<select class="subject-select" id="subj-select-\'+safeId+\'" onchange="onSubjectSelect(\\\'\'+safeId+\'\\\')">\'+\n' +
'              \'<option value="\'+escHtml(subj1)+\'">\'+escHtml(subj1)+\'</option>\'+\n' +
'              \'<option value="\'+escHtml(subj2)+\'">\'+escHtml(subj2)+\'</option>\'+\n' +
'              \'<option value="\'+escHtml(subj3)+\'">\'+escHtml(subj3)+\'</option>\'+\n' +
'              \'<option value="\'+escHtml(subj4)+\'">\'+escHtml(subj4)+\'</option>\'+\n' +
'            \'</select>\'+\n' +
'            \'<input class="subject-input" type="text" id="subj-\'+safeId+\'" placeholder="Subject line (editable)">\'+\n' +
'            \'<div class="rich-editor" contenteditable="true" id="ebody-\'+safeId+\'"></div>\'+\n' +
'            \'<button class="btn-send-email disabled" id="send-btn-\'+safeId+\'" onclick="sendEmail(\\\'\'+safeId+\'\\\')" title="Activate a contact first">\'+SVG_OUTLOOK_LOGO+\' Send Email</button>\'+\n' +
'          \'</div>\'+\n' +
'          \'<div id="li-pane-\'+safeId+\'" style="display:none;">\'+\n' +
'            \'<textarea id="libody-\'+safeId+\'" style="min-height:80px;font-family:Raleway,sans-serif;"></textarea>\'+\n' +
'            \'<div style="margin-top:6px;"><button class="btn btn-li" onclick="copyLICard(\\\'\'+safeId+\'\\\',this)">Copy for LinkedIn</button></div>\'+\n' +
'          \'</div>\'+\n' +
'        \'</div>\'+\n' +
'      \'</div>\'+\n' +
'    \'</div>\'+\n' +
'    \'<div class="card-footer">\'+\n' +
'      \'<button class="btn-glass btn-glass-skip" onclick="skipLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg> Skip</button>\'+\n' +
'      \'<button class="btn-glass btn-glass-block" onclick="toggleBlockCompany(\\\'\'+companyEsc+\'\\\',this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> \'+(blocked?"Unblock":"Block company")+\'</button>\'+\n' +
'      \'<div style="flex:1;"></div>\'+\n' +
'      \'<button class="btn-glass btn-glass-reassign" onclick="openReassignModal(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">\'+ SVG_REASSIGN +\' Reassign</button>\'+\n' +
'      \'<button class="btn-glass btn-glass-complete" onclick="completeLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">\'+ SVG_CHECK +\' Complete Lead</button>\'+\n' +
'    \'</div>\'+\n' +
'  \'<script>window._leadJobTitles=window._leadJobTitles||{};window._leadCategories=window._leadCategories||{};window._leadRedisIds=window._leadRedisIds||{};window._leadJobTitles["\'+safeId+\'"]=\'+JSON.stringify(lead.jobTitle||"")+\';window._leadCategories["\'+safeId+\'"]=\'+JSON.stringify(lead.category||"engineering")+\';window._leadRedisIds["\'+safeId+\'"]=\'+JSON.stringify(lead.id||"")+\';<\\/script>\'+\n' +
'  \'</div>\';\n' +
'}\n' +
'\n' +
'function onSubjectSelect(safeId) {\n' +
'  var sel=document.getElementById("subj-select-"+safeId);\n' +
'  var inp=document.getElementById("subj-"+safeId);\n' +
'  if(sel&&inp) inp.value=sel.value;\n' +
'}\n' +
'\n' +
'function switchCardTab(safeId, tab, btn) {\n' +
'  var card=document.getElementById("card-"+safeId);if(!card)return;\n' +
'  card.querySelectorAll(".composer .tab").forEach(function(t){t.classList.remove("active");});\n' +
'  btn.classList.add("active");\n' +
'  document.getElementById("email-pane-"+safeId).style.display=tab==="email"?"block":"none";\n' +
'  document.getElementById("li-pane-"+safeId).style.display=tab==="linkedin"?"block":"none";\n' +
'}\n' +
'\n' +
'function copyLICard(safeId,btn) {\n' +
'  navigator.clipboard.writeText(document.getElementById("libody-"+safeId).value).then(function(){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy for LinkedIn";},2000);});\n' +
'}\n' +
'\n' +
'function addContact(safeId, name, title, companyName, location, prospectId, opts) {\n' +
'  opts=opts||{};\n' +
'  if(!contactCounters[safeId]) contactCounters[safeId]=0;\n' +
'  contactCounters[safeId]++;\n' +
'  var cid=safeId+"_c"+contactCounters[safeId];\n' +
'  var ini=initials(name);\n' +
'  var photoUrl=opts.photo_url||"";\n' +
'  console.log("Contact photo:",name,photoUrl||"(none)");\n' +
'  if(photoUrl&&photoUrl.indexOf("static.licdn.com")!==-1) photoUrl="";\n' +
'  var avatarInner=photoUrl?\'<img src="\'+photoUrl+\'" onerror="this.parentNode.innerHTML=\\\'\'+ini+\'\\\'">\':ini;\n' +
'  var linkedinUrl=opts.linkedin||"";\n' +
'  if(linkedinUrl&&linkedinUrl.indexOf("http")!==0) linkedinUrl="https://"+linkedinUrl;\n' +
'  var linkedinHref=linkedinUrl?linkedinUrl:"https://www.google.com/search?q="+encodeURIComponent(name+" "+title+" LinkedIn");\n' +
'  var isFromCache=opts.fromCache&&opts.email;\n' +
'  var hasEmail=!!opts.email;\n' +
'  var emailRowHtml="";\n' +
'  if(hasEmail){\n' +
'    emailRowHtml=\'<span class="email-value" id="ev-\'+cid+\'">\'+opts.email+\'</span>\';\n' +
'  } else {\n' +
'    emailRowHtml=\'<span class="email-placeholder" id="ep-\'+cid+\'"></span><span class="email-value" id="ev-\'+cid+\'" style="display:none;"></span>\';\n' +
'  }\n' +
'  var prevJobHtml="";\n' +
'  if(isFromCache&&opts.previousJobs&&opts.previousJobs.length>0){\n' +
'    var pj=opts.previousJobs[opts.previousJobs.length-1];\n' +
'    prevJobHtml=\'<div style="font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;margin-top:1px;">Previously: \'+(pj.jobTitle||"")+(pj.date?" ("+pj.date+")":"")+\'</div>\';\n' +
'  }\n' +
'  var cityStateHtml="";\n' +
'  if(opts.city||opts.region) cityStateHtml=\'<div class="contact-loc">\'+(opts.city||"")+(opts.city&&opts.region?", ":"")+(opts.region||"")+\'</div>\';\n' +
'\n' +
'  var card=document.createElement("div");\n' +
'  card.className="contact-card";\n' +
'  card.id="cb-"+cid;\n' +
'  card.setAttribute("data-cid",cid);\n' +
'  card.setAttribute("data-safe-id",safeId);\n' +
'  card.setAttribute("data-name",name);\n' +
'  card.setAttribute("data-title",title);\n' +
'  card.setAttribute("data-company",companyName);\n' +
'  card.setAttribute("data-location",location);\n' +
'  if(prospectId) card.setAttribute("data-prospect-id",prospectId);\n' +
'  if(opts.email) card.setAttribute("data-email",opts.email);\n' +
'  if(opts.uniqid) card.setAttribute("data-uniqid",opts.uniqid);\n' +
'\n' +
'  card.innerHTML=\n' +
'    \'<div class="contact-header">\'+\n' +
'      \'<div class="avatar">\'+avatarInner+\'</div>\'+\n' +
'      \'<div class="contact-info">\'+\n' +
'        \'<div class="contact-name-row">\'+\n' +
'          \'<span class="contact-name">\'+name+\'</span>\'+\n' +
'          (isFromCache?\' <span class="badge" style="background:rgba(46,125,50,0.15);color:#6EE7C7;">Cached</span>\':"")+\n' +
'        \'</div>\'+\n' +
'        \'<div class="contact-title-sub">\'+title+\'</div>\'+\n' +
'        prevJobHtml+cityStateHtml+\n' +
'        \'<div class="email-row">\'+emailRowHtml+\'</div>\'+\n' +
'        (hasEmail?"":\'<div class="credit-note" id="cn-\'+cid+\'">1 credit to reveal email</div>\')+\n' +
'      \'</div>\'+\n' +
'    \'</div>\'+\n' +
'    \'<div class="contact-actions">\'+\n' +
'      (hasEmail?"":\'<button class="btn btn-fetch" id="ge-\'+cid+\'" onclick="event.stopPropagation();getEmail(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\')">Get Email</button>\')+\n' +
'      \'<a href="\'+linkedinHref+\'" target="_blank" class="btn btn-li" title="LinkedIn" onclick="event.stopPropagation();">\'+SVG_LINKEDIN.replace(\'viewBox="0 0 24 24"\',\'viewBox="0 0 24 24" width="14" height="14"\')+\'</a>\'+\n' +
'      \'<div class="remove-wrap"><button class="btn-ghost" onclick="event.stopPropagation();toggleRemoveDD(\\\'\'+cid+\'\\\')">Remove</button><div class="remove-dd" id="rdd-\'+cid+\'">\'+\n' +
'        \'<div class="remove-dd-item"><span>Wrong contact type</span><button class="remove-dd-btn" onclick="event.stopPropagation();removeWrongType(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\')">Remove</button></div>\'+\n' +
'        \'<div class="remove-dd-item"><span>Existing contact</span><button class="remove-dd-btn" onclick="event.stopPropagation();removeContact(\\\'\'+cid+\'\\\')">Remove</button></div>\'+\n' +
'        \'<div class="remove-dd-item"><span>Other</span><button class="remove-dd-btn" onclick="event.stopPropagation();removeContact(\\\'\'+cid+\'\\\')">Remove</button></div>\'+\n' +
'      \'</div></div>\'+\n' +
'    \'</div>\';\n' +
'\n' +
'  card.style.cursor="pointer";\n' +
'  card.addEventListener("click",function(e){\n' +
'    if(e.target.closest(".contact-actions")) return;\n' +
'    var em=card.getAttribute("data-email");\n' +
'    if(!em) return;\n' +
'    activateContact(cid,safeId);\n' +
'  });\n' +
'  document.getElementById("contacts-"+safeId).appendChild(card);\n' +
'}\n' +
'\n' +
'function logFeedback(title,category,signal){\n' +
'  fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"log_feedback",title:title,category:category,signal:signal})}).catch(function(){});\n' +
'}\n' +
'function toggleRemoveDD(cid){\n' +
'  var dd=document.getElementById("rdd-"+cid);\n' +
'  if(dd) dd.classList.toggle("open");\n' +
'}\n' +
'function removeContact(cid) {\n' +
'  var el=document.getElementById("cb-"+cid);\n' +
'  if(el){el.style.opacity="0";el.style.transition="opacity 0.2s";setTimeout(function(){el.remove();},200);}\n' +
'}\n' +
'function removeWrongType(cid,safeId){\n' +
'  var card=document.getElementById("cb-"+cid);\n' +
'  if(card){\n' +
'    var title=card.getAttribute("data-title")||"";\n' +
'    var cat=(window._leadCategories&&window._leadCategories[safeId])||"engineering";\n' +
'    logFeedback(title,cat,"mild_negative");\n' +
'  }\n' +
'  removeContact(cid);\n' +
'}\n' +
'\n' +
// Activate contact (tile click - requires email)
'async function activateContact(cid, safeId) {\n' +
'  var card=document.getElementById("cb-"+cid);\n' +
'  if(!card) return;\n' +
'  var email=card.getAttribute("data-email")||"";\n' +
'  if(!email) return;\n' +
'  var name=card.getAttribute("data-name");\n' +
'  var title=card.getAttribute("data-title");\n' +
'  var companyName=card.getAttribute("data-company");\n' +
'  var prospectId=card.getAttribute("data-prospect-id")||"";\n' +
'  var uniqid=card.getAttribute("data-uniqid")||"";\n' +
'  var firstName=name.split(" ")[0];\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  var leadRedisId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'\n' +
'  // Mailchimp lookup/add\n' +
'  if(!uniqid){\n' +
'    try{\n' +
'      var mcRes=await fetch("/api/mailchimp?email="+encodeURIComponent(email));\n' +
'      var mcData=await mcRes.json();\n' +
'      if(mcData.found&&mcData.member){\n' +
'        uniqid=mcData.member.unique_email_id||"";\n' +
'      } else {\n' +
'        var addRes=await fetch("/api/mailchimp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add",email:email,fname:firstName,lname:name.split(" ").slice(1).join(" ")||"",title:title,company:companyName,source:"BD Pipeline"})});\n' +
'        var addData=await addRes.json();\n' +
'        uniqid=addData.unique_email_id||"";\n' +
'      }\n' +
'      if(uniqid){\n' +
'        card.setAttribute("data-uniqid",uniqid);\n' +
'        // Save uniqid to lead in Redis\n' +
'        if(leadRedisId&&lead&&lead.contacts){\n' +
'          var ci2=lead.contacts.findIndex(function(c){return(c.apollo_id||"")===prospectId;});\n' +
'          if(ci2>=0){lead.contacts[ci2].uniqid=uniqid;lead.contacts[ci2].email=email;}\n' +
'          fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts}})}).catch(function(){});\n' +
'        }\n' +
'      }\n' +
'    }catch(e){console.error("Mailchimp error:",e);}\n' +
'  }\n' +
'\n' +
'  // Mark active\n' +
'  var prevActive=activeContacts[safeId];\n' +
'  if(prevActive){\n' +
'    var prevCard=document.getElementById("cb-"+prevActive);\n' +
'    if(prevCard) prevCard.classList.remove("active");\n' +
'  }\n' +
'  activeContacts[safeId]=cid;\n' +
'  card.classList.add("active");\n' +
'\n' +
'  // Enable Send Email button\n' +
'  var sendBtn=document.getElementById("send-btn-"+safeId);\n' +
'  if(sendBtn){sendBtn.classList.remove("disabled");sendBtn.removeAttribute("title");sendBtn.classList.add("pulse");}\n' +
'\n' +
'  // Activate composer with merge fields\n' +
'  document.getElementById("composer-prompt-"+safeId).style.display="none";\n' +
'  document.getElementById("composer-active-"+safeId).style.display="block";\n' +
'\n' +
'  var subjInput=document.getElementById("subj-"+safeId);\n' +
'  var ebodyEl=document.getElementById("ebody-"+safeId);\n' +
'  var libodyEl=document.getElementById("libody-"+safeId);\n' +
'\n' +
'  // If first time or no state, populate fresh\n' +
'  if(!composerState[safeId]){\n' +
'    composerState[safeId]={subj:"",body:"",li:"",lastFirstName:"",lastUniqid:""};\n' +
'    var sel=document.getElementById("subj-select-"+safeId);\n' +
'    if(sel) subjInput.value=sel.options[0].value;\n' +
'    if(lead) ebodyEl.innerHTML=getEmailTemplate(lead,firstName,uniqid);\n' +
'    if(lead) libodyEl.value=getLITemplate(lead,firstName,uniqid);\n' +
'    composerState[safeId].lastFirstName=firstName;\n' +
'    composerState[safeId].lastUniqid=uniqid;\n' +
'  } else {\n' +
'    // Swap merge fields only\n' +
'    var st=composerState[safeId];\n' +
'    var oldFirst=st.lastFirstName||"there";\n' +
'    var oldUid=st.lastUniqid||"*|UNIQID|*";\n' +
'    var newUid=uniqid||"*|UNIQID|*";\n' +
'    var curBody=ebodyEl.innerHTML;\n' +
'    var curLI=libodyEl.value;\n' +
'    // Replace old first name greeting\n' +
'    if(oldFirst!==firstName){\n' +
'      curBody=curBody.replace("Hi "+oldFirst+",","Hi "+firstName+",");\n' +
'      curLI=curLI.replace("Hi "+oldFirst+",","Hi "+firstName+",");\n' +
'    }\n' +
'    // Replace old UNIQID\n' +
'    if(oldUid!==newUid){\n' +
'      curBody=curBody.split(oldUid).join(newUid);\n' +
'      curLI=curLI.split(oldUid).join(newUid);\n' +
'    }\n' +
'    ebodyEl.innerHTML=curBody;\n' +
'    libodyEl.value=curLI;\n' +
'    composerState[safeId].lastFirstName=firstName;\n' +
'    composerState[safeId].lastUniqid=newUid;\n' +
'  }\n' +
'}\n' +
'\n' +
'function sendEmail(safeId) {\n' +
'  var activeCid=activeContacts[safeId];\n' +
'  if(!activeCid) return;\n' +
'  var card=document.getElementById("cb-"+activeCid);\n' +
'  if(!card) return;\n' +
'  var email=card.getAttribute("data-email")||"";\n' +
'  if(!email) return;\n' +
'  var subject=encodeURIComponent(document.getElementById("subj-"+safeId).value);\n' +
'  var htmlBody=document.getElementById("ebody-"+safeId).innerHTML;\n' +
'  navigator.clipboard.writeText(htmlBody).then(function(){\n' +
'    showToast("Email copied - paste into Outlook",3000);\n' +
'  }).catch(function(){});\n' +
'  var pref=localStorage.getItem("outlook_preference")||"classic";\n' +
'  if(pref==="new") window.location.href="ms-outlook://compose?to="+encodeURIComponent(email)+"&subject="+subject;\n' +
'  else window.location.href="mailto:"+email+"?subject="+subject;\n' +
'  card.classList.add("sent");\n' +
'}\n' +
'\n' +
'async function getEmail(cid, safeId) {\n' +
'  var btn=document.getElementById("ge-"+cid);\n' +
'  btn.textContent="Fetching...";btn.disabled=true;\n' +
'  var card=document.getElementById("cb-"+cid);\n' +
'  var name=card.getAttribute("data-name")||"";\n' +
'  var title=card.getAttribute("data-title")||"";\n' +
'  var companyName=card.getAttribute("data-company")||"";\n' +
'  var location=card.getAttribute("data-location")||"";\n' +
'  var prospectId=card.getAttribute("data-prospect-id")||"";\n' +
'  var leadRedisId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'  try{\n' +
'    var payload={contactName:name,contactTitle:title,companyName:companyName,location:location,leadId:leadRedisId};\n' +
'    if(prospectId) payload.apollo_id=prospectId;\n' +
'    var r=await fetch("/api/enrich",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    var d=await r.json();\n' +
'    var email=d.email||null;\n' +
'    if(email){\n' +
'      card.setAttribute("data-email",email);\n' +
'      var epEl=document.getElementById("ep-"+cid);if(epEl)epEl.style.display="none";\n' +
'      var evEl=document.getElementById("ev-"+cid);if(evEl){evEl.style.display="inline";evEl.textContent=email;}\n' +
'      var cnEl=document.getElementById("cn-"+cid);if(cnEl)cnEl.remove();\n' +
'      btn.remove();\n' +
'      card.style.cursor="pointer";\n' +
'      var geCat=(window._leadCategories&&window._leadCategories[safeId])||"engineering";\n' +
'      logFeedback(title,geCat,"positive");\n' +
'      if(leadRedisId){\n' +
'        var lead=leads.find(function(l){return l.id===leadRedisId;});\n' +
'        if(lead&&lead.contacts){\n' +
'          var ci=lead.contacts.findIndex(function(c){return(c.apollo_id||"")===prospectId;});\n' +
'          if(ci>=0) lead.contacts[ci].email=email;\n' +
'          fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts}})}).catch(function(){});\n' +
'        }\n' +
'      }\n' +
'    } else {\n' +
'      btn.textContent="Not found";btn.disabled=true;\n' +
'      var epEl2=document.getElementById("ep-"+cid);if(epEl2)epEl2.textContent="Email not found";\n' +
'    }\n' +
'  }catch(e){btn.textContent="Failed";btn.disabled=false;}\n' +
'}\n' +
'\n' +
// Additional Contacts modal
'var _acSafeId="";\n' +
'function openACModal(safeId) {\n' +
'  _acSafeId=safeId;\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead||!lead.allContacts||!lead.allContacts.length){showToast("No additional contacts available.",2000);return;}\n' +
'  document.getElementById("ac-title").textContent="Additional Contacts - "+lead.company;\n' +
'  var body=document.getElementById("ac-body");\n' +
'  body.innerHTML=lead.allContacts.map(function(c,i){\n' +
'    return \'<div class="modal-row" id="ac-row-\'+safeId+\'-\'+i+\'">\'+\n' +
'      \'<div><div class="modal-row-name">\'+c.first_name+" "+c.last_name_obfuscated+\'</div><div class="modal-row-title">\'+c.title+\'</div></div>\'+\n' +
'      \'<button class="search-add-btn" onclick="addFromModal(\\\'\'+safeId+\'\\\',\'+i+\')">+ Add</button>\'+\n' +
'    \'</div>\';\n' +
'  }).join("");\n' +
'  document.getElementById("ac-overlay").classList.add("open");\n' +
'}\n' +
'function closeACModal(){document.getElementById("ac-overlay").classList.remove("open");}\n' +
'\n' +
'async function addFromModal(safeId, idx) {\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead||!lead.allContacts||!lead.allContacts[idx]) return;\n' +
'  var ac=lead.allContacts[idx];\n' +
'  var row=document.getElementById("ac-row-"+safeId+"-"+idx);\n' +
'  var btn=row.querySelector(".search-add-btn");\n' +
'  btn.textContent="Adding...";btn.disabled=true;\n' +
'  // Call enrich action=match to get full name + LinkedIn (1 credit)\n' +
'  try{\n' +
'    var r=await fetch("/api/enrich",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"match",apollo_id:ac.apollo_id})});\n' +
'    var d=await r.json();\n' +
'    if(d.error){btn.textContent="Failed";btn.disabled=false;return;}\n' +
'    var fullName=d.full_name||ac.first_name+" "+ac.last_name_obfuscated;\n' +
'    var linkedin=d.linkedin||"";\n' +
'    if(linkedin&&linkedin.indexOf("http")!==0) linkedin="https://"+linkedin;\n' +
'    // Add contact card\n' +
'    addContact(safeId,fullName,d.title||ac.title,lead.company,lead.location||"",ac.apollo_id,{\n' +
'      suggested:true,city:d.city||"",region:d.state||"",linkedin:linkedin\n' +
'    });\n' +
'    var addCat=(window._leadCategories&&window._leadCategories[safeId])||"engineering";\n' +
'    logFeedback(d.title||ac.title,addCat,"positive");\n' +
'    // Save to lead contacts in Redis\n' +
'    var leadRedisId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'    if(!lead.contacts) lead.contacts=[];\n' +
'    lead.contacts.push({apollo_id:ac.apollo_id,full_name:fullName,name:fullName,first_name:d.first_name||"",last_name:d.last_name||"",job_title:d.title||ac.title,title:d.title||ac.title,city:d.city||"",state:d.state||"",linkedin:linkedin,email:null,source:"apollo"});\n' +
'    // Remove from allContacts\n' +
'    lead.allContacts.splice(idx,1);\n' +
'    if(leadRedisId) fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts,allContacts:lead.allContacts}})}).catch(function(){});\n' +
'    row.remove();\n' +
'    // Update button count\n' +
'    var moreBtn=document.querySelector("#card-"+safeId+" .btn-more-contacts");\n' +
'    if(moreBtn){if(lead.allContacts.length>0){moreBtn.innerHTML=\'<span style="width:14px;height:14px;display:inline-flex;">\'+SVG_PLUS+\'</span> Additional Contacts (\'+lead.allContacts.length+\')\';}else{moreBtn.remove();}}\n' +
'    if(!lead.allContacts.length) closeACModal();\n' +
'  }catch(e){btn.textContent="Failed";btn.disabled=false;}\n' +
'}\n' +
'\n' +
'function openJD(safeId) {\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead)return;\n' +
'  document.getElementById("jd-popup-title").textContent=lead.company+" - "+lead.jobTitle;\n' +
'  document.getElementById("jd-popup-body").textContent=lead.description||"No description available.";\n' +
'  document.getElementById("jd-overlay").classList.add("open");\n' +
'}\n' +
'function closeJDBtn(){document.getElementById("jd-overlay").classList.remove("open");}\n' +
'\n' +
'document.addEventListener("click",function(e){\n' +
'  if(!e.target.classList.contains("search-input")){\n' +
'    document.querySelectorAll(\'[id^="ss-"]\').forEach(function(el){if(!el.contains(e.target))el.style.display="none";});\n' +
'  }\n' +
'  if(!e.target.closest(".remove-wrap")){\n' +
'    document.querySelectorAll(".remove-dd.open").forEach(function(el){el.classList.remove("open");});\n' +
'  }\n' +
'});\n' +
'function showSS(safeId){var el=document.getElementById("ss-"+safeId);if(el)el.style.display="block";}\n' +
'function filterSS(input,safeId){var val=input.value.toLowerCase();var r=document.getElementById("ss-"+safeId);if(!r)return;r.style.display="block";r.querySelectorAll(".search-result-item").forEach(function(item){var n=item.querySelector("div > div").textContent.toLowerCase();item.style.display=n.includes(val)?"flex":"none";});}\n' +
'\n' +
// Toast, confirm, skip, block
'var _skipTimer=null,_skipUndone=false;\n' +
'function showToast(html,dur){var c=document.getElementById("toast-container");document.getElementById("toast-inner").innerHTML=html;c.classList.add("show");return setTimeout(function(){c.classList.remove("show");},dur||5000);}\n' +
'function hideToast(){document.getElementById("toast-container").classList.remove("show");}\n' +
'function showConfirm(t,s,bl,fn,btnCls){document.getElementById("confirm-title").textContent=t;document.getElementById("confirm-sub").textContent=s;var b=document.getElementById("confirm-action-btn");b.textContent=bl;b.className="btn-glass "+(btnCls||"btn-glass-block");b.onclick=function(){closeConfirm();fn();};document.getElementById("confirm-overlay").classList.add("open");}\n' +
'function closeConfirm(){document.getElementById("confirm-overlay").classList.remove("open");}\n' +
'\n' +
'function toggleBlockCompany(company,btn){\n' +
'  var isBlocked=isCompanyBlocked(company);\n' +
'  if(isBlocked){\n' +
'    fetch("/api/blocklist",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"companies",value:company})});\n' +
'    blocklist.companies=blocklist.companies.filter(function(c){return c.toLowerCase()!==company.toLowerCase();});\n' +
'    btn.innerHTML=\'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Block company\';\n' +
'    return;\n' +
'  }\n' +
'  showConfirm("Block "+company+"?","This company will not appear in future leads.","Block",function(){\n' +
'    fetch("/api/blocklist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"companies",value:company})});\n' +
'    blocklist.companies.push(company);\n' +
'    var rm=[];leads.forEach(function(l){if(l.company.toLowerCase()===company.toLowerCase())rm.push(getSafeId(l.id));});\n' +
'    leads=leads.filter(function(l){return l.company.toLowerCase()!==company.toLowerCase();});\n' +
'    rm.forEach(function(sid){var c=document.getElementById("card-"+sid);if(c){c.style.opacity="0";c.style.transition="opacity 0.3s";setTimeout(function(){c.remove();},300);}});\n' +
'    document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'  });\n' +
'}\n' +
'\n' +
'function skipLead(safeId,realId){\n' +
'  if(_skipTimer){clearTimeout(_skipTimer);hideToast();}\n' +
'  _skipUndone=false;\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  var cn=lead?lead.company:"";\n' +
'  var card=document.getElementById("card-"+safeId);\n' +
'  var cardHTML=card?card.outerHTML:null,cardParent=card?card.parentNode:null,cardNext=card?card.nextSibling:null;\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.2s";setTimeout(function(){if(!_skipUndone)card.remove();},200);}\n' +
'  leads=leads.filter(function(l){return l.id!==realId;});\n' +
'  document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'  _skipTimer=showToast("Lead skipped: "+cn+" <button class=\\"toast-undo\\" onclick=\\"undoSkip()\\">Undo</button>",5000);\n' +
'  var pRealId=realId,pLead=lead;\n' +
'  window._skipUndo=function(){\n' +
'    _skipUndone=true;clearTimeout(_skipTimer);hideToast();\n' +
'    if(pLead)leads.push(pLead);\n' +
'    document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'    if(cardHTML&&cardParent){var tmp=document.createElement("div");tmp.innerHTML=cardHTML;var r=tmp.firstChild;r.style.opacity="0";r.style.transition="opacity 0.3s";if(cardNext&&cardNext.parentNode===cardParent)cardParent.insertBefore(r,cardNext);else cardParent.appendChild(r);setTimeout(function(){r.style.opacity="1";},10);fetchLogo(pLead.company,pLead.employerWebsite||"",pLead.location||"",getSafeId(pLead.id));}\n' +
'  };\n' +
'  setTimeout(function(){if(!_skipUndone)fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pRealId,updates:{status:"skipped"}})});},5200);\n' +
'}\n' +
'function undoSkip(){if(window._skipUndo)window._skipUndo();}\n' +
'\n' +
'function completeLead(safeId, realId) {\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  var cn=lead?lead.company:"";\n' +
'  showConfirm("Mark this lead as complete?","A follow-up reminder will be scheduled for 3 business days.","Complete",function(){\n' +
'    fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:realId,updates:{status:"completed",assignedAM:AM.name}})}).then(function(){showToast("Lead completed",3000);}).catch(function(){});\n' +
'    var card=document.getElementById("card-"+safeId);\n' +
'    if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'    leads=leads.filter(function(l){return l.id!==realId;});\n' +
'    document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'  },"btn-glass-complete");\n' +
'}\n' +
'\n' +
'var _reassignSafeId="",_reassignRealId="";\n' +
'function openReassignModal(safeId, realId) {\n' +
'  _reassignSafeId=safeId;_reassignRealId=realId;\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  document.getElementById("reassign-title").textContent="Reassign Lead"+(lead?" - "+lead.company:"");\n' +
'  var body=document.getElementById("reassign-body");\n' +
'  body.innerHTML=AM_NAMES.map(function(name){\n' +
'    return \'<div class="reassign-item"><span>\'+ name +\'</span><button class="reassign-btn" onclick="reassignLead(\\\'\'+name.replace(/\x27/g,"\\\\\\x27")+\'\\\')">Reassign</button></div>\';\n' +
'  }).join("");\n' +
'  document.getElementById("reassign-overlay").classList.add("open");\n' +
'}\n' +
'function closeReassignModal(){document.getElementById("reassign-overlay").classList.remove("open");}\n' +
'\n' +
'function reassignLead(amName) {\n' +
'  closeReassignModal();\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:_reassignRealId,updates:{assignedAM:amName}})}).catch(function(){});\n' +
'  var card=document.getElementById("card-"+_reassignSafeId);\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'  leads=leads.filter(function(l){return l.id!==_reassignRealId;});\n' +
'  document.getElementById("lead-count").textContent=leads.length+" pending leads";\n' +
'  showToast("Lead reassigned to "+amName,3000);\n' +
'}\n' +
'\n' +
'function setOutlookPref(pref){\n' +
'  localStorage.setItem("outlook_preference",pref);\n' +
'  document.getElementById("ol-classic").classList.toggle("active",pref==="classic");\n' +
'  document.getElementById("ol-new").classList.toggle("active",pref==="new");\n' +
'}\n' +
'(function(){\n' +
'  var pref=localStorage.getItem("outlook_preference")||"classic";\n' +
'  if(pref==="new") setOutlookPref("new");\n' +
'})();\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';

  res.status(200).send(html);
};
