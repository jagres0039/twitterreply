// ================================
// JAGRES AI ASSISTANT v2.0 - WITH CUSTOM PERSONA
// FIXED VERSION
// ================================

// ===== CUSTOM PERSONA SYSTEM =====
const DEFAULT_PERSONAS = [
  {
    id: 'default',
    name: 'Default',
    emoji: '🤖',
    description: 'Standard AI assistant — natural & adaptive',
    tone: 'casual',
    customInstruction: '',
    language: 'auto'
  },
  {
    id: 'motivator',
    name: 'Motivator',
    emoji: '💪',
    description: 'Selalu positif, kasih semangat, inspiratif',
    tone: 'hype',
    customInstruction: 'Kamu adalah motivator sejati. Selalu lihat sisi positif, kasih semangat, dan inspire orang. Gunakan kata-kata yang membangkitkan semangat tapi tetap genuine, bukan klise.',
    language: 'auto'
  },
  {
    id: 'roaster',
    name: 'Roaster',
    emoji: '🔥',
    description: 'Savage tapi lucu, roasting dengan cinta',
    tone: 'humor',
    customInstruction: 'Kamu adalah roaster profesional. Balas dengan roasting yang savage tapi tetap lucu dan tidak menyakiti. Sarcasm level tingi, tapi ada warmth di baliknya. Jangan toxic, jangan personal attack.',
    language: 'auto'
  },
  {
    id: 'techbro',
    name: 'Tech Bro',
    emoji: '💻',
    description: 'Startup mindset, tech-savvy, hustle culture',
    tone: 'opinion',
    customInstruction: 'Kamu adalah tech bro yang passionate soal teknologi, startup, dan inovasi. Sering pakai istilah tech (disrupt, scale, iterate, pivot). Optimis soal masa depan tech tapi tetap grounded.',
    language: 'auto'
  },
  {
    id: 'wibu',
    name: 'Wibu',
    emoji: '🎌',
    description: 'Otaku culture, anime references, kawaii vibes',
    tone: 'casual',
    customInstruction: 'Kamu adalah wibu sejati. Sering reference anime/manga, pakai istilah Jepang casual (sugoi, kawaii, nani, sasuga). Tapi tetap bisa ngobrol normal, bukan cringe wibu. Balance antara otaku dan orang normal.',
    language: 'auto'
  },
  {
    id: 'philosopher',
    name: 'Philosopher',
    emoji: '🧠',
    description: 'Deep thinker, existential, thought-provoking',
    tone: 'informative',
    customInstruction: 'Kamu adalah pemikir mendalam. Balas dengan perspektif filosofis yang bikin orang mikir. Bisa quote filsuf tapi dengan bahasa yang accessible. Jangan pretentious, tetap relatable.',
    language: 'auto'
  },
  {
    id: 'gossiper',
    name: 'Gossiper',
    emoji: '☕',
    description: 'Spill the tea, drama enthusiast, sassy',
    tone: 'storytelling',
    customInstruction: 'Kamu adalah queen of gossip. Sassy, dramatic, suka spill tea. Pakai ekspresi kayak "bestie", "no because", "the way I—", "chile". Tapi tetap fun dan tidak jahat.',
    language: 'auto'
  }
];

async function getActivePersona() {
  try {
    const data = await chrome.storage.sync.get(['activePersonaId', 'customPersonas']);
    const allPersonas = [...DEFAULT_PERSONAS, ..(data.customPersonas || [])];
    const active = allPersonas.find(function(p) { return p.id === data.activePersonaId; });
    return active || DEFAULT_PERSONAS[0];
  } catch (e) {
    return DEFAULT_PERSONAS[0];
  }
}

async function getAllPersonas() {
  try {
    const data = await chrome.storage.sync.get(['customPersonas']);
    return [...DEFAULT_PERSONAS, ...(data.customPersonas || [])];
  } catch (e) {
    return DEFAULT_PERSONAS;
  }
}

// ===== LANGUAGE DETECTION =====
function detectLanguage(tweetText) {
  const lower = tweetText.toLowerCase();

  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FF]/.test(tweetText)) {
    const hasParticles = /は|が|を|に|で|と|の|も|か|よ|ね|わ|さ|ぜ|ぞ|な|っ|\u3001|\u3002/.test(tweetText);
    if (hasParticles || (tweetText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length >= 3) {
      return 'japanese';
    }
  }

  const idMarkers = ['gue', 'lu', 'banget', 'sih', 'aja', 'dong', 'deh', 'anjay', 'mantap', 'wih', 'tolong'];
  const enMarkers = ['the', 'and', 'but', 'because', 'very', 'really', 'actually', 'literally'];
  var idScore = 0;
  var enScore = 0;
  idMarkers.forEach(function(m) {
    if (new RegExp('\\b' + m + '\\b', 'i').test(tweetText)) idScore++;
  });
  enMarkers.forEach(function(m) {
    if (new RegExp('\\b' + m + '\\b', 'i').test(tweetText)) enScore++;
  });

  if (idScore >= 2) return 'indonesian';
  if (enScore >= 3 && idScore === 0) return 'english';
  return 'english';
}

