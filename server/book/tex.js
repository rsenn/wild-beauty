// The photo book as LuaLaTeX source (docs/ALBUM.md S4d). Pure: the page plan of
// client/gallery/book.js in, the text of a .tex file out; the pictures are named by
// `file(picture)` so the caller decides where they live.
import { hasBody, paragraphsOf } from '../../client/editor/core/caption.js';
import { SHORT_NOTE, bookOf } from '../../client/gallery/book.js';

const SPECIAL = { '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', $: '\\$', '#': '\\#', _: '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };

// text made safe for TeX: its special characters escaped, control characters dropped
export const texEscape = text =>
  String(text ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[\\&%$#_{}~^]/g, c => SPECIAL[c]);

// the note under a picture: the first line as a heading when there is more than one line, paragraphs
// apart, a single line break kept; a short note is centred, a long one left-aligned
export function noteTex(text, centred) {
  const heading = hasBody(text);
  const body = paragraphsOf(text)
    .map((lines, p) => lines.map((line, i) => (heading && p === 0 && i === 0 ? `{\\bfseries\\fontsize{14}{17}\\selectfont ${texEscape(line)}}` : texEscape(line))).join(' \\\\\n'))
    .join('\n\n');

  return centred ? `\\begin{center}\n${body}\n\\end{center}` : `\\raggedright\n${body}\n\\par`;
}

// The pictures fill the page like the print page (docs/ALBUM.md S4c): a cell per picture of equal height, the note under the
// picture, and the picture scaled to what the note leaves free. TeX measures the note first (\sbox), so the page is
// filled whatever the note's length. `\figfill` makes a box (a short note, side by side is possible);
// `\figflow` leaves a long note outside the box so it can continue on the next page. A picture is never smaller than 60 mm.
export const MACROS = [
  '\\newdimen\\figh',
  '\\newcommand{\\figfill}[4]{%',
  '  \\sbox0{\\parbox{#3}{#4}}%',
  '  \\figh=\\dimexpr#2-\\ht0-\\dp0-3mm\\relax',
  '  \\ifdim\\figh<60mm \\figh=60mm \\fi',
  '  \\parbox[t]{#3}{\\centering\\parbox[c][\\figh][c]{#3}{\\centering\\includegraphics[width=#3,height=\\figh,keepaspectratio]{#1}}\\par\\vspace{3mm}#4}}',
  '\\newcommand{\\figflow}[3]{%',
  '  \\sbox0{\\parbox{\\linewidth}{#3}}%',
  '  \\figh=\\dimexpr#2-\\ht0-\\dp0-3mm\\relax',
  '  \\ifdim\\figh<60mm \\figh=60mm \\fi',
  '  \\noindent\\parbox[c][\\figh][c]{\\linewidth}{\\centering\\includegraphics[width=\\linewidth,height=\\figh,keepaspectratio]{#1}}\\par\\vspace{3mm}#3\\par}',
].join('\n');

const FULL = '\\dimexpr\\textheight-4mm\\relax';
const HALF = '\\dimexpr(\\textheight-10mm)/2\\relax';

const noteOf = p => (p.desc ? noteTex(p.desc, p.desc.length <= SHORT_NOTE) : '');

function pageTex(page, file) {
  if(page.length === 4)
    return [[0, 1], [2, 3]].map(([a, b]) => `\\noindent\\figfill{${file(page[a])}}{${HALF}}{0.48\\linewidth}{}\\hfill\\figfill{${file(page[b])}}{${HALF}}{0.48\\linewidth}{}\\par\\vspace{6mm}`).join('\n');

  const cell = page.length === 1 ? FULL : HALF;

  return page.map(p => (p.desc && p.desc.length > SHORT_NOTE ? `\\figflow{${file(p)}}{${cell}}{${noteOf(p)}}` : `\\noindent\\figfill{${file(p)}}{${cell}}{\\linewidth}{${noteOf(p)}}\\par`)).join('\n\\vspace{6mm}\n');
}

// -> the .tex text. `chapters` as the server collects them ([{ id, title, pictures }]), `title` of the book,
// `strings` = { pictures: n => '17 pictures', contents: 'Contents' }
export function bookTex(chapters, { title = '', onlyNoted = false, file, strings }) {
  const book = bookOf(chapters, { onlyNoted });
  const many = book.chapters.length > 1;
  const out = [
    '\\documentclass[11pt]{article}',
    '\\usepackage[a4paper,margin=18mm]{geometry}',
    '\\usepackage{fontspec}',
    '\\setmainfont{Liberation Sans}',
    '\\usepackage{graphicx}',
    '\\usepackage{parskip}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\emergencystretch}{3em}',
    '\\pagestyle{plain}',
    MACROS,
    '\\begin{document}',
    '\\thispagestyle{empty}',
    '\\vspace*{\\fill}',
    `{\\bfseries\\fontsize{30}{36}\\selectfont ${texEscape(title)}}\\par\\vspace{6mm}`,
    `{\\fontsize{12}{15}\\selectfont ${texEscape(strings.pictures(book.pictures))}}\\par`,
  ];

  if(many) {
    out.push('\\vspace{10mm}', `{\\bfseries\\large ${texEscape(strings.contents)}}\\par\\vspace{3mm}`);
    book.chapters.forEach((c, i) => out.push(`\\noindent ${texEscape(c.title)} (${c.count})\\dotfill\\pageref{ch${i}}\\par`));
  }

  out.push('\\vspace*{\\fill}', '\\clearpage');

  book.chapters.forEach((c, i) => {
    if(many) out.push('\\thispagestyle{empty}', '\\vspace*{\\fill}', `{\\bfseries\\fontsize{26}{32}\\selectfont ${texEscape(c.title)}}\\par\\vspace{4mm}`, `{\\fontsize{12}{15}\\selectfont ${texEscape(strings.pictures(c.count))}}\\par`, '\\vspace*{\\fill}', `\\label{ch${i}}`, '\\clearpage');

    for(const page of c.pages) out.push(pageTex(page, file), '\\clearpage');
  });

  out.push('\\end{document}');

  return out.join('\n') + '\n';
}

// how many LuaLaTeX runs the source needs: a second one resolves the page numbers of the contents
export const runsFor = chapters => (chapters.length > 1 ? 2 : 1);
