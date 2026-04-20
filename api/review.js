// --- Analytics helpers (embedded to stay within Hobby plan function limit) ---
var _aRedisGet = async function(key) {
  var url = process.env.KV_REST_API_URL + '/get/' + encodeURIComponent(key);
  var r = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  var data = await r.json();
  if (!data.result) return null;
  try { var v = data.result; while (typeof v === 'string') v = JSON.parse(v); if (v && typeof v.value === 'string') v = JSON.parse(v.value); return v; } catch(e) { return null; }
};
var _aRedisSet = async function(key, value) {
  var url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(value) }) });
};
var _aRedisKeys = async function(pattern) {
  var url = process.env.KV_REST_API_URL + '/keys/' + encodeURIComponent(pattern);
  var r = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  var data = await r.json(); return data.result || [];
};

var _A_PROFILES = [
  { name: 'Doug Koetsier', email: 'dkoetsier@impactbusinessgroup.com', outreachTarget: 80, removalTarget: 15 },
  { name: 'Paul Kujawski', email: 'pkujawski@impactbusinessgroup.com', outreachTarget: 45, removalTarget: 10 },
  { name: 'Lauren Sylvester', email: 'lsylvester@impactbusinessgroup.com', outreachTarget: 40, removalTarget: 8 },
  { name: 'Dan Teliczan', email: 'dteliczan@impactbusinessgroup.com', outreachTarget: 20, removalTarget: 5 },
  { name: 'Mark Sapoznikov', email: 'msapoznikov@impactbusinessgroup.com', outreachTarget: 5, removalTarget: 2 },
];

var _SEED_COMPANIES = ['Gentex Corporation','Steelcase Inc','Amway Corporation','Wolverine Worldwide','Meijer Inc','Herman Miller','Spectrum Health','Lacks Enterprises','Autocam Medical','Perrigo Company','Dematic Corp','Bissell Homecare','Roskam Baking','Yanfeng Automotive','Tower Automotive','Shape Corp','GE Aviation','Parker Hannifin','Eaton Corporation','Borg Warner','Whirlpool Corporation','Kellogg Company','Stryker Corporation','Dow Chemical','Consumers Energy','Blue Cross Blue Shield','Haworth Inc','X-Rite Inc','Dura Automotive','Kaydon Corporation','Progressive AE','Deloitte Grand Rapids','Plante Moran','BDO USA','Crowe LLP','Rehmann Group','Raymond James','Fifth Third Bank','Mercantile Bank','Lake Michigan Financial','Tampa General Hospital','Jabil Inc','ConnectWise','KnowBe4','ReliaQuest','Accusoft Corporation','Digital Hands','Greenway Health'];
var _SEED_FN = ['James','Robert','Michael','William','David','Richard','Joseph','Thomas','Christopher','Daniel','Matthew','Andrew','Joshua','Brandon','Kevin','Jennifer','Amanda','Jessica','Sarah','Megan','Emily','Nicole','Stephanie','Michelle','Laura','Rachel','Heather','Karen','Lisa','Patricia','Brian','Steven','Eric','Jeffrey','Ryan','Jacob','Nathan','Tyler','Rebecca','Samantha','Katherine','Christine','Angela','Melissa','Tiffany'];
var _SEED_LN = ['Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','VanDyke','DeVries','Vander Wal','Kowalski','Nowak','Schmidt','Fischer','Patel','Singh','Chen','Wang','Kim','Nguyen','Park','Tanaka'];
var _SEED_T_ENG = ['VP of Engineering','Director of Manufacturing','Plant Manager','Engineering Manager','Director of Operations','Quality Director','Senior Mechanical Engineer','Controls Engineer','Manufacturing Director','Process Engineering Manager','VP of Operations','Facilities Manager','Production Manager','Director of Quality','Chief Engineer'];
var _SEED_T_IT = ['VP of Technology','Director of IT','CTO','IT Manager','Director of Software Engineering','Senior DevOps Engineer','Cloud Architect','CISO','Director of Data Engineering','VP of Information Systems','Systems Architect','Network Operations Manager','Director of Cybersecurity','Infrastructure Manager','Software Development Manager'];
var _SEED_T_ACCT = ['Controller','CFO','Director of Finance','Senior Accountant','VP of Finance','Accounting Manager','Financial Planning Director','Tax Director','Audit Manager','Director of Financial Reporting','Treasury Manager','Payroll Director','Assistant Controller','Finance Manager','Chief Accounting Officer'];
var _CATS = ['engineering','it','accounting'];
var _OUTREACH_OPTS = [['email'],['linkedin_message'],['linkedin_connect'],['email','linkedin_connect'],['email','linkedin_message'],['linkedin_message','linkedin_connect'],['email','linkedin_message','linkedin_connect']];
var _REM_REASONS = ['made_contact','wrong_contact_type','existing_contact','not_interested','other'];

function _pr(seed) { var x = Math.sin(seed)*10000; return x - Math.floor(x); }
function _pk(arr,seed) { return arr[Math.floor(_pr(seed)*arr.length)]; }
function _gaid(seed) { var c='abcdef0123456789',id=''; for(var i=0;i<24;i++) id+=c[Math.floor(_pr(seed+i*7)*c.length)]; return id; }

function _genSeed() {
  var entries=[],now=Date.now(),sc=42;
  for(var a=0;a<_A_PROFILES.length;a++){
    var am=_A_PROFILES[a];
    for(var o=0;o<am.outreachTarget;o++){
      sc+=13;var cat=_pk(_CATS,sc),titles=cat==='it'?_SEED_T_IT:cat==='accounting'?_SEED_T_ACCT:_SEED_T_ENG;
      var fn=_pk(_SEED_FN,sc+1),ln=_pk(_SEED_LN,sc+2),co=_pk(_SEED_COMPANIES,sc+3),ti=_pk(titles,sc+4),meth=_pk(_OUTREACH_OPTS,sc+5);
      var da=Math.floor(_pr(sc+6)*60),ed=new Date(now-da*864e5),slug=co.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,40);
      var ld=new Date(ed.getTime()-Math.floor(_pr(sc+7)*3)*864e5),lds=ld.toISOString().split('T')[0];
      var mc=_pr(sc+8)<0.12,rs=Math.floor(_pr(sc+9)*4);
      entries.push({apollo_id:_gaid(sc+10),contact_name:fn+' '+ln,contact_title:ti,lead_category:cat,action_type:'outreach_sent',outreach_methods:meth,removal_reason:null,outreach_result:mc?'made_contact':null,reminder_stage:rs,am_email:am.email,lead_id:'lead:'+lds+':'+slug,date:ed.toISOString()});
    }
    for(var r=0;r<am.removalTarget;r++){
      sc+=17;var cat=_pk(_CATS,sc),titles=cat==='it'?_SEED_T_IT:cat==='accounting'?_SEED_T_ACCT:_SEED_T_ENG;
      var fn=_pk(_SEED_FN,sc+1),ln=_pk(_SEED_LN,sc+2),co=_pk(_SEED_COMPANIES,sc+3),ti=_pk(titles,sc+4),reason=_pk(_REM_REASONS,sc+5);
      var da=Math.floor(_pr(sc+6)*60),ed=new Date(now-da*864e5),slug=co.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,40);
      var ld=new Date(ed.getTime()-Math.floor(_pr(sc+7)*3)*864e5),lds=ld.toISOString().split('T')[0];
      var rs=Math.floor(_pr(sc+9)*4);
      entries.push({apollo_id:_gaid(sc+10),contact_name:fn+' '+ln,contact_title:ti,lead_category:cat,action_type:'removal',outreach_methods:[],removal_reason:reason,outreach_result:reason==='made_contact'?'made_contact':null,reminder_stage:rs,am_email:am.email,lead_id:'lead:'+lds+':'+slug,date:ed.toISOString()});
    }
  }
  return entries;
}

function _weekStart(ds){var d=new Date(ds),day=d.getUTCDay(),diff=d.getUTCDate()-day+(day===0?-6:1);var m=new Date(d);m.setUTCDate(diff);return m.toISOString().split('T')[0];}

function _buildAm(email,name,act,lc){
  var out=act.filter(function(e){return e.action_type==='outreach_sent';}),rem=act.filter(function(e){return e.action_type==='removal';});
  var cm=act.filter(function(e){return e.outreach_result==='made_contact';}).length;
  var obm={email:0,linkedin_message:0,linkedin_connect:0};
  for(var i=0;i<out.length;i++){var ms=out[i].outreach_methods||[];for(var j=0;j<ms.length;j++)if(obm.hasOwnProperty(ms[j]))obm[ms[j]]++;}
  var rr={made_contact:0,wrong_contact_type:0,existing_contact:0,not_interested:0,other:0};
  for(var i=0;i<rem.length;i++){var r=rem[i].removal_reason||'other';if(rr.hasOwnProperty(r))rr[r]++;else rr.other++;}
  var stg={stage1:0,stage2:0,stage3:0};
  for(var i=0;i<act.length;i++){var s=act[i].reminder_stage;if(s===1)stg.stage1++;else if(s===2)stg.stage2++;else if(s>=3)stg.stage3++;}
  var wm={};for(var i=0;i<out.length;i++){var w=_weekStart(out[i].date);wm[w]=(wm[w]||0)+1;}
  var obw=[],wk=Object.keys(wm).sort();for(var i=0;i<wk.length;i++)obw.push({week:wk[i],count:wm[wk[i]]});
  var cr=lc>0?Math.round((cm/lc)*100):0;
  return {name:name,email:email,leadsReceived:lc,outreachSent:out.length,contactsMade:cm,completionRate:cr,outreachByMethod:obm,removalReasons:rr,reminderStages:stg,outreachByWeek:obw};
}

async function handleAnalytics(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  var q=req.query||{},fromDate=q.from||'',toDate=q.to||'',filterAm=q.am||'';
  var seedDone=await _aRedisGet('analytics_seed_done');
  if(!seedDone){var se=_genSeed();var el=(await _aRedisGet('contact_activity_log'))||[];await _aRedisSet('contact_activity_log',el.concat(se));await _aRedisSet('analytics_seed_done',{seeded:true,date:new Date().toISOString(),count:se.length});}
  var all=(await _aRedisGet('contact_activity_log'))||[],filtered=all;
  if(fromDate){var ft=new Date(fromDate).getTime();filtered=filtered.filter(function(e){return new Date(e.date).getTime()>=ft;});}
  if(toDate){var tt=new Date(toDate+'T23:59:59.999Z').getTime();filtered=filtered.filter(function(e){return new Date(e.date).getTime()<=tt;});}
  var lk=await _aRedisKeys('lead:*'),lpa={};
  for(var i=0;i<lk.length;i++){try{var ld=await _aRedisGet(lk[i]);if(!ld)continue;var ae=ld.assignedAMEmail||'';if(!ae)continue;if(!lpa[ae])lpa[ae]={count:0};lpa[ae].count++;}catch(e){}}
  var _NAME_MAP={msapoznikov:'Mark Sapoznikov',dkoetsier:'Doug Koetsier',pkujawski:'Paul Kujawski',dkunkel:'Drew Kunkel',mpeal:'Matt Peal',lsylvester:'Lauren Sylvester',dteliczan:'Dan Teliczan',cwillbrandt:'Curt Willbrandt',twangler:'Trish Wangler',mherman:'Mark Herman',jdrajka:'Jamie Drajka',dbentsen:'Drew Bentsen',sbetteley:'Steve Betteley'};
  function _resolveAmName(emailOrPrefix){var prefix=emailOrPrefix.split('@')[0];return _NAME_MAP[prefix]||prefix;}
  var amMap={};for(var i=0;i<_A_PROFILES.length;i++)amMap[_A_PROFILES[i].email]=_A_PROFILES[i].name;
  for(var i=0;i<filtered.length;i++){var em=filtered[i].am_email;if(em&&!amMap[em])amMap[em]=_resolveAmName(em);}
  var aek=Object.keys(lpa);for(var i=0;i<aek.length;i++)if(!amMap[aek[i]])amMap[aek[i]]=_resolveAmName(aek[i]);
  var ams=[],ak=Object.keys(amMap);
  for(var i=0;i<ak.length;i++){var em=ak[i];if(filterAm&&em!==filterAm)continue;var aa=filtered.filter(function(e){return e.am_email===em;});var li=lpa[em]||{count:0};ams.push(_buildAm(em,amMap[em],aa,li.count));}
  ams.sort(function(a,b){return b.outreachSent-a.outreachSent;});
  var tl=0,to=0,tc=0;for(var i=0;i<ams.length;i++){tl+=ams[i].leadsReceived;to+=ams[i].outreachSent;tc+=ams[i].contactsMade;}
  var cr=tl>0?Math.round((tc/tl)*100):0;
  return res.status(200).json({ok:true,summary:{totalLeads:tl,totalOutreach:to,totalContactsMade:tc,completionRate:cr},ams:ams});
}