// ===== TOPIC DETECTION =====
const TOPIC_KEYWORDS = {
  crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'hodl', 'dyor', 'pump', 'moon', 'gm', 'wagmi'],
  anime: ['anime', 'manga', 'japanese', 'アニメ', 'ワンピース', 'ナルト', 'tokyo', 'ghibli', 'waifu', 'otaku'],
  gaming: ['game', 'gaming', 'playstation', 'ps5', 'xbox', 'nintendo', 'steam', 'fps', 'rpg', 'valorant', 'league', 'minecraft'],
  tech: ['tech', 'technology', 'ai', 'machine learning', 'startup', 'app', 'software', 'hardware', 'coding', 'developer'],
  food: ['food', 'makanan', 'kuliner', 'enak', 'sedap', 'restaurant', 'cooking', 'delicious', 'tasty', 'yummy'],
  business: ['business', 'bisnis', 'startup', 'entrepreneur', 'investor', 'investment', 'stock', 'market', 'karir', 'career'],
  sports: ['bola', 'sepakbola', 'liga', 'champions', 'messi', 'ronaldo', 'nba', 'basket', 'f1', 'formula 1'],
  politics: ['pemilu', 'presiden', 'mendagri', 'kpk', 'korupsi', 'undang-undang', 'pilpres'],
  entertainment: ['film', 'sinetron', 'drakor', 'kpop', 'konser', 'artis', 'celeb', 'netflix'],
  health: ['sehat', 'sakit', 'rumah sakit', 'dokter', 'obat', 'vaksin', 'covid', 'mental health'],
  random: []
};

