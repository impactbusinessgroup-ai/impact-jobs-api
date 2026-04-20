// api/_am_data.js
// Single source of truth for Account Manager directory data.
// Keyed by lowercase email for fast reverse lookups. Imported by
// api/mailchimp.js, api/cron.js, api/draft.js, api/leads.js, and
// api/review.js (which serializes it into the client-side bundle).

const AMS = {
  'msapoznikov@impactbusinessgroup.com': {
    name: 'Mark Sapoznikov',
    title: 'Marketing Manager',
    email: 'msapoznikov@impactbusinessgroup.com',
    phone: '(616) 780-3224',
    calendly: 'https://calendly.com/msapoznikov',
  },
  'mpeal@impactbusinessgroup.com': {
    name: 'Matt Peal',
    title: 'President',
    email: 'mpeal@impactbusinessgroup.com',
    phone: '(616) 308-2483',
    calendly: 'https://calendly.com/mattpeal/15min',
  },
  'cwillbrandt@impactbusinessgroup.com': {
    name: 'Curt Willbrandt',
    title: 'Senior Account Executive',
    email: 'cwillbrandt@impactbusinessgroup.com',
    phone: '(616) 292-4229',
    calendly: 'https://calendly.com/cwillbrandt/phone-call',
  },
  'dkoetsier@impactbusinessgroup.com': {
    name: 'Douglas Koetsier',
    title: 'Account Manager',
    email: 'dkoetsier@impactbusinessgroup.com',
    phone: '(616) 780-1154',
    calendly: 'https://calendly.com/dkoetsier/',
  },
  'pkujawski@impactbusinessgroup.com': {
    name: 'Paul Kujawski',
    title: 'Account Manager',
    email: 'pkujawski@impactbusinessgroup.com',
    phone: '(616) 638-8530',
    calendly: 'https://calendly.com/pkujawski',
  },
  'lsylvester@impactbusinessgroup.com': {
    name: 'Lauren Sylvester',
    title: 'Recruiter/Account Manager',
    email: 'lsylvester@impactbusinessgroup.com',
    phone: '(616) 633-4515',
    calendly: 'https://calendly.com/lsylvester',
  },
  'dteliczan@impactbusinessgroup.com': {
    name: 'Dan Teliczan',
    title: 'Sr. Recruiter/Account Manager',
    email: 'dteliczan@impactbusinessgroup.com',
    phone: '(616) 900-9656',
    calendly: 'https://calendly.com/dteliczan-impactbusinessgroup',
  },
  'twangler@impactbusinessgroup.com': {
    name: 'Trish Wangler',
    title: 'Sr Recruiter / Account Manager',
    email: 'twangler@impactbusinessgroup.com',
    phone: '(616) 498-5050',
    calendly: 'https://calendly.com/twangler-impactbusinessgroup/15min',
  },
  'mherman@impactbusinessgroup.com': {
    name: 'Mark Herman',
    title: 'Senior Recruiter/Account Manager',
    email: 'mherman@impactbusinessgroup.com',
    phone: '(727) 644-0421',
    calendly: 'https://calendly.com/markherman',
  },
  'jdrajka@impactbusinessgroup.com': {
    name: 'Jamie Drajka',
    title: 'Sr. Recruiter',
    email: 'jdrajka@impactbusinessgroup.com',
    phone: '(616) 340-3329',
    calendly: 'https://calendly.com/jdrajka',
  },
  'dbentsen@impactbusinessgroup.com': {
    name: 'Drew Bentsen',
    title: 'Account Manager/Recruiter',
    email: 'dbentsen@impactbusinessgroup.com',
    phone: '(425) 647-6705',
    calendly: 'https://calendly.com/dbentsen',
  },
  'sbetteley@impactbusinessgroup.com': {
    name: 'Steve Betteley',
    title: 'Vice President National Accounts',
    email: 'sbetteley@impactbusinessgroup.com',
    phone: '(616) 808-1009',
    calendly: 'https://calendly.com/sbetteley',
  },
  'dkunkel@impactbusinessgroup.com': {
    name: 'Drew Kunkel',
    title: 'Account Manager',
    email: 'dkunkel@impactbusinessgroup.com',
    phone: '(616) 322-4951',
    calendly: 'https://calendly.com/drewkunkel/15min',
  },
};

function byEmail(email) {
  if (!email) return null;
  return AMS[String(email).toLowerCase()] || null;
}

function byName(name) {
  if (!name) return null;
  const q = String(name).toLowerCase().trim();
  for (const em in AMS) {
    if (AMS[em].name.toLowerCase() === q) return AMS[em];
  }
  return null;
}

function emailForName(name) { const a = byName(name); return a ? a.email : ''; }
function nameForEmail(email) { const a = byEmail(email); return a ? a.name : ''; }
function calendlyForEmail(email) { const a = byEmail(email); return a ? a.calendly : ''; }

module.exports = { AMS, byEmail, byName, emailForName, nameForEmail, calendlyForEmail };
