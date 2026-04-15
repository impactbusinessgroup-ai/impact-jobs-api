
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html');

  var html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>iMPact Client Lead Review</title>\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
'<style>\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: Raleway, -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(180deg, #363636 0%, #2a2a2a 50%, #1f1f1f 100%); background-attachment: fixed; color: #f0f0f0; min-height: 100vh; }\n' +
'h1,h2,h3,h4,h5,h6,.section-label,.pill,.cal-month { font-family: Oswald, sans-serif; }\n' +
'.header { background: rgba(26,26,26,0.95); backdrop-filter: blur(16px); padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #333333; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }\n' +
'.header-logo { height: 34px; }\n' +
'.header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }\n' +
'.btn-add-lead { width: 32px; height: 32px; border-radius: 50%; background: #22c55e; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 700; transition: all 0.15s; box-shadow: 0 2px 8px rgba(34,197,94,0.3); }\n' +
'.btn-add-lead:hover { background: #16a34a; transform: scale(1.08); }\n' +
'.add-modal { max-width: 620px; }\n' +
'.add-modal .modal-body { padding: 20px 24px; }\n' +
'.add-field { margin-bottom: 14px; }\n' +
'.add-field label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }\n' +
'.add-field input, .add-field select, .add-field textarea { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 13px; font-family: Raleway, sans-serif; outline: none; transition: border-color 0.15s; }\n' +
'.add-field input:focus, .add-field select:focus, .add-field textarea:focus { border-color: rgba(232,98,10,0.5); }\n' +
'.add-field textarea { min-height: 120px; resize: vertical; line-height: 1.5; }\n' +
'.add-field select option { background: #2a2a2a; color: #fff; }\n' +
'.add-row { display: flex; gap: 12px; }\n' +
'.add-row .add-field { flex: 1; }\n' +
'.add-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); }\n' +
'.add-footer .btn-cancel { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: Raleway, sans-serif; }\n' +
'.add-footer .btn-cancel:hover { background: rgba(255,255,255,0.1); }\n' +
'.add-footer .btn-submit { background: #22c55e; border: none; color: white; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: Raleway, sans-serif; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }\n' +
'.add-footer .btn-submit:hover { background: #16a34a; }\n' +
'.add-footer .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }\n' +
'.add-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }\n' +
'@keyframes spin { to { transform: rotate(360deg); } }\n' +
'.card-loading-overlay { position: absolute; inset: 0; background: rgba(42,42,42,0.85); border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 5; }\n' +
'.card-loading-overlay .add-spinner { width: 24px; height: 24px; }\n' +
'.card-loading-overlay span { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; }\n' +
'.header-meta { color: #999999; font-size: 12px; text-align: right; }\n' +
'.container { max-width: 920px; margin: 0 auto; padding: 28px 16px 60px; }\n' +
'.queue-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }\n' +
'.queue-bar h2 { font-size: 26px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }\n' +
'.queue-bar .sub { font-size: 13px; color: #999999; margin-top: 3px; }\n' +
'.lead-count-badge { background: linear-gradient(135deg, #FFA000, #E8620A); color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; box-shadow: 0 2px 12px rgba(232,98,10,0.35); }\n' +
'.card { background: #3a3a3a; border-radius: 18px; margin-bottom: 24px; overflow: visible; box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04); border: 1px solid #333333; }\n' +
'.card-top { background: linear-gradient(135deg, #2a3a5c 0%, #1e2a42 60%, #161e30 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); position: relative; z-index: 1; }\n' +
'.card-top-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }\n' +
'.company-logo-wrap { width: 80px; height: 80px; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }\n' +
'.company-initials { width: 80px; height: 80px; border-radius: 12px; background: linear-gradient(135deg, #FFA000, #E8620A); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; flex-shrink: 0; font-family: Oswald, sans-serif; }\n' +
'.company-name { font-size: 22px; font-weight: 700; color: white; line-height: 1.2; font-family: Oswald, sans-serif; }\n' +
'.company-location { font-size: 13px; color: #999999; margin-top: 3px; }\n' +
'.card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; align-self: stretch; justify-content: center; }\n' +
'.pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase; }\n' +
'.pill-eng { background: rgba(29,158,117,0.07); color: #6EE7C7; border: 1px solid rgba(110,231,199,0.35); }\n' +
'.pill-acc { background: rgba(99,179,237,0.06); color: #93C5FD; border: 1px solid rgba(147,197,253,0.35); }\n' +
'.pill-it { background: rgba(255,160,0,0.06); color: #FCD34D; border: 1px solid rgba(252,211,77,0.35); }\n' +
'.pill-other { background: rgba(168,130,255,0.06); color: #C4B5FD; border: 1px solid rgba(196,181,253,0.35); }\n' +
'.card-top-job-title { font-size: 15px; color: rgba(255,255,255,0.7); font-weight: 500; line-height: 1.3; }\n' +
'.links-bar { display: flex; justify-content: space-between; align-items: center; padding: 8px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); background: #1e1e1e; }\n' +
'.links-bar-left, .links-bar-right { display: flex; gap: 12px; align-items: center; }\n' +
'.link-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid #3a3a3a; color: rgba(255,255,255,0.5); cursor: pointer; text-decoration: none; transition: all 0.15s; }\n' +
'.link-icon:hover { background: rgba(255,255,255,0.1); color: #E8620A; border-color: rgba(232,98,10,0.3); }\n' +
'.link-icon svg { width: 15px; height: 15px; }\n' +
'.card-body { padding: 20px 24px; background: transparent; }\n' +
'.cal-block { background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; width: 62px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.cal-month { background: rgba(232,98,10,0.8); color: white; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; width: 100%; text-align: center; padding: 4px 0; }\n' +
'.cal-day { font-size: 22px; font-weight: 800; color: white; padding: 4px 0 1px; line-height: 1; font-family: Oswald, sans-serif; }\n' +
'.cal-year { font-size: 9px; color: rgba(255,255,255,0.4); padding-bottom: 5px; }\n' +
'.section-label { font-size: 16px; font-weight: 700; color: #f0f0f0; letter-spacing: 0.02em; margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #E8620A; }\n' +
'.contacts-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }\n' +
'.contact-card { flex: 1; min-width: 200px; max-width: 320px; background: #424242; border: 1px solid #555555; border-radius: 12px; padding: 14px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; }\n' +
'.contact-card:hover { border-color: #666666; background: #4a4a4a; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }\n' +
'.contact-header, .contact-info, .contact-name-row, .contact-name, .contact-title-sub, .contact-loc, .email-row, .credit-note, .badge { pointer-events: none; }\n' +
'.contact-actions { pointer-events: auto; }\n' +
'.contact-actions .btn-li, .contact-actions .remove-wrap, .contact-actions .btn-fetch { pointer-events: auto; }\n' +
'.contact-card.active { border: 2px solid #E8620A; background: #424242; box-shadow: 0 0 16px rgba(232,98,10,0.3); }\n' +
'.contact-card.sent { border-color: rgba(232,98,10,0.4); background: rgba(232,98,10,0.06); }\n' +
'.contact-header { display: flex; align-items: flex-start; gap: 10px; }\n' +
'.avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #E8620A, #333333); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; font-family: Oswald, sans-serif; overflow: hidden; }\n' +
'.avatar img { width: 100%; height: 100%; object-fit: cover; }\n' +
'.contact-info { flex: 1; min-width: 0; }\n' +
'.contact-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap; }\n' +
'.contact-name { font-size: 16px; font-weight: 600; color: #fff; }\n' +
'.contact-title-sub { font-size: 11px; color: #999999; }\n' +
'.contact-loc { font-size: 11px; color: #777777; }\n' +
'.email-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }\n' +
'.email-placeholder { font-size: 11px; color: rgba(255,255,255,0.25); font-style: italic; }\n' +
'.email-value { font-size: 11px; color: #E8620A; font-weight: 600; }\n' +
'.credit-note { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 2px; }\n' +
'.contact-actions { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; align-items: center; }\n' +
'.badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.3px; }\n' +
'.btn { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #cdd; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.btn-li { background: rgba(0,119,181,0.15); color: #0077B5; border-color: rgba(0,119,181,0.25); padding: 5px 8px; }\n' +
'.btn-li:hover { background: rgba(0,119,181,0.25); }\n' +
'.btn-fetch { background: rgba(255,160,0,0.15); color: #FCD34D; border-color: rgba(255,160,0,0.3); }\n' +
'.btn-fetch:hover { background: rgba(255,160,0,0.25); }\n' +
'.btn-sent { background: rgba(93,202,165,0.15); color: #6EE7C7; border-color: rgba(93,202,165,0.3); cursor: default; }\n' +
'.btn-ghost { color: rgba(255,255,255,0.3); font-size: 11px; border: none; background: none; cursor: pointer; padding: 3px 5px; font-weight: 500; }\n' +
'.btn-ghost:hover { color: #ef6961; }\n' +
'.btn-primary { background: #E8620A; color: white; border-color: #E8620A; }\n' +
'.btn-primary:hover { background: #FF7A2F; }\n' +
'.btn-more-contacts { background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 16px; font-size: 12px; color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }\n' +
'.btn-more-contacts:hover { background: rgba(255,255,255,0.08); color: #E8620A; border-color: rgba(232,98,10,0.3); }\n' +
'.composer { background: #262626; border: 1px solid #333333; border-radius: 12px; padding: 16px; margin-top: 14px; }\n' +
'.composer-label { font-size: 16px; font-weight: 700; color: #f0f0f0; letter-spacing: 0.02em; margin-bottom: 8px; font-family: Oswald, sans-serif; padding-left: 10px; border-left: 3px solid #E8620A; }\n' +
'.composer-disabled { text-align: center; padding: 24px; color: rgba(255,255,255,0.25); font-size: 13px; font-style: italic; }\n' +
'.subj-bar { display: flex; align-items: center; background: #323232; border: 1px solid #444444; border-radius: 10px; padding: 0; margin-bottom: 8px; overflow: visible; position: relative; }\n' +
'.subj-bar-input { flex: 1; font-size: 14px; padding: 8px 12px; border: none; background: transparent; color: #fff; font-family: Raleway, sans-serif; outline: none; min-width: 0; border-radius: 9px 0 0 9px; }\n' +
'.subj-bar-input::placeholder { color: #666666; }\n' +
'.subj-bar-chevron { width: 32px; height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #E8620A; flex-shrink: 0; border-left: 1px solid #444444; transition: background 0.2s; padding: 8px 0; }\n' +
'.subj-bar-chevron:hover { background: rgba(232,98,10,0.15); }\n' +
'.subj-bar-chevron svg { width: 14px; height: 14px; transition: transform 0.2s; }\n' +
'.subj-bar.open .subj-bar-chevron svg { transform: rotate(180deg); }\n' +
'.subj-bar-ai { width: 32px; height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #E8620A; flex-shrink: 0; margin-left: 8px; border-left: 1px solid #444444; transition: all 0.2s; padding: 8px 0; border-radius: 0 9px 9px 0; }\n' +
'.subj-bar-ai:hover { background: rgba(232,98,10,0.15); }\n' +
'.subj-bar-ai:hover svg { transform: scale(1.15); filter: brightness(1.2); }\n' +
'.subj-bar-ai svg { width: 18px; height: 18px; transition: transform 0.2s, filter 0.2s; }\n' +
'.subj-bar-ai .spinner { width: 14px; height: 14px; border: 2px solid #444; border-top-color: #E8620A; border-radius: 50%; animation: spin 0.6s linear infinite; }\n' +
'@keyframes spin { to { transform: rotate(360deg); } }\n' +
'.subj-dd-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #303030; border: 1px solid #484848; border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 1000; opacity: 0; transform: translateY(-8px); pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; overflow: hidden; }\n' +
'.subj-bar.open .subj-dd-panel { opacity: 1; transform: translateY(0); pointer-events: auto; }\n' +
'.subj-dd-opt { padding: 10px 16px; font-size: 13px; color: rgba(255,255,255,0.85); cursor: pointer; transition: background 0.12s, color 0.12s, opacity 0.2s; font-family: Raleway, sans-serif; border-radius: 8px; margin: 2px 4px; opacity: 0; transform: translateY(-4px); }\n' +
'.subj-dd-opt:hover { background: rgba(232,98,10,0.2); color: #fff; }\n' +
'.subj-dd-opt.selected { color: #E8620A; font-weight: 600; }\n' +
'.subj-bar.open .subj-dd-opt { opacity: 1; transform: translateY(0); }\n' +
'.subj-bar.open .subj-dd-opt:nth-child(1) { transition-delay: 0ms; }\n' +
'.subj-bar.open .subj-dd-opt:nth-child(2) { transition-delay: 30ms; }\n' +
'.subj-bar.open .subj-dd-opt:nth-child(3) { transition-delay: 60ms; }\n' +
'.subj-bar.open .subj-dd-opt:nth-child(4) { transition-delay: 90ms; }\n' +
'.tab-row { display: flex; gap: 6px; margin-bottom: 8px; }\n' +
'.tab { font-size: 11px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; font-weight: 600; transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.tab.active { background: #E8620A; color: white; border-color: #E8620A; }\n' +
'.search-add-btn { font-size: 11px; font-weight: 700; color: #E8620A; background: rgba(232,98,10,0.15); padding: 3px 10px; border-radius: 6px; cursor: pointer; border: none; }\n' +
'.card-footer { display: flex; gap: 8px; align-items: center; padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.04); background: #1a1a1a; }\n' +
'.btn-glass { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; height: 42px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 200ms ease; background: #2a2a2a; border: none; color: white; text-decoration: none; font-family: Raleway, sans-serif; position: relative; }\n' +
'.btn-glass:hover { background: #2a2a2a; border-color: rgba(255,255,255,0.2); }\n' +
'.btn-glass-skip { background: #E8620A; color: white; border: none; }\n' +
'.btn-glass-skip:hover { background: #cc5200; }\n' +
'.btn-glass-block { background: #cc3333; color: white; border: none; }\n' +
'.btn-glass-block:hover { background: #aa2222; }\n' +
'.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(5,10,25,0.8); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px); }\n' +
'.modal-overlay.open { display: flex; }\n' +
'.modal { background: #2a2a2a; border: 1px solid #484848; border-radius: 20px; max-width: 560px; width: 92%; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04); }\n' +
'.modal-header { padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }\n' +
'.modal-header h3 { font-size: 16px; font-weight: 600; color: #fff; font-family: Oswald, sans-serif; }\n' +
'.modal-close { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; cursor: pointer; font-size: 14px; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }\n' +
'.modal-close:hover { background: rgba(255,255,255,0.1); }\n' +
'.modal-body { padding: 16px 24px; overflow-y: auto; flex: 1; min-height: 0; max-height: 70vh; }\n' +
'.modal-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }\n' +
'.modal-row:last-child { border-bottom: none; }\n' +
'.modal-row-name { font-size: 13px; font-weight: 600; color: #fff; }\n' +
'.modal-row-title { font-size: 11px; color: rgba(255,255,255,0.45); }\n' +
'.modal-row-info { flex: 1; min-width: 0; }\n' +
'.modal-row-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }\n' +
'.modal-row-location { font-size: 10px; color: rgba(255,255,255,0.35); }\n' +
'.modal-row-li { display: inline-flex; align-items: center; }\n' +
'.modal-row-li svg { width: 14px; height: 14px; fill: rgba(255,255,255,0.35); transition: fill 0.15s; }\n' +
'.modal-row-li:hover svg { fill: #0A66C2; }\n' +
'.toast-container { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(80px); z-index: 300; opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none; }\n' +
'.toast-container.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }\n' +
'.toast { background: linear-gradient(135deg, #E8620A, #d4560a); color: white; border-radius: 28px; padding: 12px 20px; box-shadow: 0 8px 32px rgba(232,98,10,0.4); display: flex; align-items: center; gap: 12px; font-size: 13px; white-space: nowrap; }\n' +
'.toast-undo { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 16px; padding: 4px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }\n' +
'.toast-undo:hover { background: rgba(255,255,255,0.25); }\n' +
'.confirm-overlay { display: none; position: fixed; inset: 0; background: rgba(5,10,25,0.75); z-index: 250; align-items: center; justify-content: center; backdrop-filter: blur(4px); }\n' +
'.confirm-overlay.open { display: flex; }\n' +
'.confirm-card { background: #2a2a2a; border: 1px solid #484848; border-radius: 18px; max-width: 400px; width: 90%; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; }\n' +
'.confirm-card h3 { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; font-family: Oswald, sans-serif; }\n' +
'.confirm-card p { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 24px; }\n' +
'.confirm-actions { display: flex; gap: 10px; justify-content: center; }\n' +
'.loading { text-align: center; padding: 80px; color: rgba(255,255,255,0.4); font-size: 15px; }\n' +
'.empty { text-align: center; padding: 80px; }\n' +
'.empty h3 { font-size: 18px; margin-bottom: 8px; color: rgba(255,255,255,0.6); font-family: Oswald, sans-serif; }\n' +
'.btn-send-email { display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg, #E8620A, #c94f00); color: white; font-family: Raleway, sans-serif; transition: all 250ms cubic-bezier(0.4,0,0.2,1); box-shadow: 0 2px 12px rgba(232,98,10,0.35); margin-top: 10px; letter-spacing: 0.3px; }\n' +
'.btn-send-email:hover { background: linear-gradient(135deg, #FF7A2F, #E8620A); box-shadow: 0 6px 28px rgba(232,98,10,0.5); transform: translateY(-3px); }\n' +
'.btn-send-email.disabled { opacity: 0.35; cursor: default; pointer-events: none; }\n' +
'.btn-glass-complete { background: #00a86b; color: white; border: none; }\n' +
'.btn-glass-complete:hover { background: #008a57; }\n' +
'.btn-glass-reassign { background: #1e2a42; color: white; border: none; }\n' +
'.btn-glass-reassign:hover { background: #2a3a5c; }\n' +
'.reassign-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); transition: all 0.15s; border-radius: 8px; margin: 2px 0; }\n' +
'.reassign-item:last-child { border-bottom: none; }\n' +
'.reassign-item:hover { background: rgba(232,98,10,0.1); color: #fff; }\n' +
'.reassign-btn { font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 6px; border: 1px solid rgba(232,98,10,0.3); background: rgba(232,98,10,0.12); color: #E8620A; cursor: pointer; transition: all 0.15s; }\n' +
'.reassign-btn:hover { background: rgba(232,98,10,0.25); box-shadow: 0 0 8px rgba(232,98,10,0.2); }\n' +
'.remove-wrap { position: relative; display: inline-block; }\n' +
'.remove-dd { display: none; position: absolute; bottom: 100%; right: 0; background: #2a2a2a; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; min-width: 190px; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.4); overflow: hidden; margin-bottom: 4px; }\n' +
'.remove-dd.open { display: block; }\n' +
'.remove-dd-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; color: rgba(255,255,255,0.6); }\n' +
'.remove-dd-item:last-child { border-bottom: none; }\n' +
'.remove-dd-btn { font-size: 10px; font-weight: 600; color: #ef6961; background: rgba(198,40,40,0.12); border: 1px solid rgba(198,40,40,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; }\n' +
'.remove-dd-btn:hover { background: rgba(198,40,40,0.25); }\n' +
'.btn-fetch:hover { box-shadow: 0 0 14px rgba(255,160,0,0.4), 0 0 28px rgba(255,160,0,0.15); transform: translateY(-2px); }\n' +
'.btn-send-email.pulse { animation: sendPulse 2s ease-in-out infinite; }\n' +
'.btn-custom-msg { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #E8620A; background: transparent; color: #E8620A; font-family: Raleway, sans-serif; transition: all 0.2s; }\n' +
'.btn-custom-msg:hover { background: rgba(232,98,10,0.15); }\n' +
'@keyframes sendPulse { 0%,100% { box-shadow: 0 2px 12px rgba(232,98,10,0.35); } 50% { box-shadow: 0 4px 24px rgba(232,98,10,0.6), 0 0 40px rgba(232,98,10,0.25); } }\n' +
'.btn-glass::before { content: ""; position: absolute; top: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(to right, transparent, currentColor, transparent); opacity: 0; transition: opacity 250ms cubic-bezier(0.4,0,0.2,1); }\n' +
'.btn-glass::after { content: ""; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(to right, transparent, currentColor, transparent); opacity: 0; transition: opacity 250ms cubic-bezier(0.4,0,0.2,1); }\n' +
'.btn-glass:hover::before { opacity: 0.4; }\n' +
'.btn-glass:hover::after { opacity: 0.3; }\n' +
'.btn-glass-skip:hover { box-shadow: 0 4px 16px rgba(232,98,10,0.4); transform: translateY(-2px); }\n' +
'.btn-glass-block:hover { box-shadow: 0 4px 16px rgba(204,51,51,0.3); transform: translateY(-2px); }\n' +
'.btn-glass-complete:hover { box-shadow: 0 4px 16px rgba(0,168,107,0.4); transform: translateY(-2px); }\n' +
'.btn-glass-reassign:hover { box-shadow: 0 4px 16px rgba(30,42,66,0.4); transform: translateY(-2px); }\n' +
'.link-icon:hover { box-shadow: 0 0 10px rgba(232,98,10,0.3); }\n' +
'.btn-li:hover { box-shadow: 0 0 10px rgba(0,119,181,0.35); }\n' +
'.rich-editor { width: 100%; font-size: 14px; line-height: 1.6; padding: 12px 14px; border: 1px solid #3a3a3a; border-radius: 8px; background: #2a2a2a; color: #f0f0f0; min-height: 180px; overflow-y: auto; font-family: Raleway, sans-serif; outline: none; }\n' +
'.rich-editor:focus { border-color: #E8620A; box-shadow: 0 0 0 2px rgba(232,98,10,0.2); }\n' +
'.rich-editor p { margin-bottom: 16px; }\n' +
'.rich-editor p:last-child { margin-bottom: 0; }\n' +
'.rich-editor a { color: #FF7A2F; text-decoration: underline; }\n' +
'.li-editor { width: 100%; font-size: 14px; line-height: 1.6; padding: 12px 14px; border: 1px solid #3a3a3a; border-radius: 8px; background: #262626; color: #f0f0f0; min-height: 100px; overflow-y: auto; font-family: Raleway, sans-serif; outline: none; white-space: pre-wrap; }\n' +
'.li-editor:focus { border-color: #E8620A; box-shadow: 0 0 0 2px rgba(232,98,10,0.2); }\n' +
'.li-counter { font-size: 11px; color: rgba(255,255,255,0.35); }\n' +
'.li-counter.over { color: #ef6961; }\n' +
'@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }\n' +
'.draft-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; gap: 12px; }\n' +
'.draft-loading-bar { width: 80%; height: 10px; border-radius: 5px; background: linear-gradient(90deg, rgba(232,98,10,0.15) 25%, rgba(232,98,10,0.35) 50%, rgba(232,98,10,0.15) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease infinite; }\n' +
'.draft-loading-bar:nth-child(2) { width: 60%; animation-delay: 0.2s; }\n' +
'.draft-loading-bar:nth-child(3) { width: 70%; animation-delay: 0.4s; }\n' +
'.draft-loading-text { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }\n' +
'.outlook-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.45); }\n' +
'.outlook-toggle-btns { display: inline-flex; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.outlook-toggle-btn { padding: 2px 10px; font-size: 10px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.4); transition: all 0.15s; font-family: Raleway, sans-serif; }\n' +
'.outlook-toggle-btn.active { background: rgba(232,98,10,0.4); color: white; }\n' +
'.custom-tooltip { position: fixed; background: #1a1a1a; color: #fff; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-family: Raleway, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 9999; pointer-events: none; opacity: 0; transition: opacity 150ms ease; white-space: nowrap; }\n' +
'.custom-tooltip.visible { opacity: 1; }\n' +
'.btn-custom-msg { position: relative; overflow: visible; }\n' +
'.subj-bar-ai { position: relative; overflow: visible; }\n' +
'.star-burst { position: absolute; z-index: 2; pointer-events: none; opacity: 0; transform: scale(0); transition: none; }\n' +
'.star-burst svg { filter: drop-shadow(0 0 4px #E8620A); }\n' +
'.btn-custom-msg:hover, .subj-bar-ai:hover { text-shadow: 0 0 8px rgba(232,98,10,0.4); }\n' +
'.btn-custom-msg:hover { background: rgba(232,98,10,0.2); color: #ff8533; border-color: rgba(232,98,10,0.5); }\n' +
'.btn-ac-circle { width: 28px; height: 28px; border-radius: 50%; background: #2a2a2a; border: 1px solid #E8620A; color: #E8620A; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; padding: 0; line-height: 1; }\n' +
'.btn-ac-circle:hover { box-shadow: 0 0 12px rgba(232,98,10,0.4); background: rgba(232,98,10,0.15); }\n' +
'.btn-ac-circle.disabled { opacity: 0.4; cursor: not-allowed; border-color: #555555; color: #888888; }\n' +
'.btn-ac-circle.disabled:hover { box-shadow: none; background: #2a2a2a; }\n' +
'.contact-actions .btn, .contact-actions .btn-li, .contact-actions .btn-fetch, .contact-actions .btn-dots { height: 34px; padding: 6px 14px; display: inline-flex; align-items: center; justify-content: center; }\n' +
'.btn-dots { width: 34px; height: 34px; padding: 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; letter-spacing: 2px; line-height: 1; }\n' +
'.btn-dots:hover { background: rgba(255,255,255,0.1); color: #E8620A; border-color: rgba(232,98,10,0.3); }\n' +
'.contact-dd { display: none; position: absolute; bottom: calc(100% + 6px); right: 0; background: #2a2a2a; border: 1px solid #444; border-radius: 10px; min-width: 220px; z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,0.5); overflow: hidden; opacity: 0; transform: translateY(4px); transition: opacity 150ms ease, transform 150ms ease; }\n' +
'.contact-dd.open { display: block; opacity: 1; transform: translateY(0); }\n' +
'.contact-dd-section { padding: 8px 0; }\n' +
'.contact-dd-header { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 14px 6px; }\n' +
'.contact-dd-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }\n' +
'.outreach-cb-row { display: flex; align-items: center; gap: 8px; padding: 6px 14px; font-size: 12px; color: rgba(255,255,255,0.7); cursor: pointer; transition: background 0.12s; }\n' +
'.outreach-cb-row:hover { background: rgba(255,255,255,0.04); }\n' +
'.outreach-cb-row input { accent-color: #E8620A; }\n' +
'.btn-confirm-outreach { display: block; width: calc(100% - 28px); margin: 6px 14px 8px; font-size: 11px; font-weight: 600; padding: 7px 14px; border-radius: 6px; border: none; background: #E8620A; color: white; cursor: pointer; transition: all 0.15s; }\n' +
'.btn-confirm-outreach:hover { background: #FF7A2F; }\n' +
'.contact-dd-remove { padding: 6px 14px; font-size: 12px; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.12s; }\n' +
'.contact-dd-remove:hover { background: rgba(198,40,40,0.1); color: #ef6961; }\n' +
'.outreach-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: rgba(46,125,50,0.15); color: #6EE7C7; text-transform: uppercase; letter-spacing: 0.3px; }\n' +
'.reminder-banner { background: linear-gradient(135deg, rgba(232,98,10,0.2), rgba(232,98,10,0.1)); border: 1px solid rgba(232,98,10,0.3); border-radius: 10px; padding: 10px 16px; margin-bottom: 14px; font-size: 12px; color: #FFA000; }\n' +
'.btn-glass-complete.disabled { opacity: 0.6; cursor: not-allowed; background: #444444; color: #888888; border: none; }\n' +
'.btn-glass-complete.disabled:hover { box-shadow: none; transform: none; background: #444444; }\n' +
'.closeout-dd { display: none; position: absolute; bottom: 100%; right: 0; background: #2a2a2a; border: 1px solid #484848; border-radius: 8px; min-width: 180px; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.4); overflow: hidden; margin-bottom: 4px; }\n' +
'.closeout-dd.open { display: block; }\n' +
'.closeout-dd-item { padding: 8px 12px; font-size: 12px; color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.12s; }\n' +
'.closeout-dd-item:hover { background: rgba(232,98,10,0.15); color: #fff; }\n' +
'.section-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }\n' +
'.section-label-row .section-label { margin-bottom: 0; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<div class="header">\n' +
'  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact">\n' +
'  <div class="header-center">Client Lead Review</div>\n' +
'  <div style="display:flex;align-items:center;gap:14px;">\n' +
'    <button class="btn-add-lead" onclick="openAddModal()" title="Add Job Lead">+</button>\n' +
'    <div class="outlook-toggle"><span>Outlook:</span><div class="outlook-toggle-btns"><button class="outlook-toggle-btn active" id="ol-classic" onclick="setOutlookPref(&apos;classic&apos;)">Classic</button><button class="outlook-toggle-btn" id="ol-new" onclick="setOutlookPref(&apos;new&apos;)">New</button></div></div>\n' +
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
'<div class="modal-overlay" id="add-overlay" onclick="if(event.target===this)closeAddModal()">\n' +
'  <div class="modal add-modal">\n' +
'    <div class="modal-header">\n' +
'      <h3>Add Job Lead</h3>\n' +
'      <button class="modal-close" onclick="closeAddModal()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div id="add-stage1">\n' +
'      <div class="modal-body">\n' +
'        <div class="add-field"><label>Job URL</label><input type="text" id="add-url" placeholder="https://... (optional)"></div>\n' +
'        <div class="add-field"><label>Job Description *</label><textarea id="add-desc" style="min-height:200px;" placeholder="Paste the full job description here"></textarea></div>\n' +
'        <div id="add-status1" style="font-size:12px;color:#22c55e;text-align:center;min-height:18px;"></div>\n' +
'      </div>\n' +
'      <div class="add-footer">\n' +
'        <button class="btn-cancel" onclick="closeAddModal()">Cancel</button>\n' +
'        <button class="btn-submit" id="add-generate-btn" onclick="generateJobDetails()">Generate</button>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div id="add-stage2" style="display:none;">\n' +
'      <div class="modal-body">\n' +
'        <div class="add-field"><label>Job Title</label><input type="text" id="add-title" placeholder="e.g. Senior Mechanical Engineer"></div>\n' +
'        <div class="add-row">\n' +
'          <div class="add-field"><label>Company Name</label><input type="text" id="add-company" placeholder="e.g. Acme Manufacturing"></div>\n' +
'          <div class="add-field" style="max-width:160px;"><label>Category</label><select id="add-category"><option value="engineering">Engineering</option><option value="it">IT</option><option value="accounting">Accounting</option><option value="other">Other</option></select></div>\n' +
'        </div>\n' +
'        <div class="add-row">\n' +
'          <div class="add-field"><label>Location</label><input type="text" id="add-location" placeholder="City, State"></div>\n' +
'          <div class="add-field"><label>Company Website</label><input type="text" id="add-domain" placeholder="company.com"></div>\n' +
'        </div>\n' +
'        <div class="add-field"><label>Job Description</label><textarea id="add-desc-preview" readonly style="min-height:100px;max-height:100px;resize:none;opacity:0.6;font-size:11px;line-height:1.5;cursor:default;"></textarea></div>\n' +
'      </div>\n' +
'      <div class="add-footer">\n' +
'        <button class="btn-cancel" onclick="addGoBack()">&#x2190; Back</button>\n' +
'        <button class="btn-submit" id="add-submit-btn" onclick="submitAddLead()">Add Lead</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="container">\n' +
'  <div class="queue-bar">\n' +
'    <div>\n' +
'      <h2 id=\"greeting-text\">Good morning, Mark</h2>\n' +
'      <div class="sub" id="queue-sub"></div>\n' +
'    </div>\n' +
'' +
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
'var AM_NAMES = ["Doug Koetsier","Paul Kujawski","Matt Peal","Lauren Sylvester","Dan Teliczan","Curt Willbrandt","Trish Wangler","Mark Herman","Jamie Drajka","Drew Bentsen","Steve Betteley"];\n' +
'\n' +
'var AM = { name: "Mark Sapoznikov", email: "msapoznikov@impactbusinessgroup.com" };\n' +
'var leads = [];\n' +
'var blocklist = { companies: [], titles: [] };\n' +
'var contactCounters = {};\n' +
'var logoCache = {};\n' +
'var activeContacts = {};\n' +
'var composerState = {};\n' +
'var customDraftCache = {};\n' +
'var liDraftCache = {};\n' +
'var CALENDLY = {"cwillbrandt@impactbusinessgroup.com":"https://calendly.com/cwillbrandt/phone-call","dbentsen@impactbusinessgroup.com":"https://calendly.com/dbentsen","dkoetsier@impactbusinessgroup.com":"https://calendly.com/dkoetsier/","dkunkel@impactbusinessgroup.com":"https://calendly.com/drewkunkel/15min","dteliczan@impactbusinessgroup.com":"https://calendly.com/dteliczan-impactbusinessgroup","jdrajka@impactbusinessgroup.com":"https://calendly.com/jdrajka","lsylvester@impactbusinessgroup.com":"https://calendly.com/lsylvester","mherman@impactbusinessgroup.com":"https://calendly.com/markherman","mpeal@impactbusinessgroup.com":"https://calendly.com/mattpeal/15min","pkujawski@impactbusinessgroup.com":"https://calendly.com/pkujawski","sbetteley@impactbusinessgroup.com":"https://calendly.com/sbetteley","twangler@impactbusinessgroup.com":"https://calendly.com/twangler-impactbusinessgroup/15min","msapoznikov@impactbusinessgroup.com":"https://calendly.com/msapoznikov"};\n' +
'\n' +
'function _g(id) { return document.getElementById(id); }\n' +
'function updateLeadCount(){ var sub=_g("queue-sub"); if(!sub)return; if(leads.length===0) sub.innerHTML="<span style=\\"color:#666\\">No pending leads</span>"; else sub.innerHTML="<span style=\\"color:#E8620A;font-weight:600;\\">"+ leads.length+" pending lead"+(leads.length===1?"":"s")+"</span>"; }\n' +
'function getSafeId(id) { return id.replace(/[^a-zA-Z0-9]/g, "_"); }\n' +
'function cleanJobTitle(t) { if(!t) return ""; var states="AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY"; var loc=new RegExp("\\\\s*[-\\u2013]\\\\s*(plant|plants|facility|building|site|campus|north|south|east|west|remote|\\\\d).*","i"); var geo=new RegExp("\\\\s*[-\\u2013]\\\\s*[A-Z][a-z]+,?\\\\s*("+states+")\\\\b.*","i"); var parens=new RegExp("\\\\s*\\\\((?:hybrid|remote|onsite|on-site)\\\\s*[-\\u2013]\\\\s*[A-Z][a-z]+,?\\\\s*(?:"+states+")\\\\b[^)]*\\\\)","i"); return t.replace(parens,"").replace(loc,"").replace(geo,"").replace(/,\\s*$/,"").trim(); }\n' +
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
'function articleFor(title) { var first = title.replace(/^[^a-zA-Z]*/, "").charAt(0).toLowerCase(); return "aeiou".indexOf(first) >= 0 ? "an" : "a"; }\n' +
'function getEmailTemplate(lead, firstName, uniqid) {\n' +
'  var uid = uniqid || "*|UNIQID|*";\n' +
'  var cal = CALENDLY[AM.email] || "";\n' +
'  var jt = cleanJobTitle(lead.jobTitle || "");\n' +
'  return "<p>Hi " + firstName + ",</p>" +\n' +
'    "<p>I noticed " + lead.company + " is looking for " + articleFor(jt) + " " + jt + " and wanted to reach out. At iMPact Business Group, we specialize in connecting companies with top talent in engineering, IT, accounting, and business professional roles.</p>" +\n' +
'    "<p>We have a strong track record of placing quality candidates quickly. You can see some of our recent success stories here: <a href=\\"https://impactbusinessgroup.com/case-studies/?cid=" + uid + "\\">View Case Studies</a></p>" +\n' +
'    "<p><a href=\\"https://impactbusinessgroup.com/employers/?cid=" + uid + "\\">Learn more about how we can help</a></p>" +\n' +
'    (cal ? "<p>Happy to find a time to connect: <a href=\\"" + cal + "\\">" + cal + "</a></p>" : "");\n' +
'}\n' +
'\n' +
'function getLITemplate(lead, firstName, uniqid) {\n' +
'  var uid = uniqid || "*|UNIQID|*";\n' +
'  var cal = CALENDLY[AM.email] || "";\n' +
'  var cat = lead.category || "engineering";\n' +
'  var roleType = cat === "it" ? "tech" : cat === "accounting" ? "finance" : "engineering";\n' +
'  var msg = "Hi " + firstName + ", we help " + roleType + " companies find specialized talent quickly. Learn more about how we can help: https://impactbusinessgroup.com/employers/?cid=" + uid;\n' +
'  if(cal) msg += "\\n\\nHappy to find a time to connect: " + cal;\n' +
'  if(msg.length > 300) msg = "Hi " + firstName + ", we help companies find specialized talent quickly: https://impactbusinessgroup.com/employers/?cid=" + uid + (cal ? "\\n\\n" + cal : "");\n' +
'  return msg;\n' +
'}\n' +
'function getLITemplateHtml(lead, firstName, uniqid) {\n' +
'  var uid = uniqid || "*|UNIQID|*";\n' +
'  var cal = CALENDLY[AM.email] || "";\n' +
'  var cat = lead.category || "engineering";\n' +
'  var roleType = cat === "it" ? "tech" : cat === "accounting" ? "finance" : "engineering";\n' +
'  var msg = "Hi " + firstName + ", we help " + roleType + " companies find specialized talent quickly. Learn more about how we can help: https://impactbusinessgroup.com/employers/?cid=" + uid;\n' +
'  if(cal) msg += "\\n\\nHappy to find a time to connect: " + cal;\n' +
'  return msg;\n' +
'}\n' +
'\n' +
'async function fetchLogo(company, website, location, safeId, apolloLogo) {\n' +
'  var ck=company.toLowerCase(); if(logoCache[ck]!==undefined){applyLogo(safeId,logoCache[ck]);return;}\n' +
'  var domain=""; if(website){var w=website;if(w.indexOf("http")!==0)w="https://"+w;try{domain=new URL(w).hostname.replace("www.","");}catch(e){}}\n' +
'  if(!domain) domain=company.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,20)+".com";\n' +
'  try{var u="/api/logo?domain="+encodeURIComponent(domain);if(apolloLogo)u+="&apollo_logo="+encodeURIComponent(apolloLogo);var r=await fetch(u);var d=await r.json();var url=d.url||null;logoCache[ck]=url;applyLogo(safeId,url);}catch(e){logoCache[ck]=null;applyLogo(safeId,null);}\n' +
'}\n' +
'function applyLogo(safeId, url) {\n' +
'  var wrap=_g("logo-"+safeId),ini=_g("ini-"+safeId);if(!wrap)return;\n' +
'  if(url){var img=document.createElement("img");img.src=url;img.style.cssText="width:100%;height:100%;object-fit:cover;";img.onerror=function(){wrap.style.display="none";if(ini)ini.style.display="flex";};wrap.innerHTML="";wrap.appendChild(img);wrap.style.display="flex";if(ini)ini.style.display="none";}else{wrap.style.display="none";if(ini)ini.style.display="flex";}\n' +
'}\n' +
'\n' +
'async function init() {\n' +
'  var today=new Date();\n' +
'  _g("header-date").textContent=today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});\n' +
'  var hr=today.getHours(); var greet=hr<12?"Good morning":hr<18?"Good afternoon":"Good evening";\n' +
'  _g("greeting-text").textContent=greet+", Mark";\n' +
'  _g("queue-sub").innerHTML="<span style=\\"color:#666\\">Loading leads...</span>";\n' +
'  try{\n' +
'    var results=await Promise.all([fetch("/api/leads").then(function(r){return r.json();}),fetch("/api/blocklist").then(function(r){return r.json();})]);\n' +
'    leads=results[0].leads||[];blocklist={companies:results[1].companies||[],titles:results[1].titles||[]};\n' +
'    updateLeadCount();\n' +
'    renderLeads();\n' +
'    leads.forEach(function(lead){var sid=getSafeId(lead.id);fetchLogo(lead.company,lead.company_website||lead.employerWebsite||"",lead.location||"",sid,lead.company_logo_apollo||"");});\n' +
'  }catch(e){console.error("Init error:",e);_g("leads-container").innerHTML=\'<div class="loading">Error loading leads.</div>\';}\n' +
'}\n' +
'\n' +
'function renderLeads() {\n' +
'  var container=_g("leads-container");\n' +
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
'      // Show outreach badges for contacts with logged outreach and evaluate Complete button\n' +
'      if(lead.outreach_log){\n' +
'        var contactCards=_g("contacts-"+safeId).querySelectorAll(".contact-card");\n' +
'        contactCards.forEach(function(cc){\n' +
'          var pid=cc.getAttribute("data-prospect-id")||"";\n' +
'          if(pid&&lead.outreach_log[pid]&&lead.outreach_log[pid].length>0){\n' +
'            var last=lead.outreach_log[pid][lead.outreach_log[pid].length-1];\n' +
'            var badge=cc.querySelector(".outreach-badge");\n' +
'            if(badge){badge.style.display="inline-block";badge.textContent="Outreach "+last.attempt+" sent "+new Date(last.date).toLocaleDateString();}\n' +
'          }\n' +
'        });\n' +
'      }\n' +
'      checkAllActioned(safeId);\n' +
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
'  var jobTitle=cleanJobTitle(lead.jobTitle||"");\n' +
'  var subj1="Question about your "+jobTitle+" position search";\n' +
'  var subj2="Your "+jobTitle+" position at "+lead.company;\n' +
'  var subj3=jobTitle+" position - iMPact Business Group";\n' +
'  var subj4="Following up on your "+jobTitle+" position";\n' +
'  var hasAllContacts=lead.allContacts&&lead.allContacts.length>0;\n' +
'\n' +
'  var linksLeft="";\n' +
'  if(lead.company_domain){\n' +
'    linksLeft+=\'<a class="link-icon" href="https://\'+lead.company_domain+\'" target="_blank" data-tooltip="Website">\'+SVG_GLOBE+\'</a>\';\n' +
'  } else if(lead.company_website){\n' +
'    var wUrl=lead.company_website;if(wUrl.indexOf("http")!==0)wUrl="https://"+wUrl;\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+wUrl+\'" target="_blank" data-tooltip="Website">\'+SVG_GLOBE+\'</a>\';\n' +
'  }\n' +
'  if(lead.company_linkedin){\n' +
'    var liUrl=lead.company_linkedin;if(liUrl.indexOf("http")!==0)liUrl="https://"+liUrl;\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+liUrl+\'" target="_blank" data-tooltip="LinkedIn" style="color:#0077B5;">\'+SVG_LINKEDIN+\'</a>\';\n' +
'  }\n' +
'  var linksRight="";\n' +
'  if(hasJD) linksRight+=\'<a class="link-icon" href="#" onclick="openJD(\\\'\'+safeId+\'\\\');return false;" data-tooltip="Job Description">\'+SVG_DOC+\'</a>\';\n' +
'  if(lead.jobUrl) linksRight+=\'<a class="link-icon" href="\'+lead.jobUrl+\'" target="_blank" data-tooltip="View Posting">\'+SVG_LINK+\'</a>\';\n' +
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
'    (lead.reminder_stage>0?\'<div class="reminder-banner">Follow-up Reminder \'+lead.reminder_stage+\' of 3 - Originally closed \'+(lead.completedAt?new Date(lead.completedAt).toLocaleDateString():"unknown")+(lead.outreach_summary&&lead.outreach_summary.length>0?" - Last outreach: "+lead.outreach_summary[0].attempts[lead.outreach_summary[0].attempts.length-1].methods.join(", ")+" on "+new Date(lead.outreach_summary[0].attempts[lead.outreach_summary[0].attempts.length-1].date).toLocaleDateString():"")+\'</div>\':"")+\n' +
'      \'<div class="section-label-row">\'+\n' +
'        \'<div class="section-label">Contacts</div>\'+\n' +
'        (hasAllContacts?\'<button class="btn-ac-circle" onclick="openACModal(\\\'\'+safeId+\'\\\')" data-tooltip="Additional contacts found on Apollo">+</button>\':\'<button class="btn-ac-circle disabled" data-tooltip="No additional contacts available">+</button>\')+\n' +
'      \'</div>\'+\n' +
'      \'<div class="contacts-row" id="contacts-\'+safeId+\'"></div>\'+\n' +
'      \'<div class="composer" id="composer-\'+safeId+\'">\'+\n' +
'        \'<div class="composer-label">Email Composer</div>\'+\n' +
'        \'<div class="composer-disabled" id="composer-prompt-\'+safeId+\'">Select a contact to compose an email.</div>\'+\n' +
'        \'<div id="composer-active-\'+safeId+\'" style="display:none;">\'+\n' +
'          \'<div class="tab-row">\'+\n' +
'            \'<button class="tab active" onclick="switchCardTab(\\\'\'+safeId+\'\\\',\\\'email\\\',this)">Email</button>\'+\n' +
'            \'<button class="tab" onclick="switchCardTab(\\\'\'+safeId+\'\\\',\\\'linkedin\\\',this)">LinkedIn</button>\'+\n' +
'          \'</div>\'+\n' +
'          \'<div id="email-pane-\'+safeId+\'">\'+\n' +
'            \'<div class="subj-bar" id="subj-bar-\'+safeId+\'">\'+\n' +
'              \'<input class="subj-bar-input" type="text" id="subj-\'+safeId+\'" placeholder="Enter subject line">\'+\n' +
'              \'<div class="subj-bar-chevron" onclick="toggleSubjDD(\\\'\'+safeId+\'\\\')" data-tooltip="Choose a subject line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>\'+\n' +
'              \'<div class="subj-bar-ai" id="subj-ai-\'+safeId+\'" onclick="generateSubjectAI(\\\'\'+safeId+\'\\\')" data-tooltip="Generate subject line with AI"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/><path d="M19 14L19.75 17.25L23 18L19.75 18.75L19 22L18.25 18.75L15 18L18.25 17.25L19 14Z"/><path d="M5 4L5.5 6.5L8 7L5.5 7.5L5 10L4.5 7.5L2 7L4.5 6.5L5 4Z"/></svg></div>\'+\n' +
'              \'<div class="subj-dd-panel" id="subj-dd-panel-\'+safeId+\'">\'+\n' +
'                \'<div class="subj-dd-opt selected" data-value="\'+escHtml(subj1)+\'" onclick="selectSubjOpt(\\\'\'+safeId+\'\\\',this)">\'+escHtml(subj1)+\'</div>\'+\n' +
'                \'<div class="subj-dd-opt" data-value="\'+escHtml(subj2)+\'" onclick="selectSubjOpt(\\\'\'+safeId+\'\\\',this)">\'+escHtml(subj2)+\'</div>\'+\n' +
'                \'<div class="subj-dd-opt" data-value="\'+escHtml(subj3)+\'" onclick="selectSubjOpt(\\\'\'+safeId+\'\\\',this)">\'+escHtml(subj3)+\'</div>\'+\n' +
'                \'<div class="subj-dd-opt" data-value="\'+escHtml(subj4)+\'" onclick="selectSubjOpt(\\\'\'+safeId+\'\\\',this)">\'+escHtml(subj4)+\'</div>\'+\n' +
'              \'</div>\'+\n' +
'            \'</div>\'+\n' +
'            \'<div class="rich-editor" contenteditable="true" id="ebody-\'+safeId+\'"></div>\'+\n' +
'            \'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">\'+\n' +
'              \'<button class="btn-send-email disabled" id="send-btn-\'+safeId+\'" onclick="sendEmail(\\\'\'+safeId+\'\\\')" data-tooltip="Activate a contact first">\'+SVG_OUTLOOK_LOGO+\' Send Email</button>\'+\n' +
'              \'<button class="btn-custom-msg" onclick="generateCustomDraft(\\\'\'+safeId+\'\\\')"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="flex-shrink:0;"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/><path d="M19 14L19.75 17.25L23 18L19.75 18.75L19 22L18.25 18.75L15 18L18.25 17.25L19 14Z"/><path d="M5 4L5.5 6.5L8 7L5.5 7.5L5 10L4.5 7.5L2 7L4.5 6.5L5 4Z"/></svg> Custom Message</button>\'+\n' +
'            \'</div>\'+\n' +
'          \'</div>\'+\n' +
'          \'<div id="li-pane-\'+safeId+\'" style="display:none;">\'+\n' +
'            \'<div class="li-editor" contenteditable="true" id="libody-\'+safeId+\'" oninput="updateLICount(\\\'\'+safeId+\'\\\')"></div>\'+\n' +
'            \'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;gap:6px;"><button class="btn btn-li" onclick="copyLICard(\\\'\'+safeId+\'\\\',this)">Copy for LinkedIn</button><button class="btn btn-li" onclick="generateLIDraft(\\\'\'+safeId+\'\\\',this)">Generate Message</button><span class="li-counter" id="li-count-\'+safeId+\'">0 / 300</span></div>\'+\n' +
'          \'</div>\'+\n' +
'        \'</div>\'+\n' +
'      \'</div>\'+\n' +
'    \'</div>\'+\n' +
'    \'<div class="card-footer">\'+\n' +
'      \'<button class="btn-glass btn-glass-skip" onclick="skipLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg> Skip</button>\'+\n' +
'      \'<button class="btn-glass btn-glass-block" onclick="toggleBlockCompany(\\\'\'+companyEsc+\'\\\',this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> \'+(blocked?"Unblock":"Block company")+\'</button>\'+\n' +
'      \'<div style="flex:1;"></div>\'+\n' +
'      \'<button class="btn-glass btn-glass-reassign" onclick="openReassignModal(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">\'+ SVG_REASSIGN +\' Reassign</button>\'+\n' +
'      (lead.reminder_stage>=3?\'<div class="remove-wrap" style="position:relative;"><button class="btn-glass btn-glass-complete" onclick="toggleCloseoutDD(\\\'\'+safeId+\'\\\')">\'+ SVG_CHECK +\' Complete Lead</button><div class="closeout-dd" id="closeout-\'+safeId+\'"><div class="closeout-dd-item" onclick="closeOutLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">Close Out</div><div class="closeout-dd-item" onclick="addReminderLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">Add 3-day Reminder</div></div></div>\':\'<button class="btn-glass btn-glass-complete disabled" data-tooltip="Action all contacts to close this lead" onclick="completeLead(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')">\'+ SVG_CHECK +\' Complete Lead</button>\')+\n' +
'    \'</div>\'+\n' +
'  \'<script>window._leadJobTitles=window._leadJobTitles||{};window._leadCategories=window._leadCategories||{};window._leadRedisIds=window._leadRedisIds||{};window._leadJobTitles["\'+safeId+\'"]=\'+JSON.stringify(lead.jobTitle||"")+\';window._leadCategories["\'+safeId+\'"]=\'+JSON.stringify(lead.category||"engineering")+\';window._leadRedisIds["\'+safeId+\'"]=\'+JSON.stringify(lead.id||"")+\';<\\/script>\'+\n' +
'  \'</div>\';\n' +
'}\n' +
'\n' +
'function toggleSubjDD(safeId) {\n' +
'  var bar=_g("subj-bar-"+safeId);\n' +
'  if(bar) bar.classList.toggle("open");\n' +
'}\n' +
'function selectSubjOpt(safeId, el) {\n' +
'  var bar=_g("subj-bar-"+safeId);\n' +
'  var inp=_g("subj-"+safeId);\n' +
'  bar.querySelectorAll(".subj-dd-opt").forEach(function(o){o.classList.remove("selected");});\n' +
'  el.classList.add("selected");\n' +
'  inp.value=el.getAttribute("data-value");\n' +
'  bar.classList.remove("open");\n' +
'}\n' +
'async function generateSubjectAI(safeId) {\n' +
'  console.log("[AI-Subject] Called for safeId:", safeId);\n' +
'  var activeCid=activeContacts[safeId];\n' +
'  if(!activeCid){console.log("[AI-Subject] No active contact");showToast("Select a contact first",3000);return;}\n' +
'  var card=_g("cb-"+activeCid);\n' +
'  if(!card){console.log("[AI-Subject] Card element not found for cid:", activeCid);return;}\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead){console.log("[AI-Subject] Lead not found for safeId:", safeId);return;}\n' +
'  var aiBtn=_g("subj-ai-"+safeId);\n' +
'  var inp=_g("subj-"+safeId);\n' +
'  aiBtn.innerHTML=\'<div class="spinner"></div>\';\n' +
'  try{\n' +
'    var contactFirstName=(card.getAttribute("data-name")||"").split(" ")[0];\n' +
'    var uniqid=card.getAttribute("data-uniqid")||"*|UNIQID|*";\n' +
'    console.log("[AI-Subject] uniqid:", uniqid, "contactFirstName:", contactFirstName);\n' +
'    var payload={jobTitle:cleanJobTitle(lead.jobTitle||""),companyName:lead.company||"",category:lead.category||"engineering",contactTitle:card.getAttribute("data-title")||"",contactFirstName:contactFirstName,uniqid:uniqid,amEmail:AM.email,action:"subject_only"};\n' +
'    console.log("[AI-Subject] Sending payload:", JSON.stringify(payload));\n' +
'    var r=await fetch("/api/draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    console.log("[AI-Subject] Response status:", r.status);\n' +
'    var d=await r.json();\n' +
'    console.log("[AI-Subject] Response body:", JSON.stringify(d));\n' +
'    if(d.subject) inp.value=d.subject;\n' +
'  }catch(e){console.error("[AI-Subject] Error:",e);}\n' +
'  aiBtn.innerHTML=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/><path d="M19 14L19.75 17.25L23 18L19.75 18.75L19 22L18.25 18.75L15 18L18.25 17.25L19 14Z"/><path d="M5 4L5.5 6.5L8 7L5.5 7.5L5 10L4.5 7.5L2 7L4.5 6.5L5 4Z"/></svg>\';\n' +
'}\n' +
'document.addEventListener("click",function(e){\n' +
'  document.querySelectorAll(".subj-bar.open").forEach(function(bar){\n' +
'    if(!bar.contains(e.target)) bar.classList.remove("open");\n' +
'  });\n' +
'});\n' +
'\n' +
'async function generateCustomDraft(safeId) {\n' +
'  console.log("[CustomDraft] Called for safeId:", safeId);\n' +
'  var activeCid=activeContacts[safeId];\n' +
'  if(!activeCid){console.log("[CustomDraft] No active contact");showToast("Select a contact first",3000);return;}\n' +
'  var card=_g("cb-"+activeCid);\n' +
'  if(!card){console.log("[CustomDraft] Card element not found for cid:", activeCid);return;}\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead){console.log("[CustomDraft] Lead not found for safeId:", safeId);return;}\n' +
'  var contactName=card.getAttribute("data-name")||"";\n' +
'  var contactTitle=card.getAttribute("data-title")||"";\n' +
'  var contactFirstName=contactName.split(" ")[0];\n' +
'  var uniqid=card.getAttribute("data-uniqid")||"*|UNIQID|*";\n' +
'  console.log("[CustomDraft] contact:", contactName, "uniqid:", uniqid, "hasEmail:", !!card.getAttribute("data-email"));\n' +
'  var prospectId=card.getAttribute("data-prospect-id")||activeCid;\n' +
'  var cacheKey=safeId+"__"+prospectId;\n' +
'  var ebodyEl=_g("ebody-"+safeId);\n' +
'  var subjInput=_g("subj-"+safeId);\n' +
'  // Always regenerate when button is clicked (spec: clicking again regenerates)\n' +
'  ebodyEl.innerHTML=\'<div class="draft-loading"><div class="draft-loading-bar"></div><div class="draft-loading-bar"></div><div class="draft-loading-bar"></div><div class="draft-loading-text">Generating personalized email...</div></div>\';\n' +
'  ebodyEl.setAttribute("contenteditable","false");\n' +
'  try{\n' +
'    var payload={jobTitle:cleanJobTitle(lead.jobTitle||""),companyName:lead.company||"",category:lead.category||"engineering",contactTitle:contactTitle,contactFirstName:contactFirstName,contactName:contactName,description:lead.description||"",uniqid:uniqid,amEmail:AM.email};\n' +
'    console.log("[CustomDraft] Sending payload:", JSON.stringify(payload));\n' +
'    var r=await fetch("/api/draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    console.log("[CustomDraft] Response status:", r.status);\n' +
'    var d=await r.json();\n' +
'    console.log("[CustomDraft] Response body:", JSON.stringify(d).slice(0,300));\n' +
'    if(!r.ok||!d.body) throw new Error(d.error||"Draft failed");\n' +
'    ebodyEl.innerHTML=d.body;\n' +
'    customDraftCache[cacheKey]={body:d.body};\n' +
'    composerState[safeId].body=d.body;\n' +
'  }catch(e){\n' +
'    console.error("[CustomDraft] Error:",e);\n' +
'    showToast("Could not generate email - using default template",3000);\n' +
'    if(lead) ebodyEl.innerHTML=getEmailTemplate(lead,contactFirstName,uniqid);\n' +
'  }\n' +
'  ebodyEl.setAttribute("contenteditable","true");\n' +
'}\n' +
'\n' +
'function switchCardTab(safeId, tab, btn) {\n' +
'  var card=_g("card-"+safeId);if(!card)return;\n' +
'  card.querySelectorAll(".composer .tab").forEach(function(t){t.classList.remove("active");});\n' +
'  btn.classList.add("active");\n' +
'  _g("email-pane-"+safeId).style.display=tab==="email"?"block":"none";\n' +
'  _g("li-pane-"+safeId).style.display=tab==="linkedin"?"block":"none";\n' +
'}\n' +
'\n' +
'function copyLICard(safeId,btn) {\n' +
'  navigator.clipboard.writeText(_g("libody-"+safeId).innerText).then(function(){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy for LinkedIn";},2000);});\n' +
'}\n' +
'function updateLICount(safeId) {\n' +
'  var el=_g("libody-"+safeId);\n' +
'  var counter=_g("li-count-"+safeId);\n' +
'  if(!el||!counter) return;\n' +
'  var len=el.innerText.length;\n' +
'  counter.textContent=len+" / 300";\n' +
'  if(len>300) counter.classList.add("over"); else counter.classList.remove("over");\n' +
'}\n' +
'\n' +
'async function generateLIDraft(safeId, btn) {\n' +
'  var activeCid=activeContacts[safeId];\n' +
'  if(!activeCid){showToast("Select a contact first",3000);return;}\n' +
'  var card=_g("cb-"+activeCid);\n' +
'  if(!card) return;\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead) return;\n' +
'  var contactName=card.getAttribute("data-name")||"";\n' +
'  var contactTitle=card.getAttribute("data-title")||"";\n' +
'  var contactFirstName=contactName.split(" ")[0];\n' +
'  var uniqid=card.getAttribute("data-uniqid")||"*|UNIQID|*";\n' +
'  var prospectId=card.getAttribute("data-prospect-id")||activeCid;\n' +
'  var cacheKey=safeId+"__li__"+prospectId;\n' +
'  var libodyEl=_g("libody-"+safeId);\n' +
'  // Cache restore happens in activateContact when switching contacts.\n' +
'  // Clicking Generate Message always generates fresh (or overwrites cache).\n' +
'  btn.textContent="Generating...";btn.disabled=true;\n' +
'  libodyEl.innerHTML=\'<div class="draft-loading"><div class="draft-loading-bar"></div><div class="draft-loading-bar"></div><div class="draft-loading-text">Generating LinkedIn message...</div></div>\';\n' +
'  try{\n' +
'    var payload={jobTitle:cleanJobTitle(lead.jobTitle||""),companyName:lead.company||"",category:lead.category||"engineering",contactTitle:contactTitle,contactFirstName:contactFirstName,contactName:contactName,uniqid:uniqid,amEmail:AM.email,action:"linkedin"};\n' +
'    var r=await fetch("/api/draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    var d=await r.json();\n' +
'    if(!r.ok||!d.linkedinMessage) throw new Error(d.error||"LI draft failed");\n' +
'    libodyEl.innerText=d.linkedinMessage;\n' +
'    liDraftCache[cacheKey]=d.linkedinMessage;\n' +
'  }catch(e){\n' +
'    console.error("LI draft error:",e);\n' +
'    showToast("Could not generate message - using default",3000);\n' +
'    libodyEl.innerText=getLITemplateHtml(lead,contactFirstName,uniqid);\n' +
'  }\n' +
'  btn.textContent="Generate Message";btn.disabled=false;\n' +
'  updateLICount(safeId);\n' +
'}\n' +
'\n' +
'function addContact(safeId, name, title, companyName, location, prospectId, opts) {\n' +
'  opts=opts||{};\n' +
'  if(!contactCounters[safeId]) contactCounters[safeId]=0;\n' +
'  contactCounters[safeId]++;\n' +
'  var cid=safeId+"_c"+contactCounters[safeId];\n' +
'  var ini=initials(name);\n' +
'  var photoUrl=opts.photo_url||"";\n' +
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
'      \'<a href="\'+linkedinHref+\'" target="_blank" class="btn btn-li" data-tooltip="LinkedIn" onclick="event.stopPropagation();">\'+SVG_LINKEDIN.replace(\'viewBox="0 0 24 24"\',\'viewBox="0 0 24 24" width="14" height="14"\')+\'</a>\'+\n' +
'      \'<span class="outreach-badge" id="obd-\'+cid+\'" style="display:none;"></span>\'+\n' +
'      \'<div class="remove-wrap" style="position:relative;"><button class="btn-dots" onclick="event.stopPropagation();toggleContactDD(\\\'\'+cid+\'\\\')">&#x2026;</button>\'+\n' +
'        \'<div class="contact-dd" id="cdd-\'+cid+\'">\'+\n' +
'          \'<div class="contact-dd-section">\'+\n' +
'            \'<div class="contact-dd-header" style="color:#E8620A;font-weight:600;">Log Outreach</div>\'+\n' +
'            \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-email-\'+cid+\'"> Email</label>\'+\n' +
'            \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-limsg-\'+cid+\'"> LinkedIn Message</label>\'+\n' +
'            \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-liconn-\'+cid+\'"> LinkedIn Connect</label>\'+\n' +
'            \'<button class="btn-confirm-outreach" onclick="event.stopPropagation();confirmOutreach(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\')">Confirm Outreach</button>\'+\n' +
'          \'</div>\'+\n' +
'          \'<div class="contact-dd-divider"></div>\'+\n' +
'          \'<div class="contact-dd-section">\'+\n' +
'            \'<div class="contact-dd-header" style="color:#cc4444;font-weight:600;">Remove</div>\'+\n' +
'            \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'made_contact\\\')">Made Contact</div>\'+\n' +
'            \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'wrong_type\\\')">Wrong Contact Type</div>\'+\n' +
'            \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'existing\\\')">Existing Contact</div>\'+\n' +
'            \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'not_interested\\\')">Not Interested</div>\'+\n' +
'            \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'other\\\')">Other</div>\'+\n' +
'          \'</div>\'+\n' +
'        \'</div>\'+\n' +
'      \'</div>\'+\n' +
'    \'</div>\';\n' +
'\n' +
'  card.addEventListener("click",function(e){\n' +
'    var em=card.getAttribute("data-email");\n' +
'    if(!em) return;\n' +
'    activateContact(cid,safeId);\n' +
'  });\n' +
'  _g("contacts-"+safeId).appendChild(card);\n' +
'}\n' +
'\n' +
'function logFeedback(title,category,signal){\n' +
'  fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"log_feedback",title:title,category:category,signal:signal})}).catch(function(){});\n' +
'}\n' +
'function toggleContactDD(cid){\n' +
'  document.querySelectorAll(".contact-dd.open").forEach(function(el){el.classList.remove("open");});\n' +
'  var dd=_g("cdd-"+cid);\n' +
'  if(dd) dd.classList.add("open");\n' +
'}\n' +
'function confirmOutreach(cid,safeId){\n' +
'  var methods=[];\n' +
'  if(_g("oc-email-"+cid)&&_g("oc-email-"+cid).checked) methods.push("email");\n' +
'  if(_g("oc-limsg-"+cid)&&_g("oc-limsg-"+cid).checked) methods.push("linkedin_message");\n' +
'  if(_g("oc-liconn-"+cid)&&_g("oc-liconn-"+cid).checked) methods.push("linkedin_connect");\n' +
'  if(!methods.length){showToast("Select at least one outreach method",2000);return;}\n' +
'  var card=_g("cb-"+cid);\n' +
'  if(!card) return;\n' +
'  var leadId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'  var payload={id:leadId,action:"log_outreach",apollo_id:card.getAttribute("data-prospect-id")||"",contact_name:card.getAttribute("data-name")||"",contact_title:card.getAttribute("data-title")||"",methods:methods,am_email:AM.email};\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(d){\n' +
'    if(d.ok){\n' +
'      var badge=_g("obd-"+cid);\n' +
'      var attempt=d.attempt||1;\n' +
'      if(badge){badge.style.display="inline-block";badge.textContent="Outreach "+attempt+" sent "+new Date().toLocaleDateString();}\n' +
'      var btn=_g("ob-"+cid);\n' +
'      if(btn) btn.textContent="Follow-up";\n' +
'      var cdd=_g("cdd-"+cid);\n' +
'      if(cdd) cdd.classList.remove("open");\n' +
'      checkAllActioned(safeId);\n' +
'      showToast("Outreach logged",2000);\n' +
'    }\n' +
'  }).catch(function(){});\n' +
'}\n' +
'function removeWithReason(cid,safeId,reason){\n' +
'  var card=_g("cb-"+cid);\n' +
'  if(!card) return;\n' +
'  var leadId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'  var payload={id:leadId,action:"log_removal",apollo_id:card.getAttribute("data-prospect-id")||"",contact_name:card.getAttribute("data-name")||"",contact_title:card.getAttribute("data-title")||"",reason:reason,am_email:AM.email};\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(function(){});\n' +
'  card.style.opacity="0";card.style.transition="opacity 0.2s";setTimeout(function(){card.remove();setTimeout(function(){checkAllActioned(safeId);},50);},200);\n' +
'}\n' +
'function checkAllActioned(safeId){\n' +
'  var row=_g("contacts-"+safeId);\n' +
'  if(!row) return;\n' +
'  var cards=row.querySelectorAll(".contact-card");\n' +
'  var allDone=true;\n' +
'  var actionedCount=0;\n' +
'  cards.forEach(function(c){\n' +
'    var badge=c.querySelector(".outreach-badge");\n' +
'    var isActioned=badge&&badge.style.display!=="none";\n' +
'    if(isActioned) actionedCount++;\n' +
'    else allDone=false;\n' +
'  });\n' +
'  if(cards.length===0) allDone=true;\n' +
'  console.log("[checkAllActioned]",safeId,"total:",cards.length,"actioned:",actionedCount,"allDone:",allDone);\n' +
'  var completeBtn=document.querySelector("#card-"+safeId+" .btn-glass-complete");\n' +
'  if(completeBtn){\n' +
'    if(allDone){completeBtn.classList.remove("disabled");completeBtn.removeAttribute("data-tooltip");}\n' +
'    else{completeBtn.classList.add("disabled");completeBtn.setAttribute("data-tooltip","Action all contacts to close this lead");}\n' +
'  }\n' +
'}\n' +
'\n' +
'async function activateContact(cid, safeId) {\n' +
'  var card=_g("cb-"+cid);\n' +
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
'    var prevCard=_g("cb-"+prevActive);\n' +
'    if(prevCard) prevCard.classList.remove("active");\n' +
'  }\n' +
'  activeContacts[safeId]=cid;\n' +
'  card.classList.add("active");\n' +
'\n' +
'  // Enable Send Email button\n' +
'  var sendBtn=_g("send-btn-"+safeId);\n' +
'  if(sendBtn){sendBtn.classList.remove("disabled");sendBtn.removeAttribute("data-tooltip");sendBtn.classList.add("pulse");}\n' +
'\n' +
'  // Activate composer with merge fields\n' +
'  _g("composer-prompt-"+safeId).style.display="none";\n' +
'  _g("composer-active-"+safeId).style.display="block";\n' +
'\n' +
'  var subjInput=_g("subj-"+safeId);\n' +
'  var ebodyEl=_g("ebody-"+safeId);\n' +
'  var libodyEl=_g("libody-"+safeId);\n' +
'\n' +
'  // If first time or no state, populate fresh\n' +
'  if(!composerState[safeId]){\n' +
'    composerState[safeId]={subj:"",body:"",li:"",lastFirstName:"",lastUniqid:""};\n' +
'    var firstOpt=_g("subj-dd-panel-"+safeId);\n' +
'    if(firstOpt){var fo=firstOpt.querySelector(".subj-dd-opt");if(fo) subjInput.value=fo.getAttribute("data-value")||"";}\n' +
'    var emailCK=safeId+"__"+(card.getAttribute("data-prospect-id")||cid);\n' +
'    if(customDraftCache[emailCK]){ebodyEl.innerHTML=customDraftCache[emailCK].body;} else if(lead){ebodyEl.innerHTML=getEmailTemplate(lead,firstName,uniqid);}\n' +
'    var liCK=safeId+"__li__"+(card.getAttribute("data-prospect-id")||cid);\n' +
'    if(liDraftCache[liCK]){libodyEl.innerText=liDraftCache[liCK];} else if(lead){libodyEl.innerText=getLITemplateHtml(lead,firstName,uniqid);}\n' +
'    updateLICount(safeId);\n' +
'    composerState[safeId].lastFirstName=firstName;\n' +
'    composerState[safeId].lastUniqid=uniqid;\n' +
'  } else {\n' +
'    // Swap merge fields only\n' +
'    var st=composerState[safeId];\n' +
'    var oldFirst=st.lastFirstName||"there";\n' +
'    var oldUid=st.lastUniqid||"*|UNIQID|*";\n' +
'    var newUid=uniqid||"*|UNIQID|*";\n' +
'    var curBody=ebodyEl.innerHTML;\n' +
'    var curLI=libodyEl.innerHTML;\n' +
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
'    libodyEl.innerHTML=curLI;updateLICount(safeId);\n' +
'    composerState[safeId].lastFirstName=firstName;\n' +
'    composerState[safeId].lastUniqid=newUid;\n' +
'  }\n' +
'}\n' +
'\n' +
'function sendEmail(safeId) {\n' +
'  var activeCid=activeContacts[safeId];\n' +
'  if(!activeCid) return;\n' +
'  var card=_g("cb-"+activeCid);\n' +
'  if(!card) return;\n' +
'  var email=card.getAttribute("data-email")||"";\n' +
'  if(!email) return;\n' +
'  var subject=encodeURIComponent(_g("subj-"+safeId).value);\n' +
'  var htmlBody=_g("ebody-"+safeId).innerHTML;\n' +
'  var plainText=_g("ebody-"+safeId).innerText;\n' +
'  try{navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([htmlBody],{type:"text/html"}),"text/plain":new Blob([plainText],{type:"text/plain"})})]).then(function(){showToast("Email copied - paste into Outlook",3000);}).catch(function(){navigator.clipboard.writeText(htmlBody).then(function(){showToast("Email copied - paste into Outlook",3000);});});}catch(e){navigator.clipboard.writeText(htmlBody);showToast("Email copied - paste into Outlook",3000);}\n' +
'  var pref=localStorage.getItem("outlook_preference")||"classic";\n' +
'  if(pref==="new") window.location.href="ms-outlook://compose?to="+encodeURIComponent(email)+"&subject="+subject;\n' +
'  else window.location.href="mailto:"+email+"?subject="+subject;\n' +
'  card.classList.add("sent");\n' +
'}\n' +
'\n' +
'async function getEmail(cid, safeId) {\n' +
'  var btn=_g("ge-"+cid);\n' +
'  btn.textContent="Fetching...";btn.disabled=true;\n' +
'  var card=_g("cb-"+cid);\n' +
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
'      var epEl=_g("ep-"+cid);if(epEl)epEl.style.display="none";\n' +
'      var evEl=_g("ev-"+cid);if(evEl){evEl.style.display="inline";evEl.textContent=email;}\n' +
'      var cnEl=_g("cn-"+cid);if(cnEl)cnEl.remove();\n' +
'      btn.remove();\n' +
'      card.style.cursor="pointer";\n' +
'      var geCat=(window._leadCategories&&window._leadCategories[safeId])||"engineering";\n' +
'      logFeedback(title,geCat,"positive");\n' +
'      // Mailchimp lookup/add immediately after email found\n' +
'      var firstName=name.split(" ")[0];\n' +
'      try{\n' +
'        var mcRes=await fetch("/api/mailchimp?email="+encodeURIComponent(email));\n' +
'        var mcData=await mcRes.json();\n' +
'        var uniqid="";\n' +
'        if(mcData.found&&mcData.member){\n' +
'          uniqid=mcData.member.unique_email_id||"";\n' +
'        } else {\n' +
'          var addRes=await fetch("/api/mailchimp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add",email:email,fname:firstName,lname:name.split(" ").slice(1).join(" ")||"",title:title,company:companyName,source:"BD Pipeline"})});\n' +
'          var addData=await addRes.json();\n' +
'          uniqid=addData.unique_email_id||"";\n' +
'        }\n' +
'        if(uniqid) card.setAttribute("data-uniqid",uniqid);\n' +
'      }catch(mcErr){console.error("Mailchimp in getEmail:",mcErr);}\n' +
'      if(leadRedisId){\n' +
'        var lead=leads.find(function(l){return l.id===leadRedisId;});\n' +
'        if(lead&&lead.contacts){\n' +
'          var ci=lead.contacts.findIndex(function(c){return(c.apollo_id||"")===prospectId;});\n' +
'          if(ci>=0){lead.contacts[ci].email=email;var uid=card.getAttribute("data-uniqid")||"";if(uid)lead.contacts[ci].uniqid=uid;}\n' +
'          fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts}})}).catch(function(){});\n' +
'        }\n' +
'      }\n' +
'    } else {\n' +
'      btn.textContent="Not found";btn.disabled=true;\n' +
'      var epEl2=_g("ep-"+cid);if(epEl2)epEl2.textContent="Email not found";\n' +
'    }\n' +
'  }catch(e){btn.textContent="Failed";btn.disabled=false;}\n' +
'}\n' +
'\n' +
'var _acSafeId="";\n' +
'function openACModal(safeId) {\n' +
'  _acSafeId=safeId;\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead||!lead.allContacts||!lead.allContacts.length){showToast("No additional contacts available.",2000);return;}\n' +
'  _g("ac-title").textContent="Additional Contacts - "+lead.company;\n' +
'  var body=_g("ac-body");\n' +
'  var leadLoc=lead.location||"";\n' +
'  var locParts=leadLoc.split(","); var leadCity=locParts[0]?locParts[0].trim():""; var leadState=locParts[1]?locParts[1].trim():"";\n' +
'  body.innerHTML=lead.allContacts.map(function(c,i){\n' +
'    var nameStr=(c.first_name||"")+" "+(c.last_name_obfuscated||c.last_name||"");\n' +
'    var liHtml=c.linkedin_url?\'<a class="modal-row-li" href="\'+c.linkedin_url+\'" target="_blank" rel="noopener" title="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>\':"";\n' +
'    var locHtml=(c.has_state&&leadState)?\'<span class="modal-row-location">\'+leadCity+(leadState?", "+leadState:"")+\'</span>\':"";\n' +
'    return \'<div class="modal-row" id="ac-row-\'+safeId+\'-\'+i+\'">\'+\n' +
'      \'<div class="modal-row-info"><div class="modal-row-name">\'+nameStr+\'</div><div class="modal-row-title">\'+c.title+\'</div>\'+\n' +
'      (liHtml||locHtml?\'<div class="modal-row-meta">\'+liHtml+locHtml+\'</div>\':"")+\n' +
'      \'</div>\'+\n' +
'      \'<button class="search-add-btn" onclick="addFromModal(\\\'\'+safeId+\'\\\',\'+i+\')">+ Add</button>\'+\n' +
'    \'</div>\';\n' +
'  }).join("");\n' +
'  _g("ac-overlay").classList.add("open");\n' +
'}\n' +
'function closeACModal(){_g("ac-overlay").classList.remove("open");}\n' +
'\n' +
'async function addFromModal(safeId, idx) {\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead||!lead.allContacts||!lead.allContacts[idx]) return;\n' +
'  var ac=lead.allContacts[idx];\n' +
'  var row=_g("ac-row-"+safeId+"-"+idx);\n' +
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
'    var acBtn=document.querySelector("#card-"+safeId+" .btn-ac-circle");\n' +
'    if(acBtn&&!lead.allContacts.length) acBtn.remove();\n' +
'    if(!lead.allContacts.length) closeACModal();\n' +
'  }catch(e){btn.textContent="Failed";btn.disabled=false;}\n' +
'}\n' +
'\n' +
'function openJD(safeId) {\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead)return;\n' +
'  _g("jd-popup-title").textContent=lead.company+" - "+lead.jobTitle;\n' +
'  _g("jd-popup-body").textContent=lead.description||"No description available.";\n' +
'  _g("jd-overlay").classList.add("open");\n' +
'}\n' +
'function closeJDBtn(){_g("jd-overlay").classList.remove("open");}\n' +
'\n' +
'document.addEventListener("click",function(e){\n' +
'  if(!e.target.classList.contains("search-input")){\n' +
'    document.querySelectorAll(\'[id^="ss-"]\').forEach(function(el){if(!el.contains(e.target))el.style.display="none";});\n' +
'  }\n' +
'  if(!e.target.closest(".remove-wrap")){\n' +
'    document.querySelectorAll(".contact-dd.open").forEach(function(el){el.classList.remove("open");});\n' +
'  }\n' +
'});\n' +
'\n' +
'var _skipTimer=null,_skipUndone=false;\n' +
'function showToast(html,dur){var c=_g("toast-container");_g("toast-inner").innerHTML=html;c.classList.add("show");return setTimeout(function(){c.classList.remove("show");},dur||5000);}\n' +
'function hideToast(){_g("toast-container").classList.remove("show");}\n' +
'function showConfirm(t,s,bl,fn,btnCls){_g("confirm-title").textContent=t;_g("confirm-sub").textContent=s;var b=_g("confirm-action-btn");b.textContent=bl;b.className="btn-glass "+(btnCls||"btn-glass-block");b.onclick=function(){closeConfirm();fn();};_g("confirm-overlay").classList.add("open");}\n' +
'function closeConfirm(){_g("confirm-overlay").classList.remove("open");}\n' +
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
'    rm.forEach(function(sid){var c=_g("card-"+sid);if(c){c.style.opacity="0";c.style.transition="opacity 0.3s";setTimeout(function(){c.remove();},300);}});\n' +
'    updateLeadCount();\n' +
'  });\n' +
'}\n' +
'\n' +
'function skipLead(safeId,realId){\n' +
'  if(_skipTimer){clearTimeout(_skipTimer);hideToast();}\n' +
'  _skipUndone=false;\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  var cn=lead?lead.company:"";\n' +
'  var card=_g("card-"+safeId);\n' +
'  var cardHTML=card?card.outerHTML:null,cardParent=card?card.parentNode:null,cardNext=card?card.nextSibling:null;\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.2s";setTimeout(function(){if(!_skipUndone)card.remove();},200);}\n' +
'  leads=leads.filter(function(l){return l.id!==realId;});\n' +
'  updateLeadCount();\n' +
'  _skipTimer=showToast("Lead skipped: "+cn+" <button class=\\"toast-undo\\" onclick=\\"undoSkip()\\">Undo</button>",5000);\n' +
'  var pRealId=realId,pLead=lead;\n' +
'  window._skipUndo=function(){\n' +
'    _skipUndone=true;clearTimeout(_skipTimer);hideToast();\n' +
'    if(pLead)leads.push(pLead);\n' +
'    updateLeadCount();\n' +
'    if(cardHTML&&cardParent){var tmp=document.createElement("div");tmp.innerHTML=cardHTML;var r=tmp.firstChild;r.style.opacity="0";r.style.transition="opacity 0.3s";if(cardNext&&cardNext.parentNode===cardParent)cardParent.insertBefore(r,cardNext);else cardParent.appendChild(r);setTimeout(function(){r.style.opacity="1";},10);fetchLogo(pLead.company,pLead.employerWebsite||"",pLead.location||"",getSafeId(pLead.id));}\n' +
'  };\n' +
'  setTimeout(function(){if(!_skipUndone)fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pRealId,updates:{status:"skipped"}})});},5200);\n' +
'}\n' +
'function undoSkip(){if(window._skipUndo)window._skipUndo();}\n' +
'\n' +
'function completeLead(safeId, realId) {\n' +
'  var btn=document.querySelector("#card-"+safeId+" .btn-glass-complete");\n' +
'  if(btn&&btn.classList.contains("disabled")) return;\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  showConfirm("Close this lead and start follow-up reminders?","You can still reach out to remaining contacts when reminders fire.","Confirm",function(){\n' +
'    fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:realId,action:"complete_lead",am_email:AM.email})}).then(function(){showToast("Lead closed, reminders scheduled",3000);}).catch(function(){});\n' +
'    var card=_g("card-"+safeId);\n' +
'    if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'    leads=leads.filter(function(l){return l.id!==realId;});\n' +
'    updateLeadCount();\n' +
'  },"btn-glass-complete");\n' +
'}\n' +
'function toggleCloseoutDD(safeId){\n' +
'  var dd=_g("closeout-"+safeId);\n' +
'  if(dd) dd.classList.toggle("open");\n' +
'}\n' +
'function closeOutLead(safeId,realId){\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:realId,action:"close_out"})}).then(function(){showToast("Lead permanently closed",3000);}).catch(function(){});\n' +
'  var card=_g("card-"+safeId);\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'  leads=leads.filter(function(l){return l.id!==realId;});\n' +
'  updateLeadCount();\n' +
'}\n' +
'function addReminderLead(safeId,realId){\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:realId,action:"add_reminder"})}).then(function(){showToast("3-day reminder added",3000);}).catch(function(){});\n' +
'  var card=_g("card-"+safeId);\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'  leads=leads.filter(function(l){return l.id!==realId;});\n' +
'  updateLeadCount();\n' +
'}\n' +
'\n' +
'var _reassignSafeId="",_reassignRealId="";\n' +
'function openReassignModal(safeId, realId) {\n' +
'  _reassignSafeId=safeId;_reassignRealId=realId;\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  _g("reassign-title").textContent="Reassign Lead"+(lead?" - "+lead.company:"");\n' +
'  var body=_g("reassign-body");\n' +
'  body.innerHTML=AM_NAMES.map(function(name){\n' +
'    return \'<div class="reassign-item"><span>\'+ name +\'</span><button class="reassign-btn" onclick="reassignLead(\\\'\'+name.replace(/\x27/g,"\\\\\\x27")+\'\\\')">Reassign</button></div>\';\n' +
'  }).join("");\n' +
'  _g("reassign-overlay").classList.add("open");\n' +
'}\n' +
'function closeReassignModal(){_g("reassign-overlay").classList.remove("open");}\n' +
'\n' +
'function reassignLead(amName) {\n' +
'  closeReassignModal();\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:_reassignRealId,updates:{assignedAM:amName}})}).catch(function(){});\n' +
'  var card=_g("card-"+_reassignSafeId);\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'  leads=leads.filter(function(l){return l.id!==_reassignRealId;});\n' +
'  updateLeadCount();\n' +
'  showToast("Lead reassigned to "+amName,3000);\n' +
'}\n' +
'\n' +
'function setOutlookPref(pref){\n' +
'  localStorage.setItem("outlook_preference",pref);\n' +
'  _g("ol-classic").classList.toggle("active",pref==="classic");\n' +
'  _g("ol-new").classList.toggle("active",pref==="new");\n' +
'}\n' +
'(function(){\n' +
'  var pref=localStorage.getItem("outlook_preference")||"classic";\n' +
'  if(pref==="new") setOutlookPref("new");\n' +
'})();\n' +
'\n' +
'(function(){\n' +
'  var tip=document.createElement("div");tip.className="custom-tooltip";document.body.appendChild(tip);\n' +
'  function show(e){\n' +
'    var el=e.target.closest("[data-tooltip]");if(!el)return;\n' +
'    var text=el.getAttribute("data-tooltip");if(!text)return;\n' +
'    tip.textContent=text;\n' +
'    var rect=el.getBoundingClientRect();\n' +
'    var tx=rect.left+rect.width/2-tip.offsetWidth/2;\n' +
'    var ty=rect.top-tip.offsetHeight-6;\n' +
'    if(tx<4)tx=4;if(tx+tip.offsetWidth>window.innerWidth-4)tx=window.innerWidth-tip.offsetWidth-4;\n' +
'    if(ty<4)ty=rect.bottom+6;\n' +
'    tip.style.left=tx+"px";tip.style.top=ty+"px";\n' +
'    tip.classList.add("visible");\n' +
'  }\n' +
'  function hide(){tip.classList.remove("visible");}\n' +
'  document.addEventListener("mouseover",show);document.addEventListener("mouseout",function(e){if(e.target.closest("[data-tooltip]"))hide();});\n' +
'})();\n' +
'(function(){\n' +
'  var STAR_SVG = \'<svg viewBox="0 0 24 24" fill="#E8620A"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/><path d="M19 14L19.75 17.25L23 18L19.75 18.75L19 22L18.25 18.75L15 18L18.25 17.25L19 14Z"/><path d="M5 4L5.5 6.5L8 7L5.5 7.5L5 10L4.5 7.5L2 7L4.5 6.5L5 4Z"/></svg>\';\n' +
'  var STAR_CONFIG = [\n' +
'    {tx:"-120%",ty:"-140%",dur:800,size:12},\n' +
'    {tx:"-30%",ty:"-160%",dur:700,size:8},\n' +
'    {tx:"100%",ty:"-120%",dur:900,size:16},\n' +
'    {tx:"140%",ty:"20%",dur:650,size:20},\n' +
'    {tx:"110%",ty:"120%",dur:800,size:10},\n' +
'    {tx:"-100%",ty:"110%",dur:750,size:6}\n' +
'  ];\n' +
'  var EASING = "cubic-bezier(0.05, 0.83, 0.43, 0.96)";\n' +
'  function createStars(btn) {\n' +
'    if(btn._stars) return;\n' +
'    btn._stars = [];\n' +
'    STAR_CONFIG.forEach(function(cfg) {\n' +
'      var el = document.createElement("span");\n' +
'      el.className = "star-burst";\n' +
'      el.innerHTML = STAR_SVG;\n' +
'      el.style.cssText = "position:absolute;top:50%;left:50%;margin-top:-"+(cfg.size/2)+"px;margin-left:-"+(cfg.size/2)+"px;width:"+cfg.size+"px;height:"+cfg.size+"px;z-index:2;pointer-events:none;opacity:0;transform:scale(0);transition:none;";\n' +
'      el.querySelector("svg").style.cssText = "width:100%;height:100%;filter:drop-shadow(0 0 4px #E8620A);";\n' +
'      el._cfg = cfg;\n' +
'      btn.appendChild(el);\n' +
'      btn._stars.push(el);\n' +
'    });\n' +
'  }\n' +
'  function animateOut(btn) {\n' +
'    if(!btn._stars) return;\n' +
'    btn._stars.forEach(function(el) {\n' +
'      var cfg = el._cfg;\n' +
'      el.style.transition = "none";\n' +
'      el.offsetHeight;\n' +
'      el.style.transition = "transform "+cfg.dur+"ms "+EASING+", opacity "+cfg.dur+"ms "+EASING;\n' +
'      el.style.transform = "translate("+cfg.tx+","+cfg.ty+") scale(1)";\n' +
'      el.style.opacity = "1";\n' +
'      setTimeout(function(){ el.style.opacity = "0"; }, cfg.dur * 0.55);\n' +
'    });\n' +
'  }\n' +
'  function animateBack(btn) {\n' +
'    if(!btn._stars) return;\n' +
'    btn._stars.forEach(function(el) {\n' +
'      var cfg = el._cfg;\n' +
'      el.style.transition = "transform 400ms "+EASING+", opacity 300ms ease";\n' +
'      el.style.transform = "scale(0)";\n' +
'      el.style.opacity = "0";\n' +
'    });\n' +
'  }\n' +
'  document.addEventListener("mouseover", function(e) {\n' +
'    var btn = e.target.closest(".btn-custom-msg, .subj-bar-ai");\n' +
'    if(!btn) return;\n' +
'    createStars(btn);\n' +
'    animateOut(btn);\n' +
'  });\n' +
'  document.addEventListener("mouseout", function(e) {\n' +
'    var btn = e.target.closest(".btn-custom-msg, .subj-bar-ai");\n' +
'    if(!btn) return;\n' +
'    if(btn.contains(e.relatedTarget)) return;\n' +
'    animateBack(btn);\n' +
'  });\n' +
'})();\n' +
'var _addDesc="";\n' +
'function openAddModal(){\n' +
'  _g("add-url").value="";_g("add-desc").value="";\n' +
'  _g("add-status1").textContent="";\n' +
'  _g("add-stage1").style.display="";\n' +
'  _g("add-stage2").style.display="none";\n' +
'  _g("add-generate-btn").disabled=false;\n' +
'  _g("add-generate-btn").innerHTML="Generate";\n' +
'  _g("add-overlay").classList.add("open");\n' +
'}\n' +
'function closeAddModal(){_g("add-overlay").classList.remove("open");}\n' +
'function addGoBack(){\n' +
'  _g("add-stage1").style.display="";\n' +
'  _g("add-stage2").style.display="none";\n' +
'}\n' +
'\n' +
'async function generateJobDetails(){\n' +
'  var desc=_g("add-desc").value.trim();\n' +
'  if(!desc){showToast("Please paste a job description",2000);return;}\n' +
'  _addDesc=desc;\n' +
'  var btn=_g("add-generate-btn");\n' +
'  btn.disabled=true;btn.innerHTML=\'<div class="add-spinner"></div> Analyzing...\';\n' +
'  _g("add-status1").textContent="";\n' +
'  try{\n' +
'    var r=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"extract_job",description:desc})});\n' +
'    var d=await r.json();\n' +
'    if(!d.ok){_g("add-status1").textContent="Error: "+(d.error||"Could not parse");btn.disabled=false;btn.innerHTML="Generate";return;}\n' +
'    _g("add-title").value=d.jobTitle||"";\n' +
'    _g("add-company").value=d.company||"";\n' +
'    _g("add-location").value=d.location||"";\n' +
'    _g("add-category").value=d.category||"engineering";\n' +
'    _g("add-domain").value=d.domain||"";\n' +
'    _g("add-desc-preview").value=_addDesc;\n' +
'    _g("add-stage1").style.display="none";\n' +
'    _g("add-stage2").style.display="";\n' +
'  }catch(e){\n' +
'    _g("add-status1").textContent="Error: "+e.message;\n' +
'  }\n' +
'  btn.disabled=false;btn.innerHTML="Generate";\n' +
'}\n' +
'\n' +
'function replaceCardWithLead(lead, oldCardId) {\n' +
'  console.log("[AddLead] replaceCardWithLead called | id:",lead.id,"| oldCardId:",oldCardId,"| contacts:",lead.contacts?lead.contacts.length:0);\n' +
'  var safeId=getSafeId(lead.id);\n' +
'  // Update leads array\n' +
'  var idx=leads.findIndex(function(l){return l.id===lead.id;});\n' +
'  if(idx>=0) leads[idx]=lead; else leads.unshift(lead);\n' +
'  // Register metadata (normally done by inline script tags)\n' +
'  window._leadJobTitles=window._leadJobTitles||{};\n' +
'  window._leadCategories=window._leadCategories||{};\n' +
'  window._leadRedisIds=window._leadRedisIds||{};\n' +
'  window._leadJobTitles[safeId]=lead.jobTitle||"";\n' +
'  window._leadCategories[safeId]=lead.category||"engineering";\n' +
'  window._leadRedisIds[safeId]=lead.id||"";\n' +
'  // Render new card HTML\n' +
'  var html=renderCard(lead);\n' +
'  var temp=document.createElement("div");\n' +
'  temp.innerHTML=html;\n' +
'  var newCard=temp.firstChild;\n' +
'  // Replace old card in DOM\n' +
'  var oldCard=_g(oldCardId);\n' +
'  console.log("[AddLead] oldCard lookup:",oldCardId,"| found:",!!oldCard,"| parentNode:",oldCard?!!oldCard.parentNode:false);\n' +
'  if(oldCard&&oldCard.parentNode) oldCard.parentNode.replaceChild(newCard,oldCard);\n' +
'  // Force visibility and diagnose\n' +
'  newCard.style.display="block";\n' +
'  newCard.style.visibility="visible";\n' +
'  newCard.style.opacity="1";\n' +
'  var cs=window.getComputedStyle(newCard);\n' +
'  console.log("[AddLead] Card after insert | display:",cs.display,"| visibility:",cs.visibility,"| height:",newCard.offsetHeight,"| offsetParent:",!!newCard.offsetParent);\n' +
'  console.log("[AddLead] Card classes:",newCard.className,"| inline style:",newCard.getAttribute("style")||"none","| hidden class:",newCard.classList.contains("hidden"));\n' +
'  newCard.scrollIntoView({behavior:"smooth",block:"start"});\n' +
'  // Fetch logo\n' +
'  fetchLogo(lead.company,lead.company_website||lead.employerWebsite||"",lead.location||"",safeId,lead.company_logo_apollo||lead.company_logo||"");\n' +
'  updateLeadCount();\n' +
'}\n' +
'\n' +
'async function submitAddLead(){\n' +
'  try{\n' +
'  var title=_g("add-title").value.trim();\n' +
'  var company=_g("add-company").value.trim();\n' +
'  var loc=_g("add-location").value.trim();\n' +
'  var category=_g("add-category").value;\n' +
'  var domain=_g("add-domain").value.trim();\n' +
'  var jobUrl=_g("add-url").value.trim();\n' +
'  if(!title||!company||!loc){showToast("Please fill in title, company and location",2000);return;}\n' +
'  closeAddModal();\n' +
'  var slug=company.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").substring(0,40);\n' +
'  var today=new Date().toISOString().split("T")[0];\n' +
'  var placeholderId="lead:"+today+":"+slug;\n' +
'  var placeholder={id:placeholderId,jobTitle:title,company:company,location:loc,category:category,company_domain:domain,status:"pending",contacts:[],createdAt:Date.now(),source:"manual"};\n' +
'  leads.unshift(placeholder);\n' +
'  var container=_g("leads-container");\n' +
'  var temp=document.createElement("div");\n' +
'  temp.innerHTML=renderCard(placeholder);\n' +
'  var newCard=temp.firstChild;\n' +
'  newCard.style.position="relative";\n' +
'  var overlay=document.createElement("div");\n' +
'  overlay.className="card-loading-overlay";\n' +
'  overlay.innerHTML=\'<div class="add-spinner"></div><span>Finding contacts...</span>\';\n' +
'  newCard.appendChild(overlay);\n' +
'  container.insertBefore(newCard,container.firstChild);\n' +
'  updateLeadCount();\n' +
'  // Fire POST - returns immediately, enrichment runs async on server\n' +
'  var r=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_lead",jobTitle:title,company:company,location:loc,category:category,jobUrl:jobUrl,description:_addDesc,domain:domain})});\n' +
'  var d=await r.json();\n' +
'  if(!d.ok){overlay.querySelector("span").textContent="Error: "+(d.error||"Failed");return;}\n' +
'  var pollId=d.leadId||placeholderId;\n' +
'  // Poll for enrichment completion\n' +
'  var startTime=Date.now();\n' +
'  var pollTimer=setInterval(async function(){\n' +
'    try{\n' +
'      var elapsed=Date.now()-startTime;\n' +
'      if(elapsed>45000){\n' +
'        clearInterval(pollTimer);\n' +
'        // Timeout - fetch final state and show whatever we have\n' +
'        var tr=await fetch("/api/leads?id="+encodeURIComponent(pollId));\n' +
'        var td=await tr.json();\n' +
'        if(td.ok&&td.lead){\n' +
'          var cardId="card-"+getSafeId(placeholderId);\n' +
'          replaceCardWithLead(td.lead,cardId);\n' +
'          showToast("Lead added: "+company+" ("+((td.lead.contacts||[]).length)+" contacts)",3000);\n' +
'        }else{\n' +
'          overlay.querySelector("span").textContent="Timeout - no contacts found";\n' +
'          setTimeout(function(){if(overlay.parentNode)overlay.remove();},2000);\n' +
'        }\n' +
'        return;\n' +
'      }\n' +
'      var pr=await fetch("/api/leads?id="+encodeURIComponent(pollId));\n' +
'      var pd=await pr.json();\n' +
'      if(!pd.ok||!pd.lead) return;\n' +
'      var lead=pd.lead;\n' +
'      var hasContacts=lead.contacts&&lead.contacts.length>0;\n' +
'      var enrichDone=!!lead.contactsEnrichedAt;\n' +
'      if(hasContacts||enrichDone){\n' +
'        clearInterval(pollTimer);\n' +
'        var cardId="card-"+getSafeId(placeholderId);\n' +
'        replaceCardWithLead(lead,cardId);\n' +
'        var cc=(lead.contacts||[]).length;\n' +
'        showToast("Lead added: "+company+" ("+cc+" contacts)",3000);\n' +
'      }\n' +
'    }catch(pe){console.error("[AddLead] Poll error:",pe.message);}\n' +
'  },3000);\n' +
'  }catch(e){\n' +
'    console.error("[AddLead] ERROR:",e.message);\n' +
'    var ov=document.querySelector(".card-loading-overlay");\n' +
'    if(ov){ov.querySelector("span").textContent="Error: "+e.message;setTimeout(function(){if(ov.parentNode)ov.remove();},3000);}\n' +
'  }\n' +
'}\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';

  res.status(200).send(html);
};