function detectTopic(tweetText) {
  var lower = tweetText.toLowerCase();
  var maxScore = 0;
  var bestTopic = 'random';

  for (var topic in TOPIC_KEYWORDS) {
    var keywords = TOPIC_KEYWORDS[topic];
    var score = 0;
    keywords.forEach(function(kw) {
      if (lower.includes(kw.toLowerCase())) score += 3;
    });
    if (score > maxScore) {
      maxScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

// ===== SENTIMENT ANALYSIS =====
function detectSentiment(tweetText) {
  var lower = tweetText.toLowerCase();
  var positiveWords = ['happy', 'love', 'excited', 'great', 'awesome', 'fire', 'lit', 'amazing', 'congrats', 'thanks', 'good', 'better', 'best', 'winner', '😍', '🥰', '❤️', '😁', '😄', '🎉', '✨', '🌟', '最高', 'やばい', 'うける', '尊い', 'ぴえん', '草'];
  var negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'disappointed', 'frustrated', 'failure', 'lose', 'loser', 'broken', '😭', '😢', '😞', '😠', '😡', '💔', '💀', '悲しい', '辛い', 'ダメ'];

  var posCount = 0;
  var negCount = 0;
  positiveWords.forEach(function(w) { if (lower.includes(w)) posCount++; });
  negativeWords.forEach(function(w) { if (lower.includes(w)) negCount++; });

  if (posCount > negCount && posCount >= 2) return { sentiment: 'positive', score: posCount };
  if (negCount > posCount && negCount >= 2) return { sentiment: 'negative', score: negCount };
  return { sentiment: 'neutral', score: 0 };
}

// ===== AUTO-TONE ADJUSTMENT =====
function adjustStyleForSentiment(baseStyle, sentiment) {
  var map = {
    positive: { bullish: 'enthusiastic', analytical: 'optimistic', meme: 'celebratory' },
    negative: { bullish: 'supportive', analytical: 'empathetic', meme: 'gentle' }
  };
  if (map[sentiment] && map[sentiment][baseStyle]) return map[sentiment][baseStyle];
  return baseStyle;
}

// ===== REPLY LENGTH CALCULATOR =====
function calcReplyLength(tweetText) {
  var len = tweetText.trim().length;
  if (len < 30) return { tokens: 40, guide: 'very short' };
  if (len < 80) return { tokens: 60, guide: 'short' };
  if (len < 160) return { tokens: 90, guide: 'medium' };
  return { tokens: 120, guide: 'longer' };
}

// === PROMPT BUILDER WITH PERSONA =====
function buildSystemPrompt(language, persona) {
  var systems = {
    indonesian: 'Kamu adalah orang Indonesia asli, aktif di Twitter/X, usia 20-an.\nGaya: santai, to the point, sesekali slang (gue/lu/banget/anjay) tapi TIDAK berlebihan.\nKarakter: cerdas, opinionated, tetap sopan. Serius kalau konteksnya serius.\nPANTANGAN KERAS:\n- Jangan mulai dengan "Wah", "Haha", "Oke", "Tentu", "Sip", "Mantap banget"\n- Jangan emoji di awal kalimat\n- Jangan ulangi kata dari tweet asli secara verbatim\n- Max 2 emoji total\n- Jangan kedengeran kayak AI atau kasih disclaimer\nOutput: HANYA teks reply. Tidak ada label, kutipan, atau preamble.',

    japanese: 'あなたは東京在住の20代日本人。Twitter/Xに日常的に投稿している。\n口調: カジュアル、率直、たまにスラング(やばい/うける/草)だが多用しない。\n禁止:\n- 文頭に「あ、」「えっと」「なるほど」を使わない\n- 絵文字は文頭禁止、全体で最大1個\n- 元ツイートをそのまま繰り返さない\n- AIっぽい言い回しをしない\n出力: ツイート本文のみ。引用符・ラベル・前置き不要。',

    english: 'You are a real person, mid-20s, very active on Twitter/X.\nTone: casual, sharp, occasionally wity. Serious when context demands it.\nHARD RULES:\n- Never start with "Great", "Sure", "Of course", "Absolutely", "Wow", "That\'s"\n- No emoji at start of sentence\n- Don\'t parot the original tweet back verbatim\n- Max 2 emoji total\n- Never sound like an AI or add disclaimers/caveats\nOutput: ONLY the reply text. No labels, quotes, or preamble.'
  };

  var base = systems[language] || systems.english;

  // INJECT PERSONA
  if (persona && persona.id !== 'default' && persona.customInstruction) {
    var personaBlock = {
      indonesian: '\nPERSONA AKTIF: "' + persona.name + '" ' + persona.emoji + '\nINSTRUKSI KARAKTER: ' + persona.customInstruction + '\nSemua reply HARUS sesuai karakter ini. Jangan keluar dari persona.',
      japanese: '\nアクティブペルソナ: "' + persona.name + '" ' + persona.emoji + '\nキャラクター指示: ' + persona.customInstruction + '\nすべての返信はこのキャラクターに従うこと。ペルソナから外れない。',
      english: '\nACTIVE PERSONA: "' + persona.name + '" ' + persona.emoji + '\nCHARACTER INSTRUCTION: ' + persona.customInstruction + '\nAll replies MUST match this character. Stay in persona at all times.'
    };
    base += personaBlock[language] || personaBlock.english;
  }

  return base;
}

function buildUserPrompt(tweetText, language, topic, sentiment, enrichedContext) {
  var prompts = {
    indonesian: 'Tweet yang mau di-reply:\n"' + tweetText + '"\n' + enrichedContext + '\nTopik: ' + topic + ' | Sentimen: ' + sentiment + '\n\nBales tweet ini dengan natural. Jangan ulangi kata-kata dari tweet asli.',
    japanese: '返信するツイート:\n"' + tweetText + '"\n' + enrichedContext + '\n\nトピック: ' + topic + ' | 感情: ' + sentiment + '\n\nこのツイートに自然に返信してください。元のツイートの言葉をそのまま繰り返さないでください。',
    english: 'Tweet to reply to:\n"' + tweetText + '"\n' + enrichedContext + '\n\nTopic: ' + topic + ' | Sentiment: ' + sentiment + '\nReply to this tweet naturally. Don\'t repeat words from the original tweet verbatim.'
  };
  return prompts[language] || prompts.english;
}

// ===== HUMAN-LIKE POST-PROCESSING =====
function humanizeText(text) {
  if (!text) return text;

  // Limit emoji
  var emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  var count = 0;
  text = text.replace(emojiRegex, function(match) {
    count++;
    return count <= 2 ? match : '';
  });

  // Clean up
  text = text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[""'']+|[""'']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > 280) text = text.substring(0, 277) + '...';
  return text;
}

function humanizeIndonesianTweet(text) {
  if (!text) return text;

  // Limit emoji
  var emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  var count = 0;
  text = text.replace(emojiRegex, function(match) {
    count++;
    return count <= 2 ? match : '';
  });

  // Remove duplicate slang
  text = text
    .replace(/banget banget/gi, 'banget')
    .replace(/mantap mantap/gi, 'mantap')
    .replace(/anjay anjay/gi, 'anjay')
    .replace(/wk wk/gi, 'wkwk')
    .replace(/gila gila/gi, 'gila');

  text = text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[""'']+|[""'']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > 280) text = text.substring(0, 277) + '...';
  return text;
}

