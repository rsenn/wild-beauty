// Contact data in the text of a text box: mail addresses, phone numbers, web
// pages, and the profile links of the usual platforms (SITES.md S12). Pure
// functions shared by the server render, the browser and the paste handler.
//
//   detect(text)           the places in `text` that are links -> [{ start, end, text, type, href }]
//   normalizeShared(text)  what a phone's share sheet or a clipboard gives, tidied up as words:
//                          vCards as lines, mailto:/tel: as the plain address/number, tracking
//                          parameters off links, WhatsApp/Telegram deep links as web links
//
// Only http(s), mailto, tel, sms and geo links are ever made, whatever the text says.

// platform id, the hosts it lives on (a host matches itself and its sub-domains, `www.` and `m.` aside)
const PLATFORMS = [
  ['facebook', ['facebook.com', 'fb.com', 'fb.me', 'fb.watch', 'facebook.net']],
  ['instagram', ['instagram.com', 'instagr.am', 'ig.me']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['tiktok', ['tiktok.com']],
  ['x', ['x.com', 'twitter.com']],
  ['linkedin', ['linkedin.com', 'lnkd.in']],
  ['whatsapp', ['wa.me', 'whatsapp.com']],
  ['telegram', ['t.me', 'telegram.me', 'telegram.org']],
  ['signal', ['signal.me', 'signal.group', 'signal.org']],
  ['threema', ['threema.id', 'threema.ch']],
  ['github', ['github.com']],
  ['bluesky', ['bsky.app']],
  ['threads', ['threads.net', 'threads.com']],
  ['pinterest', ['pinterest.com', 'pin.it']],
  ['snapchat', ['snapchat.com']],
  ['spotify', ['spotify.com', 'spoti.fi']],
  ['soundcloud', ['soundcloud.com']],
  ['bandcamp', ['bandcamp.com']],
  ['vimeo', ['vimeo.com']],
  ['twitch', ['twitch.tv']],
  ['reddit', ['reddit.com', 'redd.it']],
  ['discord', ['discord.gg', 'discord.com']],
  ['behance', ['behance.net']],
  ['dribbble', ['dribbble.com']],
  ['flickr', ['flickr.com', 'flic.kr']],
  ['medium', ['medium.com']],
  ['tumblr', ['tumblr.com']],
  ['patreon', ['patreon.com']],
  ['kofi', ['ko-fi.com']],
  ['paypal', ['paypal.me']],
  ['linktree', ['linktr.ee']],
  ['map', ['maps.app.goo.gl', 'maps.google.com', 'openstreetmap.org', 'osm.org', 'maps.apple.com']],
];

export const TYPES = ['email', 'tel', 'sms', 'website', ...PLATFORMS.map(([id]) => id)];

const hostOf = host => host.toLowerCase().replace(/^(www|m|mobile|web)\./, '');
const onHost = (host, hosts) => hosts.some(h => host === h || host.endsWith(`.${h}`));

// the platform a host belongs to, or 'website'
export function platformOf(host) {
  const h = hostOf(host);

  if(h === 'google.com' || h === 'google.ch') return 'website';

  return PLATFORMS.find(([, hosts]) => onHost(h, hosts))?.[0] ?? 'website';
}

// the hosts of the platforms, for finding "instagram.com/user" without a scheme
const KNOWN = PLATFORMS.flatMap(([, hosts]) => hosts).map(h => h.replace(/\./g, '\\.')).join('|');

const SCHEMES = 'https?|mailto|tel|sms|smsto|geo|whatsapp|tg|signal|threema';

// parameters that only say who shared a link, not what it points to
const TRACKING = /^(utm_[a-z_]+|fbclid|gclid|igshid|igsh|mibextid|si|ref_src|ref_url|feature|fb_source|__tn__|rdid|share_id|s)$/i;

// the part of the candidate that is the link: trailing punctuation and an unbalanced bracket are the sentence's
function trim(s) {
  let end = s.length;

  for(;;) {
    const c = s[end - 1];

    if(c !== undefined && '.,;:!?\'"»”>'.includes(c)) end--;
    else if(c === ')' && (s.slice(0, end).match(/\(/g) ?? []).length < (s.slice(0, end).match(/\)/g) ?? []).length) end--;
    else if(c === ']' && (s.slice(0, end).match(/\[/g) ?? []).length < (s.slice(0, end).match(/\]/g) ?? []).length) end--;
    else break;
  }

  return s.slice(0, end);
}

const digits = s => s.replace(/\D/g, '');

// +41 79 123 45 67 / 0041 79 ... / 079 123 45 67 -> +41791234567 (a national number stays national)
function telHref(raw) {
  const plus = /^\s*(\+|00)/.test(raw);
  const d = digits(raw);

  return plus ? `+${raw.trim().startsWith('00') ? d.slice(2) : d}` : d;
}

const MAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// the profile or page a candidate string stands for -> { type, href } | null
export function classify(raw) {
  const m = /^([a-z][a-z0-9+.-]*):(.*)$/is.exec(raw);
  const scheme = m && !/^[a-z0-9.-]+:\d+(\/|$)/i.test(raw) ? m[1].toLowerCase() : null;

  switch(scheme) {
    case 'mailto': {
      const addr = decodeURIComponent(m[2].replace(/^\/\//, '').split('?')[0]).trim();

      return MAIL.test(addr) ? { type: 'email', href: `mailto:${addr}` } : null;
    }
    case 'tel': {
      const n = telHref(decodeURIComponent(m[2]));

      return digits(n).length >= 3 ? { type: 'tel', href: `tel:${n}` } : null;
    }
    case 'sms':
    case 'smsto': {
      const n = telHref(decodeURIComponent(m[2].split(/[?:]/)[0]));

      return digits(n).length >= 3 ? { type: 'sms', href: `sms:${n}` } : null;
    }
    case 'geo': {
      const at = /^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/.exec(m[2]);

      return at ? { type: 'map', href: `geo:${at[1]},${at[2]}` } : null;
    }
    case 'whatsapp': {
      const phone = /[?&]phone=(\+?\d+)/.exec(m[2])?.[1];

      return phone ? { type: 'whatsapp', href: `https://wa.me/${digits(phone)}` } : null;
    }
    case 'tg': {
      const user = /[?&]domain=([A-Za-z0-9_]{3,})/.exec(m[2])?.[1];

      return user ? { type: 'telegram', href: `https://t.me/${user}` } : null;
    }
    case 'signal':
    case 'threema':
    case null:
    case 'http':
    case 'https':
      break;
    default:
      return null;
  }

  let url;

  try {
    url = new URL(scheme === 'http' || scheme === 'https' ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  if(!/^https?:$/.test(url.protocol) || !url.hostname.includes('.') || /\s/.test(url.hostname)) return null;

  const type = platformOf(url.hostname);

  return { type, href: url.href };
}

// a link without the parameters that identify the sharer
export function cleanUrl(href) {
  let url;

  try {
    url = new URL(href);
  } catch {
    return href;
  }

  const type = platformOf(url.hostname);

  for(const key of [...url.searchParams.keys()]) {
    // a timestamp in a YouTube link and the id of a post are the link
    if(/^(t|v|list|id|story_fbid|u|q)$/i.test(key)) continue;
    if(TRACKING.test(key) && (key.toLowerCase() !== 's' || type === 'x')) url.searchParams.delete(key);
  }

  return url.href.replace(/\?$/, '');
}

const URLISH = new RegExp(`\\b(?:${SCHEMES}):[^\\s<>"'\\u00a0]+|(?<![\\w@./-])(?:www\\.)?(?:${KNOWN}|www\\.(?:[a-z0-9-]+\\.)+[a-z]{2,}(?![\\w-]))(?:/[^\\s<>"'\\u00a0]*)?`, 'gi');
const EMAIL = /(?<![\w@./-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const FEDI = /(?<![\w@./-])@([A-Za-z0-9_]{1,30})@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;
const PHONE = /(?<![\w+/.-])(?:(?:\+|00)[1-9][\d\s().\-/]{6,18}\d|\(?0[1-9][\d\s().\-/]{7,14}\d)(?![\w-])/g;

// a phone number has 8 to 15 digits (E.164), and a date or a price is not one
function phoneOk(s) {
  const n = digits(s).length;

  return n >= 8 && n <= 15 && !/^\d{1,4}[./-]\d{1,2}[./-]\d{1,4}$/.test(s.trim());
}

// every link in `text`, in order, none inside another
export function detect(text) {
  const found = [];
  const add = (start, raw, make) => {
    const body = trim(raw);
    const hit = body && make(body);

    if(hit) found.push({ start, end: start + body.length, text: body, ...hit });
  };

  for(const m of text.matchAll(URLISH)) add(m.index, m[0], classify);
  for(const m of text.matchAll(EMAIL)) add(m.index, m[0], body => ({ type: 'email', href: `mailto:${body}` }));
  for(const m of text.matchAll(FEDI)) add(m.index, m[0], body => {
    const [, user, host] = /^@([^@]+)@(.+)$/.exec(body);

    return { type: 'website', href: `https://${host}/@${user}` };
  });
  for(const m of text.matchAll(PHONE)) add(m.index, m[0], body => (phoneOk(body) ? { type: 'tel', href: `tel:${telHref(body)}` } : null));

  found.sort((a, b) => a.start - b.start || b.end - a.end);

  // the first of overlapping candidates wins: a URL over the address inside it
  const out = [];

  for(const f of found) if(!out.length || f.start >= out.at(-1).end) out.push(f);

  return out;
}

// --- what a share sheet or the clipboard gives ---------------------------------------------

// a vCard (the "share contact" of a phone) as plain lines: name, organisation, numbers, addresses, pages
export function vcardLines(source) {
  const lines = source.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const out = [];
  const take = (re, map = v => v) => lines.forEach(l => {
    const m = re.exec(l);

    if(m && m[1].trim()) out.push(map(m[1].trim()));
  });

  take(/^FN(?:;[^:]*)?:(.*)$/i);

  if(!out.length) take(/^N(?:;[^:]*)?:(.*)$/i, v => v.split(';').filter(Boolean).reverse().join(' '));

  take(/^ORG(?:;[^:]*)?:(.*)$/i, v => v.split(';').filter(Boolean).join(', '));
  take(/^TEL(?:;[^:]*)?:(.*)$/i);
  take(/^EMAIL(?:;[^:]*)?:(.*)$/i);
  take(/^URL(?:;[^:]*)?:(.*)$/i);
  take(/^X-SOCIALPROFILE(?:;[^:]*)?:(.*)$/i);

  return out;
}

// the words of a clipboard: vCards as lines, links tidied, blanks collapsed
export function normalizeShared(text) {
  let words = String(text).replace(/\r\n?/g, '\n');

  words = words.replace(/BEGIN:VCARD[\s\S]*?END:VCARD/gi, card => vcardLines(card).join('\n'));

  const links = detect(words);
  let out = '';
  let at = 0;

  for(const l of links) {
    out += words.slice(at, l.start);

    // an address or a number reads as itself; a web link loses the sharer's parameters
    out += /^(mailto|tel|sms|smsto|geo):/i.test(l.text) ? l.href.replace(/^[a-z]+:/, '') : /^https?:/.test(l.href) && !l.text.startsWith('@') ? tidy(l) : l.text;
    at = l.end;
  }

  out += words.slice(at);

  return out
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// the text of a link the way it is shown: the address without the scheme if it was typed that way
function tidy(l) {
  // URL() adds the slash of an empty path; the text did not have it
  const clean = cleanUrl(l.href).replace(/\/$/.test(l.href) && !l.text.replace(/^[a-z]+:\/\//i, '').includes('/') ? /\/$/ : /$^/, '');

  if(/^https?:/i.test(l.text) || /^[a-z]+:/i.test(l.text)) return clean;

  return clean.replace(/^https?:\/\//, '');
}

// <a href="X">label</a> as "label X" (unless the label already says it), then the tags out: the clipboard of a page
// keeps the target of a link, which plain text loses
export function htmlWords(html) {
  return html
    .replace(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi, (all, a, b, inner) => {
      const href = (a ?? b).replace(/&amp;/g, '&');
      const label = inner.replace(/<[^>]*>/g, '').trim();
      const shown = label.replace(/^https?:\/\//, '').replace(/\/$/, '');

      if(!/^(https?|mailto|tel):/i.test(href) || (label && href.includes(shown.slice(0, 40)) && shown.length > 3) || !label) return label || href;

      return `${label} ${href}`;
    })
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
