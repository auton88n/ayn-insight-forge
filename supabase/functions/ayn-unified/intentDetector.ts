// Intent detection — minimal, only for things the AI cannot decide itself
// The model handles everything that requires judgment (search, analysis, etc.)

export function detectIntent(message: string, hasImageFile = false): string {
  const lower = message.toLowerCase();

  // IMAGE — explicit requests only, model cannot generate images itself
  const imagePatterns = [
    /generate\s+(an?\s+)?image/,
    /create\s+(an?\s+)?image/,
    /make\s+(an?\s+)?image/,
    /make\s+me\s+(an?\s+)?(picture|photo|image)/,
    /generate\s+(an?\s+)?picture/,
    /create\s+(an?\s+)?picture/,
    /show\s+me\s+(an?\s+)?(image|picture|photo)/,
    /give\s+me\s+(an?\s+)?(image|picture|photo)/,
    /draw\s/,
    /picture\s+of/,
    /image\s+of/,
    /photo\s+of/,
    /illustration\s+of/,
    /visualize/,
    /render\s+(an?\s+)?/,
    /صورة/, /ارسم/, /اعطني صورة/, /ابي\s*صورة/, /سوي\s*صورة/,
    /image\s+de/, /dessine/, /genere\s+une\s+image/,
    /another\s+image/, /new\s+image/, /new\s+picture/,
  ];
  if (imagePatterns.some(rx => rx.test(lower))) return 'image';

  // DOCUMENT — explicit PDF/Excel requests only
  const documentPatterns = [
    /create\s+(an?\s+)?pdf/, /make\s+(an?\s+)?pdf/, /generate\s+(an?\s+)?pdf/,
    /give\s+me\s+(an?\s+)?pdf/, /export\s+as\s+pdf/, /pdf\s+(report|document|about|for|of)/,
    /(?:i\s+(?:want|need)\s+(?:an?\s+)?)?pdf\s+(?:about|for|on)/,
    /(?:can\s+you\s+)?(?:make|create|get)\s+(?:me\s+)?(?:an?\s+)?pdf/,
    /create\s+(an?\s+)?(excel|exel|excell)/, /make\s+(an?\s+)?(excel|exel|excell)/,
    /give\s+me\s+(an?\s+)?(excel|exel|excell)/,
    /(excel|exel|excell)\s+(sheet|about|for|of)/, /spreadsheet/, /xlsx/,
    /create\s+(an?\s+)?report/, /make\s+(an?\s+)?report/, /generate\s+(an?\s+)?report/,
    /اعمل\s*pdf/, /انشئ\s*pdf/, /ملف\s*pdf/, /تقرير\s*pdf/,
    /اعمل\s*(اكسل|لي)/, /جدول\s*عن/, /بيانات\s*عن/, /اكسل\s*عن/,
    /ابي\s*(?:pdf|اكسل|ملف)/, /اعطني\s*(?:تقرير|ملف|جدول)/, /سوي\s*(?:pdf|اكسل|ملف)/,
    /créer\s+(un\s+)?pdf/, /faire\s+(un\s+)?pdf/, /rapport\s+pdf/,
    /créer\s+(un\s+)?excel/, /tableur/,
    /(?:make|put|convert|turn)\s+(?:it|this|that)\s+(?:in(?:to)?|to|as)?\s*(?:an?\s+)?(?:pdf|excel|exel|excell|xlsx)/,
    /^(?:in\s+)?(?:excel|exel|excell|pdf|xlsx)\s*$/,
  ];
  if (documentPatterns.some(rx => rx.test(lower))) return 'document';

  // FILES — when a file has been uploaded and user wants analysis
  const fileKeywords = ['uploaded', 'analyze this', 'summarize this', 'this file', 'this document'];
  if (fileKeywords.some(kw => lower.includes(kw))) return 'files';
  if (hasImageFile) return 'chat'; // attached image handled as chat, model sees it

  // Everything else — let the model decide naturally
  // The system prompt in ayn-unified already instructs the model to search
  // when it needs current information it doesn't have
  return 'chat';
}