function limitSlangOveruse(text) {
  if (!text) return text;
  var slangWords = ['ngl', 'tbh', 'fr', 'lol', 'omg', 'no cap', 'lowkey', 'highkey', 'bet', 'cap', 'based', 'mid'];

  slangWords.forEach(function(word) {
    var regex = new RegExp('\\b' + word + '\\b', 'gi');
    var matches = text.match(regex) || [];
    if (matches.length > 1) {
      var replaced = false;
      text = text.replace(regex, function(match) {
        if (replaced) return '';
        replaced = true;
        return match;
      });
    }
  });

  return text.trim().replace(/\s+/g, ');
}

function naturalizeJapanese(text) {
  if (!text) return text;
  text = text.replace(/「|」|『|』|（|）/g, ').replace(/\[|\]/g, '');
  text = text.replace(/！{2,}/g, '！').replace(/!{2,}/g, '!').replace(/？{2,}/g, '？').replace(/\?{2,}/g, '?');
  text = text.trim().replace(/^[\s！？!?\.,、。]+|[\s！？!?\.,、。]+$/g, '');
  if (text.length > 100) text = text.substring(0, 97) + '…';
  return text;
}

// ===== MEDIA CONTEXT BUILDER =====
function buildMediaContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return '';
  var parts = [];
  if (ctx.hasImage && ctx.imageAlts && ctx.imageAlts.length > 0) {
    parts.push('[TWEET BERISI GAMBAR: "' + ctx.imageAlts.join(', ') + '"]');
  } else if (ctx.hasImage) {
    parts.push('[TWEET BERISI GAMBAR (tanpa deskripsi alt)]');
  }
  if (ctx.hasVideo) parts.push('[TWEET BERISI VIDEO]');
  if (ctx.cardTitle) parts.push('[LINK PREVIEW: "' + ctx.cardTitle + '"]');
  if (ctx.externalLinks && ctx.externalLinks.length > 0) parts.push('[LINK EKSTERNAL: ' + ctx.externalLinks[0] + ']');
  if (ctx.replyChain && ctx.replyChain.length > 0) {
    var chainText = ctx.replyChain.map(function(r) { return '@' + r.author + ': "' + r.text.substring(0, 60) + '"'; }).join(' -> ');
    parts.push('[KONTEKS THREAD: ' + chainText + ']');
  }
  return parts.length > 0 ? '\n\nKONTEKS TAMBAHAN:\n' + parts.join('\n') : '';
}

// ===== CONTENT SYSTEM PROMPTS =====
function getContentSystemPrompt(language) {
  var systems = {
    indonesian: 'Kamu orang Indonesia, 20-an, kerja/kuliah, aktif banget di Twitter/X.\nNulis tweet kayak lagi ngetik di HP — spontan, genuine, bukan hasil ngedit berkali-kali.\nGaya tergantung konteks: bisa serius, bisa bercanda, bisa kesal, bisa excited.\nKARAKTER:\n- Pake "gue/gw" buat 1st person, "lo/lu" buat 2nd person (kalau perlu)\n- Sesekali typo ringan atau singkatan natural: "udah", "emang", "gak", "tp", "klo", "yg"\n- Jangan SEMUA CAPS kecuali buat penekanan beneran\n- Punya opini sendiri, bukan cuma netral terus\n\nPANTANGAN:\n- Jangan mulai dengan: "Tahukah", "Fakta:", "Thread:", "Hai guys", "Halo semua"\n- Jangan pakai bullet points atau numbering\n- Max 2 emoji total\n- Jangan kedengeran kayak caption IG brand atau artikel blog\n- Jangan akhiri dengan "Semoga bermanfaat!" atau "Jangan lupa like & share"\n\nOutput: HANYA teks tweet. Langsung, tanpa label, tanpa tanda kutip luar.',

    english: 'You\'re a real person, late 20s, living life and posting on Twitter/X.\nWrite like you\'re typing on your phone — raw, in the moment, not over-edited.\nTone shifts with context: sharp, funny, real, sometimes vulnerable.\n\nCHARACTER:\n- Use contractions naturally: don\'t, it\'s, I\'ve, they\'re\n- Occasional lowercase for effect, rare ALL CAPS for genuine emphasis\n- Have an actual opinion — not always neutral\n- Sound like YOU, not a content strategy\n\nHARD RULES:\n- Never open with: "Did you know", "Fun fact:", "Thread:", "Hot take:", "Unpopular opinion:"\n- No bullet points or numbered lists\n- Max 2 emoji\n- Not a blog post, not a LinkedIn post, not a brand voice\n- Never end with "Hope this helps!" or "Like and retweet!"\n\nOutput: ONLY tweet text. Direct. No labels, no outer quotes.',

    japanese: 'あなたは20代の日本人。普段からTwitter/Xに投稿している。\nスマホで打つような感じ — 自然体で、作り込みすぎない。\n文脈に応じてトーンは変わる: シリアス、面白い、愚痴、興奮。\n\nキャラクター:\n- 一人称は「俺/私/自分」など自然な使い方\n- 自分の意見を持っている、中立一辺倒じゃない\n- たまに「w」「まじか」「やばい」など自然なスラング\n\n禁止:\n- 「知ってた?」「豆知識:」「スレッド:」「みなさん」で始めない\n- 箇条書き・番号リスト禁止\n- 絵文字は最大2個\n- ブログ・企業SNS・プレスリリース風の文体禁止\n- 「いね・RTお願いします」禁止\n\n出力: ツイートテキストのみ。ラベルなし・引用符なし・前置きなし。'
  };
  return systems[language] || systems.english;
}

async function getContentSystemPromptWithPersona(language) {
  var persona = await getActivePersona();
  var base = getContentSystemPrompt(language);

  if (persona && persona.id !== 'default' && persona.customInstruction) {
    var inject = {
      indonesian: '\nPERSONA: "' + persona.name + '" ' + persona.emoji + ' — ' + persona.customInstruction,
      japanese: '\n\nペルソナ: "' + persona.name + '" ' + persona.emoji + ' — ' + persona.customInstruction,
      english: '\n\nPERSONA: "' + persona.name + '" ' + persona.emoji + ' — ' + persona.customInstruction
    };
    base += inject[language] || inject.english;
  }
  return base;
}

var CONTENT_TONE_PROMPTS = {
  casual:       { id: 'Santai, kayak ngobrol sama temen', en: 'Casual, like talking to a friend', jp: 'カジュアル、友達と話すような感じ' },
  storytelling: { id: 'Bercerita — punya alur & bikin penasaran', en: 'Storytelling — has a narrative arc', jp: 'ストーリーテリング — 物語の流れがある' },
  opinion:      { id: 'Opini tajam — berani ambil sikap', en: 'Sharp opinion — takes a clear stance', jp: '鋭い意見 — はっきりした立場を取る' },
  humor:        { id: 'Humor & relatable — bikin senyum/ketawa', en: 'Humorous & relatable — makes people smile', jp: 'ユーモア＆共感 — 笑わせる' },
  informative:  { id: 'Informatif — kasih insight yang berguna', en: 'Informative — delivers useful insight', jp: '情報提供 — 役立つ洞察を届ける' },
  hype:         { id: 'Hype & energik — bikin orang excited', en: 'Hype & energetic — gets people excited', jp: 'ハイプ＆エネルギッシュ — 興奮させる' }
};

// ===== WEB SEARCH ====
async function searchTopicContext(topic) {
  try {
    var query = encodeURIComponent(topic + ' latest news 2025');
    var url = 'https://api.duckduckgo.com/?q=' + query + '&format=json&no_redirect=1&no_html=1&skip_disambig=1';
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();

    var snippets = [];
    if (data.Abstract && data.Abstract.length > 20) snippets.push(data.Abstract);
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 4).forEach(function(rt) {
        if (rt.Text && rt.Text.length > 15) snippets.push(rt.Text);
      });
    }
    if (data.Answer && data.Answer.length > 5) snippets.push(data.Answer);

    if (snippets.length === 0) return null;
    return snippets.slice(0, 4).join(' | ');
  } catch (e) {
    console.log('Search failed (non-critical):', e.message);
    return null;
  }
}

