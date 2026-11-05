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