module.exports = async function handler(req, res) {
  // Route analytics API requests
  if (req.query && req.query.analytics !== undefined) {
    return handleAnalytics(req, res);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html');

  var html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>iMPact Client Lead Review</title>\n' +
'<link rel="icon" type="image/png" href="https://impactbusinessgroup.com/wp-content/uploads/2017/04/cropped-Logo512.png">\n' +
'<link rel="apple-touch-icon" href="https://impactbusinessgroup.com/wp-content/uploads/2017/04/cropped-Logo512.png">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
'<style>\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: Raleway, -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(180deg, #363636 0%, #2a2a2a 50%, #1f1f1f 100%); background-attachment: fixed; color: #f0f0f0; min-height: 100vh; }\n' +
'h1,h2,h3,h4,h5,h6,.section-label,.pill,.cal-month { font-family: Oswald, sans-serif; }\n' +
'.header { background: rgba(26,26,26,0.95); backdrop-filter: blur(16px); padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #333333; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }\n' +
'.header-logo { height: 34px; }\n' +
'.header-center { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }\n' +
'.btn-add-lead { width: 32px; height: 32px; border-radius: 50%; background: #00a86b; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; transition: all 0.15s; padding: 0; line-height: 1; }\n' +
'.btn-add-lead:hover { background: #14c480; transform: scale(1.05); }\n' +
'.header-btn-group { display: inline-flex; align-items: center; gap: 8px; background: #1e1e1e; border: 1px solid #333; border-radius: 24px; padding: 4px 8px; }\n' +
'.btn-cal { position: relative; width: 32px; height: 32px; border-radius: 50%; background: #E8620A; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; padding: 0; }\n' +
'.btn-cal:hover { background: #f47321; transform: scale(1.05); }\n' +
'.btn-cal.active-away { background: #cc3333; }\n' +
'.btn-cal.active-away:hover { background: #e04444; }\n' +
'.btn-help { position: relative; width: 32px; height: 32px; border-radius: 50%; background: #0F1E3D; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; padding: 0; font-family: Oswald, sans-serif; font-weight: 700; font-size: 16px; line-height: 1; }\n' +
'.btn-help:hover { background: #1a2d54; transform: scale(1.05); }\n' +
'.btn-search-icon { position: relative; width: 32px; height: 32px; border-radius: 50%; background: #4a4a4a; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; padding: 0; }\n' +
'.btn-search-icon:hover { background: #5a5a5a; transform: scale(1.05); }\n' +
'.header-search-row { display: none; align-items: center; gap: 6px; padding: 0 4px; }\n' +
'.header-btn-group.searching .header-btn-icons { display: none; }\n' +
'.header-btn-group.searching .header-search-row { display: inline-flex; }\n' +
'.header-btn-group.searching { background: #1f1f1f; }\n' +
'.header-search-input { background: #3a3a3a; border: 1px solid #4a4a4a; color: #fff; font-family: Raleway, sans-serif; font-size: 13px; padding: 7px 10px; outline: none; width: 240px; border-radius: 6px; }\n' +
'.header-search-input:focus { border-color: #E8620A; }\n' +
'.header-search-input::placeholder { color: #888; }\n' +
'.header-search-close { background: transparent; border: none; color: #888; cursor: pointer; padding: 4px 6px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; }\n' +
'.header-search-close:hover { color: #fff; background: rgba(255,255,255,0.06); }\n' +
'.search-empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.6); font-family: Raleway, sans-serif; }\n' +
'.search-empty-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 8px; }\n' +
'.search-empty-clear { display: inline-block; margin-top: 10px; color: #E8620A; font-size: 13px; cursor: pointer; text-decoration: underline; }\n' +
'.help-modal { max-width: 700px !important; width: 92% !important; }\n' +
'.help-hero { padding: 22px 26px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(232,98,10,0.08), transparent); }\n' +
'.help-hero h2 { font-family: Oswald, sans-serif; font-size: 22px; font-weight: 600; color: #fff; margin: 0 0 6px; letter-spacing: 0.5px; }\n' +
'.help-hero p { margin: 0 0 14px; font-size: 13px; color: rgba(255,255,255,0.6); font-family: Raleway, sans-serif; }\n' +
'.help-tour-btn { background: #E8620A; color: #fff; border: none; padding: 11px 22px; border-radius: 8px; font-family: Raleway, sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(232,98,10,0.35); }\n' +
'.help-tour-btn:hover { background: #cc5200; }\n' +
'.cheat-grid { padding: 8px 26px 22px; }\n' +
'.cheat-section { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }\n' +
'.cheat-section:last-child { border-bottom: none; }\n' +
'.cheat-section h3 { font-family: Oswald, sans-serif; font-size: 14px; font-weight: 600; color: #E8620A; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }\n' +
'.cheat-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-family: Raleway, sans-serif; font-size: 13px; color: rgba(255,255,255,0.8); cursor: help; position: relative; }\n' +
'.cheat-item:hover { color: #fff; }\n' +
'.cheat-item .info-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700; flex-shrink: 0; }\n' +
'.cheat-item:hover .info-icon { background: #E8620A; color: #fff; }\n' +
'.tour-overlay { display: none; position: fixed; inset: 0; z-index: 9000; pointer-events: none; }\n' +
'.tour-overlay.active { display: block; pointer-events: auto; }\n' +
'.tour-spotlight { position: fixed; background: transparent; border-radius: 10px; box-shadow: 0 0 0 9999px rgba(5,10,20,0.72); pointer-events: none; transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease; z-index: 9001; }\n' +
'.tour-card { position: fixed; z-index: 9002; background: #1a1a1a; border: 1px solid #2f2f2f; border-radius: 12px; padding: 18px 20px 16px; max-width: 340px; min-width: 260px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); font-family: Raleway, sans-serif; color: #fff; transition: top 0.25s ease, left 0.25s ease; }\n' +
'.tour-card-step { font-size: 10px; font-weight: 700; color: #E8620A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: Oswald, sans-serif; }\n' +
'.tour-card h4 { font-family: Oswald, sans-serif; font-size: 17px; font-weight: 600; color: #fff; margin: 0 0 8px; letter-spacing: 0.3px; }\n' +
'.tour-card p { font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.78); margin: 0 0 14px; }\n' +
'.tour-actions { display: flex; align-items: center; gap: 8px; }\n' +
'.tour-skip { background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 12px; font-family: Raleway, sans-serif; cursor: pointer; padding: 6px 8px; margin-right: auto; text-decoration: underline; }\n' +
'.tour-skip:hover { color: #fff; }\n' +
'.tour-prev { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.12); padding: 8px 14px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; }\n' +
'.tour-prev:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }\n' +
'.tour-prev:disabled { opacity: 0.35; cursor: not-allowed; }\n' +
'.tour-next { background: #E8620A; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; }\n' +
'.tour-next:hover { background: #cc5200; }\n' +
'.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 10px; }\n' +
'.cal-head { text-align: center; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; font-family: Raleway, sans-serif; padding: 4px 0; }\n' +
'.cal-day { text-align: center; padding: 8px 0; font-size: 13px; color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.03); border: 1px solid transparent; border-radius: 6px; cursor: pointer; user-select: none; font-family: Raleway, sans-serif; transition: background 0.1s; }\n' +
'.cal-day:hover { background: rgba(232,98,10,0.18); }\n' +
'.cal-day.blank { background: transparent; cursor: default; }\n' +
'.cal-day.today { border-color: rgba(255,255,255,0.35); font-weight: 700; }\n' +
'.cal-day.sel-start, .cal-day.sel-end, .cal-day.sel { background: #E8620A; color: #fff; border-color: #E8620A; }\n' +
'.cal-day.in-range { background: rgba(232,98,10,0.35); color: #fff; }\n' +
'.cal-nav { display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; }\n' +
'.cal-nav button { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-family: Raleway, sans-serif; }\n' +
'.cal-nav-title { font-family: Oswald, sans-serif; font-weight: 600; font-size: 15px; color: #fff; letter-spacing: 0.5px; }\n' +
'.cal-footer { display: flex; gap: 10px; justify-content: flex-end; align-items: center; margin-top: 14px; }\n' +
'.cal-footer .hint { margin-right: auto; font-size: 11px; color: rgba(255,255,255,0.4); font-family: Raleway, sans-serif; }\n' +
'.cal-add-btn { background: #E8620A; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-family: Raleway, sans-serif; font-size: 13px; cursor: pointer; }\n' +
'.cal-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }\n' +
'.cal-list { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; }\n' +
'.cal-list-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; font-family: Raleway, sans-serif; margin-bottom: 8px; }\n' +
'.cal-list-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 6px; font-family: Raleway, sans-serif; font-size: 13px; color: rgba(255,255,255,0.8); }\n' +
'.cal-list-row .dates { flex: 1; }\n' +
'.cal-list-row button { background: transparent; border: none; color: rgba(255,255,255,0.45); cursor: pointer; padding: 4px 6px; border-radius: 4px; }\n' +
'.cal-list-row button:hover { color: #fff; background: rgba(255,255,255,0.06); }\n' +
'.cal-list-row button.danger:hover { color: #ff8e8e; }\n' +
'.cal-empty { font-size: 12px; color: rgba(255,255,255,0.4); font-style: italic; padding: 10px; text-align: center; }\n' +
'.btn-archive { position: relative; width: 32px; height: 32px; border-radius: 50%; background: #1A4EA2; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; padding: 0; }\n' +
'.btn-archive:hover { background: #2360c0; transform: scale(1.05); }\n' +
'.btn-archive svg { display: block; }\n' +
'.has-tooltip { position: relative; }\n' +
'.has-tooltip::before { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; padding: 6px 10px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 12px; font-weight: 500; white-space: normal; max-width: 240px; width: max-content; text-align: center; line-height: 1.4; box-shadow: 0 2px 8px rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 10000; }\n' +
'.has-tooltip::after { content: ""; position: absolute; bottom: calc(100% + 3px); left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1a1a1a; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 10000; }\n' +
'.has-tooltip:hover::before, .has-tooltip:hover::after { opacity: 1; }\n' +
'.header .has-tooltip::before { top: calc(100% + 8px); bottom: auto; }\n' +
'.header .has-tooltip::after { top: calc(100% + 3px); bottom: auto; border-top-color: transparent; border-bottom-color: #1a1a1a; }\n' +
'.btn-archive-badge { position: absolute; top: -5px; right: -5px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #E8620A; color: #fff; font-size: 10px; font-weight: 700; font-family: Arial,sans-serif; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }\n' +
'.archive-pills { display: flex; gap: 8px; margin-bottom: 18px; }\n' +
'.archive-pill { padding: 6px 14px; font-size: 12px; font-weight: 600; font-family: Raleway, sans-serif; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; cursor: pointer; transition: all 0.15s; }\n' +
'.archive-pill:hover { background: rgba(255,255,255,0.08); color: #fff; }\n' +
'.archive-pill.active { background: #E8620A; color: #fff; border-color: #E8620A; }\n' +
'.archive-section-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.6px; font-family: Oswald, sans-serif; margin: 18px 0 10px; }\n' +
'.archive-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; }\n' +
'.archive-row-main { flex: 1; min-width: 0; }\n' +
'.archive-row-company { font-size: 13px; font-weight: 600; color: #fff; font-family: Oswald, sans-serif; }\n' +
'.archive-row-title { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
'.archive-row-meta { display: flex; gap: 10px; align-items: center; margin-top: 4px; }\n' +
'.archive-cat-pill { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
'.archive-cat-engineering { background: rgba(232,98,10,0.15); color: #E8620A; }\n' +
'.archive-cat-it { background: rgba(59,130,246,0.15); color: #3B82F6; }\n' +
'.archive-cat-accounting { background: rgba(16,185,129,0.15); color: #10B981; }\n' +
'.archive-cat-other { background: rgba(139,92,246,0.15); color: #8B5CF6; }\n' +
'.archive-date { font-size: 11px; color: rgba(255,255,255,0.35); }\n' +
'.btn-archive-action { padding: 7px 14px; font-size: 12px; font-weight: 600; font-family: Raleway, sans-serif; background: #22c55e; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }\n' +
'.btn-archive-action:hover { background: #16a34a; }\n' +
'.btn-archive-action:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
'.archive-empty { padding: 14px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.35); font-style: italic; }\n' +
'.admin-filter-bar { display: none; gap: 10px; padding: 14px 24px; background: #1a1a1a; border-bottom: 1px solid #333; align-items: center; flex-wrap: wrap; position: sticky; top: 64px; z-index: 100; }\n' +
'.admin-filter-bar.visible { display: flex; }\n' +
'.am-scoreboard { display: none; gap: 16px; padding: 22px 24px 16px; background: transparent; border-bottom: none; justify-content: center; align-items: stretch; flex-wrap: wrap; }\n' +
'.am-scoreboard.visible { display: flex; }\n' +
'.am-score-stat { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-width: 140px; padding: 16px 28px; background: #1e2a3a; border: 1px solid #2a3a4a; border-top-width: 3px; border-radius: 12px; }\n' +
'.am-score-stat[data-kind="new-today"] { border-top-color: #00a86b; box-shadow: 0 0 12px rgba(0,168,107,0.15); }\n' +
'.am-score-stat[data-kind="total-pending"] { border-top-color: #1A4EA2; box-shadow: 0 0 12px rgba(26,78,162,0.15); }\n' +
'.am-score-stat[data-kind="followups"] { border-top-color: #E8620A; box-shadow: 0 0 12px rgba(232,98,10,0.15); }\n' +
'.am-score-num { font-size: 28px; font-weight: 700; color: #E8620A; line-height: 1; font-family: Oswald, sans-serif; }\n' +
'.am-score-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-family: Raleway, sans-serif; }\n' +
'.ooo-banner { display: none; background: rgba(204,51,51,0.12); border-bottom: 1px solid #cc3333; color: #ff8e8e; font-family: Raleway, sans-serif; font-size: 13px; font-weight: 600; padding: 12px 24px; text-align: center; }\n' +
'.ooo-banner.visible { display: block; }\n' +
'.admin-filter-bar .filter-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.7px; font-weight: 700; margin-right: 4px; }\n' +
'.custom-dd { position: relative; }\n' +
'.custom-dd-btn { background: #2e2e2e; color: #fff; border: 1px solid #444; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: Raleway, sans-serif; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.15s; min-width: 90px; }\n' +
'.custom-dd-btn:hover { border-color: #666; }\n' +
'.custom-dd.active .custom-dd-btn { border-color: #E8620A; }\n' +
'.custom-dd-chevron { color: #E8620A; font-size: 10px; line-height: 1; margin-left: auto; transition: transform 0.15s; }\n' +
'.custom-dd.open .custom-dd-chevron { transform: rotate(180deg); }\n' +
'.custom-dd-panel { position: absolute; top: calc(100% + 4px); left: 0; min-width: 100%; background: #2e2e2e; border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 1000; display: none; max-height: 320px; overflow-y: auto; padding: 4px 0; }\n' +
'#panel-am, #panel-status { overflow-x: hidden; width: max-content; min-width: 100%; }\n' +
'.custom-dd.open .custom-dd-panel { display: block; }\n' +
'.custom-dd-opt { padding: 10px 16px; color: #fff; font-size: 13px; font-family: Raleway, sans-serif; cursor: pointer; white-space: nowrap; transition: background 0.1s; }\n' +
'.custom-dd-opt:hover { background: #3a3a3a; color: #fff; }\n' +
'.custom-dd-opt.selected { color: #E8620A; }\n' +
'.admin-filter-clear { font-size: 12px; padding: 7px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); border-radius: 6px; cursor: pointer; font-family: Raleway, sans-serif; font-weight: 600; }\n' +
'.admin-filter-clear:hover { border-color: #E8620A; color: #E8620A; }\n' +
'.admin-filter-count { margin-left: auto; font-size: 12px; color: rgba(255,255,255,0.5); font-family: Raleway, sans-serif; }\n' +
'.am-badge { position: absolute; top: 12px; right: 64px; background: rgba(26,78,162,0.18); color: #8AB4F0; border: 1px solid rgba(26,78,162,0.35); padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; font-family: Oswald, sans-serif; letter-spacing: 0.5px; text-transform: uppercase; pointer-events: none; }\n' +
'.inactivity-timeline { margin: 12px 14px 14px; padding: 8px 12px; background: rgba(255,160,0,0.06); border: 1px solid rgba(255,160,0,0.2); border-radius: 8px; font-size: 11px; color: #999; line-height: 1.55; font-family: Raleway, sans-serif; max-width: 100%; box-sizing: border-box; overflow: hidden; word-wrap: break-word; word-break: break-word; overflow-wrap: anywhere; }\n' +
'.inactivity-timeline strong { color: #FFA000; font-weight: 600; }\n' +
'.inact-toolbar { display: flex; align-items: center; gap: 14px; padding: 12px 16px; margin-bottom: 16px; background: #1a1a1a; border: 1px solid #333; border-radius: 10px; flex-wrap: wrap; }\n' +
'.inact-select-all { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #fff; font-family: Raleway, sans-serif; cursor: pointer; user-select: none; }\n' +
'.inact-select-all input { width: 16px; height: 16px; accent-color: #E8620A; cursor: pointer; }\n' +
'.inact-selected-count { font-size: 12px; color: rgba(255,255,255,0.55); font-family: Raleway, sans-serif; }\n' +
'.inact-reassign-btn { margin-left: auto; background: #E8620A; color: #fff; border: none; padding: 9px 18px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }\n' +
'.inact-reassign-btn:hover { background: #cc5200; }\n' +
'.inact-reassign-btn:disabled { opacity: 0.45; cursor: not-allowed; background: #666; }\n' +
'.inact-card-checkbox { width: 20px; height: 20px; accent-color: #E8620A; cursor: pointer; background: #2e2e2e; flex: 0 0 auto; margin-right: 14px; align-self: center; }\n' +
'.bulk-reassign-list { max-height: 220px; overflow-y: auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; margin: 12px 0; }\n' +
'.bulk-reassign-row { font-size: 12px; color: rgba(255,255,255,0.75); padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); font-family: Raleway, sans-serif; }\n' +
'.bulk-reassign-row:last-child { border-bottom: none; }\n' +
'.bulk-reassign-row strong { color: #fff; font-weight: 600; }\n' +
'.bulk-reassign-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 6px; font-family: Raleway, sans-serif; }\n' +
'.bulk-reassign-select { width: 100%; background: #1f1f1f; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 13px; box-sizing: border-box; }\n' +
'.bulk-reassign-note { width: 100%; background: #1f1f1f; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 13px; box-sizing: border-box; resize: vertical; min-height: 72px; }\n' +
'.bulk-reassign-progress { font-size: 12px; color: rgba(255,255,255,0.55); margin: 10px 0 0; font-family: Raleway, sans-serif; min-height: 16px; }\n' +
'.archive-row.viewed { opacity: 0.45; filter: grayscale(0.3); }\n' +
'.btn-archive-mark { padding: 6px 10px; font-size: 11px; font-weight: 600; font-family: Raleway, sans-serif; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; cursor: pointer; margin-right: 6px; }\n' +
'.btn-archive-mark:hover { background: rgba(255,255,255,0.1); color: #fff; }\n' +
'.btn-archive-mark.marked { background: rgba(46,125,50,0.18); color: #6EE7C7; border-color: rgba(46,125,50,0.3); }\n' +
'.archive-toolbar { display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 12px; }\n' +
'.hide-viewed-toggle { font-size: 12px; color: rgba(255,255,255,0.6); font-family: Raleway, sans-serif; display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }\n' +
'.notes-icon-btn { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; z-index: 3; padding: 0; }\n' +
'.notes-icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }\n' +
'.notes-icon-btn.has-unread { background: #E8620A; color: #fff; border-color: #E8620A; box-shadow: 0 2px 6px rgba(232,98,10,0.35); }\n' +
'.notes-icon-badge { position: absolute; top: -4px; right: -4px; background: #fff; color: #E8620A; font-size: 9px; font-weight: 800; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 8px; display: none; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }\n' +
'.notes-icon-btn.has-unread .notes-icon-badge { display: flex; }\n' +
'.note-row { padding: 10px 12px; margin-bottom: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }\n' +
'.note-author { font-size: 12px; font-weight: 700; color: #fff; font-family: Oswald, sans-serif; }\n' +
'.note-time { font-size: 10px; color: rgba(255,255,255,0.4); margin-left: 8px; }\n' +
'.note-message { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 6px; line-height: 1.5; white-space: pre-wrap; }\n' +
'.notes-empty { font-size: 12px; color: rgba(255,255,255,0.4); font-style: italic; text-align: center; padding: 14px; }\n' +
'.notes-input-row { display: flex; gap: 8px; margin-top: 12px; }\n' +
'.notes-input-row textarea { flex: 1; background: #1f1f1f; border: 1px solid #333; color: #fff; padding: 8px 10px; border-radius: 6px; font-family: Raleway, sans-serif; font-size: 13px; resize: vertical; min-height: 60px; }\n' +
'.notes-input-row .btn-submit { background: #E8620A; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-family: Raleway, sans-serif; cursor: pointer; align-self: flex-end; }\n' +
'.notes-input-row .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
'.btn-check { width: 28px; height: 28px; border-radius: 50%; background: #3B82F6; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; padding: 0; box-shadow: 0 2px 6px rgba(59,130,246,0.35); }\n' +
'.btn-check:hover { background: #2563eb; transform: scale(1.08); }\n' +
'.contact-actions .btn-check { height: 28px; width: 28px; }\n' +
'.contact-check-corner { position: absolute; bottom: 10px; right: 10px; z-index: 5; }\n' +
'.contact-check-corner .contact-dd { bottom: calc(100% + 6px); top: auto; right: 0; }\n' +
'.contact-actions { padding-right: 40px; }\n' +
'.reason-pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 18px; }\n' +
'.reason-pill { padding: 8px 14px; font-size: 12px; font-weight: 600; font-family: Raleway, sans-serif; color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; cursor: pointer; transition: all 0.15s; user-select: none; }\n' +
'.reason-pill:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.25); }\n' +
'.reason-pill.active { background: #E8620A; color: #fff; border-color: #E8620A; box-shadow: 0 2px 10px rgba(232,98,10,0.35); }\n' +
'.reason-pill.active-red { background: #c62828; color: #fff; border-color: #c62828; box-shadow: 0 2px 10px rgba(198,40,40,0.35); }\n' +
'.reason-target { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 10px 12px; border-radius: 8px; }\n' +
'.reason-target strong { color: #fff; font-weight: 600; }\n' +
'.reason-warning { font-size: 12px; color: #f3b86b; background: rgba(232,98,10,0.08); border: 1px solid rgba(232,98,10,0.25); padding: 10px 12px; border-radius: 8px; margin-top: 12px; }\n' +
'.confirm-actions .btn-glass-red { background: #c62828; color: #fff; border: 1px solid #c62828; }\n' +
'.confirm-actions .btn-glass-red:hover { background: #b71c1c; }\n' +
'.confirm-actions .btn-glass-red:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
'.confirm-actions .btn-glass-skip-orange { background: #E8620A; color: #fff; border: 1px solid #E8620A; }\n' +
'.confirm-actions .btn-glass-skip-orange:hover { background: #cc5200; }\n' +
'.confirm-actions .btn-glass-skip-orange:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
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
'.card { position: relative; background: #3a3a3a; border-radius: 16px; margin: 0 0 24px 6px; overflow: visible; box-shadow: -4px 0 0 var(--accent-color, transparent), 0 1px 2px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04); border: 1px solid #333333; }\n' +
'.card > .card-top { border-top-left-radius: 16px; border-top-right-radius: 16px; }\n' +
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
'.cat-dd { position: absolute; top: calc(100% + 6px); right: 0; background: #2e2e2e; border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 50; min-width: 140px; overflow: hidden; }\n' +
'.cat-dd-item { padding: 10px 16px; font-size: 13px; font-family: Raleway, sans-serif; color: #ccc; cursor: pointer; transition: all 0.12s; text-transform: none; letter-spacing: 0.5px; }\n' +
'.cat-dd-item:hover { background: #3a3a3a; color: #fff; }\n' +
'.cat-dd-item.cat-dd-sel { color: #E8620A; font-weight: 600; }\n' +
'.card-top-job-title { font-size: 15px; color: rgba(255,255,255,0.7); font-weight: 500; line-height: 1.3; }\n' +
'.links-bar { display: flex; justify-content: space-between; align-items: center; padding: 8px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); background: #1e1e1e; }\n' +
'.links-bar-left, .links-bar-right { display: flex; gap: 12px; align-items: center; }\n' +
'.links-bar-am { font-family: Raleway, sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.88); text-align: center; flex: 1; padding: 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
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
'.contact-card { position: relative; flex: 1; min-width: 200px; max-width: 320px; background: #424242; border: 1px solid #555555; border-radius: 12px; padding: 14px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; }\n' +
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
'.domain-popup { position: absolute; bottom: calc(100% + 8px); left: 0; background: #1e1e1e; border: 1px solid #444; border-radius: 10px; padding: 8px 12px; z-index: 100; box-shadow: 0 6px 24px rgba(0,0,0,0.5); white-space: nowrap; display: flex; align-items: center; gap: 8px; }\n' +
'.domain-popup-text { font-size: 12px; color: #E8620A; font-weight: 600; }\n' +
'.domain-popup-edit { width: 24px; height: 24px; border-radius: 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }\n' +
'.domain-popup-edit:hover { background: rgba(232,98,10,0.15); color: #E8620A; border-color: rgba(232,98,10,0.3); }\n' +
'.domain-popup-edit svg { width: 12px; height: 12px; }\n' +
'.domain-edit-box { position: absolute; bottom: calc(100% + 8px); left: 0; background: #1e1e1e; border: 1px solid #444; border-radius: 10px; padding: 10px 12px; z-index: 100; box-shadow: 0 6px 24px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 6px; }\n' +
'.domain-edit-input { font-family: Raleway, sans-serif; font-size: 12px; padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #fff; outline: none; width: 180px; }\n' +
'.domain-edit-input:focus { border-color: rgba(232,98,10,0.5); }\n' +
'.domain-edit-btn { font-family: Raleway, sans-serif; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 6px; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }\n' +
'.domain-edit-save { background: #444; color: #ccc; }\n' +
'.domain-edit-save:hover { background: #555; color: #fff; }\n' +
'.domain-edit-reload { background: #E8620A; color: white; }\n' +
'.domain-edit-reload:hover { background: #FF7A2F; }\n' +
'.domain-edit-cancel { background: transparent; color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }\n' +
'.domain-edit-cancel:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }\n' +
'.domain-edit-loading { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.5); }\n' +
'.domain-edit-loading .add-spinner { width: 14px; height: 14px; }\n' +
'.btn-custom-msg { position: relative; overflow: visible; }\n' +
'.subj-bar-ai { position: relative; overflow: visible; }\n' +
'.star-burst { position: absolute; z-index: 2; pointer-events: none; opacity: 0; transform: scale(0); transition: none; }\n' +
'.star-burst svg { filter: drop-shadow(0 0 4px #E8620A); }\n' +
'.btn-custom-msg:hover, .subj-bar-ai:hover { text-shadow: 0 0 8px rgba(232,98,10,0.4); }\n' +
'.btn-custom-msg:hover { background: rgba(232,98,10,0.2); color: #ff8533; border-color: rgba(232,98,10,0.5); }\n' +
'.btn-ac-circle { width: 28px; height: 28px; border-radius: 50%; background: #2a2a2a; border: 1px solid #E8620A; color: #E8620A; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; padding: 0; line-height: 1; }\n' +
'.btn-ac-circle:hover { box-shadow: 0 0 12px rgba(232,98,10,0.4); background: rgba(232,98,10,0.15); }\n' +
'.btn-ac-circle.has-suggestions { border-color: #22c55e; color: #22c55e; }\n' +
'.btn-ac-circle.has-suggestions:hover { box-shadow: 0 0 12px rgba(34,197,94,0.4); background: rgba(34,197,94,0.15); }\n' +
'.fc-search-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }\n' +
'.fc-search-grid .add-field { margin-bottom: 0; }\n' +
'.fc-search-grid .add-field:nth-child(5) { grid-column: 1 / -1; }\n' +
'.fc-dd { position: relative; }\n' +
'.fc-dd-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 12px; color: rgba(255,255,255,0.6); font-size: 13px; font-family: Raleway, sans-serif; cursor: pointer; transition: border-color 0.15s; min-height: 38px; text-align: left; gap: 6px; }\n' +
'.fc-dd-btn:hover { border-color: rgba(255,255,255,0.2); }\n' +
'.fc-dd-btn.open { border-color: rgba(232,98,10,0.5); }\n' +
'.fc-dd-btn-text { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n' +
'.fc-dd-chev { width: 12px; height: 12px; flex-shrink: 0; transition: transform 0.2s; }\n' +
'.fc-dd-btn.open .fc-dd-chev { transform: rotate(180deg); }\n' +
'.fc-dd-panel { display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #2e2e2e; border: 1px solid #484848; border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,0.5); z-index: 200; max-height: 220px; overflow-y: auto; padding: 4px; }\n' +
'.fc-dd-panel.open { display: block; }\n' +
'.fc-dd-opt { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; font-family: Raleway, sans-serif; font-weight: 600; color: #fff; cursor: pointer; border-radius: 6px; transition: background 0.12s; }\n' +
'.add-field label.fc-dd-opt { text-transform: none; letter-spacing: 0; display: flex; font-size: 13px; color: #fff; margin-bottom: 0; }\n' +
'.fc-dd-opt:hover { background: #3a3a3a; }\n' +
'.fc-dd-opt input[type="checkbox"] { position: absolute; opacity: 0; width: 0; height: 0; margin: 0; padding: 0; }\n' +
'.fc-dd-opt .fc-cb { display: inline-block; vertical-align: middle; width: 16px; height: 16px; border: 2px solid #666; border-radius: 3px; background: #1a1a1a; flex-shrink: 0; position: relative; transition: all 0.15s; margin-right: 10px; }\n' +
'.fc-dd-opt:hover .fc-cb { border-color: #E8620A; }\n' +
'.fc-dd-opt input[type="checkbox"]:checked + .fc-cb { background: #E8620A; border-color: #E8620A; }\n' +
'.fc-dd-opt input[type="checkbox"]:checked + .fc-cb::after { content: ""; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; border-top: none; border-left: none; transform: rotate(45deg); }\n' +
'.fc-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }\n' +
'.fc-pill { display: inline-flex; align-items: center; gap: 4px; background: rgba(232,98,10,0.15); color: #E8620A; border: 1px solid rgba(232,98,10,0.3); border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 600; font-family: Raleway, sans-serif; }\n' +
'.fc-pill-x { cursor: pointer; font-size: 12px; line-height: 1; opacity: 0.6; }\n' +
'.fc-pill-x:hover { opacity: 1; }\n' +
'.fc-email-error { font-size: 11px; color: #ef6961; margin-top: 3px; display: none; }\n' +
'.fc-search-btn { background: #E8620A; color: white; border: none; padding: 8px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: Raleway, sans-serif; transition: all 0.15s; margin-bottom: 12px; }\n' +
'.fc-search-btn:hover { background: #FF7A2F; }\n' +
'.fc-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
'.fc-results { margin-bottom: 16px; }\n' +
'.fc-empty { text-align: center; padding: 20px; color: rgba(255,255,255,0.3); font-size: 13px; font-style: italic; }\n' +
'.fc-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }\n' +
'.fc-section-header { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; font-family: Oswald, sans-serif; }\n' +
'.fc-manual-toggle { font-size: 12px; color: #E8620A; cursor: pointer; font-weight: 600; margin-bottom: 10px; display: inline-block; }\n' +
'.fc-manual-toggle:hover { color: #FF7A2F; }\n' +
'.fc-manual-form { display: none; margin-bottom: 12px; }\n' +
'.fc-manual-form.open { display: block; }\n' +
'.fc-manual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }\n' +
'.fc-manual-grid .add-field { margin-bottom: 0; }\n' +
'.fc-row-loc { font-size: 10px; color: rgba(255,255,255,0.35); }\n' +
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
/* ===== Analytics Tab Styles ===== */
'.nav-tabs { display: flex; gap: 0; margin-bottom: 0; }\n' +
'.nav-tab { font-family: Oswald, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 8px 24px; cursor: pointer; color: rgba(255,255,255,0.45); background: transparent; border: none; border-bottom: 2px solid transparent; transition: all 0.2s; }\n' +
'.nav-tab:hover { color: rgba(255,255,255,0.7); }\n' +
'.nav-tab.active { color: #E8620A; border-bottom-color: #E8620A; }\n' +
'.analytics-container { max-width: 920px; margin: 0 auto; padding: 28px 16px 60px; display: none; }\n' +
'.analytics-container.visible { display: block; }\n' +
'.date-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 24px; }\n' +
'.date-pill { font-family: Raleway, sans-serif; font-size: 12px; font-weight: 600; padding: 7px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s; }\n' +
'.date-pill:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }\n' +
'.date-pill.active { background: #E8620A; color: white; border-color: #E8620A; }\n' +
'.date-custom-inputs { display: none; align-items: center; gap: 8px; }\n' +
'.date-custom-inputs.visible { display: flex; }\n' +
'.date-custom-inputs input { font-family: Raleway, sans-serif; font-size: 12px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #fff; outline: none; }\n' +
'.date-custom-inputs input:focus { border-color: rgba(232,98,10,0.5); }\n' +
'.stat-cards-row { display: block; margin-bottom: 28px; }\n' +
'.stat-card { background: #2e2e2e; border-radius: 14px; padding: 20px; border: 1px solid #3a3a3a; }\n' +
'.stat-card-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-family: Raleway, sans-serif; }\n' +
'.stat-card-value { font-size: 32px; font-weight: 700; color: #E8620A; font-family: Oswald, sans-serif; line-height: 1; }\n' +
'.funnel-wrap { width: 100%; padding: 6px 0 2px; }\n' +
'.funnel-wrap svg { width: 100%; height: auto; display: block; max-width: 100%; }\n' +
'.funnel-rate { text-align: center; font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 14px; font-family: Raleway, sans-serif; }\n' +
'.funnel-rate strong { color: #E8620A; font-weight: 700; font-family: Oswald, sans-serif; font-size: 15px; letter-spacing: 0.5px; }\n' +
'.leaderboard { background: #2e2e2e; border-radius: 14px; padding: 20px 24px; border: 1px solid #3a3a3a; margin-bottom: 28px; }\n' +
'.leaderboard h3 { font-family: Oswald, sans-serif; font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 16px; letter-spacing: 0.5px; }\n' +
'.lb-row { display: grid; grid-template-columns: 160px 1fr 80px 80px 80px; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s; border-radius: 6px; padding-left: 8px; padding-right: 8px; }\n' +
'.lb-row:hover { background: rgba(255,255,255,0.03); }\n' +
'.lb-row:last-child { border-bottom: none; }\n' +
'.lb-row.highlighted { background: rgba(232,98,10,0.08); border: 1px solid rgba(232,98,10,0.2); }\n' +
'.lb-row.selected { background: rgba(232,98,10,0.12); }\n' +
'.lb-name { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
'.lb-bar-wrap { height: 22px; background: rgba(255,255,255,0.04); border-radius: 6px; overflow: hidden; }\n' +
'.lb-bar { height: 100%; background: linear-gradient(90deg, #E8620A, #FF7A2F); border-radius: 6px; transition: width 0.6s ease; min-width: 2px; }\n' +
'.lb-stat { font-size: 12px; color: rgba(255,255,255,0.5); text-align: center; font-weight: 600; font-family: Raleway, sans-serif; }\n' +
'.lb-stat-val { color: #E8620A; }\n' +
'.lb-header { display: grid; grid-template-columns: 160px 1fr 80px 80px 80px; gap: 12px; padding: 0 8px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }\n' +
'.lb-header span { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; font-family: Raleway, sans-serif; }\n' +
'.lb-header span:nth-child(n+3) { text-align: center; }\n' +
'.am-detail { background: #2e2e2e; border-radius: 14px; padding: 20px 24px; border: 1px solid #3a3a3a; margin-bottom: 28px; }\n' +
'.am-detail h3 { font-family: Oswald, sans-serif; font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 16px; letter-spacing: 0.5px; }\n' +
'.am-progress-wrap { margin-bottom: 20px; }\n' +
'.am-progress-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 6px; font-weight: 600; }\n' +
'.am-progress-bar { height: 18px; background: rgba(255,255,255,0.06); border-radius: 9px; overflow: hidden; position: relative; }\n' +
'.am-progress-fill { height: 100%; background: linear-gradient(90deg, #E8620A, #FF7A2F); border-radius: 9px; transition: width 0.6s ease; }\n' +
'.am-progress-text { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 700; color: white; }\n' +
'.am-pills-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }\n' +
'.am-pill-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 120px; }\n' +
'.am-pill-stat-val { font-size: 24px; font-weight: 700; color: #E8620A; font-family: Oswald, sans-serif; }\n' +
'.am-pill-stat-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; font-weight: 600; }\n' +
'.am-chart-section { margin-bottom: 20px; }\n' +
'.am-chart-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 10px; font-family: Raleway, sans-serif; text-transform: uppercase; letter-spacing: 0.3px; }\n' +
'.am-hbar { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }\n' +
'.am-hbar-label { font-size: 11px; color: rgba(255,255,255,0.5); width: 120px; text-align: right; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
'.am-hbar-track { flex: 1; height: 16px; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden; }\n' +
'.am-hbar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 2px; }\n' +
'.am-hbar-val { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); width: 30px; }\n' +
'.am-funnel { display: flex; gap: 8px; align-items: flex-end; justify-content: center; margin-top: 10px; }\n' +
'.am-funnel-step { text-align: center; flex: 1; max-width: 120px; }\n' +
'.am-funnel-bar { background: rgba(232,98,10,0.3); border-radius: 6px 6px 0 0; margin: 0 auto; width: 60px; transition: height 0.6s ease; }\n' +
'.am-funnel-val { font-size: 16px; font-weight: 700; color: #E8620A; font-family: Oswald, sans-serif; margin-top: 4px; }\n' +
'.am-funnel-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 2px; }\n' +
'.am-weekly-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; margin-top: 10px; padding-bottom: 20px; position: relative; }\n' +
'.am-weekly-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }\n' +
'.am-weekly-bar { width: 100%; max-width: 40px; background: linear-gradient(180deg, #E8620A, #FF7A2F); border-radius: 4px 4px 0 0; transition: height 0.6s ease; min-height: 2px; }\n' +
'.am-weekly-label { font-size: 8px; color: rgba(255,255,255,0.3); margin-top: 4px; transform: rotate(-45deg); white-space: nowrap; }\n' +
'@media (max-width: 768px) { .stat-cards-row { grid-template-columns: repeat(2, 1fr); } .lb-row { grid-template-columns: 100px 1fr 60px; } .lb-header { grid-template-columns: 100px 1fr 60px; } .lb-row > :nth-child(4), .lb-row > :nth-child(5), .lb-header > :nth-child(4), .lb-header > :nth-child(5) { display: none; } }\n' +
'@media (max-width: 768px) {\n' +
'  body { font-size: 13px; }\n' +
'  .header { flex-direction: column; height: auto; padding: 12px 16px; gap: 10px; position: sticky; top: 0; }\n' +
'  .header-logo { height: 28px; }\n' +
'  .header-center { position: static; transform: none; order: 2; }\n' +
'  .header-center .nav-tabs { flex-wrap: wrap; justify-content: center; gap: 4px; }\n' +
'  .header > div:last-child { order: 3; width: 100%; justify-content: space-between; flex-wrap: wrap; gap: 10px; }\n' +
'  .header-meta { font-size: 11px; }\n' +
'  .outlook-toggle { font-size: 11px; }\n' +
'  .lead-card, .card { max-width: 100% !important; width: 100%; padding: 14px; margin: 0 0 14px 0; }\n' +
'  .contacts-row, .contacts-wrap, #contacts-container { flex-direction: column; }\n' +
'  .contact-card { max-width: 100%; min-width: 0; width: 100%; }\n' +
'  .composer, .email-composer, .li-composer { width: 100%; max-width: 100%; }\n' +
'  .composer-head, .subject-row { flex-wrap: wrap; gap: 6px; }\n' +
'  .composer input, .composer textarea, .subject-row input { width: 100%; min-width: 0; box-sizing: border-box; }\n' +
'  .lead-footer, .card-footer, .footer-actions { flex-wrap: wrap; gap: 8px; }\n' +
'  .lead-footer .btn-glass, .card-footer .btn-glass, .footer-actions .btn-glass { flex: 1 1 calc(50% - 4px); min-width: 0; padding: 10px 12px; font-size: 12px; }\n' +
'  .modal-overlay .modal { width: calc(100% - 20px); max-width: calc(100% - 20px); max-height: calc(100vh - 40px); margin: 20px 10px; overflow-y: auto; }\n' +
'  .modal-body { padding: 14px 16px; }\n' +
'  .modal-header { padding: 14px 16px 10px; }\n' +
'  .stat-cards-row, .stats-row { grid-template-columns: 1fr !important; gap: 10px; }\n' +
'  .leaderboard, .lb-wrap, .analytics-row { overflow-x: auto; -webkit-overflow-scrolling: touch; }\n' +
'  .fc-filters, .filters, .fc-row { flex-direction: column; gap: 8px; }\n' +
'  .fc-field, .fc-filters input, .fc-filters select { width: 100%; box-sizing: border-box; }\n' +
'  .archive-pills { flex-wrap: wrap; }\n' +
'  .archive-row { flex-wrap: wrap; }\n' +
'  .archive-row .btn-archive-action { width: 100%; }\n' +
'  .reason-pill-row { justify-content: center; }\n' +
'  .greeting { font-size: 18px; }\n' +
'  .queue-head h2, .queue-sub { font-size: 14px; }\n' +
'  .contact-check-corner { bottom: 8px; right: 8px; }\n' +
'  .contact-actions { padding-right: 44px; }\n' +
'}\n' +
'@media (max-width: 480px) {\n' +
'  body { font-size: 12px; }\n' +
'  .header { padding: 10px 12px; }\n' +
'  .lead-card, .card { padding: 12px; border-radius: 10px; }\n' +
'  .lead-footer .btn-glass, .card-footer .btn-glass, .footer-actions .btn-glass { flex: 1 1 100%; }\n' +
'  .nav-tab { font-size: 11px; padding: 6px 10px; }\n' +
'  .stat-cards-row { gap: 8px; }\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n';
// Split the giant template into multiple += chunks so Vercel's build
// pipeline (Babel/Terser) doesn't stack-overflow on a single ~3800-op
// binary-expression AST.
html += '' +
'\n' +
'<div class="header">\n' +
'  <img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" class="header-logo" alt="iMPact">\n' +
'  <div class="header-center"><div class="nav-tabs"><button class="nav-tab active" id="tab-leads" onclick="switchTab(&apos;leads&apos;)">Leads</button><button class="nav-tab" id="tab-analytics" onclick="switchTab(&apos;analytics&apos;)">Analytics</button><button class="nav-tab" id="tab-inactivity" style="display:none;" onclick="switchTab(&apos;inactivity&apos;)">Inactivity Queue</button></div></div>\n' +
'  <div style="display:flex;align-items:center;gap:14px;">\n' +
'    <div class="header-btn-group" id="header-btn-group">\n' +
'      <div class="header-btn-icons" id="header-btn-icons" style="display:inline-flex;align-items:center;gap:8px;">\n' +
'        <button class="btn-add-lead has-tooltip" data-tooltip="Add Job Description" onclick="openAddModal()">+</button>\n' +
'        <button class="btn-archive has-tooltip" data-tooltip="Re-activate skipped &amp; blocked jobs" onclick="openArchiveModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg><span class="btn-archive-badge" id="archive-badge" style="display:none;">0</span></button>\n' +
'        <button class="btn-cal has-tooltip" id="btn-cal" data-tooltip="Schedule days to skip leads" onclick="openCalendarModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>\n' +
'        <button class="btn-help has-tooltip" id="btn-help" data-tooltip="Help &amp; Getting Started" onclick="openHelpModal()">?</button>\n' +
'        <button class="btn-search-icon has-tooltip" id="btn-search" data-tooltip="Search Leads" onclick="openHeaderSearch()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>\n' +
'      </div>\n' +
'      <div class="header-search-row" id="header-search-row">\n' +
'        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>\n' +
'        <input type="text" class="header-search-input" id="header-search-input" placeholder="Search company, job, or contact..." oninput="onSearchInput(this.value)" onkeydown="if(event.key===&apos;Escape&apos;)closeHeaderSearch()">\n' +
'        <button class="header-search-close" onclick="closeHeaderSearch()" aria-label="Close search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>\n' +
'      </div>\n' +
'    </div>\n' +
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
'<div class="modal-overlay" id="skip-overlay" onclick="if(event.target===this)closeSkipModal()">\n' +
'  <div class="modal" style="max-width:460px;">\n' +
'    <div class="modal-header"><h3>Skip this lead?</h3><button class="modal-close" onclick="closeSkipModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div class="reason-target" id="skip-target"></div>\n' +
'      <div class="reason-pill-row" id="skip-pills">\n' +
'        <button class="reason-pill" data-reason="active_client" onclick="selectSkipReason(this)">Active Client</button>\n' +
'        <button class="reason-pill" data-reason="already_contacted" onclick="selectSkipReason(this)">Already Contacted</button>\n' +
'        <button class="reason-pill" data-reason="duplicate" onclick="selectSkipReason(this)">Duplicate</button>\n' +
'        <button class="reason-pill" data-reason="other" onclick="selectSkipReason(this)">Other</button>\n' +
'      </div>\n' +
'      <div class="confirm-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">\n' +
'        <button class="btn-glass" onclick="closeSkipModal()">Cancel</button>\n' +
'        <button class="btn-glass btn-glass-skip-orange" id="skip-confirm-btn" disabled onclick="confirmSkipModal()">Skip Lead</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="block-overlay" onclick="if(event.target===this)closeBlockModal()">\n' +
'  <div class="modal" style="max-width:480px;">\n' +
'    <div class="modal-header"><h3>Block this company?</h3><button class="modal-close" onclick="closeBlockModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div class="reason-warning" id="block-warning"></div>\n' +
'      <div class="reason-pill-row" id="block-pills">\n' +
'        <button class="reason-pill" data-reason="not_a_fit" onclick="selectBlockReason(this)">Not a Fit</button>\n' +
'        <button class="reason-pill" data-reason="competitor_staffing" onclick="selectBlockReason(this)">Competitor/Staffing</button>\n' +
'        <button class="reason-pill" data-reason="bad_experience" onclick="selectBlockReason(this)">Bad Experience</button>\n' +
'        <button class="reason-pill" data-reason="out_of_territory" onclick="selectBlockReason(this)">Out of Territory</button>\n' +
'        <button class="reason-pill" data-reason="other" onclick="selectBlockReason(this)">Other</button>\n' +
'      </div>\n' +
'      <div class="confirm-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">\n' +
'        <button class="btn-glass" onclick="closeBlockModal()">Cancel</button>\n' +
'        <button class="btn-glass btn-glass-red" id="block-confirm-btn" disabled onclick="confirmBlockModal()">Block Company</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="archive-overlay" onclick="if(event.target===this)closeArchiveModal()">\n' +
'  <div class="modal">\n' +
'    <div class="modal-header">\n' +
'      <h3>Skipped &amp; Blocked</h3>\n' +
'      <button class="modal-close" onclick="closeArchiveModal()">&#x2715;</button>\n' +
'    </div>\n' +
'    <div class="modal-body">\n' +
'      <div class="archive-pills">\n' +
'        <button class="archive-pill active" id="arch-pill-1" onclick="loadArchive(1)">Last 24 Hours</button>\n' +
'        <button class="archive-pill" id="arch-pill-3" onclick="loadArchive(3)">Last 3 Days</button>\n' +
'        <button class="archive-pill" id="arch-pill-7" onclick="loadArchive(7)">Last 7 Days</button>\n' +
'      </div>\n' +
'      <div id="archive-body"><div class="archive-empty">Loading...</div></div>\n' +
'    </div>\n' +
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
'<div class="ooo-banner" id="ooo-banner">You are currently marked as Out of Office. New leads will not be assigned to you today.</div>\n' +
'<div class="am-scoreboard" id="am-scoreboard">\n' +
'  <div class="am-score-stat" data-kind="new-today"><div class="am-score-num" id="score-new-today">0</div><div class="am-score-label">New Today</div></div>\n' +
'  <div class="am-score-stat" data-kind="total-pending"><div class="am-score-num" id="score-total-pending">0</div><div class="am-score-label">Total Pending</div></div>\n' +
'  <div class="am-score-stat" data-kind="followups"><div class="am-score-num" id="score-followups">0</div><div class="am-score-label">Follow-ups Due</div></div>\n' +
'</div>\n' +
'\n' +
'<div class="admin-filter-bar" id="admin-filter-bar">\n' +
'  <span class="filter-label">AM</span>\n' +
'  <div class="custom-dd" id="dd-am"><button class="custom-dd-btn" onclick="toggleFilterDD(&apos;am&apos;,event)"><span class="custom-dd-label" id="lbl-am">All</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="panel-am"></div></div>\n' +
'  <span class="filter-label">Category</span>\n' +
'  <div class="custom-dd" id="dd-category"><button class="custom-dd-btn" onclick="toggleFilterDD(&apos;category&apos;,event)"><span class="custom-dd-label" id="lbl-category">All</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="panel-category"></div></div>\n' +
'  <span class="filter-label">Location</span>\n' +
'  <div class="custom-dd" id="dd-location"><button class="custom-dd-btn" onclick="toggleFilterDD(&apos;location&apos;,event)"><span class="custom-dd-label" id="lbl-location">All</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="panel-location"></div></div>\n' +
'  <span class="filter-label">Status</span>\n' +
'  <div class="custom-dd" id="dd-status"><button class="custom-dd-btn" onclick="toggleFilterDD(&apos;status&apos;,event)"><span class="custom-dd-label" id="lbl-status">All</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="panel-status"></div></div>\n' +
'  <button class="admin-filter-clear" onclick="clearAdminFilters()">Clear</button>\n' +
'  <span class="admin-filter-count" id="admin-filter-count">0 leads</span>\n' +
'</div>\n' +
'\n' +
'<div class="container" id="leads-view">\n' +
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
'<div class="container" id="inactivity-view" style="display:none;">\n' +
'  <div class="queue-bar">\n' +
'    <div>\n' +
'      <h2>Inactivity Queue</h2>\n' +
'      <div class="sub" id="inactivity-sub">Loading...</div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div id="inactivity-container"><div class="loading">Loading inactivity queue...</div></div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="help-overlay" onclick="if(event.target===this)closeHelpModal()">\n' +
'  <div class="modal help-modal">\n' +
'    <div class="modal-header" style="border-bottom:none;padding-bottom:0;"><h3>&nbsp;</h3><button class="modal-close" onclick="closeHelpModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body" style="padding:0;">\n' +
'      <div class="help-hero">\n' +
'        <h2>Welcome to your lead dashboard</h2>\n' +
'        <p>A quick reference for working leads efficiently.</p>\n' +
'        <button class="help-tour-btn" onclick="closeHelpModal();startGuidedTour();">Take the Guided Tour</button>\n' +
'      </div>\n' +
'      <div class="cheat-grid" id="cheat-grid"></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="tour-overlay" id="tour-overlay">\n' +
'  <div class="tour-spotlight" id="tour-spotlight"></div>\n' +
'  <div class="tour-card" id="tour-card">\n' +
'    <div class="tour-card-step" id="tour-card-step"></div>\n' +
'    <h4 id="tour-card-heading"></h4>\n' +
'    <p id="tour-card-body"></p>\n' +
'    <div class="tour-actions">\n' +
'      <button class="tour-skip" onclick="endGuidedTour(true)">Skip</button>\n' +
'      <button class="tour-prev" id="tour-prev-btn" onclick="tourPrev()">Previous</button>\n' +
'      <button class="tour-next" id="tour-next-btn" onclick="tourNext()">Next</button>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="cal-overlay" onclick="if(event.target===this)closeCalendarModal()">\n' +
'  <div class="modal" style="max-width:420px;">\n' +
'    <div class="modal-header"><h3>Out of Office Dates</h3><button class="modal-close" onclick="closeCalendarModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div class="cal-nav"><button onclick="calPrevMonth()">&larr;</button><div class="cal-nav-title" id="cal-nav-title"></div><button onclick="calNextMonth()">&rarr;</button></div>\n' +
'      <div class="cal-grid" id="cal-grid"></div>\n' +
'      <div class="cal-footer"><span class="hint" id="cal-hint">Click a day, then click another for a range. Click the same day twice for one-day.</span><button class="cal-add-btn" id="cal-add-btn" disabled onclick="addAwayDate()">Add Date</button></div>\n' +
'      <div class="cal-list"><div class="cal-list-title">Your Away Dates</div><div id="cal-list-body"></div></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="admin-ooo-overlay" onclick="if(event.target===this)closeAdminOOOModal()">\n' +
'  <div class="modal" style="max-width:520px;">\n' +
'    <div class="modal-header"><h3>Upcoming Out of Office</h3><button class="modal-close" onclick="closeAdminOOOModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div id="admin-ooo-body"><div class="cal-empty">Loading...</div></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="bulk-reassign-overlay" onclick="if(event.target===this)closeBulkReassignModal()">\n' +
'  <div class="modal" style="max-width:520px;">\n' +
'    <div class="modal-header"><h3 id="bulk-reassign-title">Reassign leads</h3><button class="modal-close" onclick="closeBulkReassignModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div class="bulk-reassign-label">Selected leads</div>\n' +
'      <div class="bulk-reassign-list" id="bulk-reassign-list"></div>\n' +
'      <div class="bulk-reassign-label">Reassign to</div>\n' +
'      <select class="bulk-reassign-select" id="bulk-reassign-am"><option value="">Select an AM...</option></select>\n' +
'      <div class="bulk-reassign-label">Add a note for the AMs (optional)</div>\n' +
'      <textarea class="bulk-reassign-note" id="bulk-reassign-note" placeholder="e.g. These were all sitting with Matt. Please action this week."></textarea>\n' +
'      <div class="bulk-reassign-progress" id="bulk-reassign-progress"></div>\n' +
'      <div class="confirm-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">\n' +
'        <button class="btn-glass" onclick="closeBulkReassignModal()">Cancel</button>\n' +
'        <button class="btn-glass btn-glass-skip-orange" id="bulk-reassign-confirm" onclick="submitBulkReassign()">Reassign All</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="modal-overlay" id="notes-overlay" onclick="if(event.target===this)closeNotesModal()">\n' +
'  <div class="modal" style="max-width:520px;">\n' +
'    <div class="modal-header"><h3 id="notes-modal-title">Notes</h3><button class="modal-close" onclick="closeNotesModal()">&#x2715;</button></div>\n' +
'    <div class="modal-body">\n' +
'      <div id="notes-list"><div class="notes-empty">Loading notes...</div></div>\n' +
'      <div class="notes-input-row">\n' +
'        <textarea id="notes-input" placeholder="Add a note..."></textarea>\n' +
'        <button class="btn-submit" id="notes-submit-btn" onclick="submitNote()">Add Note</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="analytics-container" id="analytics-view">\n' +
'  <div class="date-filter-bar">\n' +
'    <button class="date-pill active" data-range="30" onclick="setDateRange(30,this)">Last 30 Days</button>\n' +
'    <button class="date-pill" data-range="60" onclick="setDateRange(60,this)">Last 60 Days</button>\n' +
'    <button class="date-pill" data-range="90" onclick="setDateRange(90,this)">Last 90 Days</button>\n' +
'    <button class="date-pill" data-range="all" onclick="setDateRange(&apos;all&apos;,this)">All Time</button>\n' +
'    <button class="date-pill" data-range="custom" onclick="setDateRange(&apos;custom&apos;,this)">Custom Range</button>\n' +
'    <div class="date-custom-inputs" id="custom-date-inputs">\n' +
'      <input type="date" id="custom-from" onchange="applyCustomDateRange()">\n' +
'      <span style="color:rgba(255,255,255,0.3);">to</span>\n' +
'      <input type="date" id="custom-to" onchange="applyCustomDateRange()">\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="stat-cards-row" id="analytics-summary"></div>\n' +
'  <div class="leaderboard" id="analytics-leaderboard"></div>\n' +
'  <div class="am-detail" id="analytics-am-detail"></div>\n' +
'</div>\n' +
'\n' +
'<script>\n';
html += '' +
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
'var _params=new URLSearchParams(window.location.search);\n' +
'var AM = { name: "Mark Sapoznikov", email: "msapoznikov@impactbusinessgroup.com", role: "admin" };\n' +
'var AUTH_READY = false;\n' +
'async function resolveAuth(){\n' +
'  var tk=(_params.get("token")||"").trim();\n' +
'  if(tk){\n' +
'    try{\n' +
'      var r=await fetch("/api/leads?action=validate_token&token="+encodeURIComponent(tk));\n' +
'      var d=await r.json();\n' +
'      if(d && d.ok && d.email){ AM={ name:d.name||"", email:d.email, role:d.role||"am" }; AUTH_READY=true; return true; }\n' +
'    }catch(e){ console.error("Token validation error:",e); }\n' +
'    return false;\n' +
'  }\n' +
'  if(_params.get("am")==="cwillbrandt"){ AM={ name:"Curt Willbrandt", email:"cwillbrandt@impactbusinessgroup.com", role:"am" }; AUTH_READY=true; return true; }\n' +
'  if(_params.get("am")==="msapoznikov"){ AM={ name:"Mark Sapoznikov", email:"msapoznikov@impactbusinessgroup.com", role:"admin" }; AUTH_READY=true; return true; }\n' +
'  return false;\n' +
'}\n' +
'function renderAccessDenied(){\n' +
'  document.body.innerHTML = \'<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1419;font-family:Raleway,Arial,sans-serif;padding:24px;"><div style="max-width:420px;text-align:center;"><img src="https://impactbusinessgroup.com/wp-content/uploads/2022/05/White_ClearBG-183x79.png" style="width:180px;margin:0 auto 28px;display:block;" alt="iMPact"><h1 style="color:#fff;font-family:Oswald,sans-serif;font-size:28px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Access Denied</h1><p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0;">Please contact your administrator for access.</p></div></div>\';\n' +
'}\n' +
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
'function isCompanyBlocked(c) { var q=(c||"").toLowerCase(); return blocklist.companies.some(function(b){var n=(typeof b==="string"?b:((b&&b.company)||""));return n.toLowerCase()===q;}); }\n' +
'function formatPostDate(lead) { var d=lead.createdAt?new Date(lead.createdAt):new Date(); return {month:d.toLocaleString("en-US",{month:"short"}).toUpperCase(),day:d.getDate(),year:d.getFullYear()}; }\n' +
'function categoryPill(cat, safeId) {\n' +
'  var cls="pill-eng",lbl="Engineering";\n' +
'  if(cat==="accounting"){cls="pill-acc";lbl="Accounting";}\n' +
'  else if(cat==="it"){cls="pill-it";lbl="IT";}\n' +
'  else if(cat==="other"){cls="pill-other";lbl="Other";}\n' +
'  return \'<div class="cat-pill-wrap" style="position:relative;display:inline-block;" id="cat-wrap-\'+safeId+\'"><span class="pill \'+cls+\'" style="cursor:pointer;" onclick="toggleCatDD(\\\'\'+safeId+\'\\\')">\'+lbl+\'</span></div>\';\n' +
'}\n' +
'function toggleCatDD(safeId){\n' +
'  var wrap=_g("cat-wrap-"+safeId); if(!wrap) return;\n' +
'  var existing=wrap.querySelector(".cat-dd"); if(existing){existing.remove();return;}\n' +
'  // Close any other open cat dropdowns\n' +
'  document.querySelectorAll(".cat-dd").forEach(function(d){d.remove();});\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  var curCat=lead?lead.category:"engineering";\n' +
'  var opts=[["engineering","Engineering"],["it","IT"],["accounting","Accounting"],["other","Other"]];\n' +
'  var dd=document.createElement("div"); dd.className="cat-dd";\n' +
'  var h="";\n' +
'  for(var i=0;i<opts.length;i++){\n' +
'    var sel=opts[i][0]===curCat?" cat-dd-sel":"";\n' +
'    h+=\'<div class="cat-dd-item\'+sel+\'" onclick="selectCat(\\\'\'+safeId+\'\\\',\\\'\'+opts[i][0]+\'\\\')\">\'+opts[i][1]+\'</div>\';\n' +
'  }\n' +
'  dd.innerHTML=h; wrap.appendChild(dd);\n' +
'}\n' +
'async function selectCat(safeId,newCat){\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead) return;\n' +
'  var dd=document.querySelector("#cat-wrap-"+safeId+" .cat-dd"); if(dd) dd.remove();\n' +
'  if(lead.category===newCat) return;\n' +
'  lead.category=newCat;\n' +
'  // Update pill display\n' +
'  var wrap=_g("cat-wrap-"+safeId); if(wrap){\n' +
'    var cls="pill-eng",lbl="Engineering";\n' +
'    if(newCat==="accounting"){cls="pill-acc";lbl="Accounting";}\n' +
'    else if(newCat==="it"){cls="pill-it";lbl="IT";}\n' +
'    else if(newCat==="other"){cls="pill-other";lbl="Other";}\n' +
'    var pill=wrap.querySelector(".pill"); if(pill){pill.className="pill "+cls;pill.textContent=lbl;}\n' +
'  }\n' +
'  try{\n' +
'    var r=await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:lead.id,action:"update_category",category:newCat})});\n' +
'    var d=await r.json();\n' +
'    if(d.ok) showToast("Category updated",1500);\n' +
'  }catch(e){}\n' +
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
'  var ok=await resolveAuth();\n' +
'  if(!ok){ renderAccessDenied(); return; }\n' +
'  if(AM.role==="admin"){\n' +
'    _g("admin-filter-bar").classList.add("visible");\n' +
'    _g("tab-inactivity").style.display="inline-block";\n' +
'    populateAmFilterOptions();\n' +
'    readAdminFiltersFromUrl();\n' +
'    loadAdminViewedSet();\n' +
'    loadAwayDatesForAdmin();\n' +
'  } else {\n' +
'    _g("am-scoreboard").classList.add("visible");\n' +
'    loadAwayDatesForSelf();\n' +
'  }\n' +
'  var today=new Date();\n' +
'  _g("header-date").textContent=today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});\n' +
'  var hr=today.getHours(); var greet=hr<12?"Good morning":hr<18?"Good afternoon":"Good evening";\n' +
'  _g("greeting-text").textContent=greet+", "+(AM.name?AM.name.split(" ")[0]:"");\n' +
'  _g("queue-sub").innerHTML="<span style=\\"color:#666\\">Loading leads...</span>";\n' +
'  try{\n' +
'    // Always showAll=1 so search can reach past-30-day archived leads\n' +
'    // regardless of role. Normal display still only shows pipeline leads.\n' +
'    var results=await Promise.all([fetch("/api/leads?showAll=1").then(function(r){return r.json();}),fetch("/api/blocklist").then(function(r){return r.json();})]);\n' +
'    var allLeads=results[0].leads||[];\n' +
'    allLeadsCache=allLeads;\n' +
'    if(AM.role==="admin"){\n' +
'      leads = allLeads;\n' +
'    } else {\n' +
'      // AM pipeline view: only their leads, in working statuses, with contacts\n' +
'      leads = allLeads.filter(function(l){\n' +
'        if((l.assignedAMEmail||"").toLowerCase() !== AM.email.toLowerCase()) return false;\n' +
'        var st = l.status||"";\n' +
'        if(st !== "new" && st !== "pending" && st !== "in_progress") return false;\n' +
'        return Array.isArray(l.contacts) && l.contacts.length > 0;\n' +
'      });\n' +
'    }\n' +
'    blocklist={companies:results[1].companies||[],titles:results[1].titles||[]};\n' +
'    updateLeadCount();\n' +
'    renderLeads();\n' +
'    leads.forEach(function(lead){var sid=getSafeId(lead.id);fetchLogo(lead.company,lead.company_domain||lead.company_website||lead.employerWebsite||"",lead.location||"",sid,lead.company_logo_apollo||lead.company_logo||"");});\n' +
'    var scrollTarget=localStorage.getItem("scrollToCard");\n' +
'    if(scrollTarget){ localStorage.removeItem("scrollToCard"); setTimeout(function(){ var el=document.getElementById(scrollTarget); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); },300); }\n' +
'    refreshArchiveBadge();\n' +
'    restoreActiveTabFromSession();\n' +
'    maybeAutoLaunchTour();\n' +
'  }catch(e){console.error("Init error:",e);_g("leads-container").innerHTML=\'<div class="loading">Error loading leads.</div>\';}\n' +
'}\n' +
'\n' +
'function renderLeads() {\n' +
'  updateAmScoreboard();\n' +
'  var container=_g("leads-container");\n' +
'  var q = (_headerSearchQuery||"").trim();\n' +
'  var view;\n' +
'  if(q){\n' +
'    view = _applySearchFilter(q);\n' +
'    if(AM.role==="admin"){ var cEl=_g("admin-filter-count"); if(cEl) cEl.textContent = view.length + " lead" + (view.length===1?"":"s"); }\n' +
'    if(!view.length){\n' +
'      container.innerHTML = \'<div class="search-empty"><div class="search-empty-title">No leads found matching "\'+escHtml(q)+\'"</div><div>Try a different search term.</div><a class="search-empty-clear" onclick="_clearHeaderSearchFromLink()">Clear search</a></div>\';\n' +
'      return;\n' +
'    }\n' +
'  } else {\n' +
'    view=(AM.role==="admin")?applyFilterToLeads(leads):leads;\n' +
'    if(AM.role==="admin"){ var cEl=_g("admin-filter-count"); if(cEl) cEl.textContent = view.length + " lead" + (view.length===1?"":"s"); }\n' +
'    if(!view.length){container.innerHTML=\'<div class="empty"><h3>No pending leads</h3><p style="color:rgba(255,255,255,0.35);font-size:13px;">Check back after the morning fetch runs.</p></div>\';return;}\n' +
'  }\n' +
'  container.innerHTML=view.map(function(lead){return renderCard(lead);}).join("");\n' +
'  postRenderLeads(view);\n' +
'}\n' +
'\n' +
'/* ===== Header search ===== */\n' +
'var _headerSearchQuery = "";\n' +
'function openHeaderSearch() {\n' +
'  if (currentTab !== "leads") { switchTab("leads"); }\n' +
'  var grp=_g("header-btn-group"); if(!grp) return;\n' +
'  grp.classList.add("searching");\n' +
'  var input=_g("header-search-input"); if(input){ input.value = _headerSearchQuery || ""; setTimeout(function(){ input.focus(); }, 50); }\n' +
'}\n' +
'function closeHeaderSearch() {\n' +
'  var grp=_g("header-btn-group"); if(grp) grp.classList.remove("searching");\n' +
'  var input=_g("header-search-input"); if(input) input.value = "";\n' +
'  _headerSearchQuery = "";\n' +
'  renderLeads();\n' +
'}\n' +
'function _clearHeaderSearchFromLink() { closeHeaderSearch(); }\n' +
'function onSearchInput(val) {\n' +
'  _headerSearchQuery = String(val || "");\n' +
'  renderLeads();\n' +
'}\n' +
'function _applySearchFilter(q) {\n' +
'  var query = q.toLowerCase();\n' +
'  // Search scope: past 30 days of activity. Admin sees all AMs + current\n' +
'  // admin filters. AM sees only their own leads.\n' +
'  var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;\n' +
'  function leadActivityMs(l) {\n' +
'    var ts = 0;\n' +
'    var ca = (typeof l.createdAt === "number") ? l.createdAt : (l.createdAt ? Date.parse(l.createdAt) : 0);\n' +
'    if (ca && ca > ts) ts = ca;\n' +
'    ["assignedAt","skippedAt","retrievedAt","unblockedAt","completedAt","closedAt","last_reminder_date"].forEach(function(k){\n' +
'      var v = l[k]; if(!v) return; var p = Date.parse(v); if(!isNaN(p) && p > ts) ts = p;\n' +
'    });\n' +
'    if (l.outreach_log && typeof l.outreach_log === "object") {\n' +
'      Object.keys(l.outreach_log).forEach(function(aid){\n' +
'        (l.outreach_log[aid]||[]).forEach(function(e){ var p = e && e.date ? Date.parse(e.date) : 0; if(!isNaN(p) && p > ts) ts = p; });\n' +
'      });\n' +
'    }\n' +
'    if (Array.isArray(l.assignment_history)) {\n' +
'      l.assignment_history.forEach(function(h){ var p = h && h.assigned_at ? Date.parse(h.assigned_at) : 0; if(!isNaN(p) && p > ts) ts = p; });\n' +
'    }\n' +
'    return ts;\n' +
'  }\n' +
'  var pool = (AM.role === "admin")\n' +
'    ? applyFilterToLeads(allLeadsCache || [])\n' +
'    : (allLeadsCache || []).filter(function(l){ return (l.assignedAMEmail||"").toLowerCase() === AM.email.toLowerCase(); });\n' +
'  return pool.filter(function(l){\n' +
'    if (leadActivityMs(l) < cutoff) return false;\n' +
'    var hay = [];\n' +
'    hay.push((l.company||"").toLowerCase());\n' +
'    hay.push((l.jobTitle||"").toLowerCase());\n' +
'    (l.contacts||[]).forEach(function(c){\n' +
'      var fn = (c.first_name||"").toLowerCase();\n' +
'      var ln = (c.last_name||"").toLowerCase();\n' +
'      var full = ((c.full_name||c.name||"")).toLowerCase();\n' +
'      if(fn) hay.push(fn); if(ln) hay.push(ln); if(full) hay.push(full);\n' +
'    });\n' +
'    return hay.some(function(s){ return s.indexOf(query) !== -1; });\n' +
'  });\n' +
'}\n' +
'\n' +
'/* ===== Out of Office calendar ===== */\n' +
'var _awayDates = [];\n' +
'var _calViewYear, _calViewMonth;\n' +
'var _calSelStart = null, _calSelEnd = null;\n' +
'function _fmtYMD(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }\n' +
'function _parseYMD(s){ if(!s) return null; var parts=String(s).slice(0,10).split("-"); if(parts.length<3) return null; return new Date(Number(parts[0]),Number(parts[1])-1,Number(parts[2])); }\n' +
'function _todayYMD(){ return _fmtYMD(new Date()); }\n' +
'function _fmtFriendly(ymd){ var d=_parseYMD(ymd); if(!d) return ymd; return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }\n' +
'function _isTodayInRange(ranges){\n' +
'  var t=_todayYMD();\n' +
'  return (ranges||[]).some(function(r){ return r && r.start && (t >= r.start) && (t <= (r.end||r.start)); });\n' +
'}\n' +
'function _anyAwayWithinDays(byEmail, days){\n' +
'  var now = new Date(); var cutoff = new Date(now.getFullYear(),now.getMonth(),now.getDate()+days);\n' +
'  var t = _todayYMD(); var cutoffStr = _fmtYMD(cutoff);\n' +
'  for (var em in byEmail){\n' +
'    var list = byEmail[em] || [];\n' +
'    for (var i=0;i<list.length;i++){\n' +
'      var r=list[i]; if(!r||!r.start) continue;\n' +
'      var s = r.start, e = r.end||r.start;\n' +
'      if(!(e < t || s > cutoffStr)) return true;\n' +
'    }\n' +
'  }\n' +
'  return false;\n' +
'}\n' +
'async function loadAwayDatesForSelf(){\n' +
'  try {\n' +
'    var r=await fetch("/api/leads?action=get_away_dates&email="+encodeURIComponent(AM.email));\n' +
'    var d=await r.json();\n' +
'    _awayDates = Array.isArray(d.dates) ? d.dates : [];\n' +
'    _applyOOOStateForAM();\n' +
'  } catch(e){ console.error("loadAwayDates error:",e); }\n' +
'}\n' +
'function _applyOOOStateForAM(){\n' +
'  var btn=_g("btn-cal"); if(!btn) return;\n' +
'  var todayAway = _isTodayInRange(_awayDates);\n' +
'  btn.classList.toggle("active-away", todayAway);\n' +
'  var banner=_g("ooo-banner"); if(banner) banner.classList.toggle("visible", todayAway);\n' +
'}\n' +
'async function loadAwayDatesForAdmin(){\n' +
'  try {\n' +
'    var r=await fetch("/api/leads?action=get_away_dates&scope=all");\n' +
'    var d=await r.json();\n' +
'    var byEmail = (d && d.byEmail) || {};\n' +
'    var btn=_g("btn-cal"); if(btn) btn.classList.toggle("active-away", _anyAwayWithinDays(byEmail, 7));\n' +
'    window._awayByEmail = byEmail;\n' +
'  } catch(e){ console.error("loadAwayDates admin error:",e); }\n' +
'}\n' +
'function openCalendarModal(){\n' +
'  if(AM.role === "admin") return openAdminOOOModal();\n' +
'  var now=new Date(); _calViewYear = now.getFullYear(); _calViewMonth = now.getMonth();\n' +
'  _calSelStart=null; _calSelEnd=null;\n' +
'  _renderCalendar(); _renderCalList();\n' +
'  _g("cal-overlay").classList.add("open");\n' +
'}\n' +
'function closeCalendarModal(){ _g("cal-overlay").classList.remove("open"); }\n' +
'function calPrevMonth(){ _calViewMonth--; if(_calViewMonth<0){_calViewMonth=11; _calViewYear--;} _renderCalendar(); }\n' +
'function calNextMonth(){ _calViewMonth++; if(_calViewMonth>11){_calViewMonth=0; _calViewYear++;} _renderCalendar(); }\n' +
'function _renderCalendar(){\n' +
'  var title = new Date(_calViewYear,_calViewMonth,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});\n' +
'  _g("cal-nav-title").textContent = title;\n' +
'  var grid=_g("cal-grid");\n' +
'  var heads = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function(d){ return \'<div class="cal-head">\'+d+\'</div>\'; }).join("");\n' +
'  var first = new Date(_calViewYear,_calViewMonth,1);\n' +
'  var firstDow = first.getDay();\n' +
'  var daysInMonth = new Date(_calViewYear,_calViewMonth+1,0).getDate();\n' +
'  var today = _todayYMD();\n' +
'  var cells = "";\n' +
'  for (var i=0;i<firstDow;i++) cells += \'<div class="cal-day blank"></div>\';\n' +
'  for (var d=1; d<=daysInMonth; d++){\n' +
'    var ymd = _calViewYear+"-"+String(_calViewMonth+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");\n' +
'    var classes = ["cal-day"];\n' +
'    if(ymd === today) classes.push("today");\n' +
'    if(_calSelStart && ymd === _calSelStart) classes.push("sel-start","sel");\n' +
'    if(_calSelEnd && ymd === _calSelEnd) classes.push("sel-end","sel");\n' +
'    if(_calSelStart && _calSelEnd && ymd > _calSelStart && ymd < _calSelEnd) classes.push("in-range");\n' +
'    // Highlight already-saved ranges lightly\n' +
'    if(_awayDates.some(function(r){ return r && r.start && ymd >= r.start && ymd <= (r.end||r.start); })) classes.push("in-range");\n' +
'    cells += \'<div class="\'+classes.join(" ")+\'" data-ymd="\'+ymd+\'" onclick="_onCalDayClick(\\\'\'+ymd+\'\\\')">\'+d+\'</div>\';\n' +
'  }\n' +
'  grid.innerHTML = heads + cells;\n' +
'  _g("cal-add-btn").disabled = !_calSelStart;\n' +
'}\n' +
'function _onCalDayClick(ymd){\n' +
'  if(!_calSelStart || _calSelEnd){\n' +
'    _calSelStart = ymd; _calSelEnd = null;\n' +
'  } else if(ymd < _calSelStart){\n' +
'    _calSelEnd = _calSelStart; _calSelStart = ymd;\n' +
'  } else {\n' +
'    _calSelEnd = ymd;\n' +
'  }\n' +
'  _renderCalendar();\n' +
'}\n' +
'async function addAwayDate(){\n' +
'  if(!_calSelStart) return;\n' +
'  var entry = { id: "aw_"+Date.now()+"_"+Math.random().toString(36).slice(2,8), start: _calSelStart, end: _calSelEnd || _calSelStart };\n' +
'  _awayDates = _awayDates.concat([entry]);\n' +
'  await _saveAwayDates();\n' +
'  _calSelStart=null; _calSelEnd=null;\n' +
'  _renderCalendar(); _renderCalList(); _applyOOOStateForAM();\n' +
'}\n' +
'async function deleteAwayDate(id){\n' +
'  if(!confirm("Delete this out-of-office entry?")) return;\n' +
'  try {\n' +
'    await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete_away_date",email:AM.email,date_id:id})});\n' +
'    _awayDates = _awayDates.filter(function(d){ return d.id !== id; });\n' +
'    _renderCalendar(); _renderCalList(); _applyOOOStateForAM();\n' +
'  } catch(e){ console.error("delete_away_date error:",e); }\n' +
'}\n' +
'function editAwayDate(id){\n' +
'  var r = _awayDates.find(function(x){ return x.id === id; }); if(!r) return;\n' +
'  _calSelStart = r.start; _calSelEnd = (r.end && r.end !== r.start) ? r.end : null;\n' +
'  var d = _parseYMD(r.start) || new Date();\n' +
'  _calViewYear = d.getFullYear(); _calViewMonth = d.getMonth();\n' +
'  // Delete the old entry; adding will save a new one with fresh id\n' +
'  deleteAwayDate(id);\n' +
'}\n' +
'async function _saveAwayDates(){\n' +
'  try {\n' +
'    await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_away_dates",email:AM.email,dates:_awayDates})});\n' +
'  } catch(e){ console.error("save_away_dates error:",e); }\n' +
'}\n' +
'function _renderCalList(){\n' +
'  var el=_g("cal-list-body"); if(!el) return;\n' +
'  if(!_awayDates.length){ el.innerHTML = \'<div class="cal-empty">No away dates saved.</div>\'; return; }\n' +
'  el.innerHTML = _awayDates.slice().sort(function(a,b){ return a.start.localeCompare(b.start); }).map(function(r){\n' +
'    var label = (r.end && r.end !== r.start) ? (_fmtFriendly(r.start)+" \\u2013 "+_fmtFriendly(r.end)) : _fmtFriendly(r.start);\n' +
'    return \'<div class="cal-list-row"><span class="dates">\'+escHtml(label)+\'</span>\'+\n' +
'      \'<button title="Edit" onclick="editAwayDate(\\\'\'+r.id+\'\\\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>\'+\n' +
'      \'<button class="danger" title="Delete" onclick="deleteAwayDate(\\\'\'+r.id+\'\\\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg></button>\'+\n' +
'    \'</div>\';\n' +
'  }).join("");\n' +
'}\n' +
'async function openAdminOOOModal(){\n' +
'  _g("admin-ooo-overlay").classList.add("open");\n' +
'  _g("admin-ooo-body").innerHTML = \'<div class="cal-empty">Loading...</div>\';\n' +
'  try {\n' +
'    var r=await fetch("/api/leads?action=get_away_dates&scope=all");\n' +
'    var d=await r.json();\n' +
'    var byEmail = (d && d.byEmail) || {};\n' +
'    var now = new Date(); var cutoff = _fmtYMD(new Date(now.getFullYear(),now.getMonth(),now.getDate()+30));\n' +
'    var todayStr = _todayYMD();\n' +
'    var rows = [];\n' +
'    Object.keys(byEmail).forEach(function(em){\n' +
'      (byEmail[em]||[]).forEach(function(r){\n' +
'        if(!r||!r.start) return;\n' +
'        var end = r.end || r.start;\n' +
'        if(end < todayStr) return;\n' +
'        if(r.start > cutoff) return;\n' +
'        rows.push({ email: em, start: r.start, end: end, id: r.id });\n' +
'      });\n' +
'    });\n' +
'    if(!rows.length){ _g("admin-ooo-body").innerHTML = \'<div class="cal-empty">No upcoming away dates</div>\'; return; }\n' +
'    rows.sort(function(a,b){ return a.start.localeCompare(b.start); });\n' +
'    var nameFor = function(em){ var k = Object.keys(AM_EMAIL_MAP||{}).find(function(n){ return AM_EMAIL_MAP[n] === em; }); return k ? k.split(" ").map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1); }).join(" ") : em; };\n' +
'    _g("admin-ooo-body").innerHTML = rows.map(function(r){\n' +
'      var label = (r.end && r.end !== r.start) ? (_fmtFriendly(r.start)+" \\u2013 "+_fmtFriendly(r.end)) : _fmtFriendly(r.start);\n' +
'      return \'<div class="cal-list-row"><span class="dates"><strong>\'+escHtml(nameFor(r.email))+\'</strong> &mdash; \'+escHtml(label)+\'</span>\'+\n' +
'        \'<button class="danger" title="Remove" onclick="adminDeleteAwayDate(\\\'\'+escHtml(r.email)+\'\\\',\\\'\'+escHtml(r.id)+\'\\\')">Remove</button>\'+\n' +
'      \'</div>\';\n' +
'    }).join("");\n' +
'  } catch(e){ _g("admin-ooo-body").innerHTML = \'<div class="cal-empty">Failed to load.</div>\'; }\n' +
'}\n' +
'function closeAdminOOOModal(){ _g("admin-ooo-overlay").classList.remove("open"); }\n' +
'async function adminDeleteAwayDate(email, id){\n' +
'  if(!confirm("Remove this out-of-office entry?")) return;\n' +
'  try {\n' +
'    await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete_away_date",email:email,date_id:id})});\n' +
'    openAdminOOOModal();\n' +
'    loadAwayDatesForAdmin();\n' +
'  } catch(e){ console.error("adminDeleteAwayDate error:",e); }\n' +
'}\n' +
'\n' +
'// Admin mapping for nameFor lookup inside openAdminOOOModal\n' +
'var AM_EMAIL_MAP = {\n' +
'  "mark sapoznikov": "msapoznikov@impactbusinessgroup.com",\n' +
'  "matt peal": "mpeal@impactbusinessgroup.com",\n' +
'  "curt willbrandt": "cwillbrandt@impactbusinessgroup.com",\n' +
'  "doug koetsier": "dkoetsier@impactbusinessgroup.com",\n' +
'  "paul kujawski": "pkujawski@impactbusinessgroup.com",\n' +
'  "lauren sylvester": "lsylvester@impactbusinessgroup.com",\n' +
'  "dan teliczan": "dteliczan@impactbusinessgroup.com",\n' +
'  "trish wangler": "twangler@impactbusinessgroup.com",\n' +
'  "mark herman": "mherman@impactbusinessgroup.com",\n' +
'  "jamie drajka": "jdrajka@impactbusinessgroup.com",\n' +
'  "drew bentsen": "dbentsen@impactbusinessgroup.com",\n' +
'  "steve betteley": "sbetteley@impactbusinessgroup.com"\n' +
'};\n' +
'\n' +
'/* ===== Help modal + guided tour ===== */\n' +
'var _cheatSections = [\n' +
'  { title: "Working a lead", items: [\n' +
'    ["Click a contact tile to activate it", "Activating a contact loads their info into the email composer below so you can write a message to that specific person."],\n' +
'    ["Get Email reveals a verified email address", "Uses one Apollo credit per reveal. Only click when you\\u2019re ready to reach out."],\n' +
'    ["Custom Message generates an AI-personalized email", "Uses Gemini to draft a personalized outreach email referencing the company, role, and a matched IBG case study. Edit as needed before sending."],\n' +
'    ["Email and LinkedIn tabs switch between message types", "Use the Email tab to send via Outlook. Use the LinkedIn tab to copy a shorter message for LinkedIn outreach."]\n' +
'  ]},\n' +
'  { title: "Contact actions", items: [\n' +
'    ["Blue checkmark on each tile opens the action menu", "From here you can log an outreach action or remove a contact with a reason."],\n' +
'    ["Log outreach: Email, LinkedIn Message, or LinkedIn Connect", "Check any or all of the three methods you used. This records the outreach and updates analytics."],\n' +
'    ["Remove reasons: Made Contact, Wrong Contact Type, Existing Contact, Not Interested, Other", "Use Made Contact when you successfully connected. Others remove the contact without counting as a successful connection."]\n' +
'  ]},\n' +
'  { title: "Finding more contacts", items: [\n' +
'    ["Plus button searches Apollo for more contacts at the company", "Search by name, title, department, seniority, or location. Scoped to the company\\u2019s Apollo record."],\n' +
'    ["Manual Entry adds a contact you already have", "Enter first name, last name, title, email, and optional LinkedIn. Useful for contacts you found outside Apollo."]\n' +
'  ]},\n' +
'  { title: "Closing a lead", items: [\n' +
'    ["Complete Lead turns green when every contact has been actioned", "Every contact on the card must have either outreach logged or be removed before you can complete the lead."],\n' +
'    ["Completing a lead starts the 3-day follow-up cycle", "The lead is archived and reappears on your dashboard after 3 business days as a follow-up reminder."]\n' +
'  ]},\n' +
'  { title: "Skip vs Block", items: [\n' +
'    ["Skip dismisses this one lead only", "The company stays in the system. Future leads from the same company will still appear."],\n' +
'    ["Block dismisses the lead AND adds the company to a blocklist", "No future leads from this company will come through. Use for companies you\\u2019ve permanently decided not to pursue."],\n' +
'    ["Both require a reason", "Reasons help the team understand patterns and improve filtering over time."]\n' +
'  ]},\n' +
'  { title: "Reassign", items: [\n' +
'    ["Hand the lead to a different AM", "Use when a lead is better suited to another AM\\u2019s specialty. Choose the AM, add an optional note, and the lead moves to their dashboard."]\n' +
'  ]},\n' +
'  { title: "Follow-up reminders", items: [\n' +
'    ["Completed leads return every 3 business days, up to 3 times", "This keeps you touching base with prospects who haven\\u2019t responded yet."],\n' +
'    ["Close Out permanently closes a lead", "After the 3rd reminder, you can Close Out or Add 3-day Reminder if you want more time."]\n' +
'  ]},\n' +
'  { title: "Header icons", items: [\n' +
'    ["Calendar: set out-of-office days", "Add date ranges when you\\u2019re away. Leads won\\u2019t be routed to you on those days."],\n' +
'    ["Undo: restore skipped or blocked leads", "Brings back leads you dismissed in the last 1, 3, or 7 days."],\n' +
'    ["Plus: manually add a job lead", "For leads you found outside the system that you want to work through the dashboard."],\n' +
'    ["Question mark: open this help any time", "Includes the cheat sheet and a button to re-launch the guided tour."]\n' +
'  ]},\n' +
'  { title: "Card status colors", items: [\n' +
'    ["Green border: new lead, no outreach yet", "Freshly enriched and waiting for you to act on it."],\n' +
'    ["Grey border: outreach in progress", "At least one contact has been actioned."],\n' +
'    ["Blue border: follow-up reminder stage 1 or 2", "You\\u2019ve completed this lead and it\\u2019s back for follow-up."],\n' +
'    ["Orange border: follow-up reminder stage 3 or later", "Final reminder stages. Decide whether to follow up once more or close out."]\n' +
'  ]}\n' +
'];\n' +
'function _renderCheatSheet() {\n' +
'  var el = _g("cheat-grid"); if(!el) return;\n' +
'  el.innerHTML = _cheatSections.map(function(sec){\n' +
'    var items = sec.items.map(function(it){\n' +
'      return \'<div class="cheat-item has-tooltip" data-tooltip="\'+escHtml(it[1])+\'"><span>\'+escHtml(it[0])+\'</span><span class="info-icon">i</span></div>\';\n' +
'    }).join("");\n' +
'    return \'<div class="cheat-section"><h3>\'+escHtml(sec.title)+\'</h3>\'+items+\'</div>\';\n' +
'  }).join("");\n' +
'}\n' +
'function openHelpModal() {\n' +
'  _renderCheatSheet();\n' +
'  _g("help-overlay").classList.add("open");\n' +
'}\n' +
'function closeHelpModal() { _g("help-overlay").classList.remove("open"); }\n' +
'\n' +
'var _tourSteps = [\n' +
'  { target: function(){ return document.querySelector("#leads-container .card"); }, heading: "This is a lead card", body: "Each card is a company that\\u2019s actively hiring. The colored bar on the left shows its status. Let\\u2019s walk through how to work one." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .card .contacts-row"); }, heading: "Contacts", body: "These are hiring managers we found at the company. Click any tile to activate it for outreach." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .btn-fetch"); }, heading: "Get Email", body: "Click this to reveal a verified email address. Uses one Apollo credit per reveal." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .composer"); }, heading: "Email composer", body: "Write your outreach here. Click Custom Message for an AI-personalized draft, or edit the default template directly." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .btn-check"); }, heading: "Log outreach", body: "When you\\u2019ve reached out or want to remove a contact, click the checkmark. Log what method you used, or remove with a reason." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .btn-ac-circle"); }, heading: "Find more contacts", body: "Need more people at this company? Search Apollo or add a contact manually." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .card-footer"); }, heading: "Footer actions", body: "Skip dismisses this lead. Block adds the company to a permanent blocklist. Reassign sends it to another AM. Complete Lead closes it out once all contacts are actioned." },\n' +
'  { target: function(){ return document.querySelector("#leads-container .card"); }, heading: "Follow-up cycle", body: "Completed leads reappear every 3 business days up to 3 times as reminders. The border color tells you the stage." },\n' +
'  { target: function(){ return _g("btn-help"); }, heading: "You\\u2019re set", body: "Click the question mark any time to reopen this tour or the cheat sheet." }\n' +
'];\n' +
'var _tourIdx = 0;\n' +
'function _tourAuthKey() {\n' +
'  var tk = (_params.get("token")||"").trim();\n' +
'  return "tour_seen_" + (tk || AM.email || "anon");\n' +
'}\n' +
'function maybeAutoLaunchTour() {\n' +
'  try {\n' +
'    if (localStorage.getItem(_tourAuthKey())) return;\n' +
'  } catch(e) { return; }\n' +
'  // Small delay so leads have painted before we try to highlight them\n' +
'  setTimeout(function(){ startGuidedTour(); }, 600);\n' +
'}\n' +
'function startGuidedTour() {\n' +
'  if (currentTab !== "leads") { try { switchTab("leads"); } catch(e){} }\n' +
'  _tourIdx = 0;\n' +
'  _g("tour-overlay").classList.add("active");\n' +
'  _renderTourStep();\n' +
'}\n' +
'function endGuidedTour(fromSkip) {\n' +
'  _g("tour-overlay").classList.remove("active");\n' +
'  try { localStorage.setItem(_tourAuthKey(), new Date().toISOString()); } catch(e) {}\n' +
'}\n' +
'function tourNext() {\n' +
'  if (_tourIdx >= _tourSteps.length - 1) { endGuidedTour(false); return; }\n' +
'  _tourIdx++; _renderTourStep();\n' +
'}\n' +
'function tourPrev() { if (_tourIdx > 0) { _tourIdx--; _renderTourStep(); } }\n' +
'function _renderTourStep() {\n' +
'  var step = _tourSteps[_tourIdx]; if(!step) return;\n' +
'  var el = null;\n' +
'  try { el = step.target(); } catch(e) { el = null; }\n' +
'  _g("tour-card-step").textContent = "Step " + (_tourIdx+1) + " of " + _tourSteps.length;\n' +
'  _g("tour-card-heading").textContent = step.heading;\n' +
'  _g("tour-card-body").textContent = step.body;\n' +
'  _g("tour-prev-btn").disabled = (_tourIdx === 0);\n' +
'  _g("tour-next-btn").textContent = (_tourIdx === _tourSteps.length - 1) ? "Finish" : "Next";\n' +
'  var spotlight = _g("tour-spotlight");\n' +
'  var card = _g("tour-card");\n' +
'  if (!el) {\n' +
'    spotlight.style.display = "none";\n' +
'    card.style.top = "50%"; card.style.left = "50%"; card.style.transform = "translate(-50%,-50%)";\n' +
'    return;\n' +
'  }\n' +
'  // Bring the target into view first so geometry is stable\n' +
'  try { el.scrollIntoView({behavior:"smooth", block:"center", inline:"center"}); } catch(e) {}\n' +
'  setTimeout(function(){\n' +
'    var r = el.getBoundingClientRect();\n' +
'    var pad = 8;\n' +
'    spotlight.style.display = "block";\n' +
'    spotlight.style.top = (r.top - pad) + "px";\n' +
'    spotlight.style.left = (r.left - pad) + "px";\n' +
'    spotlight.style.width = (r.width + pad*2) + "px";\n' +
'    spotlight.style.height = (r.height + pad*2) + "px";\n' +
'    // Place card below the spotlight if there\\u2019s room; else above; else to the right; else center\n' +
'    card.style.transform = "none";\n' +
'    var cardW = 340, cardH = card.offsetHeight || 180, margin = 14;\n' +
'    var top, left;\n' +
'    if (r.bottom + margin + cardH < window.innerHeight) { top = r.bottom + margin; left = Math.min(Math.max(8, r.left), window.innerWidth - cardW - 8); }\n' +
'    else if (r.top - margin - cardH > 0) { top = r.top - margin - cardH; left = Math.min(Math.max(8, r.left), window.innerWidth - cardW - 8); }\n' +
'    else if (r.right + margin + cardW < window.innerWidth) { top = Math.max(8, Math.min(r.top, window.innerHeight - cardH - 8)); left = r.right + margin; }\n' +
'    else { top = Math.max(8, (window.innerHeight - cardH) / 2); left = Math.max(8, (window.innerWidth - cardW) / 2); }\n' +
'    card.style.top = top + "px";\n' +
'    card.style.left = left + "px";\n' +
'  }, 280);\n' +
'}\n' +
'document.addEventListener("keydown", function(e){\n' +
'  if (e.key !== "Escape") return;\n' +
'  if (_g("tour-overlay") && _g("tour-overlay").classList.contains("active")) { endGuidedTour(true); return; }\n' +
'  if (_g("help-overlay") && _g("help-overlay").classList.contains("open")) { closeHelpModal(); return; }\n' +
'  var grp=_g("header-btn-group"); if(grp && grp.classList.contains("searching")){ closeHeaderSearch(); return; }\n' +
'});\n' +
'\n' +
'function updateAmScoreboard() {\n' +
'  if(AM.role === "admin") return;\n' +
'  var source = (typeof allLeadsCache !== "undefined" && allLeadsCache && allLeadsCache.length) ? allLeadsCache : leads;\n' +
'  var mine = source.filter(function(l){ return (l.assignedAMEmail||"").toLowerCase() === AM.email.toLowerCase(); });\n' +
'  var today = new Date();\n' +
'  var todayStr = today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");\n' +
'  var pending = mine.filter(function(l){ return (l.status==="new"||l.status==="pending") && Array.isArray(l.contacts) && l.contacts.length>0; });\n' +
'  var newToday = pending.filter(function(l){ return l.date === todayStr || (typeof l.id === "string" && l.id.indexOf("lead:"+todayStr+":") === 0); }).length;\n' +
'  var followups = mine.filter(function(l){\n' +
'    if(l.status !== "awaiting_followup") return false;\n' +
'    var d = l.last_reminder_date || l.completedAt;\n' +
'    if(!d) return false;\n' +
'    return _clientBizDaysBetween(new Date(d), today) >= 3;\n' +
'  }).length;\n' +
'  var el;\n' +
'  if((el=_g("score-new-today"))) el.textContent = newToday;\n' +
'  if((el=_g("score-total-pending"))) el.textContent = pending.length;\n' +
'  if((el=_g("score-followups"))) el.textContent = followups;\n' +
'}\n' +
'\n' +
'// Shared post-render pass for any view that builds card HTML via renderCard().\n' +
'// Fetches logos, seeds the window._lead* maps, hydrates contact tiles with\n' +
'// addContact(), shows outreach badges, and evaluates Complete Lead state.\n' +
'function postRenderLeads(renderedLeads) {\n' +
'  if(!Array.isArray(renderedLeads) || !renderedLeads.length) return;\n' +
'  // Kick off logo fetch for every rendered card\n' +
'  renderedLeads.forEach(function(lead){var sid=getSafeId(lead.id);fetchLogo(lead.company,lead.company_domain||lead.company_website||lead.employerWebsite||"",lead.location||"",sid,lead.company_logo_apollo||lead.company_logo||"");});\n' +
'  // <script> tags embedded via innerHTML do not execute, so populate the per-lead window maps here.\n' +
'  window._leadJobTitles=window._leadJobTitles||{};\n' +
'  window._leadCategories=window._leadCategories||{};\n' +
'  window._leadRedisIds=window._leadRedisIds||{};\n' +
'  renderedLeads.forEach(function(lead){\n' +
'    var sid=getSafeId(lead.id);\n' +
'    window._leadJobTitles[sid]=lead.jobTitle||"";\n' +
'    window._leadCategories[sid]=lead.category||"engineering";\n' +
'    window._leadRedisIds[sid]=lead.id||"";\n' +
'    var cardEl=_g("card-"+sid);\n' +
'    if(cardEl) cardEl.setAttribute("data-lead-redis-id",lead.id||"");\n' +
'  });\n' +
'  renderedLeads.forEach(function(lead){\n' +
'    if(lead.contacts&&lead.contacts.length>0){\n' +
'      var safeId=getSafeId(lead.id);\n' +
'      var contactsWrap=_g("contacts-"+safeId);\n' +
'      if(!contactsWrap) return;\n' +
'      lead.contacts.forEach(function(c){\n' +
'        addContact(safeId,c.full_name||c.name||"",c.job_title||c.title||"",lead.company,lead.location||"",c.apollo_id||c.prospect_id||"",{\n' +
'          suggested:true,city:c.city||"",region:c.region_name||c.region||c.state||"",linkedin:c.linkedin||"",\n' +
'          fromCache:c.fromCache||false,email:c.email||"",previousJobs:c.previousJobs||[],uniqid:c.uniqid||"",photo_url:c.photo_url||""\n' +
'        });\n' +
'      });\n' +
'      if(lead.outreach_log){\n' +
'        var contactCards=contactsWrap.querySelectorAll(".contact-card");\n' +
'        contactCards.forEach(function(cc){\n' +
'          var pid=cc.getAttribute("data-prospect-id")||"";\n' +
'          if(pid&&lead.outreach_log[pid]&&lead.outreach_log[pid].length>0){\n' +
'            var last=lead.outreach_log[pid][lead.outreach_log[pid].length-1];\n' +
'            var badge=cc.querySelector(".outreach-badge");\n' +
'            if(badge){badge.style.display="inline-block";badge.textContent=_formatOutreachBadge(last.attempt,last.date,last.am_email);}\n' +
'          }\n' +
'        });\n' +
'      }\n' +
'      checkAllActioned(safeId);\n' +
'    }\n' +
'  });\n' +
'}\n' +
'\n' +
'function _amShortName(email) {\n' +
'  if (!email) return "";\n' +
'  var e = String(email).toLowerCase();\n' +
'  // AM_EMAIL_MAP is keyed by lowercase "first last" -> email\n' +
'  if (typeof AM_EMAIL_MAP === "object") {\n' +
'    for (var k in AM_EMAIL_MAP) {\n' +
'      if (AM_EMAIL_MAP[k] === e) {\n' +
'        var parts = k.split(" ");\n' +
'        var first = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "";\n' +
'        var lastInit = parts[1] ? parts[1].charAt(0).toUpperCase() : "";\n' +
'        return lastInit ? (first + " " + lastInit) : first;\n' +
'      }\n' +
'    }\n' +
'  }\n' +
'  // Fallback: derive from local part of email (e.g. "msapoznikov" -> "M Sapoznikov" not ideal;\n' +
'  // keep simple "<local>" when unknown so the badge still renders distinctively)\n' +
'  var local = e.split("@")[0] || "";\n' +
'  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "";\n' +
'}\n' +
'function _formatOutreachBadge(attempt, dateIso, amEmail) {\n' +
'  var base = "Outreach " + attempt + " sent " + new Date(dateIso).toLocaleDateString();\n' +
'  var who = _amShortName(amEmail||"");\n' +
'  return who ? (base + " - " + who) : base;\n' +
'}\n' +
'function _cardBorderForStatus(lead) {\n' +
'  var hasOutreach = lead.outreach_log && typeof lead.outreach_log === "object" && Object.keys(lead.outreach_log).length > 0;\n' +
'  var stage = Number(lead.reminder_stage || 0);\n' +
'  if(lead.status === "awaiting_followup" && stage >= 3) return "#E8620A";\n' +
'  if(lead.status === "awaiting_followup") return "#1A4EA2";\n' +
'  if((lead.status === "new" || lead.status === "pending") && !hasOutreach) return "#00a86b";\n' +
'  if(hasOutreach) return "#444444";\n' +
'  return "#444444";\n' +
'}\n';
html += '' +
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
'  var domainVal=lead.company_domain||lead.company_website||"";\n' +
'  if(domainVal){\n' +
'    var domainHref=domainVal;if(domainHref.indexOf("http")!==0)domainHref="https://"+domainHref;\n' +
'    linksLeft+=\'<div class="domain-wrap" style="position:relative;display:inline-block;" onmouseenter="showDomainPopup(this,\\\'\'+safeId+\'\\\',\\\'\'+domainVal.replace(/\x27/g,"")+ \'\\\')" onmouseleave="hideDomainPopup(this)">\';\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+domainHref+\'" target="_blank">\'+SVG_GLOBE+\'</a>\';\n' +
'    linksLeft+=\'</div>\';\n' +
'  }\n' +
'  if(lead.company_linkedin){\n' +
'    var liUrl=lead.company_linkedin;if(liUrl.indexOf("http")!==0)liUrl="https://"+liUrl;\n' +
'    linksLeft+=\'<a class="link-icon" href="\'+liUrl+\'" target="_blank" data-tooltip="LinkedIn" style="color:#0077B5;">\'+SVG_LINKEDIN+\'</a>\';\n' +
'  }\n' +
'  var linksRight="";\n' +
'  if(hasJD) linksRight+=\'<a class="link-icon" href="#" onclick="openJD(\\\'\'+safeId+\'\\\');return false;" data-tooltip="Job Description">\'+SVG_DOC+\'</a>\';\n' +
'  if(lead.jobUrl) linksRight+=\'<a class="link-icon" href="\'+lead.jobUrl+\'" target="_blank" data-tooltip="View Posting">\'+SVG_LINK+\'</a>\';\n' +
'\n' +
'  var amBadgeHtml = (AM.role==="admin" && lead.assignedAM) ? \'<div class="am-badge">\'+escHtml(lead.assignedAM)+\'</div>\' : "";\n' +
'  var statusBorderColor = _cardBorderForStatus(lead);\n' +
'  var unreadCount = _leadHasUnreadNotes(lead);\n' +
'  var noteClass = unreadCount>0 ? "notes-icon-btn has-unread has-tooltip" : "notes-icon-btn has-tooltip";\n' +
'  // Only show the notes bubble when there is actually an unread note for this AM.\n' +
'  // The standalone entry point is removed (notes are now authored through the\n' +
'  // reassign modal). Keeping the unread-indicator lets the receiving AM read it.\n' +
'  var notesBtnHtml = unreadCount > 0\n' +
'    ? \'<button class="\'+noteClass+\'" id="notes-btn-\'+safeId+\'" data-tooltip="Unread note from admin" onclick="event.stopPropagation();openNotesModal(\\\'\'+lead.id+\'\\\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="notes-icon-badge" id="notes-badge-\'+safeId+\'">\'+unreadCount+\'</span></button>\'\n' +
'    : "";\n' +
'  return \'<div class="card" id="card-\'+safeId+\'" style="--accent-color:\'+statusBorderColor+\';">\'+amBadgeHtml+notesBtnHtml+\n' +
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
'        categoryPill(cat,safeId)+\n' +
'      \'</div>\'+\n' +
'    \'</div>\'+\n' +
'    ((linksLeft||linksRight)?\'<div class="links-bar"><div class="links-bar-left">\'+linksLeft+\'</div>\'+((AM.role==="admin" && lead.assignedAM)?\'<div class="links-bar-am">\'+escHtml(lead.assignedAM)+\'</div>\':"")+\'<div class="links-bar-right">\'+linksRight+\'</div></div>\':"")+\n' +
'    \'<div class="card-body">\'+\n' +
'    (lead.reminder_stage>0?\'<div class="reminder-banner">Follow-up Reminder \'+lead.reminder_stage+\' of 3 - Originally closed \'+(lead.completedAt?new Date(lead.completedAt).toLocaleDateString():"unknown")+(lead.outreach_summary&&lead.outreach_summary.length>0?" - Last outreach: "+lead.outreach_summary[0].attempts[lead.outreach_summary[0].attempts.length-1].methods.join(", ")+" on "+new Date(lead.outreach_summary[0].attempts[lead.outreach_summary[0].attempts.length-1].date).toLocaleDateString():"")+\'</div>\':"")+\n' +
'      \'<div class="section-label-row">\'+\n' +
'        \'<div class="section-label">Contacts</div>\'+\n' +
'        \'<button class="btn-ac-circle\'+(hasAllContacts?" has-suggestions":"")+\'" onclick="openACModal(\\\'\'+safeId+\'\\\')" data-tooltip="Find contacts">+</button>\'+\n' +
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
'      \'<button class="btn-glass btn-glass-skip" onclick="openSkipModal(\\\'\'+safeId+\'\\\',\\\'\'+lead.id+\'\\\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg> Skip</button>\'+\n' +
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
'  var _lrid=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'  if(!_lrid){var _pcard=_g("card-"+safeId);if(_pcard) _lrid=_pcard.getAttribute("data-lead-redis-id")||"";}\n' +
'  if(_lrid) card.setAttribute("data-lead-redis-id",_lrid);\n' +
'\n' +
'  card.innerHTML=\n' +
'    \'<div class="contact-check-corner"><div class="remove-wrap" style="position:relative;">\'+\n' +
'      \'<button class="btn-check has-tooltip" data-tooltip="Log action to complete contact. Complete all contacts before completing lead." onclick="event.stopPropagation();toggleContactDD(\\\'\'+cid+\'\\\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>\'+\n' +
'      \'<div class="contact-dd" id="cdd-\'+cid+\'">\'+\n' +
'        \'<div class="contact-dd-section">\'+\n' +
'          \'<div class="contact-dd-header" style="color:#E8620A;font-weight:600;">Log Outreach</div>\'+\n' +
'          \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-email-\'+cid+\'"> Email</label>\'+\n' +
'          \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-limsg-\'+cid+\'"> LinkedIn Message</label>\'+\n' +
'          \'<label class="outreach-cb-row" onclick="event.stopPropagation();"><input type="checkbox" id="oc-liconn-\'+cid+\'"> LinkedIn Connect</label>\'+\n' +
'          \'<button class="btn-confirm-outreach" onclick="event.stopPropagation();confirmOutreach(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\')">Confirm Outreach</button>\'+\n' +
'        \'</div>\'+\n' +
'        \'<div class="contact-dd-divider"></div>\'+\n' +
'        \'<div class="contact-dd-section">\'+\n' +
'          \'<div class="contact-dd-header" style="color:#cc4444;font-weight:600;">Remove</div>\'+\n' +
'          \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'made_contact\\\')">Made Contact</div>\'+\n' +
'          \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'wrong_type\\\')">Wrong Contact Type</div>\'+\n' +
'          \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'existing\\\')">Existing Contact</div>\'+\n' +
'          \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'not_interested\\\')">Not Interested</div>\'+\n' +
'          \'<div class="contact-dd-remove" onclick="event.stopPropagation();removeWithReason(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\',\\\'other\\\')">Other</div>\'+\n' +
'        \'</div>\'+\n' +
'      \'</div>\'+\n' +
'    \'</div></div>\'+\n' +
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
'      (hasEmail?"":\'<button class="btn btn-fetch has-tooltip" data-tooltip="Get Email - 1 credit" id="ge-\'+cid+\'" onclick="event.stopPropagation();getEmail(\\\'\'+cid+\'\\\',\\\'\'+safeId+\'\\\')">Get Email</button>\')+\n' +
'      \'<a href="\'+linkedinHref+\'" target="_blank" class="btn btn-li" data-tooltip="LinkedIn" onclick="event.stopPropagation();">\'+SVG_LINKEDIN.replace(\'viewBox="0 0 24 24"\',\'viewBox="0 0 24 24" width="14" height="14"\')+\'</a>\'+\n' +
'      \'<span class="outreach-badge" id="obd-\'+cid+\'" style="display:none;"></span>\'+\n' +
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
'      if(badge){badge.style.display="inline-block";badge.textContent=_formatOutreachBadge(attempt,new Date().toISOString(),AM.email);}\n' +
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
'  console.log("[getEmail] BUTTON CLICKED - cid:",cid,"safeId:",safeId);\n' +
'  var btn=_g("ge-"+cid);\n' +
'  btn.textContent="Fetching...";btn.disabled=true;\n' +
'  var card=_g("cb-"+cid);\n' +
'  var name=card.getAttribute("data-name")||"";\n' +
'  var title=card.getAttribute("data-title")||"";\n' +
'  var companyName=card.getAttribute("data-company")||"";\n' +
'  var location=card.getAttribute("data-location")||"";\n' +
'  var prospectId=card.getAttribute("data-prospect-id")||"";\n' +
'  var leadRedisId=card.getAttribute("data-lead-redis-id")||"";\n' +
'  if(!leadRedisId){var _pc=_g("card-"+safeId);if(_pc) leadRedisId=_pc.getAttribute("data-lead-redis-id")||"";}\n' +
'  if(!leadRedisId) leadRedisId=(window._leadRedisIds&&window._leadRedisIds[safeId])||"";\n' +
'  if(!leadRedisId){var _l=leads.find(function(l){return getSafeId(l.id)===safeId;});if(_l) leadRedisId=_l.id||"";}\n' +
'  console.log("[getEmail] card attrs - name:",name,"title:",title,"company:",companyName,"prospectId:",prospectId,"leadRedisId:",leadRedisId);\n' +
'  try{\n' +
'    var payload={contactName:name,contactTitle:title,companyName:companyName,location:location,leadId:leadRedisId};\n' +
'    if(prospectId) payload.apollo_id=prospectId;\n' +
'    console.log("[getEmail] POST /api/enrich payload:",payload);\n' +
'    var r=await fetch("/api/enrich",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    var d=await r.json();\n' +
'    console.log("[getEmail] /api/enrich response status:",r.status,"body:",d);\n' +
'    var email=d.email||null;\n' +
'    console.log("[getEmail] extracted email:",email);\n' +
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
'      console.log("[getEmail] about to check PATCH conditions - leadRedisId:",leadRedisId);\n' +
'      if(leadRedisId){\n' +
'        var lead=leads.find(function(l){return l.id===leadRedisId;});\n' +
'        console.log("[getEmail] lead found in memory:",!!lead,"has contacts:",!!(lead&&lead.contacts));\n' +
'        if(lead){\n' +
'          if(!lead.contacts) lead.contacts=[];\n' +
'          var ci=-1;\n' +
'          if(prospectId) ci=lead.contacts.findIndex(function(c){return(c.apollo_id||"")===prospectId;});\n' +
'          if(ci<0){\n' +
'            var nameLc=(name||"").trim().toLowerCase();\n' +
'            if(nameLc) ci=lead.contacts.findIndex(function(c){return((c.full_name||c.name||"").trim().toLowerCase())===nameLc;});\n' +
'          }\n' +
'          console.log("[getEmail] contact match index:",ci,"of",lead.contacts.length,"(matched by",(prospectId&&ci>=0&&lead.contacts[ci]&&lead.contacts[ci].apollo_id===prospectId?"apollo_id":"name"),")");\n' +
'          var uid=card.getAttribute("data-uniqid")||"";\n' +
'          if(ci>=0){\n' +
'            lead.contacts[ci].email=email;\n' +
'            if(uid) lead.contacts[ci].uniqid=uid;\n' +
'          } else {\n' +
'            lead.contacts.push({apollo_id:prospectId||("contact_"+Date.now()),full_name:name,name:name,job_title:title,title:title,email:email,uniqid:uid||"",source:"enrich"});\n' +
'            console.log("[getEmail] appended new contact entry to lead.contacts (no match found)");\n' +
'          }\n' +
'          var patchBody={id:leadRedisId,updates:{contacts:lead.contacts}};\n' +
'          console.log("[getEmail] CALLING PATCH /api/leads with body:",patchBody);\n' +
'          fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patchBody)}).then(function(pr){console.log("[getEmail] PATCH /api/leads response status:",pr.status);return pr.json().then(function(pd){console.log("[getEmail] PATCH /api/leads response body:",pd);}).catch(function(je){console.log("[getEmail] PATCH /api/leads response not JSON:",je);});}).catch(function(pe){console.error("[getEmail] PATCH /api/leads FAILED:",pe);});\n' +
'        } else {\n' +
'          console.warn("[getEmail] SKIPPING PATCH - lead not in client memory for id:",leadRedisId);\n' +
'        }\n' +
'      } else {\n' +
'        console.warn("[getEmail] SKIPPING PATCH - no leadRedisId could be resolved");\n' +
'      }\n' +
'    } else {\n' +
'      console.warn("[getEmail] no email returned from /api/enrich");\n' +
'      btn.textContent="Not found";btn.disabled=true;\n' +
'      var epEl2=_g("ep-"+cid);if(epEl2)epEl2.textContent="Email not found";\n' +
'    }\n' +
'  }catch(e){console.error("[getEmail] caught exception:",e);btn.textContent="Failed";btn.disabled=false;}\n' +
'}\n' +
'\n' +
'var _acSafeId="";\n' +
'function openACModal(safeId) {\n' +
'  _acSafeId=safeId;\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead){showToast("Lead not found",2000);return;}\n' +
'  _g("ac-title").textContent="Find Contacts - "+lead.company;\n' +
'  var body=_g("ac-body");\n' +
'  var leadState=(lead.location||"").split(",")[1]?(lead.location||"").split(",")[1].trim():"";\n' +
'  var isMI=leadState.match(/^MI$|Michigan/i);\n' +
'  var isFL=leadState.match(/^FL$|Florida/i);\n' +
'  var defaultLocLabel=isMI?"Michigan":isFL?"Florida":"Job Location";\n' +
'  var SVG_CHEV_SM=\'<svg class="fc-dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>\';\n' +
'  var h=\'<div class="fc-search-grid">\';\n' +
'  h+=\'<div class="add-field"><label>Name</label><input type="text" id="fc-name" placeholder="First and/or last name"></div>\';\n' +
'  h+=\'<div class="add-field"><label>Title</label><input type="text" id="fc-title" placeholder="e.g. Plant Manager, IT Director"></div>\';\n' +
'  // Department multi-select\n' +
'  h+=\'<div class="add-field"><label>Department</label><div class="fc-dd" id="fc-dept-dd"><button type="button" class="fc-dd-btn" onclick="fcToggleDD(\\\'fc-dept-dd\\\')"><span class="fc-dd-btn-text">Any Department</span>\'+SVG_CHEV_SM+\'</button><div class="fc-dd-panel" id="fc-dept-panel">\';\n' +
'  var depts=[["communications","Communications"],["education","Education"],["engineering","Engineering"],["finance","Finance"],["human_resources","Human Resources"],["information_technology","Information Technology"],["legal","Legal"],["marketing","Marketing"],["medical_health","Medical \\x26 Health"],["operations","Operations"],["owner","Owner"],["real_estate","Real Estate"],["sales","Sales"],["support","Support"]];\n' +
'  for(var di=0;di<depts.length;di++) h+=\'<label class="fc-dd-opt"><input type="checkbox" value="\'+depts[di][0]+\'" onchange="fcUpdateMulti(\\\'fc-dept-dd\\\',\\\'Any Department\\\')"><span class="fc-cb"></span> \'+depts[di][1]+\'</label>\';\n' +
'  h+=\'</div><div class="fc-pills" id="fc-dept-pills"></div></div></div>\';\n' +
'  // Seniority multi-select\n' +
'  h+=\'<div class="add-field"><label>Seniority</label><div class="fc-dd" id="fc-sen-dd"><button type="button" class="fc-dd-btn" onclick="fcToggleDD(\\\'fc-sen-dd\\\')"><span class="fc-dd-btn-text">Any Level</span>\'+SVG_CHEV_SM+\'</button><div class="fc-dd-panel" id="fc-sen-panel">\';\n' +
'  var sens=[["owner","Owner"],["founder","Founder"],["c_suite","C-Suite"],["partner","Partner"],["vp","VP"],["head","Head"],["director","Director"],["manager","Manager"],["senior","Senior"]];\n' +
'  for(var si=0;si<sens.length;si++) h+=\'<label class="fc-dd-opt"><input type="checkbox" value="\'+sens[si][0]+\'" onchange="fcUpdateMulti(\\\'fc-sen-dd\\\',\\\'Any Level\\\')"><span class="fc-cb"></span> \'+sens[si][1]+\'</label>\';\n' +
'  h+=\'</div><div class="fc-pills" id="fc-sen-pills"></div></div></div>\';\n' +
'  // Location multi-select\n' +
'  h+=\'<div class="add-field"><label>Location</label><div class="fc-dd" id="fc-loc-dd"><button type="button" class="fc-dd-btn" onclick="fcToggleDD(\\\'fc-loc-dd\\\')"><span class="fc-dd-btn-text">\'+defaultLocLabel+\'</span>\'+SVG_CHEV_SM+\'</button><div class="fc-dd-panel" id="fc-loc-panel">\';\n' +
'  h+=\'<label class="fc-dd-opt"><input type="checkbox" value="job_location" checked onchange="fcUpdateLoc()"><span class="fc-cb"></span> \'+defaultLocLabel+\'</label>\';\n' +
'  h+=\'<label class="fc-dd-opt"><input type="checkbox" value="Michigan" onchange="fcUpdateLoc()"><span class="fc-cb"></span> Michigan</label>\';\n' +
'  h+=\'<label class="fc-dd-opt"><input type="checkbox" value="Florida" onchange="fcUpdateLoc()"><span class="fc-cb"></span> Florida</label>\';\n' +
'  h+=\'<label class="fc-dd-opt"><input type="checkbox" value="us_all" onchange="fcUpdateLoc()"><span class="fc-cb"></span> United States (no filter)</label>\';\n' +
'  h+=\'</div><div class="fc-pills" id="fc-loc-pills"></div></div></div>\';\n' +
'  h+=\'</div>\';\n' +
'  h+=\'<button class="fc-search-btn" id="fc-search-btn" onclick="fcSearch(\\\'\'+safeId+\'\\\')">Search</button>\';\n' +
'  h+=\'<div class="fc-results" id="fc-results"><div class="fc-empty">Search within this company using the filters above</div></div>\';\n' +
'  h+=\'<div class="fc-divider"></div>\';\n' +
'  h+=\'<span class="fc-manual-toggle" onclick="this.nextElementSibling.classList.toggle(\\\'open\\\');this.textContent=this.nextElementSibling.classList.contains(\\\'open\\\')?\\\'- Hide manual entry\\\':\\\'+ Add contact manually\\\'">+ Add contact manually</span>\';\n' +
'  h+=\'<div class="fc-manual-form" id="fc-manual-form">\';\n' +
'  h+=\'<div class="fc-manual-grid">\';\n' +
'  h+=\'<div class="add-field"><label>First Name *</label><input type="text" id="fc-m-fname" placeholder="First name"></div>\';\n' +
'  h+=\'<div class="add-field"><label>Last Name *</label><input type="text" id="fc-m-lname" placeholder="Last name"></div>\';\n' +
'  h+=\'<div class="add-field"><label>Title *</label><input type="text" id="fc-m-title" placeholder="Job title"></div>\';\n' +
'  h+=\'<div class="add-field"><label>Email *</label><input type="text" id="fc-m-email" placeholder="Email address"><div class="fc-email-error" id="fc-m-email-err">Email is required</div></div>\';\n' +
'  h+=\'<div class="add-field"><label>LinkedIn URL</label><input type="text" id="fc-m-linkedin" placeholder="Optional"></div>\';\n' +
'  h+=\'</div>\';\n' +
'  h+=\'<button class="fc-search-btn" onclick="fcManualAdd(\\\'\'+safeId+\'\\\')">Add Contact</button>\';\n' +
'  h+=\'</div>\';\n' +
'  // Apollo suggestions\n' +
'  if(lead.allContacts&&lead.allContacts.length){\n' +
'    h+=\'<div class="fc-divider"></div>\';\n' +
'    h+=\'<div class="fc-section-header">Apollo Suggestions</div>\';\n' +
'    h+=\'<div id="fc-suggestions">\';\n' +
'    var max=Math.min(lead.allContacts.length,10);\n' +
'    for(var i=0;i<max;i++){\n' +
'      var c=lead.allContacts[i];\n' +
'      h+=fcContactRow(safeId,c.apollo_id,c.first_name||"",c.last_name_obfuscated||"",c.title||"",c.linkedin_url||"",c.has_city?c.city||"":"",c.has_state?c.state||"":"","sug-"+i);\n' +
'    }\n' +
'    h+=\'</div>\';\n' +
'  }\n' +
'  body.innerHTML=h;\n' +
'  _g("ac-overlay").classList.add("open");\n' +
'}\n' +
'function closeACModal(){_g("ac-overlay").classList.remove("open");}\n';
html += '' +
'\n' +
'function fcContactRow(safeId,apolloId,firstName,lastInitial,title,linkedin,city,state,rowId){\n' +
'  var nameStr=firstName+" "+lastInitial;\n' +
'  var liHtml=linkedin?\'<a class="modal-row-li" href="\'+linkedin+\'" target="_blank" rel="noopener" title="LinkedIn"><svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:rgba(255,255,255,0.35);"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>\':"";\n' +
'  var locHtml=(city||state)?\'<span class="fc-row-loc">\'+[city,state].filter(Boolean).join(", ")+\'</span>\':"";\n' +
'  return \'<div class="modal-row" id="fc-row-\'+safeId+\'-\'+rowId+\'">\'+\n' +
'    \'<div class="modal-row-info"><div class="modal-row-name">\'+nameStr+\'</div><div class="modal-row-title">\'+title+\'</div>\'+\n' +
'    (liHtml||locHtml?\'<div class="modal-row-meta">\'+liHtml+locHtml+\'</div>\':"")+\n' +
'    \'</div>\'+\n' +
'    \'<button class="search-add-btn" onclick="fcAddContact(\\\'\'+safeId+\'\\\',\\\'\'+apolloId+\'\\\',\\\'\'+rowId+\'\\\')">+ Add (1 credit)</button>\'+\n' +
'  \'</div>\';\n' +
'}\n' +
'\n' +
'function fcToggleDD(ddId){\n' +
'  var dd=_g(ddId); if(!dd) return;\n' +
'  var btn=dd.querySelector(".fc-dd-btn"); var panel=dd.querySelector(".fc-dd-panel");\n' +
'  var isOpen=panel.classList.contains("open");\n' +
'  // Close all open panels first\n' +
'  document.querySelectorAll(".fc-dd-panel.open").forEach(function(p){p.classList.remove("open");p.parentElement.querySelector(".fc-dd-btn").classList.remove("open");});\n' +
'  if(!isOpen){ panel.classList.add("open"); btn.classList.add("open"); }\n' +
'}\n' +
'function fcGetChecked(ddId){\n' +
'  var dd=_g(ddId); if(!dd) return [];\n' +
'  var vals=[]; dd.querySelectorAll("input[type=checkbox]:checked").forEach(function(cb){ vals.push(cb.value); });\n' +
'  return vals;\n' +
'}\n' +
'function fcUpdateMulti(ddId, defaultLabel){\n' +
'  var dd=_g(ddId); if(!dd) return;\n' +
'  var checked=fcGetChecked(ddId);\n' +
'  var btnText=dd.querySelector(".fc-dd-btn-text");\n' +
'  var pillsDiv=dd.querySelector(".fc-pills");\n' +
'  if(!checked.length){\n' +
'    btnText.textContent=defaultLabel;\n' +
'    if(pillsDiv) pillsDiv.innerHTML="";\n' +
'  } else {\n' +
'    btnText.textContent=checked.length+" selected";\n' +
'    if(pillsDiv){\n' +
'      var ph=""; dd.querySelectorAll("input[type=checkbox]:checked").forEach(function(cb){\n' +
'        var lbl=cb.parentElement.textContent.trim();\n' +
'        ph+=\'<span class="fc-pill">\'+lbl+\'<span class="fc-pill-x" onclick="event.stopPropagation();fcRemovePill(this,\\\'\'+ddId+\'\\\',\\\'\'+cb.value+\'\\\',\\\'\'+defaultLabel+\'\\\')">\\x26times;</span></span>\';\n' +
'      });\n' +
'      pillsDiv.innerHTML=ph;\n' +
'    }\n' +
'  }\n' +
'}\n' +
'function fcUpdateLoc(){\n' +
'  var dd=_g("fc-loc-dd"); if(!dd) return;\n' +
'  var checked=fcGetChecked("fc-loc-dd");\n' +
'  var btnText=dd.querySelector(".fc-dd-btn-text");\n' +
'  var pillsDiv=dd.querySelector(".fc-pills");\n' +
'  // If us_all selected, uncheck others\n' +
'  var lastChanged=null;\n' +
'  dd.querySelectorAll("input[type=checkbox]").forEach(function(cb){if(document.activeElement===cb||cb.parentElement.matches(":hover"))lastChanged=cb;});\n' +
'  if(lastChanged&&lastChanged.value==="us_all"&&lastChanged.checked){\n' +
'    dd.querySelectorAll("input[type=checkbox]").forEach(function(cb){if(cb.value!=="us_all")cb.checked=false;});\n' +
'    checked=["us_all"];\n' +
'  } else if(checked.indexOf("us_all")!==-1&&checked.length>1){\n' +
'    dd.querySelector("input[value=us_all]").checked=false;\n' +
'    checked=checked.filter(function(v){return v!=="us_all";});\n' +
'  }\n' +
'  if(!checked.length){ btnText.textContent="Job Location"; if(pillsDiv) pillsDiv.innerHTML=""; return; }\n' +
'  btnText.textContent=checked.length+" selected";\n' +
'  if(pillsDiv){\n' +
'    var ph=""; dd.querySelectorAll("input[type=checkbox]:checked").forEach(function(cb){\n' +
'      var lbl=cb.parentElement.textContent.trim();\n' +
'      ph+=\'<span class="fc-pill">\'+lbl+\'<span class="fc-pill-x" onclick="event.stopPropagation();fcRemoveLocPill(this,\\\'\'+cb.value+\'\\\')">\\x26times;</span></span>\';\n' +
'    });\n' +
'    pillsDiv.innerHTML=ph;\n' +
'  }\n' +
'}\n' +
'function fcRemovePill(el,ddId,val,defaultLabel){\n' +
'  var dd=_g(ddId); if(!dd) return;\n' +
'  var cb=dd.querySelector("input[value=\\""+val+"\\"]"); if(cb) cb.checked=false;\n' +
'  fcUpdateMulti(ddId,defaultLabel);\n' +
'}\n' +
'function fcRemoveLocPill(el,val){\n' +
'  var dd=_g("fc-loc-dd"); if(!dd) return;\n' +
'  var cb=dd.querySelector("input[value=\\""+val+"\\"]"); if(cb) cb.checked=false;\n' +
'  fcUpdateLoc();\n' +
'}\n' +
'// Close dropdowns when clicking outside\n' +
'document.addEventListener("click",function(e){\n' +
'  if(!e.target.closest(".fc-dd")){ document.querySelectorAll(".fc-dd-panel.open").forEach(function(p){p.classList.remove("open");p.parentElement.querySelector(".fc-dd-btn").classList.remove("open");}); }\n' +
'  if(!e.target.closest(".cat-pill-wrap")){ document.querySelectorAll(".cat-dd").forEach(function(d){d.remove();}); }\n' +
'});\n' +
'// Event delegation for dynamically rendered contact actions\n' +
'document.addEventListener("click",function(e){\n' +
'  var btn=e.target.closest(".btn-confirm-outreach");\n' +
'  if(btn){\n' +
'    e.stopPropagation();\n' +
'    var card=btn.closest(".contact-card");\n' +
'    if(!card) return;\n' +
'    var cid=card.getAttribute("data-cid");\n' +
'    var safeId=card.getAttribute("data-safe-id");\n' +
'    if(cid&&safeId) confirmOutreach(cid,safeId);\n' +
'  }\n' +
'  var fetchBtn=e.target.closest(".btn-fetch");\n' +
'  if(fetchBtn){\n' +
'    e.stopPropagation();\n' +
'    var card2=fetchBtn.closest(".contact-card");\n' +
'    if(!card2) return;\n' +
'    var cid2=card2.getAttribute("data-cid");\n' +
'    var safeId2=card2.getAttribute("data-safe-id");\n' +
'    if(cid2&&safeId2) getEmail(cid2,safeId2);\n' +
'  }\n' +
'});\n' +
'\n' +
'async function fcSearch(safeId){\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead||!lead.apollo_org_id){showToast("No Apollo org ID - cannot search",2000);return;}\n' +
'  var btn=_g("fc-search-btn"); btn.disabled=true; btn.textContent="Searching...";\n' +
'  var results=_g("fc-results"); results.innerHTML=\'<div class="fc-empty">Searching...</div>\';\n' +
'  var payload={action:"contact_search",org_id:lead.apollo_org_id,per_page:10};\n' +
'  var titleVal=(_g("fc-title")||{}).value||""; if(titleVal) payload.person_titles=[titleVal];\n' +
'  var nameVal=(_g("fc-name")||{}).value||""; if(nameVal) payload.q_keywords=nameVal;\n' +
'  var deptVals=fcGetChecked("fc-dept-dd"); if(deptVals.length) payload.person_departments=deptVals;\n' +
'  var senVals=fcGetChecked("fc-sen-dd"); if(senVals.length) payload.person_seniorities=senVals;\n' +
'  var locVals=fcGetChecked("fc-loc-dd");\n' +
'  var hasUSAll=locVals.indexOf("us_all")!==-1;\n' +
'  if(!hasUSAll){\n' +
'    var locs=[];\n' +
'    for(var li=0;li<locVals.length;li++){\n' +
'      if(locVals[li]==="job_location"){\n' +
'        var ls=(lead.location||"").split(",")[1]?(lead.location||"").split(",")[1].trim():"";\n' +
'        if(ls.match(/^MI$|Michigan/i)) locs.push("Michigan, United States");\n' +
'        else if(ls.match(/^FL$|Florida/i)) locs.push("Florida, United States");\n' +
'      } else if(locVals[li]==="Michigan") locs.push("Michigan, United States");\n' +
'      else if(locVals[li]==="Florida") locs.push("Florida, United States");\n' +
'    }\n' +
'    if(locs.length) payload.person_locations=locs;\n' +
'  }\n' +
'  try{\n' +
'    var r=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});\n' +
'    var d=await r.json();\n' +
'    btn.disabled=false; btn.textContent="Search";\n' +
'    if(!d.ok||!d.people||!d.people.length){ results.innerHTML=\'<div class="fc-empty">No results found</div>\'; return; }\n' +
'    var h="";\n' +
'    for(var i=0;i<d.people.length;i++){\n' +
'      var p=d.people[i];\n' +
'      h+=fcContactRow(safeId,p.apollo_id,p.first_name,p.last_name_initial,p.title,p.linkedin_url,p.city||"",p.state||"","sr-"+i);\n' +
'    }\n' +
'    results.innerHTML=h;\n' +
'  }catch(e){ btn.disabled=false; btn.textContent="Search"; results.innerHTML=\'<div class="fc-empty">Search error: \'+e.message+\'</div>\'; }\n' +
'}\n' +
'\n' +
'async function fcAddContact(safeId,apolloId,rowId){\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead) return;\n' +
'  var row=_g("fc-row-"+safeId+"-"+rowId);\n' +
'  var btn=row?row.querySelector(".search-add-btn"):null;\n' +
'  if(btn){btn.textContent="Adding...";btn.disabled=true;}\n' +
'  try{\n' +
'    var r=await fetch("/api/enrich",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"match",apollo_id:apolloId})});\n' +
'    var d=await r.json();\n' +
'    if(d.error){if(btn){btn.textContent="Failed";btn.disabled=false;}return;}\n' +
'    var fullName=d.full_name||d.first_name+" "+(d.last_name||"");\n' +
'    var linkedin=d.linkedin||""; if(linkedin&&linkedin.indexOf("http")!==0) linkedin="https://"+linkedin;\n' +
'    addContact(safeId,fullName,d.title||"",lead.company,lead.location||"",apolloId,{\n' +
'      suggested:true,city:d.city||"",region:d.state||"",linkedin:linkedin,photo_url:d.photo_url||""\n' +
'    });\n' +
'    if(!lead.contacts) lead.contacts=[];\n' +
'    lead.contacts.push({apollo_id:apolloId,full_name:fullName,name:fullName,first_name:d.first_name||"",last_name:d.last_name||"",job_title:d.title||"",title:d.title||"",city:d.city||"",state:d.state||"",linkedin:linkedin,email:null,source:"apollo",photo_url:d.photo_url||""});\n' +
'    // Remove from allContacts if present\n' +
'    if(lead.allContacts) lead.allContacts=lead.allContacts.filter(function(c){return c.apollo_id!==apolloId;});\n' +
'    var leadRedisId=lead.id||"";\n' +
'    if(leadRedisId) fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts,allContacts:lead.allContacts}})}).catch(function(){});\n' +
'    if(row) row.remove();\n' +
'    showToast("Contact added: "+fullName,2000);\n' +
'  }catch(e){if(btn){btn.textContent="Failed";btn.disabled=false;}}\n' +
'}\n' +
'\n' +
'async function fcManualAdd(safeId){\n' +
'  var lead=leads.find(function(l){return getSafeId(l.id)===safeId;});\n' +
'  if(!lead) return;\n' +
'  var fn=(_g("fc-m-fname")||{}).value||""; var ln=(_g("fc-m-lname")||{}).value||"";\n' +
'  var ti=(_g("fc-m-title")||{}).value||""; var em=(_g("fc-m-email")||{}).value||""; var li=(_g("fc-m-linkedin")||{}).value||"";\n' +
'  var emailErr=_g("fc-m-email-err"); if(emailErr) emailErr.style.display="none";\n' +
'  if(!fn||!ln||!ti){showToast("First name, last name and title required",2000);return;}\n' +
'  if(!em){if(emailErr) emailErr.style.display="block";return;}\n' +
'  var fullName=fn+" "+ln;\n' +
'  var manualId="manual_"+Date.now();\n' +
'  if(li&&li.indexOf("http")!==0) li="https://"+li;\n' +
'  addContact(safeId,fullName,ti,lead.company,lead.location||"",manualId,{\n' +
'    suggested:false,city:"",region:"",linkedin:li,email:em\n' +
'  });\n' +
'  if(!lead.contacts) lead.contacts=[];\n' +
'  lead.contacts.push({apollo_id:manualId,full_name:fullName,name:fullName,first_name:fn,last_name:ln,job_title:ti,title:ti,city:"",state:"",linkedin:li,email:em||null,source:"manual"});\n' +
'  var leadRedisId=lead.id||"";\n' +
'  if(leadRedisId) fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadRedisId,updates:{contacts:lead.contacts}})}).catch(function(){});\n' +
'  _g("fc-m-fname").value="";_g("fc-m-lname").value="";_g("fc-m-title").value="";_g("fc-m-email").value="";_g("fc-m-linkedin").value="";\n' +
'  showToast("Contact added: "+fullName,2000);\n' +
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
'function _blocklistName(e){return typeof e==="string"?e:((e&&e.company)||"");}\n' +
'function toggleBlockCompany(company,btn){\n' +
'  var isBlocked=isCompanyBlocked(company);\n' +
'  if(isBlocked){\n' +
'    fetch("/api/blocklist",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"companies",value:company})});\n' +
'    blocklist.companies=blocklist.companies.filter(function(c){return _blocklistName(c).toLowerCase()!==company.toLowerCase();});\n' +
'    btn.innerHTML=\'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Block company\';\n' +
'    return;\n' +
'  }\n' +
'  openBlockModal(company);\n' +
'}\n' +
'\n' +
'var _blockModalCompany="";\n' +
'var _blockModalReason="";\n' +
'function openBlockModal(company){\n' +
'  _blockModalCompany=company||"";_blockModalReason="";\n' +
'  _g("block-warning").innerHTML="This will permanently block <strong>"+escHtml(_blockModalCompany)+"</strong> from appearing in future leads.";\n' +
'  document.querySelectorAll("#block-pills .reason-pill").forEach(function(p){p.classList.remove("active-red");});\n' +
'  _g("block-confirm-btn").disabled=true;\n' +
'  _g("block-overlay").classList.add("open");\n' +
'}\n' +
'function closeBlockModal(){_g("block-overlay").classList.remove("open");}\n' +
'function selectBlockReason(el){\n' +
'  _blockModalReason=el.getAttribute("data-reason")||"";\n' +
'  document.querySelectorAll("#block-pills .reason-pill").forEach(function(p){p.classList.remove("active-red");});\n' +
'  el.classList.add("active-red");\n' +
'  _g("block-confirm-btn").disabled=!_blockModalReason;\n' +
'}\n' +
'function confirmBlockModal(){\n' +
'  if(!_blockModalReason) return;\n' +
'  var company=_blockModalCompany,reason=_blockModalReason;\n' +
'  closeBlockModal();\n' +
'  fetch("/api/blocklist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"companies",value:company,reason:reason})});\n' +
'  blocklist.companies.push({company:company,reason:reason,at:new Date().toISOString()});\n' +
'  var rm=[];\n' +
'  leads.forEach(function(l){\n' +
'    if(l.company.toLowerCase()===company.toLowerCase()){\n' +
'      rm.push(getSafeId(l.id));\n' +
'      fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:l.id,updates:{blockReason:reason}})}).catch(function(){});\n' +
'    }\n' +
'  });\n' +
'  leads=leads.filter(function(l){return l.company.toLowerCase()!==company.toLowerCase();});\n' +
'  rm.forEach(function(sid){var c=_g("card-"+sid);if(c){c.style.opacity="0";c.style.transition="opacity 0.3s";setTimeout(function(){c.remove();},300);}});\n' +
'  updateLeadCount();\n' +
'  refreshArchiveBadge();\n' +
'}\n' +
'\n' +
'var _skipModalSafeId="",_skipModalRealId="",_skipModalReason="";\n' +
'function openSkipModal(safeId,realId){\n' +
'  _skipModalSafeId=safeId;_skipModalRealId=realId;_skipModalReason="";\n' +
'  var lead=leads.find(function(l){return l.id===realId;});\n' +
'  var cn=lead?lead.company:"",jt=lead?cleanJobTitle(lead.jobTitle||""):"";\n' +
'  _g("skip-target").innerHTML="<strong>"+escHtml(cn)+"</strong><br>"+escHtml(jt);\n' +
'  document.querySelectorAll("#skip-pills .reason-pill").forEach(function(p){p.classList.remove("active");});\n' +
'  _g("skip-confirm-btn").disabled=true;\n' +
'  _g("skip-overlay").classList.add("open");\n' +
'}\n' +
'function closeSkipModal(){_g("skip-overlay").classList.remove("open");}\n' +
'function selectSkipReason(el){\n' +
'  _skipModalReason=el.getAttribute("data-reason")||"";\n' +
'  document.querySelectorAll("#skip-pills .reason-pill").forEach(function(p){p.classList.remove("active");});\n' +
'  el.classList.add("active");\n' +
'  _g("skip-confirm-btn").disabled=!_skipModalReason;\n' +
'}\n' +
'function confirmSkipModal(){\n' +
'  if(!_skipModalReason) return;\n' +
'  var safeId=_skipModalSafeId,realId=_skipModalRealId,reason=_skipModalReason;\n' +
'  closeSkipModal();\n' +
'  skipLead(safeId,realId,reason);\n' +
'}\n' +
'\n' +
'function skipLead(safeId,realId,reason){\n' +
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
'  var pRealId=realId,pLead=lead,pReason=reason||"";\n' +
'  window._skipUndo=function(){\n' +
'    _skipUndone=true;clearTimeout(_skipTimer);hideToast();\n' +
'    if(pLead)leads.push(pLead);\n' +
'    updateLeadCount();\n' +
'    if(cardHTML&&cardParent){var tmp=document.createElement("div");tmp.innerHTML=cardHTML;var r=tmp.firstChild;r.style.opacity="0";r.style.transition="opacity 0.3s";if(cardNext&&cardNext.parentNode===cardParent)cardParent.insertBefore(r,cardNext);else cardParent.appendChild(r);setTimeout(function(){r.style.opacity="1";},10);fetchLogo(pLead.company,pLead.employerWebsite||"",pLead.location||"",getSafeId(pLead.id));}\n' +
'  };\n' +
'  setTimeout(function(){if(!_skipUndone){var upd={status:"skipped",skippedAt:new Date().toISOString()};if(pReason)upd.skipReason=pReason;fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pRealId,updates:upd})}).then(function(){refreshArchiveBadge();});}},5200);\n' +
'}\n' +
'function undoSkip(){if(window._skipUndo)window._skipUndo();}\n' +
'\n' +
'var _archiveDays=1;\n' +
'function _catClass(c){var m={engineering:"archive-cat-engineering",it:"archive-cat-it",accounting:"archive-cat-accounting",other:"archive-cat-other"};return m[c]||"archive-cat-other";}\n' +
'function _fmtArchiveDate(ms){if(!ms)return"";var d=new Date(ms);return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});}\n' +
'function openArchiveModal(){_g("archive-overlay").classList.add("open");loadArchive(_archiveDays);}\n' +
'function closeArchiveModal(){_g("archive-overlay").classList.remove("open");}\n' +
'async function loadArchive(days){\n' +
'  _archiveDays=days;\n' +
'  [1,3,7].forEach(function(d){var el=_g("arch-pill-"+d);if(el)el.classList.toggle("active",d===days);});\n' +
'  var body=_g("archive-body");body.innerHTML=\'<div class="archive-empty">Loading...</div>\';\n' +
'  try{\n' +
'    var r=await fetch("/api/leads?view=archive&am="+encodeURIComponent(AM.email)+"&days="+days);\n' +
'    var d=await r.json();\n' +
'    renderArchive(d.skipped||[],d.blocked||[]);\n' +
'  }catch(e){body.innerHTML=\'<div class="archive-empty">Failed to load.</div>\';}\n' +
'}\n' +
'function renderArchive(skipped,blocked){\n' +
'  var h="";\n' +
'  if(AM.role==="admin"){\n' +
'    h+=\'<div class="archive-toolbar"><label class="hide-viewed-toggle"><input type="checkbox" id="hide-viewed-cb" \'+(_archiveHideViewed?"checked":"")+\' onchange="toggleHideViewed(this)"> Hide viewed</label></div>\';\n' +
'  }\n' +
'  h+=\'<div class="archive-section-title">Skipped</div>\';\n' +
'  if(!skipped.length){h+=\'<div class="archive-empty">Nothing skipped in this period</div>\';}\n' +
'  else{h+=skipped.map(function(l){return _archiveRow(l,"skipped");}).join("");}\n' +
'  h+=\'<div class="archive-section-title">Blocked</div>\';\n' +
'  if(!blocked.length){h+=\'<div class="archive-empty">Nothing blocked in this period</div>\';}\n' +
'  else{h+=blocked.map(function(l){return _archiveRow(l,"blocked");}).join("");}\n' +
'  _g("archive-body").innerHTML=h;\n' +
'  if(AM.role==="admin" && _archiveHideViewed){\n' +
'    document.querySelectorAll(".archive-row").forEach(function(row){\n' +
'      var id=row.getAttribute("data-lead-id")||"";\n' +
'      if(id && adminViewedSet[id]) row.style.display="none";\n' +
'    });\n' +
'  }\n' +
'}\n' +
'function _archiveRow(l,kind){\n' +
'  var safeId=getSafeId(l.id);\n' +
'  var cat=l.category||"other";\n' +
'  var companyEsc=escHtml(l.company||"");\n' +
'  var titleEsc=escHtml(cleanJobTitle(l.jobTitle||""));\n' +
'  var date=_fmtArchiveDate(l._dateMs||l.createdAt||0);\n' +
'  var action=kind==="skipped"\n' +
'    ? \'<button class="btn-archive-action" id="arch-act-\'+safeId+\'" onclick="undoSkipFromArchive(\\\'\'+l.id+\'\\\')">Undo Skip</button>\'\n' +
'    : \'<button class="btn-archive-action" id="arch-act-\'+safeId+\'" onclick="unblockFromArchive(\\\'\'+l.id+\'\\\')">Unblock</button>\';\n' +
'  var markBtn="";\n' +
'  var viewedClass="";\n' +
'  if(AM.role==="admin"){\n' +
'    var isMarked = !!adminViewedSet[l.id];\n' +
'    viewedClass = isMarked ? " viewed" : "";\n' +
'    markBtn = \'<button class="btn-archive-mark\'+(isMarked?" marked":"")+\'" id="arch-mark-\'+safeId+\'" onclick="adminToggleViewed(\\\'\'+l.id+\'\\\',this)">\'+(isMarked?"Viewed":"Mark as Viewed")+\'</button>\';\n' +
'  }\n' +
'  return \'<div class="archive-row\'+viewedClass+\'" id="arch-row-\'+safeId+\'" data-lead-id="\'+escHtml(l.id)+\'">\'+\n' +
'    \'<div class="archive-row-main">\'+\n' +
'      \'<div class="archive-row-company">\'+companyEsc+\'</div>\'+\n' +
'      \'<div class="archive-row-title">\'+titleEsc+\'</div>\'+\n' +
'      \'<div class="archive-row-meta"><span class="archive-cat-pill \'+_catClass(cat)+\'">\'+cat+\'</span><span class="archive-date">\'+date+\'</span></div>\'+\n' +
'    \'</div>\'+\n' +
'    markBtn+\n' +
'    action+\n' +
'  \'</div>\';\n' +
'}\n' +
'async function undoSkipFromArchive(leadId){\n' +
'  var safeId=getSafeId(leadId);\n' +
'  var btn=_g("arch-act-"+safeId);if(btn){btn.disabled=true;btn.textContent="Restoring...";}\n' +
'  try{\n' +
'    var r=await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:"retrieve"})});\n' +
'    var d=await r.json();if(!d.ok)throw new Error(d.error||"failed");\n' +
'    var row=_g("arch-row-"+safeId);if(row)row.remove();\n' +
'    if(d.lead)_prependLead(d.lead);\n' +
'    refreshArchiveBadge();\n' +
'    showToast("Skip undone",2000);\n' +
'  }catch(e){if(btn){btn.disabled=false;btn.textContent="Undo Skip";}showToast("Failed to undo skip",3000);}\n' +
'}\n' +
'async function unblockFromArchive(leadId){\n' +
'  var safeId=getSafeId(leadId);\n' +
'  var btn=_g("arch-act-"+safeId);if(btn){btn.disabled=true;btn.textContent="Unblocking...";}\n' +
'  try{\n' +
'    var r=await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:"unblock"})});\n' +
'    var d=await r.json();if(!d.ok)throw new Error(d.error||"failed");\n' +
'    if(Array.isArray(d.blocklist))blocklist.companies=d.blocklist;\n' +
'    var row=_g("arch-row-"+safeId);if(row)row.remove();\n' +
'    if(d.lead)_prependLead(d.lead);\n' +
'    refreshArchiveBadge();\n' +
'    showToast("Company unblocked",2000);\n' +
'  }catch(e){if(btn){btn.disabled=false;btn.textContent="Unblock";}showToast("Failed to unblock",3000);}\n' +
'}\n' +
'function _prependLead(lead){\n' +
'  if(!lead||leads.some(function(l){return l.id===lead.id;}))return;\n' +
'  leads.unshift(lead);updateLeadCount();\n' +
'  if(typeof renderLeads==="function")renderLeads();\n' +
'}\n' +
'async function refreshArchiveBadge(){\n' +
'  try{\n' +
'    var r=await fetch("/api/leads?view=archive&am="+encodeURIComponent(AM.email)+"&days=1");\n' +
'    var d=await r.json();\n' +
'    var count=((d.skipped||[]).length)+((d.blocked||[]).length);\n' +
'    var b=_g("archive-badge");if(!b)return;\n' +
'    if(count>0){b.textContent=count>99?"99+":count;b.style.display="flex";}else{b.style.display="none";}\n' +
'  }catch(e){}\n' +
'}\n' +
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
'  if(!lead && AM.role==="admin") lead=(allLeadsCache||[]).find(function(l){return l.id===realId;});\n' +
'  _g("reassign-title").textContent="Reassign Lead"+(lead?" - "+lead.company:"");\n' +
'  var body=_g("reassign-body");\n' +
'  var list = AM_NAMES.map(function(name){\n' +
'    return \'<div class="reassign-item"><span>\'+ name +\'</span><button class="reassign-btn" onclick="reassignLead(\\\'\'+name.replace(/\x27/g,"\\\\\\x27")+\'\\\')">Reassign</button></div>\';\n' +
'  }).join("");\n' +
'  var noteField = \'<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);">\'+\n' +
'    \'<label style="display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-family:Raleway,sans-serif;">Add a note for the AM (optional)</label>\'+\n' +
'    \'<textarea id="reassign-note" rows="3" placeholder="e.g. This is an existing client - check SmartSearch before reaching out" style="width:100%;background:#1f1f1f;border:1px solid #333;color:#fff;padding:8px 10px;border-radius:6px;font-family:Raleway,sans-serif;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>\'+\n' +
'  \'</div>\';\n' +
'  body.innerHTML = list + noteField;\n' +
'  _g("reassign-overlay").classList.add("open");\n' +
'}\n' +
'function closeReassignModal(){_g("reassign-overlay").classList.remove("open");}\n' +
'\n' +
'function reassignLead(amName) {\n' +
'  var noteEl=_g("reassign-note");\n' +
'  var note = noteEl ? (noteEl.value||"").trim() : "";\n' +
'  var leadId = _reassignRealId;\n' +
'  var fromInactivity = (currentTab === "inactivity");\n' +
'  closeReassignModal();\n' +
'  var lead = (AM.role==="admin" ? (allLeadsCache||leads) : leads).find(function(l){ return l.id===leadId; });\n' +
'  var updates = { assignedAM: amName };\n' +
'  if(fromInactivity && lead && lead.status === "new") updates.status = "pending";\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,updates:updates,reassign_reason:"manual"})}).then(function(){\n' +
'    if(note){ fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:"add_note",message:note,authorEmail:AM.email,authorName:AM.name||""})}).catch(function(){}); }\n' +
'  }).catch(function(){});\n' +
'  var card=_g("card-"+_reassignSafeId);\n' +
'  if(card){card.style.opacity="0";card.style.transition="opacity 0.3s";setTimeout(function(){card.remove();},300);}\n' +
'  leads=leads.filter(function(l){return l.id!==leadId;});\n' +
'  if(fromInactivity){\n' +
'    _reassignedFromQueue[leadId] = true;\n' +
'    delete _inactivitySelected[leadId];\n' +
'    if(lead){ lead.assignedAM = amName; lead.assignedAMEmail = ""; if(updates.status) lead.status = updates.status; }\n' +
'    setTimeout(function(){ renderInactivityView(); }, 320);\n' +
'  }\n' +
'  updateLeadCount();\n' +
'  showToast("Lead reassigned to "+amName+(note?" with a note":""),3000);\n' +
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
'    if(el.classList && el.classList.contains("has-tooltip"))return;\n' +
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
'  // Register metadata\n' +
'  window._leadJobTitles=window._leadJobTitles||{};\n' +
'  window._leadCategories=window._leadCategories||{};\n' +
'  window._leadRedisIds=window._leadRedisIds||{};\n' +
'  window._leadJobTitles[safeId]=lead.jobTitle||"";\n' +
'  window._leadCategories[safeId]=lead.category||"engineering";\n' +
'  window._leadRedisIds[safeId]=lead.id||"";\n' +
'  // Find placeholder card\n' +
'  var card=_g(oldCardId);\n' +
'  if(card) card.setAttribute("data-lead-redis-id",lead.id||"");\n' +
'  console.log("[AddLead] placeholder lookup:",oldCardId,"| found:",!!card);\n' +
'  if(!card) return;\n' +
'  // Render the full card into a temp div\n' +
'  var html=renderCard(lead);\n' +
'  var temp=document.createElement("div");\n' +
'  temp.innerHTML=html;\n' +
'  var rendered=temp.firstChild;\n' +
'  // Copy innerHTML from rendered card into the placeholder (keep same DOM node)\n' +
'  card.innerHTML=rendered.innerHTML;\n' +
'  // Copy class and data attributes from rendered card\n' +
'  card.className=rendered.className;\n' +
'  if(rendered.id) card.id=rendered.id;\n' +
'  // Copy all data-* attributes\n' +
'  Array.from(rendered.attributes).forEach(function(attr){\n' +
'    if(attr.name.indexOf("data-")===0||attr.name==="style") card.setAttribute(attr.name,attr.value);\n' +
'  });\n' +
'  // Remove any leftover spinner overlay\n' +
'  var ov=card.querySelector(".card-loading-overlay");\n' +
'  if(ov) ov.remove();\n' +
'  // Force visible\n' +
'  card.style.display="block";\n' +
'  card.style.position="";\n' +
'  void card.offsetHeight;\n' +
'  console.log("[AddLead] Card updated in place | id:",card.id,"| height:",card.offsetHeight,"| children:",card.children.length);\n' +
'  card.scrollIntoView({behavior:"smooth",block:"start"});\n' +
'  // Fetch logo\n' +
'  var logoUrl=lead.company_logo_apollo||lead.company_logo||"";\n' +
'  fetchLogo(lead.company,lead.company_domain||lead.company_website||"",lead.location||"",safeId,logoUrl);\n' +
'  updateLeadCount();\n' +
'}\n';
html += '' +
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
'  showToast("Adding lead - finding contacts...",30000);\n' +
'  var r=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_lead",jobTitle:title,company:company,location:loc,category:category,jobUrl:jobUrl,description:_addDesc,domain:domain})});\n' +
'  var d=await r.json();\n' +
'  if(d.ok){\n' +
'    var cc=d.lead?(d.lead.contacts||[]).length:0;\n' +
'    showToast("Lead added: "+company+" ("+cc+" contacts) - refreshing...",2000);\n' +
'    if(d.leadId) localStorage.setItem("scrollToCard","card-"+getSafeId(d.leadId));\n' +
'    setTimeout(function(){window.location.reload();},1000);\n' +
'  }else{\n' +
'    showToast("Error: "+(d.error||"Failed to add lead"),3000);\n' +
'  }\n' +
'  }catch(e){\n' +
'    showToast("Error: "+e.message,3000);\n' +
'  }\n' +
'}\n' +
'\n' +
'/* ===== Domain Popup/Edit ===== */\n' +
'var SVG_PENCIL = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>\';\n' +
'var _domainPopupLock = false;\n' +
'function showDomainPopup(wrap, safeId, domain) {\n' +
'  if (_domainPopupLock) return;\n' +
'  if (wrap.querySelector(".domain-edit-box")) return;\n' +
'  var existing = wrap.querySelector(".domain-popup");\n' +
'  if (existing) return;\n' +
'  var popup = document.createElement("div");\n' +
'  popup.className = "domain-popup";\n' +
'  popup.innerHTML = \'<span class="domain-popup-text">\' + domain + \'</span><button class="domain-popup-edit" onclick="event.preventDefault();event.stopPropagation();openDomainEdit(this.closest(\\\'.domain-wrap\\\'),\\\'\' + safeId + \'\\\',\\\'\' + domain + \'\\\')" title="Edit domain">\' + SVG_PENCIL + \'</button>\';\n' +
'  popup.addEventListener("mouseenter", function(){ wrap._hoverLock=true; });\n' +
'  popup.addEventListener("mouseleave", function(){ wrap._hoverLock=false; hideDomainPopup(wrap); });\n' +
'  wrap.appendChild(popup);\n' +
'}\n' +
'function hideDomainPopup(wrap) {\n' +
'  setTimeout(function(){\n' +
'    if(wrap._hoverLock) return;\n' +
'    var p = wrap.querySelector(".domain-popup");\n' +
'    if(p) p.remove();\n' +
'  }, 150);\n' +
'}\n' +
'function openDomainEdit(wrap, safeId, domain) {\n' +
'  _domainPopupLock = true;\n' +
'  var popup = wrap.querySelector(".domain-popup");\n' +
'  if(popup) popup.remove();\n' +
'  var box = document.createElement("div");\n' +
'  box.className = "domain-edit-box";\n' +
'  box.innerHTML = \'<input class="domain-edit-input" id="domain-input-\' + safeId + \'" value="\' + domain + \'"><button class="domain-edit-btn domain-edit-save" onclick="saveDomain(\\\'\' + safeId + \'\\\',false)">Save</button><button class="domain-edit-btn domain-edit-reload" onclick="saveDomain(\\\'\' + safeId + \'\\\',true)">Save &amp; Reload</button><button class="domain-edit-btn domain-edit-cancel" onclick="closeDomainEdit(this.closest(\\\'.domain-wrap\\\'))">Cancel</button>\';\n' +
'  wrap.appendChild(box);\n' +
'  var inp = _g("domain-input-" + safeId);\n' +
'  if(inp) { inp.focus(); inp.select(); }\n' +
'}\n' +
'function closeDomainEdit(wrap) {\n' +
'  var box = wrap.querySelector(".domain-edit-box");\n' +
'  if(box) box.remove();\n' +
'  _domainPopupLock = false;\n' +
'}\n' +
'async function saveDomain(safeId, reenrich) {\n' +
'  var inp = _g("domain-input-" + safeId);\n' +
'  if(!inp) return;\n' +
'  var newDomain = inp.value.replace(/^https?:\\/\\//, "").replace(/^www\\./, "").replace(/\\/.*$/, "").trim().toLowerCase();\n' +
'  if(!newDomain) { showToast("Enter a domain", 2000); return; }\n' +
'  var wrap = inp.closest(".domain-wrap");\n' +
'  var box = wrap.querySelector(".domain-edit-box");\n' +
'  // Find lead ID from card\n' +
'  var card = wrap.closest(".card");\n' +
'  var leadId = "";\n' +
'  for(var i=0;i<leads.length;i++){ if("card-"+getSafeId(leads[i].id)===card.id){ leadId=leads[i].id; break; } }\n' +
'  if(!leadId){ showToast("Lead not found",2000); return; }\n' +
'  // Show loading state\n' +
'  if(box) box.innerHTML = \'<div class="domain-edit-loading"><div class="add-spinner"></div><span>\' + (reenrich ? "Saving & re-enriching..." : "Saving...") + \'</span></div>\';\n' +
'  try {\n' +
'    var r = await fetch("/api/leads", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: leadId, action: "update_domain", domain: newDomain, reenrich: reenrich }) });\n' +
'    var d = await r.json();\n' +
'    if(!d.ok) { showToast("Error: " + (d.error||"Failed"), 3000); closeDomainEdit(wrap); return; }\n' +
'    // Update local lead data\n' +
'    for(var i=0;i<leads.length;i++){\n' +
'      if(leads[i].id===leadId){\n' +
'        leads[i] = d.lead;\n' +
'        break;\n' +
'      }\n' +
'    }\n' +
'    // Update the globe link href\n' +
'    var globe = wrap.querySelector(".link-icon");\n' +
'    if(globe) globe.href = "https://" + newDomain;\n' +
'    // Refresh logo\n' +
'    fetchLogo(d.lead.company, newDomain, d.lead.location||"", safeId, d.lead.company_logo_apollo||d.lead.company_logo||"");\n' +
'    closeDomainEdit(wrap);\n' +
'    if(reenrich && d.lead.contacts) {\n' +
'      // Re-render contacts on the card\n' +
'      var contactsDiv = _g("contacts-" + safeId);\n' +
'      if(contactsDiv) contactsDiv.innerHTML = "";\n' +
'      activeContacts[safeId] = null;\n' +
'      composerState[safeId] = null;\n' +
'      d.lead.contacts.forEach(function(c){\n' +
'        addContact(safeId,c.full_name||c.name||"",c.job_title||c.title||"",d.lead.company,d.lead.location||"",c.apollo_id||"",{\n' +
'          suggested:true,city:c.city||"",region:c.state||c.region_name||c.region||"",linkedin:c.linkedin||"",\n' +
'          fromCache:false,email:c.email||"",previousJobs:c.previousJobs||[],uniqid:c.uniqid||"",photo_url:c.photo_url||""\n' +
'        });\n' +
'      });\n' +
'      // Update LinkedIn link if available\n' +
'      if(d.lead.company_linkedin){\n' +
'        var liLink = card.querySelector(".links-bar-left .link-icon[style*=\\"0077B5\\"]");\n' +
'        if(liLink) { var liUrl=d.lead.company_linkedin; if(liUrl.indexOf("http")!==0)liUrl="https://"+liUrl; liLink.href=liUrl; }\n' +
'      }\n' +
'      showToast("Company updated - reloading...", 2000);\n' +
'      localStorage.setItem("scrollToCard", card.id);\n' +
'      setTimeout(function(){ window.location.reload(); }, 1000);\n' +
'    } else {\n' +
'      showToast("Domain updated to " + newDomain, 2000);\n' +
'    }\n' +
'  } catch(e) {\n' +
'    showToast("Error: " + e.message, 3000);\n' +
'    closeDomainEdit(wrap);\n' +
'  }\n' +
'}\n' +
'\n' +
'/* ===== Tab Switching ===== */\n' +
'var currentTab = "leads";\n' +
'function switchTab(tab) {\n' +
'  currentTab = tab;\n' +
'  try { sessionStorage.setItem("activeTab", tab); } catch(e) {}\n' +
'  _g("tab-leads").classList.toggle("active", tab === "leads");\n' +
'  _g("tab-analytics").classList.toggle("active", tab === "analytics");\n' +
'  var inactTab=_g("tab-inactivity"); if(inactTab) inactTab.classList.toggle("active", tab === "inactivity");\n' +
'  _g("leads-view").style.display = tab === "leads" ? "block" : "none";\n' +
'  _g("analytics-view").classList.toggle("visible", tab === "analytics");\n' +
'  var inactView=_g("inactivity-view"); if(inactView) inactView.style.display = tab === "inactivity" ? "block" : "none";\n' +
'  var filterBar=_g("admin-filter-bar"); if(filterBar && AM.role==="admin") filterBar.style.display = tab === "leads" ? "flex" : "none";\n' +
'  var sb=_g("am-scoreboard"); if(sb && AM.role !== "admin") sb.style.display = tab === "leads" ? "flex" : "none";\n' +
'  // Avoid duplicate DOM ids across tabs: both Leads and Inactivity\n' +
'  // render cards with identical `card-<safeId>` / `logo-<sid>` /\n' +
'  // `contacts-<sid>` ids. When both card sets live in the DOM at\n' +
'  // once, document.getElementById returns the FIRST match, which\n' +
'  // is the hidden Leads tab (declared before Inactivity in markup).\n' +
'  // That silently breaks fetchLogo + addContact hydration on the\n' +
'  // visible Inactivity tab. Clear the inactive tab\'s container on\n' +
'  // every switch.\n' +
'  if (tab !== "leads") { var lc = _g("leads-container"); if (lc) lc.innerHTML = ""; }\n' +
'  if (tab !== "inactivity") { var ic = _g("inactivity-container"); if (ic) ic.innerHTML = ""; }\n' +
'  if (tab === "analytics" && !analyticsLoaded) { loadAnalytics(); }\n' +
'  if (tab === "inactivity") { renderInactivityView(); }\n' +
'  if (tab === "leads") { renderLeads(); }\n' +
'}\n' +
'function restoreActiveTabFromSession() {\n' +
'  var saved = null;\n' +
'  try { saved = sessionStorage.getItem("activeTab"); } catch(e) { saved = null; }\n' +
'  if (!saved || saved === "leads") return; // leads is the page default\n' +
'  if (saved === "inactivity" && AM.role !== "admin") return; // only admins see that tab\n' +
'  switchTab(saved);\n' +
'}\n' +
'\n' +
'/* ===== Admin filter bar ===== */\n' +
'var allLeadsCache = [];\n' +
'var adminViewedSet = {};\n' +
'var adminFilters = { am: "", category: "", location: "", status: "" };\n' +
'var _filterDDOptions = {\n' +
'  am: [{v:"",l:"All"}],\n' +
'  category: [{v:"",l:"All"},{v:"engineering",l:"Engineering"},{v:"it",l:"IT"},{v:"accounting",l:"Accounting"},{v:"other",l:"Other"}],\n' +
'  location: [{v:"",l:"All"},{v:"michigan",l:"Michigan"},{v:"florida",l:"Florida"},{v:"other",l:"Other"}],\n' +
'  status: [{v:"",l:"All"},{v:"new",l:"New"},{v:"pending",l:"Pending"},{v:"in_progress",l:"In Progress"},{v:"awaiting_followup",l:"Awaiting Follow-up"},{v:"skipped",l:"Skipped"},{v:"blocked",l:"Blocked"},{v:"completed",l:"Completed"},{v:"closed",l:"Closed"}]\n' +
'};\n' +
'var _filterKinds = ["am","category","location","status"];\n' +
'function _filterKey(kind){ return kind==="category"?"category":(kind==="location"?"location":(kind==="status"?"status":"am")); }\n' +
'function _ddLabelFor(kind, value) {\n' +
'  var opts = _filterDDOptions[kind] || [];\n' +
'  for (var i=0;i<opts.length;i++){ if(opts[i].v === (value||"")) return opts[i].l; }\n' +
'  return "All";\n' +
'}\n' +
'function _renderFilterPanel(kind) {\n' +
'  var panel = _g("panel-"+kind); if(!panel) return;\n' +
'  var opts = _filterDDOptions[kind] || [];\n' +
'  var cur = adminFilters[kind] || "";\n' +
'  panel.innerHTML = opts.map(function(o){\n' +
'    var sel = (o.v === cur) ? " selected" : "";\n' +
'    var esc = function(s){ return String(s).replace(/\\\\/g,"\\\\\\\\").replace(/\'/g,"\\\\\'"); };\n' +
'    return \'<div class="custom-dd-opt\'+sel+\'" onclick="setFilterValue(\\\'\'+kind+\'\\\',\\\'\'+esc(o.v)+\'\\\',\\\'\'+esc(o.l)+\'\\\')">\'+o.l+\'</div>\';\n' +
'  }).join("");\n' +
'}\n' +
'function _syncFilterTrigger(kind) {\n' +
'  var lbl=_g("lbl-"+kind); if(lbl) lbl.textContent = _ddLabelFor(kind, adminFilters[kind]||"");\n' +
'  var dd=_g("dd-"+kind); if(dd) dd.classList.toggle("active", !!adminFilters[kind]);\n' +
'}\n' +
'function populateAmFilterOptions() {\n' +
'  var names = (typeof AM_NAMES !== "undefined" && AM_NAMES) ? AM_NAMES.slice() : [];\n' +
'  if(names.indexOf("Mark Sapoznikov") === -1) names.unshift("Mark Sapoznikov");\n' +
'  names.sort();\n' +
'  _filterDDOptions.am = [{v:"",l:"All"}].concat(names.map(function(n){return {v:n,l:n};}));\n' +
'  _filterKinds.forEach(function(k){ _renderFilterPanel(k); _syncFilterTrigger(k); });\n' +
'}\n' +
'function toggleFilterDD(kind, evt) {\n' +
'  if(evt){ evt.stopPropagation(); evt.preventDefault(); }\n' +
'  var dd=_g("dd-"+kind); if(!dd) return;\n' +
'  var wasOpen = dd.classList.contains("open");\n' +
'  closeAllFilterDDs();\n' +
'  if(!wasOpen) dd.classList.add("open");\n' +
'}\n' +
'function closeAllFilterDDs() {\n' +
'  document.querySelectorAll(".custom-dd.open").forEach(function(el){ el.classList.remove("open"); });\n' +
'}\n' +
'function setFilterValue(kind, value, label) {\n' +
'  adminFilters[kind] = value || "";\n' +
'  var lbl=_g("lbl-"+kind); if(lbl) lbl.textContent = label || "All";\n' +
'  var dd=_g("dd-"+kind); if(dd) dd.classList.toggle("active", !!adminFilters[kind]);\n' +
'  _renderFilterPanel(kind);\n' +
'  closeAllFilterDDs();\n' +
'  writeAdminFiltersToUrl();\n' +
'  renderLeads();\n' +
'}\n' +
'document.addEventListener("click", function(e){ if(!e.target.closest(".custom-dd")) closeAllFilterDDs(); });\n' +
'function readAdminFiltersFromUrl() {\n' +
'  adminFilters.am=_params.get("f_am")||"";\n' +
'  adminFilters.category=_params.get("f_cat")||"";\n' +
'  adminFilters.location=_params.get("f_loc")||"";\n' +
'  adminFilters.status=_params.get("f_status")||"";\n' +
'  _filterKinds.forEach(function(k){ _renderFilterPanel(k); _syncFilterTrigger(k); });\n' +
'}\n' +
'function writeAdminFiltersToUrl() {\n' +
'  var u=new URL(window.location.href);\n' +
'  ["f_am","f_cat","f_loc","f_status"].forEach(function(k){u.searchParams.delete(k);});\n' +
'  if(adminFilters.am) u.searchParams.set("f_am", adminFilters.am);\n' +
'  if(adminFilters.category) u.searchParams.set("f_cat", adminFilters.category);\n' +
'  if(adminFilters.location) u.searchParams.set("f_loc", adminFilters.location);\n' +
'  if(adminFilters.status) u.searchParams.set("f_status", adminFilters.status);\n' +
'  window.history.replaceState({}, "", u.toString());\n' +
'}\n' +
'function _leadLocationBucket(l) {\n' +
'  var loc=(l.location||"").toLowerCase();\n' +
'  if(loc.indexOf("michigan")!==-1 || /,\\s*mi\\b/.test(loc)) return "michigan";\n' +
'  if(loc.indexOf("florida")!==-1 || /,\\s*fl\\b/.test(loc)) return "florida";\n' +
'  return "other";\n' +
'}\n' +
'function applyFilterToLeads(src) {\n' +
'  if(AM.role!=="admin") return src;\n' +
'  return src.filter(function(l){\n' +
'    if(adminFilters.am && (l.assignedAM||"") !== adminFilters.am) return false;\n' +
'    if(adminFilters.category && (l.category||"").toLowerCase() !== adminFilters.category) return false;\n' +
'    if(adminFilters.location && _leadLocationBucket(l) !== adminFilters.location) return false;\n' +
'    if(adminFilters.status && (l.status||"") !== adminFilters.status) return false;\n' +
'    return true;\n' +
'  });\n' +
'}\n' +
'function applyAdminFilters() {\n' +
'  // Kept for back-compat; custom dropdowns call setFilterValue directly.\n' +
'  writeAdminFiltersToUrl();\n' +
'  renderLeads();\n' +
'}\n' +
'function clearAdminFilters() {\n' +
'  adminFilters={am:"",category:"",location:"",status:""};\n' +
'  _filterKinds.forEach(function(k){ _renderFilterPanel(k); _syncFilterTrigger(k); });\n' +
'  writeAdminFiltersToUrl();\n' +
'  renderLeads();\n' +
'}\n' +
'\n' +
'/* ===== Inactivity Queue ===== */\n' +
'function _formatShortDate(v) {\n' +
'  if(!v) return "";\n' +
'  try{ var d=new Date(v); if(isNaN(d.getTime())) return ""; return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); }catch(e){ return ""; }\n' +
'}\n' +
'function _hasInactivityHistory(l) {\n' +
'  if(!Array.isArray(l.assignment_history)) return false;\n' +
'  return l.assignment_history.some(function(h){ return (h.reassign_reason||"").indexOf("inactivity") !== -1; });\n' +
'}\n' +
'function _clientBizDaysBetween(a, b) {\n' +
'  var count=0; var d=new Date(a);\n' +
'  while(d < b){ d.setDate(d.getDate()+1); var day=d.getDay(); if(day !== 0 && day !== 6) count++; }\n' +
'  return count;\n' +
'}\n' +
'var _reassignedFromQueue = {};\n' +
'function _inactivityQueueEligible(l) {\n' +
'  var co = l.company || "";\n' +
'  var hasOutreach = l.outreach_log && typeof l.outreach_log === "object" && Object.keys(l.outreach_log).length > 0;\n' +
'  var contactRemoved = Array.isArray(l.contacts) && l.contacts.some(function(c){ return c && c.removal_reason; });\n' +
'  function _dbg(ok, reason){\n' +
'    try {\n' +
'      console.log(\'[InactQueue] eligible: \'+ok+\' | \'+co+\' | \'+reason+\' | id=\'+l.id+\' status=\'+(l.status||"")+\' outreach=\'+hasOutreach+\' contactRemoved=\'+contactRemoved+\' skippedAt=\'+(l.skippedAt||"-")+\' retrievedAt=\'+(l.retrievedAt||"-")+\' blockReason=\'+(l.blockReason||"-"));\n' +
'    } catch(e){}\n' +
'  }\n' +
'  if(!_hasInactivityHistory(l)){ _dbg(false,"no_inactivity_history"); return false; }\n' +
'  if(_reassignedFromQueue[l.id]){ _dbg(false,"reassigned_this_session"); return false; }\n' +
'  if(l.reassignedFromInactivityQueue){ _dbg(false,"reassigned_persisted_flag"); return false; }\n' +
'  var st = l.status || "";\n' +
'  if(st !== "new" && st !== "pending"){ _dbg(false,"status_not_new_or_pending"); return false; }\n' +
'  if(hasOutreach){ _dbg(false,"has_outreach"); return false; }\n' +
'  if(contactRemoved){ _dbg(false,"contact_removed"); return false; }\n' +
'  var skippedMs = l.skippedAt ? Date.parse(l.skippedAt) : 0;\n' +
'  var retrievedMs = l.retrievedAt ? Date.parse(l.retrievedAt) : 0;\n' +
'  if(skippedMs && !(retrievedMs && retrievedMs > skippedMs)){ _dbg(false,"skipped_without_retrieve"); return false; }\n' +
'  if(l.blockReason){ _dbg(false,"has_block_reason"); return false; }\n' +
'  if(typeof isCompanyBlocked === "function" && isCompanyBlocked(co)){ _dbg(false,"company_blocked"); return false; }\n' +
'  _dbg(true,"pass");\n' +
'  return true;\n' +
'}\n' +
'function _buildInactivityTimeline(l) {\n' +
'  var parts=[];\n' +
'  (l.assignment_history||[]).forEach(function(h,i){\n' +
'    var nm = h.am_name || h.am_email || "Unknown";\n' +
'    var d = _formatShortDate(h.assigned_at);\n' +
'    var reasonTag = (h.reassign_reason||"").indexOf("inactivity")!==-1 ? ", inactivity" : "";\n' +
'    var piece = (i===0 ? nm + " (" + d + ")" : nm + " (" + d + reasonTag + ")");\n' +
'    parts.push(piece);\n' +
'  });\n' +
'  var currentName = l.assignedAM || "(unassigned)";\n' +
'  var currentDate = _formatShortDate(l.assignedAt) || "";\n' +
'  parts.push(currentName + (currentDate ? " (" + currentDate + ", current)" : " (current)"));\n' +
'  return parts.join(" \\u2192 ");\n' +
'}\n' +
'function _lastActivityMs(l) {\n' +
'  var ts=0;\n' +
'  if(l.assignedAt){ var a=Date.parse(l.assignedAt); if(!isNaN(a) && a>ts) ts=a; }\n' +
'  if(Array.isArray(l.assignment_history)){\n' +
'    l.assignment_history.forEach(function(h){ var p=h.assigned_at?Date.parse(h.assigned_at):0; if(!isNaN(p) && p>ts) ts=p; });\n' +
'  }\n' +
'  if(l.createdAt){ var c=typeof l.createdAt==="number"?l.createdAt:Date.parse(l.createdAt); if(!isNaN(c) && c>ts) ts=c; }\n' +
'  return ts;\n' +
'}\n' +
'var _inactivitySelected = {};\n' +
'var _inactivityList = [];\n' +
'var _inactFilterCategory = "";\n' +
'var _inactFilterLocation = "";\n' +
'var _inactFilterOptions = {\n' +
'  category: [{v:"",l:"All Categories"},{v:"engineering",l:"Engineering"},{v:"it",l:"IT"},{v:"accounting",l:"Accounting"},{v:"other",l:"Other"}],\n' +
'  location: [{v:"",l:"All Locations"},{v:"michigan",l:"Michigan"},{v:"florida",l:"Florida"},{v:"other",l:"Other"}]\n' +
'};\n' +
'function _inactFilterCur(kind){ return kind === "category" ? _inactFilterCategory : _inactFilterLocation; }\n' +
'function _renderInactFilterPanel(kind) {\n' +
'  var panel=_g("ipanel-"+kind); if(!panel) return;\n' +
'  var opts=_inactFilterOptions[kind]||[]; var cur=_inactFilterCur(kind);\n' +
'  var esc=function(s){ return String(s).replace(/\\\\/g,"\\\\\\\\").replace(/\'/g,"\\\\\'"); };\n' +
'  panel.innerHTML = opts.map(function(o){\n' +
'    var sel=(o.v===cur)?" selected":"";\n' +
'    return \'<div class="custom-dd-opt\'+sel+\'" onclick="setInactFilterValue(\\\'\'+kind+\'\\\',\\\'\'+esc(o.v)+\'\\\',\\\'\'+esc(o.l)+\'\\\')">\'+o.l+\'</div>\';\n' +
'  }).join("");\n' +
'}\n' +
'function _syncInactFilterTrigger(kind) {\n' +
'  var lbl=_g("ilbl-"+kind); if(!lbl) return;\n' +
'  var opts=_inactFilterOptions[kind]||[]; var cur=_inactFilterCur(kind);\n' +
'  var match=opts.find(function(o){ return o.v===cur; })||opts[0];\n' +
'  lbl.textContent = match ? match.l : "";\n' +
'  var dd=_g("idd-"+kind); if(dd) dd.classList.toggle("active", !!cur);\n' +
'}\n' +
'function toggleInactFilterDD(kind, evt) {\n' +
'  if(evt){ evt.stopPropagation(); evt.preventDefault(); }\n' +
'  var dd=_g("idd-"+kind); if(!dd) return;\n' +
'  var wasOpen = dd.classList.contains("open");\n' +
'  closeAllFilterDDs();\n' +
'  if(!wasOpen) dd.classList.add("open");\n' +
'}\n' +
'function setInactFilterValue(kind, value, label) {\n' +
'  if(kind === "category") _inactFilterCategory = value || "";\n' +
'  else if(kind === "location") _inactFilterLocation = value || "";\n' +
'  closeAllFilterDDs();\n' +
'  renderInactivityView();\n' +
'}\n' +
'function renderInactivityView() {\n' +
'  var container=_g("inactivity-container"); if(!container) return;\n' +
'  var src = (AM.role==="admin" && allLeadsCache.length) ? allLeadsCache : leads;\n' +
'  var list = src.filter(_inactivityQueueEligible).filter(function(l){\n' +
'    if(_inactFilterCategory && (l.category||"").toLowerCase() !== _inactFilterCategory) return false;\n' +
'    if(_inactFilterLocation && _leadLocationBucket(l) !== _inactFilterLocation) return false;\n' +
'    return true;\n' +
'  }).slice().sort(function(a,b){ return _lastActivityMs(a) - _lastActivityMs(b); });\n' +
'  _inactivityList = list;\n' +
'  // Drop stale selections (leads that no longer qualify)\n' +
'  var visibleIds = {}; list.forEach(function(l){ visibleIds[l.id]=true; });\n' +
'  Object.keys(_inactivitySelected).forEach(function(id){ if(!visibleIds[id]) delete _inactivitySelected[id]; });\n' +
'  _g("inactivity-sub").innerHTML = list.length ? \'<span style="color:#FFA000;font-weight:600;">\' + list.length + \' lead\' + (list.length===1?"":"s") + \' in queue</span>\' : \'<span style="color:#666;">No leads in queue</span>\';\n' +
'  var toolbar = \'<div class="inact-toolbar">\'+\n' +
'    \'<label class="inact-select-all"><input type="checkbox" id="inact-select-all" onchange="toggleInactivitySelectAll(this)"> Select All</label>\'+\n' +
'    \'<div class="custom-dd" id="idd-category"><button class="custom-dd-btn" onclick="toggleInactFilterDD(&apos;category&apos;,event)"><span class="custom-dd-label" id="ilbl-category">All Categories</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="ipanel-category"></div></div>\'+\n' +
'    \'<div class="custom-dd" id="idd-location"><button class="custom-dd-btn" onclick="toggleInactFilterDD(&apos;location&apos;,event)"><span class="custom-dd-label" id="ilbl-location">All Locations</span><span class="custom-dd-chevron">&#9662;</span></button><div class="custom-dd-panel" id="ipanel-location"></div></div>\'+\n' +
'    \'<span class="inact-selected-count" id="inact-selected-count">0 selected</span>\'+\n' +
'    \'<button class="inact-reassign-btn" id="inact-reassign-btn" disabled onclick="openBulkReassignModal()">Reassign Selected</button>\'+\n' +
'  \'</div>\';\n' +
'  if(!list.length){\n' +
'    container.innerHTML = toolbar + \'<div class="empty"><h3>No leads in inactivity queue</h3></div>\';\n' +
'    ["category","location"].forEach(function(k){ _renderInactFilterPanel(k); _syncInactFilterTrigger(k); });\n' +
'    _updateInactivityToolbar();\n' +
'    return;\n' +
'  }\n' +
'  container.innerHTML = toolbar + list.map(function(lead){\n' +
'    var html = renderCard(lead);\n' +
'    var timeline = _buildInactivityTimeline(lead);\n' +
'    var inject = \'<div class="inactivity-timeline"><strong>Assignment history:</strong> \' + escHtml(timeline) + \'</div>\';\n' +
'    html = html.replace(\'<div class="card" id="card-\', \'<div class="card inact-card" id="card-\');\n' +
'    // Inline the checkbox into .card-top-left so it renders with the rest\n' +
'    // of the card (was fragile when injected via DOM API after innerHTML).\n' +
'    var idAttr = escHtml(lead.id);\n' +
'    var checkedAttr = _inactivitySelected[lead.id] ? " checked" : "";\n' +
'    var cbHtml = \'<input type="checkbox" class="inact-card-checkbox" data-lead-id="\'+idAttr+\'"\'+checkedAttr+\' onclick="event.stopPropagation()" onchange="toggleInactivityLead(this.getAttribute(&apos;data-lead-id&apos;), this.checked)">\';\n' +
'    html = html.replace(\'<div class="card-top-left">\', \'<div class="card-top-left">\'+cbHtml);\n' +
'    return html.replace(/<\\/div>\\s*$/, inject + \'</div>\');\n' +
'  }).join("");\n' +
'  postRenderLeads(list);\n' +
'  ["category","location"].forEach(function(k){ _renderInactFilterPanel(k); _syncInactFilterTrigger(k); });\n' +
'  _updateInactivityToolbar();\n' +
'}\n' +
'function toggleInactivityLead(leadId, checked) {\n' +
'  if(checked) _inactivitySelected[leadId]=true; else delete _inactivitySelected[leadId];\n' +
'  _updateInactivityToolbar();\n' +
'}\n' +
'function toggleInactivitySelectAll(el) {\n' +
'  // Only affects currently visible (filtered) rows\n' +
'  _inactivityList.forEach(function(l){\n' +
'    if(el.checked) _inactivitySelected[l.id]=true; else delete _inactivitySelected[l.id];\n' +
'    var sid=getSafeId(l.id); var cardEl=_g("card-"+sid); if(!cardEl) return;\n' +
'    var cb=cardEl.querySelector(".inact-card-checkbox"); if(cb) cb.checked=el.checked;\n' +
'  });\n' +
'  _updateInactivityToolbar();\n' +
'}\n' +
'function _updateInactivityToolbar() {\n' +
'  var n = Object.keys(_inactivitySelected).length;\n' +
'  var ct=_g("inact-selected-count"); if(ct) ct.textContent = n + " selected";\n' +
'  var btn=_g("inact-reassign-btn"); if(btn) btn.disabled = (n === 0);\n' +
'  var sa=_g("inact-select-all"); if(sa) sa.checked = (_inactivityList.length > 0 && n >= _inactivityList.length);\n' +
'}\n' +
'\n' +
'/* ===== Bulk reassign modal ===== */\n' +
'var _bulkReassignInFlight = false;\n' +
'function openBulkReassignModal() {\n' +
'  if(!Object.keys(_inactivitySelected).length) return;\n' +
'  var selectedLeads = _inactivityList.filter(function(l){ return _inactivitySelected[l.id]; });\n' +
'  _g("bulk-reassign-title").textContent = "Reassign " + selectedLeads.length + " lead" + (selectedLeads.length===1?"":"s");\n' +
'  var listHtml = selectedLeads.map(function(l){ return \'<div class="bulk-reassign-row"><strong>\'+escHtml(l.company||"")+\'</strong> &mdash; \'+escHtml(cleanJobTitle(l.jobTitle||""))+\'</div>\'; }).join("");\n' +
'  _g("bulk-reassign-list").innerHTML = listHtml || \'<div class="bulk-reassign-row">No leads selected</div>\';\n' +
'  var amSel=_g("bulk-reassign-am"); amSel.innerHTML = \'<option value="">Select an AM...</option>\' + AM_NAMES.map(function(n){ return \'<option value="\'+escHtml(n)+\'">\'+escHtml(n)+\'</option>\'; }).join("");\n' +
'  _g("bulk-reassign-note").value = "";\n' +
'  _g("bulk-reassign-progress").textContent = "";\n' +
'  _g("bulk-reassign-confirm").disabled = false;\n' +
'  _g("bulk-reassign-overlay").classList.add("open");\n' +
'}\n' +
'function closeBulkReassignModal() {\n' +
'  if(_bulkReassignInFlight) return;\n' +
'  _g("bulk-reassign-overlay").classList.remove("open");\n' +
'}\n' +
'async function submitBulkReassign() {\n' +
'  var amName = _g("bulk-reassign-am").value;\n' +
'  if(!amName){ _g("bulk-reassign-progress").textContent = "Please choose an AM."; return; }\n' +
'  var note = (_g("bulk-reassign-note").value||"").trim();\n' +
'  var selectedIds = Object.keys(_inactivitySelected);\n' +
'  if(!selectedIds.length){ closeBulkReassignModal(); return; }\n' +
'  var progress=_g("bulk-reassign-progress");\n' +
'  var confirmBtn=_g("bulk-reassign-confirm"); confirmBtn.disabled = true;\n' +
'  _bulkReassignInFlight = true;\n' +
'  var i=0;\n' +
'  for (var n=0;n<selectedIds.length;n++){\n' +
'    i=n+1;\n' +
'    var leadId=selectedIds[n];\n' +
'    progress.textContent = "Reassigning " + i + " of " + selectedIds.length + "...";\n' +
'    var lead = (allLeadsCache||leads).find(function(l){return l.id===leadId;});\n' +
'    var updates = { assignedAM: amName };\n' +
'    if(lead && lead.status === "new") updates.status = "pending";\n' +
'    try {\n' +
'      await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,updates:updates,reassign_reason:"manual"})});\n' +
'      if(note) await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:"add_note",message:note,authorEmail:AM.email,authorName:AM.name||""})});\n' +
'      _reassignedFromQueue[leadId] = true;\n' +
'      if(lead){ lead.assignedAM = amName; lead.assignedAMEmail = ""; if(updates.status) lead.status = updates.status; }\n' +
'    } catch(e){ console.error("bulk reassign error for "+leadId+":", e); }\n' +
'  }\n' +
'  progress.textContent = "Refreshing...";\n' +
'  try {\n' +
'    var r=await fetch((AM.role==="admin")?"/api/leads?showAll=1":"/api/leads");\n' +
'    var d=await r.json(); var allLeads=d.leads||[];\n' +
'    if(AM.role==="admin"){ allLeadsCache = allLeads; leads = allLeads; }\n' +
'    else { leads = allLeads.filter(function(l){return(l.assignedAMEmail||"")==AM.email;}); }\n' +
'  } catch(e){ console.error("Refresh after bulk reassign failed:", e); }\n' +
'  _inactivitySelected = {};\n' +
'  _bulkReassignInFlight = false;\n' +
'  _g("bulk-reassign-overlay").classList.remove("open");\n' +
'  showToast("Reassigned " + selectedIds.length + " lead" + (selectedIds.length===1?"":"s") + " to " + amName, 3500);\n' +
'  renderInactivityView();\n' +
'  if(currentTab === "leads") renderLeads();\n' +
'}\n' +
'\n' +
'/* ===== Admin viewed tracking ===== */\n' +
'async function loadAdminViewedSet() {\n' +
'  if(AM.role!=="admin") return;\n' +
'  try {\n' +
'    var r=await fetch("/api/leads?action=admin_viewed&email="+encodeURIComponent(AM.email));\n' +
'    var d=await r.json();\n' +
'    adminViewedSet={};\n' +
'    (d.viewed||[]).forEach(function(id){ adminViewedSet[id]=true; });\n' +
'  } catch(e){ console.error("Admin viewed load error:",e); }\n' +
'}\n' +
'async function adminToggleViewed(leadId, btnEl) {\n' +
'  if(AM.role!=="admin") return;\n' +
'  var isMarked = !!adminViewedSet[leadId];\n' +
'  var action = isMarked ? "admin_unmark_viewed" : "admin_mark_viewed";\n' +
'  try {\n' +
'    await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:action,admin_email:AM.email})});\n' +
'    if(isMarked){ delete adminViewedSet[leadId]; } else { adminViewedSet[leadId]=true; }\n' +
'    var sid=getSafeId(leadId);\n' +
'    var row=_g("arch-row-"+sid);\n' +
'    if(row){ row.classList.toggle("viewed", !!adminViewedSet[leadId]); if(window._archiveHideViewed && adminViewedSet[leadId]) row.style.display="none"; }\n' +
'    if(btnEl){ btnEl.classList.toggle("marked", !!adminViewedSet[leadId]); btnEl.textContent = adminViewedSet[leadId] ? "Viewed" : "Mark as Viewed"; }\n' +
'  } catch(e){ console.error("Admin viewed toggle error:",e); }\n' +
'}\n' +
'var _archiveHideViewed = false;\n' +
'function toggleHideViewed(el) {\n' +
'  _archiveHideViewed = el.checked;\n' +
'  document.querySelectorAll(".archive-row").forEach(function(row){\n' +
'    var id=row.getAttribute("data-lead-id")||"";\n' +
'    if(!id) return;\n' +
'    if(_archiveHideViewed && adminViewedSet[id]) row.style.display="none"; else row.style.display="";\n' +
'  });\n' +
'}\n' +
'\n' +
'/* ===== Notes feature ===== */\n' +
'var _notesLead = null;\n' +
'function _leadHasUnreadNotes(l) {\n' +
'  var notes = Array.isArray(l.notes) ? l.notes : [];\n' +
'  if(!notes.length) return 0;\n' +
'  var readBy = (l.notes_read_by && typeof l.notes_read_by === "object") ? l.notes_read_by : {};\n' +
'  var readCount = Number(readBy[AM.email.toLowerCase()] || 0);\n' +
'  var fromOthers = notes.filter(function(n){ return (n.authorEmail||"").toLowerCase() !== AM.email.toLowerCase(); }).length;\n' +
'  if(!fromOthers) return 0;\n' +
'  var unread = notes.length - readCount;\n' +
'  return unread > 0 ? unread : 0;\n' +
'}\n' +
'function openNotesModal(leadId) {\n' +
'  var lead = (AM.role==="admin" ? allLeadsCache : leads).find(function(l){ return l.id === leadId; });\n' +
'  if(!lead){ lead = leads.find(function(l){ return l.id === leadId; }); }\n' +
'  if(!lead) return;\n' +
'  _notesLead = lead;\n' +
'  _g("notes-modal-title").textContent = "Notes \\u2014 " + (lead.company||"");\n' +
'  _g("notes-input").value = "";\n' +
'  renderNotesList();\n' +
'  _g("notes-overlay").classList.add("open");\n' +
'  // Mark as read for this AM\n' +
'  fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:leadId,action:"mark_notes_read",am_email:AM.email})}).then(function(r){return r.json();}).then(function(d){\n' +
'    if(d && d.ok){ lead.notes_read_by = lead.notes_read_by || {}; lead.notes_read_by[AM.email.toLowerCase()] = Array.isArray(lead.notes)?lead.notes.length:0; var sid=getSafeId(leadId); var btn=_g("notes-btn-"+sid); if(btn){ btn.classList.remove("has-unread"); var bg=_g("notes-badge-"+sid); if(bg) bg.textContent=""; } }\n' +
'  }).catch(function(){});\n' +
'}\n' +
'function closeNotesModal() { _g("notes-overlay").classList.remove("open"); _notesLead=null; }\n' +
'function renderNotesList() {\n' +
'  var el=_g("notes-list"); if(!el || !_notesLead) return;\n' +
'  var notes = Array.isArray(_notesLead.notes) ? _notesLead.notes.slice() : [];\n' +
'  notes.sort(function(a,b){ return new Date(a.timestamp) - new Date(b.timestamp); });\n' +
'  if(!notes.length){ el.innerHTML = \'<div class="notes-empty">No notes yet. Add the first one below.</div>\'; return; }\n' +
'  el.innerHTML = notes.map(function(n){\n' +
'    var t = new Date(n.timestamp); var tStr = t.toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});\n' +
'    return \'<div class="note-row"><span class="note-author">\'+escHtml(n.author||n.authorEmail||"")+\'</span><span class="note-time">\'+tStr+\'</span><div class="note-message">\'+escHtml(n.message||"")+\'</div></div>\';\n' +
'  }).join("");\n' +
'}\n' +
'async function submitNote() {\n' +
'  if(!_notesLead) return;\n' +
'  var input=_g("notes-input"); var msg=(input.value||"").trim(); if(!msg) return;\n' +
'  var btn=_g("notes-submit-btn"); btn.disabled=true;\n' +
'  try {\n' +
'    var r=await fetch("/api/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:_notesLead.id,action:"add_note",message:msg,authorEmail:AM.email,authorName:AM.name||""})});\n' +
'    var d=await r.json();\n' +
'    if(d && d.ok){\n' +
'      _notesLead.notes = d.notes || [];\n' +
'      if(!_notesLead.notes_read_by) _notesLead.notes_read_by = {};\n' +
'      _notesLead.notes_read_by[AM.email.toLowerCase()] = _notesLead.notes.length;\n' +
'      input.value = "";\n' +
'      renderNotesList();\n' +
'    }\n' +
'  } catch(e){ console.error("add_note error:",e); }\n' +
'  btn.disabled=false;\n' +
'}\n' +
'\n' +
'/* ===== Analytics ===== */\n' +
'var analyticsLoaded = false;\n' +
'var analyticsData = null;\n' +
'var analyticsDateRange = 30;\n' +
'var selectedAmEmail = AM.email;\n' +
'\n' +
'function setDateRange(range, btn) {\n' +
'  var pills = document.querySelectorAll(".date-pill");\n' +
'  for (var i = 0; i < pills.length; i++) pills[i].classList.remove("active");\n' +
'  if (btn) btn.classList.add("active");\n' +
'  var customInputs = _g("custom-date-inputs");\n' +
'  if (range === "custom") {\n' +
'    customInputs.classList.add("visible");\n' +
'    analyticsDateRange = "custom";\n' +
'    return;\n' +
'  }\n' +
'  customInputs.classList.remove("visible");\n' +
'  analyticsDateRange = range;\n' +
'  loadAnalytics();\n' +
'}\n' +
'\n' +
'function applyCustomDateRange() {\n' +
'  var from = _g("custom-from").value;\n' +
'  var to = _g("custom-to").value;\n' +
'  if (from && to) loadAnalytics();\n' +
'}\n' +
'\n' +
'function getDateParams() {\n' +
'  if (analyticsDateRange === "custom") {\n' +
'    var f = _g("custom-from").value;\n' +
'    var t = _g("custom-to").value;\n' +
'    return f && t ? "&from=" + f + "&to=" + t : "";\n' +
'  }\n' +
'  if (analyticsDateRange === "all") return "";\n' +
'  var now = new Date();\n' +
'  var from = new Date(now.getTime() - analyticsDateRange * 24 * 60 * 60 * 1000);\n' +
'  return "&from=" + from.toISOString().split("T")[0];\n' +
'}\n' +
'\n' +
'async function loadAnalytics() {\n' +
'  try {\n' +
'    var url = "/api/review?analytics" + getDateParams();\n' +
'    var r = await fetch(url);\n' +
'    var data = await r.json();\n' +
'    if (!data.ok) { console.error("Analytics error", data); return; }\n' +
'    analyticsData = data;\n' +
'    analyticsLoaded = true;\n' +
'    renderAnalyticsSummary(data.summary);\n' +
'    renderLeaderboard(data.ams);\n' +
'    var selAm = data.ams.find(function(a){ return a.email === selectedAmEmail; }) || data.ams[0];\n' +
'    if (selAm) renderAmDetail(selAm);\n' +
'  } catch (e) { console.error("Analytics load error:", e); }\n' +
'}\n' +
'\n' +
'function _buildFunnelSvg(stats) {\n' +
'  var W = 900, H = 200;\n' +
'  var sectionW = 280;\n' +
'  var baseX = 20;\n' +
'  var cy = H / 2;\n' +
'  var maxH = 150;\n' +
'  var lr = Number(stats.leadsReceived || 0);\n' +
'  var os = Number(stats.outreachSent || 0);\n' +
'  var cm = Number(stats.contactsMade || 0);\n' +
'  var denom = lr > 0 ? lr : 1;\n' +
'  // Visual taper is softened via sqrt + height floors so even the\n' +
'  // rightmost (narrowest) section has enough vertical room for its\n' +
'  // 32px number and 11px label. Raw numbers in each section stay\n' +
'  // accurate; only the SHAPE is compressed.\n' +
'  var h1L = maxH;\n' +
'  var h1R = Math.max(maxH * 0.72, Math.sqrt(os / denom) * maxH);\n' +
'  if (h1R > h1L) h1R = h1L;\n' +
'  var h2L = h1R;\n' +
'  var h2R = Math.max(maxH * 0.58, Math.sqrt(cm / denom) * maxH);\n' +
'  if (h2R > h2L - 6) h2R = h2L - 6;\n' +
'  var h3L = h2R;\n' +
'  var h3R = Math.max(maxH * 0.48, h2R * 0.82);\n' +
'  if (h3R > h3L - 4) h3R = h3L - 4;\n' +
'  // Visible-polygon centering: for a linearly-tapering trapezoid the\n' +
'  // weighted centroid is shifted toward the taller edge. This keeps\n' +
'  // the number + label planted inside the colored fill.\n' +
'  function centroidX(x, w, hL, hR){\n' +
'    if(hL + hR === 0) return x + w/2;\n' +
'    return x + w * (hL + 2*hR) / (3 * (hL + hR));\n' +
'  }\n' +
'  function trap(x, w, hL, hR, color, num, label) {\n' +
'    var pts = [x, cy-hL/2, x+w, cy-hR/2, x+w, cy+hR/2, x, cy+hL/2].join(",");\n' +
'    var tx = centroidX(x, w, hL, hR);\n' +
'    // For the number to look centered when combined with the label\n' +
'    // below it, we shift the number up slightly from the centroid.\n' +
'    return \'<polygon points="\'+pts+\'" fill="\'+color+\'"/>\'+\n' +
'      \'<text x="\'+tx+\'" y="\'+(cy-4)+\'" fill="#ffffff" font-family="Oswald, Arial, sans-serif" font-size="32" font-weight="700" text-anchor="middle">\'+num+\'</text>\'+\n' +
'      \'<text x="\'+tx+\'" y="\'+(cy+22)+\'" fill="rgba(255,255,255,0.92)" font-family="Raleway, Arial, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1.2">\'+label.toUpperCase()+\'</text>\';\n' +
'  }\n' +
'  var conv1 = lr > 0 ? Math.round((os / lr) * 100) : 0;\n' +
'  var conv2 = os > 0 ? Math.round((cm / os) * 100) : 0;\n' +
'  function chip(x, pct) {\n' +
'    var cw = 82, ch = 28;\n' +
'    var cx = x - cw/2;\n' +
'    var cyChip = cy - ch/2; // centered on funnel midline, overlapping boundary\n' +
'    return \'<g transform="translate(\'+cx+\',\'+cyChip+\')">\'+\n' +
'      \'<rect width="\'+cw+\'" height="\'+ch+\'" rx="14" fill="#1a1a1a" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>\'+\n' +
'      \'<text x="\'+(cw/2 - 8)+\'" y="19" fill="#ffffff" font-family="Raleway, Arial, sans-serif" font-size="12" font-weight="700" text-anchor="middle">\'+pct+\'%</text>\'+\n' +
'      \'<text x="\'+(cw - 14)+\'" y="20" fill="#E8620A" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">\\u2192</text>\'+\n' +
'    \'</g>\';\n' +
'  }\n' +
'  var svg = \'<svg viewBox="0 0 \'+W+\' \'+H+\'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Funnel">\';\n' +
'  svg += trap(baseX, sectionW, h1L, h1R, "#0F1E3D", lr, "Leads Received");\n' +
'  svg += trap(baseX + sectionW, sectionW, h2L, h2R, "#1A4EA2", os, "Outreach Sent");\n' +
'  svg += trap(baseX + sectionW*2, sectionW, h3L, h3R, "#E8620A", cm, "Contacts Made");\n' +
'  // Chips drawn LAST so they layer on top of the trapezoid fill\n' +
'  svg += chip(baseX + sectionW, conv1);\n' +
'  svg += chip(baseX + sectionW*2, conv2);\n' +
'  svg += \'</svg>\';\n' +
'  return svg;\n' +
'}\n' +
'function _renderFunnel(containerId, stats) {\n' +
'  var el = _g(containerId); if(!el) return;\n' +
'  var lr = Number(stats.leadsReceived || 0);\n' +
'  var cm = Number(stats.contactsMade || 0);\n' +
'  var rate = lr > 0 ? Math.round((cm / lr) * 100) : 0;\n' +
'  el.innerHTML = \'<div class="funnel-wrap">\' + _buildFunnelSvg(stats) + \'<div class="funnel-rate">Overall completion rate: <strong>\' + rate + \'%</strong></div></div>\';\n' +
'}\n' +
'function renderAnalyticsSummary(s) {\n' +
'  _g("analytics-summary").innerHTML = \'<div id="analytics-funnel"></div>\';\n' +
'  _renderFunnel("analytics-funnel", { leadsReceived: s.totalLeads, outreachSent: s.totalOutreach, contactsMade: s.totalContactsMade });\n' +
'}\n' +
'\n' +
'function renderLeaderboard(ams) {\n' +
'  var maxOutreach = 0;\n' +
'  for (var i = 0; i < ams.length; i++) { if (ams[i].outreachSent > maxOutreach) maxOutreach = ams[i].outreachSent; }\n' +
'  if (maxOutreach === 0) maxOutreach = 1;\n' +
'  var h = \'<h3>Team Leaderboard</h3>\';\n' +
'  h += \'<div class="lb-header"><span>Name</span><span>Outreach</span><span>Leads</span><span>Outreach</span><span>Rate</span></div>\';\n' +
'  for (var i = 0; i < ams.length; i++) {\n' +
'    var a = ams[i];\n' +
'    var pct = Math.round((a.outreachSent / maxOutreach) * 100);\n' +
'    var isHighlighted = a.email === AM.email;\n' +
'    var isSelected = a.email === selectedAmEmail;\n' +
'    var cls = "lb-row" + (isHighlighted ? " highlighted" : "") + (isSelected ? " selected" : "");\n' +
'    h += \'<div class="\' + cls + \'" onclick="selectAm(\\x27\' + a.email + \'\\x27)">\';\n' +
'    h += \'<div class="lb-name">\' + a.name + \'</div>\';\n' +
'    h += \'<div class="lb-bar-wrap"><div class="lb-bar" style="width:\' + pct + \'%"></div></div>\';\n' +
'    h += \'<div class="lb-stat"><span class="lb-stat-val">\' + a.leadsReceived + \'</span></div>\';\n' +
'    h += \'<div class="lb-stat"><span class="lb-stat-val">\' + a.outreachSent + \'</span></div>\';\n' +
'    h += \'<div class="lb-stat"><span class="lb-stat-val">\' + a.completionRate + \'%</span></div>\';\n' +
'    h += \'</div>\';\n' +
'  }\n' +
'  _g("analytics-leaderboard").innerHTML = h;\n' +
'}\n' +
'\n' +
'function selectAm(email) {\n' +
'  selectedAmEmail = email;\n' +
'  if (analyticsData) {\n' +
'    renderLeaderboard(analyticsData.ams);\n' +
'    var am = analyticsData.ams.find(function(a){ return a.email === email; });\n' +
'    if (am) renderAmDetail(am);\n' +
'  }\n' +
'}\n' +
'\n' +
'function _buildReminderStageChart(stageData) {\n' +
'  if (!stageData.length) return \'<div style="padding:18px;font-size:12px;color:rgba(255,255,255,0.45);font-family:Raleway,sans-serif;font-style:italic;">No reminder stages yet.</div>\';\n' +
'  var W = 640, H = 240;\n' +
'  var padL = 28, padR = 20, padT = 40, padB = 52;\n' +
'  var chartW = W - padL - padR;\n' +
'  var chartH = H - padT - padB;\n' +
'  var maxVal = 1;\n' +
'  stageData.forEach(function(s){ if(s.val > maxVal) maxVal = s.val; });\n' +
'  var n = stageData.length;\n' +
'  var slot = chartW / n;\n' +
'  var barW = Math.min(72, slot * 0.62);\n' +
'  var baseY = padT + chartH;\n' +
'  var svg = \'<svg viewBox="0 0 \'+W+\' \'+H+\'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block;max-width:100%;">\';\n' +
'  // Baseline\n' +
'  svg += \'<line x1="\'+padL+\'" x2="\'+(W-padR)+\'" y1="\'+baseY+\'" y2="\'+baseY+\'" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>\';\n' +
'  stageData.forEach(function(s, i){\n' +
'    var cx = padL + slot * (i + 0.5);\n' +
'    var bx = cx - barW/2;\n' +
'    var bh = Math.max(4, Math.round((s.val / maxVal) * (chartH - 16)));\n' +
'    var by = baseY - bh;\n' +
'    var color = (s.stage >= 3) ? "#E8620A" : "#1A4EA2";\n' +
'    svg += \'<rect x="\'+bx+\'" y="\'+by+\'" width="\'+barW+\'" height="\'+bh+\'" rx="4" fill="\'+color+\'"/>\';\n' +
'    svg += \'<text x="\'+cx+\'" y="\'+(by - 10)+\'" fill="#ffffff" font-family="Oswald, Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle">\'+s.val+\'</text>\';\n' +
'    svg += \'<text x="\'+cx+\'" y="\'+(baseY + 26)+\'" fill="rgba(255,255,255,0.6)" font-family="Raleway, Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="1.2" text-anchor="middle">REMINDER \'+s.stage+\'</text>\';\n' +
'  });\n' +
'  svg += \'</svg>\';\n' +
'  return svg;\n' +
'}\n' +
'function _buildWeeklyOutreachChart(weeksIn) {\n' +
'  // Fill missing weeks in the selected date range so the axis is continuous.\n' +
'  function weekStartDate(d){ var x=new Date(d); var day=x.getUTCDay(); var diff=x.getUTCDate()-day+(day===0?-6:1); var m=new Date(x); m.setUTCDate(diff); m.setUTCHours(0,0,0,0); return m; }\n' +
'  function fmtYMD(d){ return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0"); }\n' +
'  function parseYMD(s){ var p=String(s).split("-"); return new Date(Date.UTC(Number(p[0]),Number(p[1])-1,Number(p[2]))); }\n' +
'  var countsByWeek = {};\n' +
'  (weeksIn || []).forEach(function(w){ countsByWeek[w.week] = Number(w.count||0); });\n' +
'  // Determine the range\n' +
'  var fromInput = _g("custom-from"), toInput = _g("custom-to");\n' +
'  var fromDate = null, toDate = new Date();\n' +
'  if (analyticsDateRange === "custom" && fromInput && toInput && fromInput.value && toInput.value) {\n' +
'    fromDate = parseYMD(fromInput.value); toDate = parseYMD(toInput.value);\n' +
'  } else if (typeof analyticsDateRange === "number") {\n' +
'    fromDate = new Date(); fromDate.setUTCDate(fromDate.getUTCDate() - Number(analyticsDateRange));\n' +
'  } else if (analyticsDateRange === "all") {\n' +
'    // All time: infer earliest week from data\n' +
'    var keys = Object.keys(countsByWeek).sort();\n' +
'    if (keys.length) fromDate = parseYMD(keys[0]); else fromDate = new Date();\n' +
'  } else {\n' +
'    fromDate = new Date(); fromDate.setUTCDate(fromDate.getUTCDate() - 30);\n' +
'  }\n' +
'  var startWeek = weekStartDate(fromDate);\n' +
'  var endWeek = weekStartDate(toDate);\n' +
'  var weeks = [];\n' +
'  var cur = new Date(startWeek);\n' +
'  while (cur <= endWeek && weeks.length < 52) {\n' +
'    var key = fmtYMD(cur);\n' +
'    weeks.push({ week: key, count: countsByWeek[key] || 0, start: new Date(cur) });\n' +
'    cur = new Date(cur); cur.setUTCDate(cur.getUTCDate() + 7);\n' +
'  }\n' +
'  if (!weeks.length) return \'<div style="padding:18px;font-size:12px;color:rgba(255,255,255,0.45);font-family:Raleway,sans-serif;font-style:italic;">No data for this range.</div>\';\n' +
'  var maxVal = 1;\n' +
'  weeks.forEach(function(w){ if(w.count > maxVal) maxVal = w.count; });\n' +
'  // Snap maxVal to a tidy gridline value\n' +
'  function niceCeil(v){\n' +
'    if (v <= 5) return 5;\n' +
'    var mag = Math.pow(10, Math.floor(Math.log10(v)));\n' +
'    var n = v / mag;\n' +
'    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;\n' +
'    return step * mag;\n' +
'  }\n' +
'  var yMax = niceCeil(maxVal);\n' +
'  var ticks = 5;\n' +
'  var W = 820, H = 260;\n' +
'  var padL = 44, padR = 16, padT = 18, padB = 56;\n' +
'  var chartW = W - padL - padR;\n' +
'  var chartH = H - padT - padB;\n' +
'  var slot = chartW / weeks.length;\n' +
'  var barW = Math.max(3, slot - 4);\n' +
'  var baseY = padT + chartH;\n' +
'  var svg = \'<svg viewBox="0 0 \'+W+\' \'+H+\'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block;max-width:100%;">\';\n' +
'  // Y-axis gridlines + tick labels\n' +
'  for (var t = 0; t <= ticks; t++) {\n' +
'    var yv = (yMax * t) / ticks;\n' +
'    var y = baseY - (yv / yMax) * chartH;\n' +
'    svg += \'<line x1="\'+padL+\'" x2="\'+(W-padR)+\'" y1="\'+y+\'" y2="\'+y+\'" stroke="rgba(255,255,255,\'+(t===0?"0.18":"0.06")+\')" stroke-width="1"/>\';\n' +
'    svg += \'<text x="\'+(padL - 8)+\'" y="\'+(y + 3)+\'" fill="rgba(255,255,255,0.45)" font-family="Raleway, Arial, sans-serif" font-size="10" text-anchor="end">\'+Math.round(yv)+\'</text>\';\n' +
'  }\n' +
'  // Bars\n' +
'  weeks.forEach(function(w, i){\n' +
'    if (w.count <= 0) return;\n' +
'    var x = padL + slot * i + (slot - barW)/2;\n' +
'    var bh = Math.max(2, (w.count / yMax) * chartH);\n' +
'    svg += \'<rect x="\'+x+\'" y="\'+(baseY - bh)+\'" width="\'+barW+\'" height="\'+bh+\'" rx="2" fill="#E8620A"><title>\'+w.count+\' outreach\'+(w.count===1?"":"s")+\'</title></rect>\';\n' +
'  });\n' +
'  // X-axis labels\n' +
'  var labelCount = weeks.length;\n' +
'  var labelFont = labelCount > 16 ? 8 : (labelCount > 10 ? 9 : 10);\n' +
'  var labelStep = labelCount > 16 ? 2 : 1;\n' +
'  var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];\n' +
'  weeks.forEach(function(w, i){\n' +
'    if (i % labelStep !== 0 && i !== weeks.length - 1) return;\n' +
'    var cx = padL + slot * (i + 0.5);\n' +
'    var s = w.start;\n' +
'    var e = new Date(s); e.setUTCDate(s.getUTCDate() + 6);\n' +
'    var lbl = monthNames[s.getUTCMonth()] + " " + s.getUTCDate() + "-" + e.getUTCDate();\n' +
'    svg += \'<text x="\'+cx+\'" y="\'+(baseY + 18)+\'" fill="rgba(255,255,255,0.6)" font-family="Raleway, Arial, sans-serif" font-size="\'+labelFont+\'" font-weight="500" text-anchor="middle">\'+lbl+\'</text>\';\n' +
'  });\n' +
'  svg += \'</svg>\';\n' +
'  return svg;\n' +
'}\n' +
'\n' +
'function renderAmDetail(am) {\n' +
'  var h = \'<h3>\' + am.name + \' \\u2014 Individual Stats</h3>\';\n' +
'  var amFunnelId = "am-funnel-" + (am.email || "unknown").replace(/[^a-zA-Z0-9]/g, "_");\n' +
'  h += \'<div id="\' + amFunnelId + \'" style="margin-bottom:24px;"></div>\';\n' +
'  // Progress bar: leads received vs actioned\n' +
'  var actioned = am.outreachSent + Object.values(am.removalReasons).reduce(function(s,v){return s+v;},0);\n' +
'  var pctActioned = am.leadsReceived > 0 ? Math.min(100, Math.round((actioned / am.leadsReceived) * 100)) : 0;\n' +
'  h += \'<div class="am-progress-wrap"><div class="am-progress-label">Leads Actioned: \' + actioned + \' / \' + am.leadsReceived + \'</div>\';\n' +
'  h += \'<div class="am-progress-bar"><div class="am-progress-fill" style="width:\' + pctActioned + \'%"></div><div class="am-progress-text">\' + pctActioned + \'%</div></div></div>\';\n' +
'  // Outreach method pills\n' +
'  h += \'<div class="am-pills-row">\';\n' +
'  h += \'<div class="am-pill-stat"><div class="am-pill-stat-val">\' + am.outreachByMethod.email + \'</div><div class="am-pill-stat-label">Email</div></div>\';\n' +
'  h += \'<div class="am-pill-stat"><div class="am-pill-stat-val">\' + am.outreachByMethod.linkedin_message + \'</div><div class="am-pill-stat-label">LI Message</div></div>\';\n' +
'  h += \'<div class="am-pill-stat"><div class="am-pill-stat-val">\' + am.outreachByMethod.linkedin_connect + \'</div><div class="am-pill-stat-label">LI Connect</div></div>\';\n' +
'  h += \'</div>\';\n' +
'  // Removal reasons chart\n' +
'  var reasons = am.removalReasons;\n' +
'  var reasonLabels = {made_contact:"Made Contact",wrong_contact_type:"Wrong Contact Type",existing_contact:"Existing Contact",not_interested:"Not Interested",other:"Other"};\n' +
'  var reasonColors = {made_contact:"#6EE7C7",wrong_contact_type:"#93C5FD",existing_contact:"#FCD34D",not_interested:"#ef6961",other:"#C4B5FD"};\n' +
'  var maxReason = 0; var rKeys = Object.keys(reasons);\n' +
'  for (var i = 0; i < rKeys.length; i++) { if (reasons[rKeys[i]] > maxReason) maxReason = reasons[rKeys[i]]; }\n' +
'  if (maxReason === 0) maxReason = 1;\n' +
'  h += \'<div class="am-chart-section"><div class="am-chart-title">Removal Reasons</div>\';\n' +
'  for (var i = 0; i < rKeys.length; i++) {\n' +
'    var k = rKeys[i]; var pct = Math.round((reasons[k] / maxReason) * 100);\n' +
'    h += \'<div class="am-hbar"><div class="am-hbar-label">\' + (reasonLabels[k]||k) + \'</div><div class="am-hbar-track"><div class="am-hbar-fill" style="width:\' + pct + \'%;background:\' + (reasonColors[k]||"#E8620A") + \'"></div></div><div class="am-hbar-val">\' + reasons[k] + \'</div></div>\';\n' +
'  }\n' +
'  h += \'</div>\';\n' +
'  // Reminder stage bar chart\n' +
'  var stages = am.reminderStages || {};\n' +
'  var stageKeys = Object.keys(stages).filter(function(k){ return /^stage\\d+$/.test(k); }).sort(function(a,b){ return Number(a.slice(5)) - Number(b.slice(5)); });\n' +
'  var stageData = stageKeys.map(function(k){ return { stage: Number(k.slice(5)), val: Number(stages[k]||0) }; }).filter(function(s){ return s.val > 0; });\n' +
'  h += \'<div class="am-chart-section"><div class="am-chart-title">Reminder Stage</div>\';\n' +
'  h += _buildReminderStageChart(stageData);\n' +
'  h += \'</div>\';\n' +
'  // Weekly outreach bar chart\n' +
'  var weeks = am.outreachByWeek || [];\n' +
'  h += \'<div class="am-chart-section"><div class="am-chart-title">Outreach Activity by Week</div>\';\n' +
'  h += _buildWeeklyOutreachChart(weeks);\n' +
'  h += \'</div>\';\n' +
'  _g("analytics-am-detail").innerHTML = h;\n' +
'  var amContactsMade = (am.removalReasons && Number(am.removalReasons.made_contact || 0)) || 0;\n' +
'  _renderFunnel(amFunnelId, { leadsReceived: am.leadsReceived, outreachSent: am.outreachSent, contactsMade: amContactsMade });\n' +
'}\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';

  res.status(200).send(html);
};