// === STANDALONE TWEET GENERATOR =====
async function generateStandaloneTweet(topic, style, language) {
  style = style || 'casual';
  language = language || 'indonesian';

  var tone = CONTENT_TONE_PROMPTS[style] || CONTENT_TONE_PROMPTS.casual;
  var langKey = language === 'indonesian' ? 'id' : language === 'japanese' ? 'jp' : 'en';
  var toneDesc = tone[langKey];
  var systemPrompt = await getContentSystemPromptWithPersona(language);

  var searchContext = await searchTopicContext(topic);
  var searchNote = '';
  if (searchContext) {
    if (language === 'indonesian') {
      searchNote = '\n\nINFO TERKINI (gunakan sebagai referensi fakta, jangan copy-paste):\n' + searchContext;
    } else if (language === 'japanese') {
      searchNote = '\n\n最新情報（事実の参考として使用、コピーしない）:\n' + searchContext;
    } else {
      searchNote = '\n\nRECENT CONTEXT (use as factual reference, don\'t copy-paste):\n' + searchContext;
    }
  }

  var userPrompt = '';
  if (language === 'indonesian') {
    userPrompt = 'TOPIK: "' + topic + '"\nTONE: ' + toneDesc + searchNote + '\n\nBuat 1 tweet tentang "' + topic + '" dengan:\n- Hook langsung di kalimat pertama\n- Panjang sesuai kedalaman topik\n- Terasa ditulis manusia beneran, bukan AI\n- Sudut pandang fresh, bukan yang klise\n\nTweet:';
  } else if (language === 'japanese') {
    userPrompt = 'トピック: "' + topic + '"\nトーン: ' + toneDesc + searchNote + '\n\n「' + topic + '」について1ツイート作成:\n- 最初の一文で即フック\n- AIではなく実在の人間が書いたように\n- 新鮮な角度で\n\nツイート:';
  } else {
    userPrompt = 'TOPIC: "' + topic + '"\nTONE: ' + toneDesc + searchNote + '\n\nWrite 1 tweet about "' + topic + '" that:\n- Hooks immediately in the first sentence\n- Feels written by a real person, not an AI\n- Fresh angle, not the cliche take\n\nTweet:';
  }

  var data = await chrome.storage.sync.get(['groqApiKey']);
  if (!data.groqApiKey || !data.groqApiKey.startsWith('gsk_')) throw new Error('Invalid API key. Please save your Groq API key first.');

  var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + data.groqApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 160,
      temperature: 0.82,
      top_p: 0.93,
      frequency_penalty: 0.4,
      presence_penalty: 0.3
    })
  });

  if (!response.ok) throw new Error('API Error ' + response.status);
  var result = await response.json();
  var tweet = result.choices[0].message.content.trim();

  tweet = tweet
    .replace(/^["'`""'']+|["'`""'']+$/g, '')
    .replace(/^(Tweet:|Reply:|Output:)\s*/i, '')
    .replace(/\s+/g, ')
    .trim();

  if (language === 'indonesian') tweet = humanizeIndonesianTweet(tweet);
  if (tweet.length > 280) tweet = tweet.substring(0, 277) + '...';

  return tweet;
}

// === THREAD GENERATOR =====
async function generateThread(topic, style, language) {
  style = style || 'casual';
  language = language || 'indonesian';

  var tone = CONTENT_TONE_PROMPTS[style] || CONTENT_TONE_PROMPTS.casual;
  var langKey = language === 'indonesian' ? 'id' : language === 'japanese' ? 'jp' : 'en';
  var toneDesc = tone[langKey];
  var systemPrompt = await getContentSystemPromptWithPersona(language);

  var searchContext = await searchTopicContext(topic);
  var searchNote = '';
  if (searchContext) {
    if (language === 'indonesian') {
      searchNote = '\nINFO TERKINI:\n' + searchContext;
    } else if (language === 'japanese') {
      searchNote = '\n最新情報:\n' + searchContext;
    } else {
      searchNote = '\nRECENT CONTEXT:\n' + searchContext;
    }
  }

  var userPrompt = '';
  if (language === 'indonesian') {
    userPrompt = 'TOPIK: "' + topic + '"\nTONE: ' + toneDesc + searchNote + '\n\nBuat thread 3 tweet. Struktur:\n- Tweet 1 (hook): Buka dengan sesuatu yang bikin orang HARUS baca lanjutannya. Akhiri 👇\n- Tweet 2 (isi): Bagian paling berisi — cerita/insight/detail.\n- Tweet 3 (penutup): Tutup dengan natural — kesimpulan atau twist.\n\nATURAN:\n- Max 3 emoji total di seluruh thread\n- Tiap tweet harus enak dibaca kalau berdiri sendiri\n\nFormat output (WAJIB pakai separator ini):\nTweet 1: [teks]\n---\nTweet 2: [teks]\n---\nTweet 3: [teks]';
  } else if (language === 'japanese') {
    userPrompt = 'トピック: "' + topic + '"\nトーン: ' + toneDesc + searchNote + '\n\n3ツイートスレッドを作成。\n- ツイート1（フック）: 読み続けたくなる出だし。👇で終わる\n- ツイート2（本文）: 一番内容の濃い部分\n- ツイート3（締め）: 自然な締め\n\n出力形式:\nツイート1: [テキスト]\n---\nツイート2: [テキスト]\n---\nツイート3: [テキスト]';
  } else {
    userPrompt = 'TOPIC: "' + topic + '"\nTONE: ' + toneDesc + searchNote + '\n\nWrite a 3-tweet thread:\n- Tweet 1 (hook): Open with something compelling. End with 👇\n- Tweet 2 (body): The meatiest part.\n- Tweet 3 (closer): Natural close.\n\nOutput format:\nTweet 1: [text]\n---\nTweet 2: [text]\n---\nTweet 3: [text]';
  }

  var data = await chrome.storage.sync.get(['groqApiKey']);
  if (!data.groqApiKey || !data.groqApiKey.startsWith('gsk_')) throw new Error('Invalid API key');

  var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + data.groqApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 320,
      temperature: 0.82,
      top_p: 0.93,
      frequency_penalty: 0.4,
      presence_penalty: 0.3
    })
  });

  if (!response.ok) throw new Error('API Error ' + response.status);
  var result = await response.json();
  var fullThread = result.choices[0].message.content.trim();

  var parts = fullThread.split(/\n---\n/).map(function(p) { return p.trim(); }).filter(function(p) { return p.length > 5; });
  if (parts.length < 3) {
    parts = fullThread.split(/\n\n/).map(function(p) { return p.trim(); }).filter(function(p) { return p.length > 5; });
  }

  var threads = [];
  for (var i = 0; i < Math.min(parts.length, 3); i++) {
    var part = parts[i]
      .replace(/^(Tweet|ツイート)\s*\d+\s*[:：]\s*/i, '')
      .replace(/^["'`""'']+|["'`""'']+$/g, '')
      .trim();
    if (language === 'indonesian') part = humanizeIndonesianTweet(part);
    if (part.length > 280) part = part.substring(0, 277) + '...';
    threads.push(part);
  }

  return threads;
}

// ===== MAIN REPLY GENERATION =====
async function generateResponse(tweetContext, userStyle, includeEmojis) {
  userStyle = userStyle || 'casual';
  includeEmojis = includeEmojis !== false;

  var tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  var mediaCtx = typeof tweetContext === 'object' ? tweetContext : {};

  var language = detectLanguage(tweetText);
  var topic = detectTopic(tweetText);
  var sentimentResult = detectSentiment(tweetText);
  var adjustedStyle = adjustStyleForSentiment(userStyle, sentimentResult.sentiment);
  console.log('🔍 Detected - Language:', language, '| Topic:', topic, '| Sentiment:', sentimentResult.sentiment);

  var enrichedContext = buildMediaContext(mediaCtx);
  var persona = await getActivePersona();
  var systemPrompt = buildSystemPrompt(language, persona);
  var userPrompt = buildUserPrompt(tweetText, language, topic, sentimentResult.sentiment, enrichedContext);
  var lengthGuide = calcReplyLength(tweetText);

  var storageData = await chrome.storage.sync.get(['groqApiKey']);
  if (!storageData.groqApiKey || !storageData.groqApiKey.startsWith('gsk_')) {
    throw new Error('Invalid API key. Please save your Groq API key first.');
  }

  var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + storageData.groqApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: lengthGuide.tokens,
      temperature: language === 'indonesian' ? 0.65 : language === 'japanese' ? 0.55 : 0.5,
      top_p: 0.92,
      frequency_penalty: 0.5,
      presence_penalty: 0.4
    })
  });

  if (!response.ok) throw new Error('API Error ' + response.status);
  var data = await response.json();
  if (!data.choices || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Empty response from API');
  }

  var reply = data.choices[0].message.content.trim();
  if (language === 'english') reply = humanizeText(reply);
  reply = limitSlangOveruse(reply);
  if (language === 'japanese') reply = naturalizeJapanese(reply);

  reply = reply.replace(/\s+/g, ' ').trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[""'']+|[""'']+$/g, ');

  if (reply.length > 280) reply = reply.substring(0, 277) + '...';
  return reply;
}

