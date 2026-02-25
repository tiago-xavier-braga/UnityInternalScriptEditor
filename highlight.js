// ── highlight.js ─────────────────────────────────────────────────────────────
// Syntax highlighting: language detection + tokenizer.
// Exposes: detectLang(filename), tokenize(code, ext)

const LANG_MAP = {
  cs:     'C#',         js:   'JavaScript', ts:    'TypeScript',
  jsx:    'JSX',        tsx:  'TSX',        py:    'Python',
  html:   'HTML',       css:  'CSS',        json:  'JSON',
  xml:    'XML',        cpp:  'C++',        c:     'C',
  h:      'C Header',   hpp:  'C++ Header', java:  'Java',
  kt:     'Kotlin',     rs:   'Rust',       go:    'Go',
  sh:     'Shell',      md:   'Markdown',   txt:   'Plain Text',
  yaml:   'YAML',       yml:  'YAML',       toml:  'TOML',
  lua:    'Lua',        rb:   'Ruby',       php:   'PHP',
  swift:  'Swift',
  // Unity-specific
  unity:  'Unity Asset', asset: 'Unity Asset',
  prefab: 'Unity Prefab', meta: 'Unity Meta',
};

const KEYWORDS = {
  csharp: new Set(['abstract','as','base','bool','break','byte','case','catch','char','checked',
    'class','const','continue','decimal','default','delegate','do','double','else','enum',
    'event','explicit','extern','false','finally','fixed','float','for','foreach','goto',
    'if','implicit','in','int','interface','internal','is','lock','long','namespace','new',
    'null','object','operator','out','override','params','private','protected','public',
    'readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static',
    'string','struct','switch','this','throw','true','try','typeof','uint','ulong',
    'unchecked','unsafe','ushort','using','virtual','void','volatile','while','async',
    'await','var','dynamic','yield','partial','get','set','value','add','remove',
    'nameof','when','where']),

  js: new Set(['break','case','catch','class','const','continue','debugger','default',
    'delete','do','else','export','extends','false','finally','for','function','if',
    'import','in','instanceof','let','new','null','return','static','super','switch',
    'this','throw','true','try','typeof','undefined','var','void','while','with',
    'yield','async','await','of','from','as']),

  py: new Set(['False','None','True','and','as','assert','async','await','break','class',
    'continue','def','del','elif','else','except','finally','for','from','global','if',
    'import','in','is','lambda','nonlocal','not','or','pass','raise','return','try',
    'while','with','yield','self','cls']),

  cpp: new Set(['alignas','alignof','and','auto','bool','break','case','catch','char',
    'class','const','constexpr','continue','decltype','default','delete','do','double',
    'else','enum','explicit','extern','false','float','for','friend','goto','if',
    'inline','int','long','mutable','namespace','new','noexcept','nullptr','operator',
    'private','protected','public','return','short','signed','sizeof','static','struct',
    'switch','template','this','throw','true','try','typedef','typename','union',
    'unsigned','using','virtual','void','volatile','while','override','final']),

  java: new Set(['abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','final','finally',
    'float','for','goto','if','implements','import','instanceof','int','interface','long',
    'native','new','null','package','private','protected','public','return','short',
    'static','super','switch','synchronized','this','throw','throws','transient','true',
    'try','var','void','volatile','while']),
};

const BUILTINS = new Set([
  'console','Math','Object','Array','String','JSON','process','window','document',
  'print','len','range','list','dict','set','tuple','int','float','str','bool','type',
]);

const COLORS = {
  keyword: '#0000ff',
  type:    '#267f99',
  string:  '#a31515',
  comment: '#008000',
  number:  '#098658',
  builtin: '#795e26',
};

function detectLang(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return LANG_MAP[ext] || 'Plain Text';
}

function getKeywords(ext) {
  if (ext === 'cs')                      return KEYWORDS.csharp;
  if (['js','ts','jsx','tsx'].includes(ext)) return KEYWORDS.js;
  if (ext === 'py')                      return KEYWORDS.py;
  if (['cpp','c','h','hpp'].includes(ext))  return KEYWORDS.cpp;
  if (['java','kt'].includes(ext))       return KEYWORDS.java;
  return new Set();
}

function tokenize(code, ext) {
  const kwSet = getKeywords(ext);
  const n = code.length;
  let out = '';
  let i = 0;

  function peek(offset = 1) { return code[i + offset]; }
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function span(color, text) {
    return `<span style="color:${color}">${esc(text)}</span>`;
  }

  while (i < n) {
    const ch = code[i];

    // Single-line comment: // or # (Python/Shell)
    const isPyHash = ch === '#' && ['py','sh'].includes(ext)
      && (i === 0 || /[\s{(,;]/.test(code[i - 1]));
    if ((ch === '/' && peek() === '/') || isPyHash) {
      const j = i;
      while (i < n && code[i] !== '\n') i++;
      out += span(COLORS.comment, code.slice(j, i));
      continue;
    }

    // Block comment: /* ... */
    if (ch === '/' && peek() === '*') {
      const j = i; i += 2;
      while (i < n && !(code[i - 1] === '*' && code[i] === '/')) i++;
      i++;
      out += span(COLORS.comment, code.slice(j, i));
      continue;
    }

    // Strings: " or '
    if (ch === '"' || ch === "'") {
      const j = i; const q = ch; i++;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === q)    { i++; break; }
        if (code[i] === '\n') break;
        i++;
      }
      out += span(COLORS.string, code.slice(j, i));
      continue;
    }

    // Template literals: `...`
    if (ch === '`') {
      const j = i; i++;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '`')  { i++; break; }
        i++;
      }
      out += span(COLORS.string, code.slice(j, i));
      continue;
    }

    // Numbers
    if ((ch >= '0' && ch <= '9') || (ch === '.' && peek() >= '0' && peek() <= '9')) {
      const j = i;
      while (i < n && /[\d.xXa-fA-FuUlL_]/.test(code[i])) i++;
      out += span(COLORS.number, code.slice(j, i));
      continue;
    }

    // Identifiers, keywords, types, builtins
    if (/[a-zA-Z_$]/.test(ch)) {
      const j = i;
      while (i < n && /[\w$]/.test(code[i])) i++;
      const word = code.slice(j, i);
      if (kwSet.has(word)) {
        out += span(COLORS.keyword, word);
      } else if (/^[A-Z]/.test(word)) {
        out += span(COLORS.type, word);
      } else if (BUILTINS.has(word)) {
        out += span(COLORS.builtin, word);
      } else {
        out += esc(word);
      }
      continue;
    }

    // HTML/XML tags
    if (ext === 'html' && ch === '<') {
      const j = i; i++;
      let tag = '<';
      while (i < n && code[i] !== '>') { tag += code[i]; i++; }
      tag += '>'; i++;
      out += span(COLORS.type, tag);
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}
