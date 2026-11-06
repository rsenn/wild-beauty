// Titles and descriptions from a pattern (docs/PROFILE.md S3): `{date}`, `{location}` and
// `{pseudonym}` stand for the values; text in square brackets is left out, brackets and all,
// when a placeholder inside it has no value. Pure.

const HOLE = /\{(\w+)\}/g;

// the text of a pattern with `values` ({ date, location, pseudonym }); '' when nothing is left
export function fillPattern(pattern, values = {}) {
  const value = name => String(values[name] ?? '').trim();
  const put = text => text.replace(HOLE, (_, name) => value(name));

  const filled = String(pattern ?? '')
    .replace(/\[([^\]]*)\]/g, (_, inner) => ([...inner.matchAll(HOLE)].some(m => !value(m[1])) ? '' : put(inner)))
    .replace(HOLE, (_, name) => value(name));

  return filled
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.])/g, '$1')
    .replace(/([,;:])(\s*[,;:])+/g, '$1')
    .replace(/^[\s,;:.–-]+|[\s,;:–-]+$/g, '')
    .trim();
}

// the date of a node or photo as text in `lang`: one day, or the range of days `from` to `to` (YYYY-MM-DD or a longer local
// time text); '' when there is none
export function dateText(from, to = from, lang = 'en') {
  const day = text => {
    const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(text ?? '');

    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  };
  const [a, b] = [day(from), day(to)];

  if(!a) return '';

  try {
    const format = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' });

    return b && b.getTime() !== a.getTime() ? format.formatRange(a, b) : format.format(a);
  } catch {
    return String(from).slice(0, 10);
  }
}

// the capture time of a photo as `14:32` from the local time text `YYYY-MM-DDTHH:MM:SS`; '' when there is none
export const timeText = taken => /^\d{4}-\d\d-\d\dT(\d\d:\d\d)/.exec(taken ?? '')?.[1] ?? '';

// the three values of a photo for patterns and for the note editors' buttons, from the answer of
// POST /api/photos/describe ({ place, taken }): -> { location, date, time }
export const partsOf = (info, lang = 'en') => ({ location: info?.place ?? '', date: dateText(info?.taken, info?.taken, lang), time: timeText(info?.taken) });

// Is a note only what the generated place, date and time say (docs/BATCH.md S6a2)? Take the
// photo's own place, date and time out of it, and what is left is nothing but separators.
export function isPlaceholder(note, parts) {
  let rest = String(note ?? '').trim();

  if(!rest) return false;

  for(const value of [parts?.location, parts?.date, parts?.time].filter(Boolean).sort((a, b) => b.length - a.length)) rest = rest.split(value).join(' ');

  return /^[\s,;:.–-]*$/.test(rest);
}