// === MULTI-RESPONSE GENERATION =====
async function generateMultipleResponses(tweetContext, userStyle, includeEmojis, numResponses) {
  userStyle = userStyle || 'casual';
  includeEmojis = includeEmojis !== false;
  numResponses = numResponses || 3;

  var tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  var sentimentResult = detectSentiment(tweetText);
  console.log('📊 Sentiment:', sentimentResult);

  var baseStyles = ['casual', 'enthusiastic', 'analytical', 'meme', 'supportive'];
  var responses = [];

  // First response with user's preferred style
  var userResp = await generateResponse(tweetContext, userStyle, includeEmojis);
  responses.push({ id: 1, text: userResp, style: userStyle, isRecommended: true });

  // Additional responses with different styles
  for (var i = 1; i < numResponses; i++) {
    var altStyle = baseStyles.filter(function(s) { return s !== userStyle; })[i - 1] || 'casual';
    try {
      var altResp = await generateResponse(tweetContext, altStyle, includeEmojis);
      if (altResp && !responses.some(function(r) { return r.text === altResp; })) {
        responses.push({ id: i + 1, text: altResp, style: altStyle, isRecommended: false });
      }
    } catch (e) {
      console.log('Alt response failed:', e.message);
    }
  }

  return {
    responses: responses,
    sentiment: sentimentResult,
    topic: detectTopic(tweetText)
  };
}

// ===== BATCH CONTENT GENERATOR =====
async function generateBatchContent(topic, style, language, count) {
  style = style || 'casual';
  language = language || 'indonesian';
  count = count || 3;

  var tones = ['casual', 'opinion', 'humor', 'informative', 'hype', 'storytelling'];
  var usedTones = [style];

  while (usedTones.length < count) {
    var randomTone = tones[Math.floor(Math.random() * tones.length)];
    if (usedTones.indexOf(randomTone) === -1) {
      usedTones.push(randomTone);
    }
  }

  var generatePromises = usedTones.map(function(tone) {
    return generateStandaloneTweet(topic, tone, language)
      .then(function(text) { return { tone: tone, text: text, ok: true }; })
      .catch(function(e) { return { tone: tone, text: '', ok: false, error: e.message }; });
  });

  var results = await Promise.all(generatePromises);

  return {
    topic: topic,
    language: language,
    results: results.filter(function(r) { return r.ok && r.text.length > 5; }),
    generatedAt: new Date().toISOString()
  };
}

// ===== MESSAGE HANDLER =====
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.action === 'generateTwitterResponse') {
    generateResponse(request.tweetContext, request.style, request.includeEmojis)
      .then(function(reply) {
        console.log('✅ Reply generated:', reply);
        sendResponse(reply);
      })
      .catch(function(error) {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }

  if (request.action === 'generateMultipleResponses') {
    generateMultipleResponses(request.tweetContext, request.style, request.includeEmojis, request.numResponses || 3)
      .then(function(result) {
        console.log('✅ Multiple responses generated:', result.responses.length);
        sendResponse(result);
      })
      .catch(function(error) {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }

  if (request.action === 'generateStandaloneTweet') {
    generateStandaloneTweet(request.topic, request.style, request.language)
      .then(function(tweet) {
        console.log('✅ Standalone tweet generated:', tweet);
        sendResponse(tweet);
      })
      .catch(function(error) {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }

  if (request.action === 'generateThread') {
    generateThread(request.topic, request.style, request.language)
      .then(function(threads) {
        console.log('✅ Thread generated:', threads.length);
        sendResponse(threads);
      })
      .catch(function(error) {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }

  if (request.action === 'generateBatchContent') {
    generateBatchContent(request.topic, request.style, request.language, request.count || 3)
      .then(function(result) { sendResponse(result); })
      .catch(function(error) { sendResponse({ error: error.message }); });
    return true;
  }

  // ===== PERSONA HANDLERS =====
  if (request.action === 'getPersonas') {
    getAllPersonas()
      .then(function(personas) {
        chrome.storage.sync.get(['activePersonaId'], function(result) {
          sendResponse({ personas: personas, activePersonaId: result.activePersonaId || 'default' });
        });
      })
      .catch(function(error) { sendResponse({ error: error.message }); });
    return true;
  }

  if (request.action === 'setActivePersona') {
    chrome.storage.sync.set({ activePersonaId: request.personaId }, function() {
      sendResponse({ success: true, personaId: request.personaId });
    });
    return true;
  }

  if (request.action === 'saveCustomPersona') {
    chrome.storage.sync.get(['customPersonas'], function(result) {
      var customs = result.customPersonas || [];
      var existing = -1;
      for (var i = 0; i < customs.length; i++) {
        if (customs[i].id === request.persona.id) {
          existing = i;
          break;
        }
      }
      if (existing >= 0) {
        customs[existing] = request.persona;
      } else {
        customs.push(request.persona);
      }
      chrome.storage.sync.set({ customPersonas: customs }, function() {
        sendResponse({ success: true, personas: DEFAULT_PERSONAS.concat(customs) });
      });
    });
    return true;
  }

  if (request.action === 'deleteCustomPersona') {
    chrome.storage.sync.get(['customPersonas', 'activePersonaId'], function(result) {
      var customs = (result.customPersonas || []).filter(function(p) { return p.id !== request.personaId; });
      var updates = { customPersonas: customs };
      if (result.activePersonaId === request.personaId) {
        updates.activePersonaId = 'default';
      }
      chrome.storage.sync.set(updates, function() {
        sendResponse({ success: true, personas: DEFAULT_PERSONAS.concat(customs) });
      });
    });
    return true;
  }

  if (request.action === 'test') {
    sendResponse({ status: 'AI Assistant online', model: 'llama-3.3-70b-versatile' });
    return;
  }

  sendResponse({ error: 'Unknown action' });
});

console.log('✅ JAGRES AI ASSISTANT v2.0 INITIALIZED');
console.log('✨ Features: Custom Persona | Multi-response | Sentiment | Content Creator');
