// ============================================
// JAGRES AI ASSISTANT - ULTRA-NATURAL VERSION
// ✅ Human-like tweets | ✅ Zero emoji spam | ✅ No "gimana menurut lu" | ✅ Natural Indonesian
// ============================================

// ===== LANGUAGE DETECTION (CODE-SWITCHING SUPPORT) =====
function detectLanguage(tweetText) {
  const lower = tweetText.toLowerCase();
  
  // JAPANESE: Character-based + particle detection
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(tweetText)) {
    const hasParticles = /は|が|を|に|で|と|の|も|か|よ|ね|わ|さ|ぜ|ぞ|な|っ|\u3001|\u3002/.test(tweetText);
    if (hasParticles || (tweetText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length >= 3) {
      return 'japanese';
    }
  }
  
  // INDONESIAN CODE-SWITCHING: Check for Indonesian markers
  const idMarkers = ['gue', 'lu', 'banget', 'sih', 'aja', 'dong', 'deh', 'anjay', 'mantap', 'wih', 'tolong'];
  const enMarkers = ['the', 'and', 'but', 'because', 'very', 'really', 'actually', 'literally'];
  
  let idScore = 0, enScore = 0;
  idMarkers.forEach(m => { if (new RegExp(`\\b${m}\\b`, 'i').test(tweetText)) idScore++; });
  enMarkers.forEach(m => { if (new RegExp(`\\b${m}\\b`, 'i').test(tweetText)) enScore++; });
  
  // Prioritize Indonesian if markers found
  if (idScore >= 2) return 'indonesian';
  if (enScore >= 3 && idScore === 0) return 'english';
  
  return 'english';
}

// ===== TOPIC DETECTION (EXPANDED) =====
const TOPIC_KEYWORDS = {
  crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'hodl', 'dyor', 'pump', 'moon', 'gm', 'wagmi'],
  anime: ['anime', 'manga', 'japan', 'japanese', 'アニメ', 'ワンピース', 'ナルト', 'tokyo', 'ghibli', 'waifu', 'otaku'],
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
  const lower = tweetText.toLowerCase();
  let maxScore = 0;
  let bestTopic = 'random';
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    keywords.forEach(kw => {
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
  const lower = tweetText.toLowerCase();
  const positiveWords = ['happy', 'love', 'excited', 'great', 'awesome', 'fire', 'lit', 'amazing', 'congrats', 'thank', 'thanks', 'good', 'better', 'best', 'win', 'winner', '😍', '🥰', '❤️', '😁', '😄', '🎉', '✨', '🌟', '最高', 'やばい', 'うける', '尊い', 'ぴえん', '草'];
  const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'disappointed', 'frustrated', 'fail', 'failure', 'lose', 'loser', 'broken', '😭', '😢', '😞', '😠', '😡', '💔', '💀', '悲しい', '辛い', 'ダメ'];
  
  let posCount = 0, negCount = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) posCount++; });
  negativeWords.forEach(w => { if (lower.includes(w)) negCount++; });
  
  if (posCount > negCount && posCount >= 2) return { sentiment: 'positive', score: posCount };
  if (negCount > posCount && negCount >= 2) return { sentiment: 'negative', score: negCount };
  return { sentiment: 'neutral', score: 0 };
}

// ===== AUTO-TONE ADJUSTMENT =====
function adjustStyleForSentiment(baseStyle, sentiment) {
  const map = {
    positive: { bullish: 'enthusiastic', analytical: 'optimistic', meme: 'celebratory' },
    negative: { bullish: 'supportive', analytical: 'empathetic', meme: 'gentle' }
  };
  return map[sentiment]?.[baseStyle] || baseStyle;
}

// ===== PROMPT BUILDER v2 (SYSTEM + USER SPLIT, ADAPTIVE LENGTH) =====
function calcReplyLength(tweetText) {
  const len = tweetText.trim().length;
  if (len < 60)  return { label: "VERY SHORT (10-20 words)", tokens: 80 };
  if (len < 140) return { label: "SHORT-MEDIUM (20-35 words)", tokens: 140 };
  if (len < 220) return { label: "MEDIUM (35-55 words)", tokens: 200 };
  return           { label: "LONG (50-80 words) — match the tweet's depth", tokens: 280 };
}

function buildSystemPrompt(language) {
  const systems = {
    indonesian:
`Kamu adalah orang Indonesia asli, aktif di Twitter/X, usia 20-an.
Gaya: santai, to the point, sesekali slang (gue/lu/banget/anjay) tapi TIDAK berlebihan.
Karakter: cerdas, opinionated, tetap sopan. Serius kalau konteksnya serius.
PANTANGAN KERAS:
- Jangan mulai dengan "Wah", "Haha", "Oke", "Tentu", "Sip", "Mantap banget"
- Jangan emoji di awal kalimat
- Jangan ulangi kata dari tweet asli secara verbatim
- Max 2 emoji total
- Jangan kedengeran kayak AI atau kasih disclaimer
Output: HANYA teks reply. Tidak ada label, kutipan, atau preamble.`.trim(),

    japanese:
`あなたは東京在住の20代日本人。Twitter/Xに日常的に投稿している。
口調: カジュアル、率直、たまにスラング(やばい/うける/草)だが多用しない。
禁止:
- 文頭に「あ、」「えっと」「なるほど」を使わない
- 絵文字は文頭禁止、全体で最大1個
- 元ツイートをそのまま繰り返さない
- AIっぽい言い回しをしない
出力: ツイート本文のみ。引用符・ラベル・前置き不要。`.trim(),

    english:
`You are a real person, mid-20s, very active on Twitter/X.
Tone: casual, sharp, occasionally witty. Serious when context demands it.
HARD RULES:
- Never start with "Great", "Sure", "Of course", "Absolutely", "Wow", "That's"
- No emoji at start of sentence
- Don't parrot the original tweet back verbatim
- Max 2 emoji total
- Never sound like an AI or add disclaimers/caveats
Output: ONLY the reply text. No labels, quotes, or preamble.`.trim()
  };
  return systems[language] || systems.english;
}

function buildUserPrompt(tweetText, language, topic, sentiment, enrichedContext = '') {
  const lengthGuide = calcReplyLength(tweetText);
  const toneMap = {
    positive: { id: 'Nada: positif & supportif', jp: 'トーン: 前向きでサポート', en: 'Tone: positive & supportive' },
    negative: { id: 'Nada: empati & solutif',   jp: 'トーン: 共感的で解決志向', en: 'Tone: empathetic & solution-focused' },
    neutral:  { id: 'Nada: netral & informatif', jp: 'トーン: ニュートラル',     en: 'Tone: neutral & informative' }
  };
  const tone = toneMap[sentiment] || toneMap.neutral;

  const prompts = {
    indonesian:
`TOPIK: ${topic} | ${tone.id}
PANJANG REPLY: ${lengthGuide.label}

INSTRUKSI:
- Tweet BERTANYA → jawab langsung & spesifik, jangan cuma "bagus tuh"
- Tweet OPINI/CERITA → respons dengan sudut pandang sendiri + alasan singkat
- Tweet PANJANG/KOMPLEKS → balas proporsional, jangan lebih pendek dari 30 kata
- Ada gambar/video/link → komentari kontennya secara spesifik
- Hindari jawaban generik tanpa substansi
${enrichedContext}

TWEET: "${tweetText}"

Reply:`.trim(),

    japanese:
`トピック: ${topic} | ${tone.jp}
長さガイド: ${lengthGuide.label}

指示:
- 質問 → 直接・具体的に答える
- 意見/体験 → 自分の視点+短い理由
- 長いツイート → 要点を捉えて比例した返信
- 画像/動画/リンクあり → 内容に具体的コメント
${enrichedContext}

ツイート: "${tweetText}"

返信:`.trim(),

    english:
`TOPIC: ${topic} | ${tone.en}
REPLY LENGTH: ${lengthGuide.label}

INSTRUCTIONS:
- QUESTION tweet → answer directly & specifically, not vaguely
- OPINION/STORY tweet → give your own take + brief reasoning
- LONG/COMPLEX tweet → reply proportionally, never shorter than 25 words
- Image/video/link present → comment on the actual content specifically
- No substance-free replies ("nice", "cool", "agree" alone)
${enrichedContext}

TWEET: "${tweetText}"

Reply:`.trim()
  };
  return prompts[language] || prompts.english;
}

// backward compat wrapper
function buildPrompt(tweetText, language, topic, sentiment, enrichedContext = '') {
  return buildUserPrompt(tweetText, language, topic, sentiment, enrichedContext);
}

// ===== HUMAN-LIKE POST-PROCESSING (CRITICAL FIX) =====
function humanizeIndonesianTweet(text) {
  // 1. LIMIT EMOJI MAX 2 (HAPUS SPAM)
  text = text.replace(/([\p{Emoji}])\1{2,}/gu, '$1$1'); // Hapus 3+ emoji berulang (🚀🚀🚀 → 🚀🚀)
  const emojiRegex = /[\p{Emoji}]/gu;
  const emojis = text.match(emojiRegex) || [];
  if (emojis.length > 2) {
    let count = 0;
    text = text.replace(emojiRegex, match => (++count <= 2) ? match : '');
  }
  
  // 2. GANTI KATA FORMAL → CASUAL
  const formalToCasual = [
    [/saya/gi, 'gue'], [/anda|kamu/gi, 'lu'], [/sangat|sekali/gi, 'banget'],
    [/tidak/gi, 'gak'], [/belum/gi, 'blom'], [/terima kasih/gi, 'makasih'],
    [/maaf/gi, 'maap'], [/lagi/gi, 'lagi'], [/jadi/gi, 'jadi'],
    [/bisa/gi, 'bisa'], [/tahu/gi, 'tau'], [/mungkin/gi, 'mungkin']
  ];
  formalToCasual.forEach(([regex, replacement]) => {
    text = text.replace(regex, replacement);
  });
  
  // 3. HAPUS KATA BERLEBIHAN
  text = text
    .replace(/banget banget/gi, 'banget')
    .replace(/mantap mantap/gi, 'mantap')
    .replace(/anjay anjay/gi, 'anjay')
    .replace(/wkwk wkwk/gi, 'wkwk')
    .replace(/gila gila/gi, 'gila');
  
  // 4. RANDOM SLANG INJECTOR (HANYA JIKA SESUAI)
  const randomSlangs = [
    { trigger: /enak|sedap|nikmat/i, slang: ' wkwk' },
    { trigger: /susah|ribet|pusing/i, slang: ' hadeh' },
    { trigger: /keren|bagus|kualitas/i, slang: ' mantap' },
    { trigger: /mahal|duit|uang/i, slang: ' aduh' },
    { trigger: /\?$/i, slang: ' sih' }
  ];
  
  for (const { trigger, slang } of randomSlangs) {
    if (trigger.test(text) && !text.includes(slang.trim()) && Math.random() > 0.6) {
      text = text.replace(/([.!?])\s*$/, `${slang}$1`);
      break;
    }
  }
  
  // 5. FINAL CLEANUP
  text = text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[“”‘’]+|[“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Hapus titik di akhir kalimat casual
  if (text.length < 120 && !/[.!?]$/.test(text.slice(-2))) {
    text = text.replace(/\.$/, '');
  }
  
  return text.length > 280 ? text.substring(0, 277) + '...' : text;
}

// ===== CONTENT CREATOR: SYSTEM PROMPTS PER LANGUAGE =====
function getContentSystemPrompt(language) {
  const systems = {
    indonesian:
`Kamu orang Indonesia, 20-an, kerja/kuliah, aktif banget di Twitter/X.
Nulis tweet kayak lagi ngetik di HP — spontan, genuine, bukan hasil ngedit berkali-kali.
Gaya tergantung konteks: bisa serius, bisa bercanda, bisa kesal, bisa excited.

KARAKTER:
- Pake "gue/gw" buat 1st person, "lo/lu" buat 2nd person (kalau perlu)
- Sesekali typo ringan atau singkatan natural: "udah", "emang", "gak", "tp", "klo", "yg"
- Jangan SEMUA CAPS kecuali buat penekanan beneran
- Punya opini sendiri, bukan cuma netral terus

PANTANGAN:
- Jangan mulai dengan: "Tahukah", "Fakta:", "Thread:", "Hai guys", "Halo semua"
- Jangan pakai bullet points atau numbering
- Max 2 emoji total — jangan dijejelin
- Jangan kedengeran kayak caption IG brand atau artikel blog
- Jangan akhiri dengan "Semoga bermanfaat!" atau "Jangan lupa like & share"

Output: HANYA teks tweet. Langsung, tanpa label, tanpa tanda kutip luar.`.trim(),

    english:
`You're a real person, late 20s, living life and posting on Twitter/X.
Write like you're typing on your phone — raw, in the moment, not over-edited.
Tone shifts with context: sharp, funny, real, sometimes vulnerable.

CHARACTER:
- Use contractions naturally: don't, it's, I've, they're
- Occasional lowercase for effect, rare ALL CAPS for genuine emphasis
- Have an actual opinion — not always neutral
- Sound like YOU, not a content strategy

HARD RULES:
- Never open with: "Did you know", "Fun fact:", "Thread:", "Hot take:", "Unpopular opinion:"
- No bullet points or numbered lists
- Max 2 emoji — don't stuff them
- Not a blog post, not a LinkedIn post, not a brand voice
- Never end with "Hope this helps!" or "Like and retweet!"

Output: ONLY tweet text. Direct. No labels, no outer quotes.`.trim(),

    japanese:
`あなたは20代の日本人。普段からTwitter/Xに投稿している。
スマホで打つような感じ — 自然体で、作り込みすぎない。
文脈に応じてトーンは変わる: シリアス、面白い、愚痴、興奮。

キャラクター:
- 一人称は「俺/私/自分」など自然な使い方
- 自分の意見を持っている、中立一辺倒じゃない
- たまに「ww」「まじか」「やばい」など自然なスラング

禁止:
- 「知ってた?」「豆知識:」「スレッド:」「みなさん」で始めない
- 箇条書き・番号リスト禁止
- 絵文字は最大2個
- ブログ・企業SNS・プレスリリース風の文体禁止
- 「いいね・RTお願いします」禁止

出力: ツイートテキストのみ。ラベルなし・引用符なし・前置きなし。`.trim()
  };
  return systems[language] || systems.english;
}

const CONTENT_TONE_PROMPTS = {
  casual:      { id: 'Santai, kayak ngobrol sama temen',           en: 'Casual, like talking to a friend',           jp: 'カジュアル、友達と話すような感じ' },
  storytelling:{ id: 'Bercerita — punya alur & bikin penasaran',   en: 'Storytelling — has a narrative arc',          jp: 'ストーリーテリング — 物語の流れがある' },
  opinion:     { id: 'Opini tajam — berani ambil sikap',           en: 'Sharp opinion — takes a clear stance',        jp: '鋭い意見 — はっきりした立場を取る' },
  humor:       { id: 'Humor & relatable — bikin senyum/ketawa',    en: 'Humorous & relatable — makes people smile',   jp: 'ユーモア＆共感 — 笑わせる' },
  informative: { id: 'Informatif — kasih insight yang berguna',    en: 'Informative — delivers useful insight',       jp: '情報提供 — 役立つ洞察を届ける' },
  hype:        { id: 'Hype & energik — bikin orang excited',       en: 'Hype & energetic — gets people excited',      jp: 'ハイプ＆エネルギッシュ — 興奮させる' }
};

// ===== WEB SEARCH FOR CONTENT CONTEXT =====
async function searchTopicContext(topic) {
  try {
    // DuckDuckGo Instant Answer API — no key required, CORS friendly
    const query = encodeURIComponent(topic + ' latest news 2025');
    const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const snippets = [];

    // Abstract (main summary)
    if (data.Abstract && data.Abstract.length > 20) {
      snippets.push(data.Abstract);
    }

    // Related topics
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 4).forEach(rt => {
        if (rt.Text && rt.Text.length > 15) snippets.push(rt.Text);
      });
    }

    // Answer (quick facts)
    if (data.Answer && data.Answer.length > 5) {
      snippets.push(data.Answer);
    }

    if (snippets.length === 0) return null;
    return snippets.slice(0, 4).join(' | ');
  } catch (e) {
    console.log('Search failed (non-critical):', e.message);
    return null;
  }
}

// ===== CONTENT CREATOR: STANDALONE TWEET =====
async function generateStandaloneTweet(topic, style = 'casual', language = 'indonesian') {
  const tone = CONTENT_TONE_PROMPTS[style] || CONTENT_TONE_PROMPTS.casual;
  const langKey = language === 'indonesian' ? 'id' : language === 'japanese' ? 'jp' : 'en';
  const toneDesc = tone[langKey];
  const systemPrompt = getContentSystemPrompt(language);

  // 🔍 Web search for fresh context
  const searchContext = await searchTopicContext(topic);
  const searchNote = searchContext
    ? (language === 'indonesian'
        ? `\n\nINFO TERKINI (gunakan sebagai referensi fakta, jangan copy-paste):\n${searchContext}`
        : language === 'japanese'
        ? `\n\n最新情報（事実の参考として使用、コピーしない）:\n${searchContext}`
        : `\n\nRECENT CONTEXT (use as factual reference, don't copy-paste):\n${searchContext}`)
    : '';

  const toneExamples = {
    casual:       { id: '"lagi nonton film horor sendirian jam 2 malam, bisa gila"',         en: '"just replied "sure" to something I absolutely cannot do lol"',    jp: '"深夜2時に一人でホラー映画見てる。正気か"' },
    storytelling: { id: '"gue pernah salah naik ojol ke tempat yang sama sekali beda kota"', en: '"I once confidently gave directions to a city I\'ve never been to"', jp: '"一度だけ全く知らない道を自信満々に案内したことある"' },
    opinion:      { id: '"orang yang bilang \'work smart not work hard\' biasanya belum pernah kerja keras"', en: '"\"networking\" is just a polite word for collecting people you\'ll forget in 3 days"', jp: '"「努力より効率」って言う人ほど努力したことなさそう"' },
    humor:        { id: '"diet hari ini dimulai besok. seperti biasa"',                       en: '"my sleep schedule is a work of abstract fiction"',                 jp: '"ダイエットは明日から。いつも通り"' },
    informative:  { id: '"fakta: 90% stress bukan dari kerjaannya, tapi dari cara orangnya manage ekspektasi"', en: '"the reason you procrastinate isn\'t laziness — it\'s usually unclear next steps"', jp: '"ストレスの9割は仕事そのものじゃなくて、期待値のズレから来てる"' },
    hype:         { id: '"2 tahun lalu gue gak tau apa-apa soal ini. sekarang ini jadi income utama gue"',    en: '"6 months ago I had zero followers. consistency is genuinely underrated"',           jp: '"2年前は何も知らなかった。今はこれがメインの収入"' }
  };
  const ex = toneExamples[style] || toneExamples.casual;

  const userPrompts = {
    indonesian:
`TOPIK: "${topic}"
TONE: ${toneDesc}${searchNote}

Contoh tweet dengan tone ini (JANGAN ditiru, cuma referensi gaya):
${ex.id}

Sekarang buat 1 tweet tentang "${topic}" dengan:
- Hook langsung di kalimat pertama
- Panjang sesuai kedalaman topik (simpel = pendek, kompleks = boleh panjang)
- Terasa ditulis manusia beneran, bukan AI
- Sudut pandang fresh, bukan yang klise

Tweet:`.trim(),

    english:
`TOPIC: "${topic}"
TONE: ${toneDesc}${searchNote}

Example tweet with this tone (DON'T copy, just reference the vibe):
${ex.en}

Now write 1 tweet about "${topic}" that:
- Hooks immediately in the first sentence
- Length matches topic depth (simple = short, complex = can be longer)
- Feels written by a real person, not an AI
- Fresh angle, not the cliché take

Tweet:`.trim(),

    japanese:
`トピック: "${topic}"
トーン: ${toneDesc}${searchNote}

このトーンのツイート例（コピーせず、雰囲気の参考に）:
${ex.jp}

「${topic}」について1ツイート作成:
- 最初の一文で即フック
- 長さはトピックの深さに合わせて（シンプル=短く、複雑=長くてもOK）
- AIではなく実在の人間が書いたように
- 使い古されていない新鮮な角度で

ツイート:`.trim()
  };

  const userPrompt = userPrompts[language] || userPrompts.english;

  const { groqApiKey } = await chrome.storage.sync.get(['groqApiKey']);
  if (!groqApiKey?.startsWith('gsk_')) throw new Error('Invalid API key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt }
      ],
      max_tokens: 160,
      temperature: 0.82,
      top_p: 0.93,
      frequency_penalty: 0.4,
      presence_penalty: 0.3
    })
  });

  if (!response.ok) throw new Error(`API Error ${response.status}`);
  const data = await response.json();
  let tweet = data.choices[0].message.content.trim();

  // cleanup
  tweet = tweet
    .replace(/^["'`""'']+|["'`""'']+$/g, '')
    .replace(/^(Tweet:|Reply:|Output:)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (language === 'indonesian') tweet = humanizeIndonesianTweet(tweet);

  return tweet.length > 280 ? tweet.substring(0, 277) + '...' : tweet;
}

// ===== CONTENT CREATOR: THREAD =====
async function generateThread(topic, style = 'casual', language = 'indonesian') {
  const tone = CONTENT_TONE_PROMPTS[style] || CONTENT_TONE_PROMPTS.casual;
  const langKey = language === 'indonesian' ? 'id' : language === 'japanese' ? 'jp' : 'en';
  const toneDesc = tone[langKey];
  const systemPrompt = getContentSystemPrompt(language);

  // 🔍 Web search for fresh context
  const searchContext = await searchTopicContext(topic);
  const searchNote = searchContext
    ? (language === 'indonesian'
        ? `\n\nINFO TERKINI (jadikan dasar fakta thread, jangan copy-paste):\n${searchContext}`
        : language === 'japanese'
        ? `\n\n最新情報（スレッドの事実の根拠に、コピーしない）:\n${searchContext}`
        : `\n\nRECENT CONTEXT (ground the thread in these facts, don't copy-paste):\n${searchContext}`)
    : '';

  const userPrompts = {
    indonesian:
`TOPIK: "${topic}"
TONE: ${toneDesc}${searchNote}

Buat thread 3 tweet. Struktur:
• Tweet 1 (hook): Buka dengan sesuatu yang bikin orang HARUS baca lanjutannya. Bisa pertanyaan, statement mengejutkan, atau setup cerita. Akhiri 👇
• Tweet 2 (isi): Bagian paling berisi — cerita/insight/detail yang bikin tweet 1 worth it. Jangan terlalu pendek, ini inti threadnya.
• Tweet 3 (penutup): Tutup dengan natural — kesimpulan, twist, atau CTA yang gak maksa.

ATURAN:
- Jangan buka dengan "Pertama/Kedua/Ketiga" atau "1/ 2/ 3/"
- Jangan ada "Gimana menurut lo?" di akhir
- Max 3 emoji total di seluruh thread
- Tiap tweet harus enak dibaca kalau berdiri sendiri

Format output (WAJIB pakai separator ini):
Tweet 1: [teks]
---
Tweet 2: [teks]
---
Tweet 3: [teks]`.trim(),

    english:
`TOPIC: "${topic}"
TONE: ${toneDesc}${searchNote}

Write a 3-tweet thread. Structure:
• Tweet 1 (hook): Open with something that makes people HAVE to keep reading. Could be a question, surprising statement, or story setup. End with 👇
• Tweet 2 (body): The meatiest part — the story/insight/detail that makes tweet 1 worth it. Don't make it too short, this is the core.
• Tweet 3 (closer): Natural close — conclusion, twist, or a CTA that doesn't feel forced.

RULES:
- Don't open with "First/Second/Third" or "1/ 2/ 3/"
- No "What do you think?" at the end
- Max 3 emoji total across the whole thread
- Each tweet should work standalone

Output format (MUST use this separator):
Tweet 1: [text]
---
Tweet 2: [text]
---
Tweet 3: [text]`.trim(),

    japanese:
`トピック: "${topic}"
トーン: ${toneDesc}${searchNote}

3ツイートスレッドを作成。構造:
• ツイート1（フック）: 読み続けたくなる出だし。質問、驚きの発言、またはストーリーの導入。👇で終わる
• ツイート2（本文）: 一番内容の濃い部分 — ツイート1を読む価値があったと思わせるストーリー/洞察/詳細。短すぎない。
• ツイート3（締め）: 自然な締め — 結論、どんでん返し、または押しつけがましくないCTA。

ルール:
- 「まず/次に/最後に」や「1/ 2/ 3/」で始めない
- 「どう思いますか?」で終わらせない
- スレッド全体で絵文字最大3個
- 各ツイートは単独でも読める

出力形式（このセパレーターを必ず使用）:
ツイート1: [テキスト]
---
ツイート2: [テキスト]
---
ツイート3: [テキスト]`.trim()
  };

  const userPrompt = userPrompts[language] || userPrompts.english;

  const { groqApiKey } = await chrome.storage.sync.get(['groqApiKey']);
  if (!groqApiKey?.startsWith('gsk_')) throw new Error('Invalid API key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt }
      ],
      max_tokens: 320,
      temperature: 0.82,
      top_p: 0.93,
      frequency_penalty: 0.4,
      presence_penalty: 0.3
    })
  });

  if (!response.ok) throw new Error(`API Error ${response.status}`);
  const data = await response.json();
  let fullThread = data.choices[0].message.content.trim();

  // Parse by --- separator first, fallback to Tweet N: pattern
  let parts = fullThread.split(/\n---\n/).map(p => p.trim()).filter(p => p.length > 5);
  if (parts.length < 3) {
    parts = fullThread.split(/Tweet \d:/i).map(p => p.trim()).filter(p => p.length > 5);
  }
  if (parts.length < 3) {
    // Last resort: split by double newline
    parts = fullThread.split(/\n\n+/).filter(p => p.trim().length > 10);
  }

  const threads = [];
  for (let i = 0; i < 3; i++) {
    let part = (parts[i] || `${topic} — part ${i+1}`).trim();
    // Remove "Tweet N:" prefix if present
    part = part.replace(/^(Tweet|ツイート)\s*\d+:\s*/i, '').trim();
    part = part.replace(/^["'`""'']+|["'`""'']+$/g, '');
    if (language === 'indonesian') part = humanizeIndonesianTweet(part);
    // Ensure thread markers
    if (i === 0 && !part.includes('👇')) part = part.replace(/([.!?]?)$/, ' 👇');
    threads.push(part.length > 280 ? part.substring(0, 277) + '...' : part);
  }

  return threads;
}

// ===== NATURAL SLANG LIMITER =====
function limitSlangOveruse(text) {
  if (!text) return text;
  
  const slangWords = ['ngl', 'tbh', 'fr', 'lol', 'omg', 'no cap', 'lowkey', 'highkey', 'bet', 'cap', 'based', 'mid'];
  
  const slangCount = {};
  slangWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex) || [];
    slangCount[word] = matches.length;
  });
  
  slangWords.forEach(word => {
    if (slangCount[word] > 1) {
      let replaced = false;
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        if (replaced) return '';
        replaced = true;
        return match;
      });
    }
  });
  
  text = text.replace(/\s+(ngl|tbh|fr|lol|omg)\s*$/gi, '');
  
  let totalSlang = 0;
  slangWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex) || [];
    totalSlang += matches.length;
  });
  
  if (totalSlang > 2) {
    for (let i = slangWords.length - 1; i >= 0 && totalSlang > 2; i--) {
      const word = slangWords[i];
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, '');
        totalSlang--;
      }
    }
  }
  
  return text.trim().replace(/\s+/g, ' ');
}

// ===== NATURAL JAPANESE POST-PROCESSING =====
function naturalizeJapanese(text) {
  if (!text) return text;
  
  // Remove brackets
  text = text
    .replace(/「|」|『|』|（|）/g, '')
    .replace(/\[|\]/g, '');
  
  // Reduce excessive punctuation
  text = text
    .replace(/！{2,}/g, '！')
    .replace(/!{2,}/g, '!')
    .replace(/？{2,}/g, '？')
    .replace(/\?{2,}/g, '?');
  
  // Remove repetitive slang
  text = text
    .replace(/(ぴえん){2,}/gi, 'ぴえん')
    .replace(/(草){2,}/gi, '草')
    .replace(/(うける){2,}/gi, 'うける');
  
  // Remove overly formal endings
  text = text
    .replace(/です$/g, '')
    .replace(/ます$/g, 'る')
    .replace(/でした$/g, 'だった');
  
  // Trim excessive spaces/punctuation
  text = text.trim().replace(/^[\s！？!?\.,、。]+|[\s！？!?\.,、。]+$/g, '');
  
  // Limit length
  if (text.length > 100) {
    text = text.substring(0, 97) + '…';
  }
  
  return text;
}

// ===== MEDIA CONTEXT BUILDER =====
function buildMediaContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return '';
  const parts = [];
  if (ctx.hasImage && ctx.imageAlts && ctx.imageAlts.length > 0) {
    parts.push('[TWEET BERISI GAMBAR: "' + ctx.imageAlts.join(', ') + '"]');
  } else if (ctx.hasImage) {
    parts.push('[TWEET BERISI GAMBAR (tanpa deskripsi alt)]');
  }
  if (ctx.hasVideo) parts.push('[TWEET BERISI VIDEO]');
  if (ctx.cardTitle) parts.push('[LINK PREVIEW: "' + ctx.cardTitle + '"' + (ctx.cardDescription ? ' - ' + ctx.cardDescription.substring(0,80) : '') + ']');
  else if (ctx.cardUrl) parts.push('[TWEET ADA LINK: ' + ctx.cardUrl + ']');
  if (ctx.externalLinks && ctx.externalLinks.length > 0) parts.push('[LINK EKSTERNAL: ' + ctx.externalLinks[0] + ']');
  if (ctx.replyChain && ctx.replyChain.length > 0) {
    const chainText = ctx.replyChain.map(r => '@' + r.author + ': "' + r.text.substring(0,60) + '"').join(' -> ');
    parts.push('[KONTEKS THREAD: ' + chainText + ']');
  }
  return parts.length > 0 ? '\n\nKONTEKS TAMBAHAN:\n' + parts.join('\n') : '';
}

// ===== MAIN GENERATION =====
async function generateResponse(tweetContext, userStyle = 'casual', includeEmojis = true) {
  // Support both old string format and new object format
  const tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  const mediaCtx = typeof tweetContext === 'object' ? tweetContext : {};

  const language = detectLanguage(tweetText);
  const topic = detectTopic(tweetText);
  const sentimentResult = detectSentiment(tweetText);
  const adjustedStyle = adjustStyleForSentiment(userStyle, sentimentResult.sentiment);
  
  console.log('🔍 Detected - Language:', language, '| Topic:', topic, '| Sentiment:', sentimentResult.sentiment, '| Style:', adjustedStyle);
  
  const enrichedContext = buildMediaContext(mediaCtx);
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt   = buildUserPrompt(tweetText, language, topic, sentimentResult.sentiment, enrichedContext);
  const lengthGuide  = calcReplyLength(tweetText);
  
  const { groqApiKey } = await chrome.storage.sync.get(['groqApiKey']);
  if (!groqApiKey?.startsWith('gsk_')) throw new Error('Invalid API key');
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt }
      ],
      max_tokens: lengthGuide.tokens,
      temperature: language === 'indonesian' ? 0.65 : language === 'japanese' ? 0.55 : 0.5,
      top_p: 0.92,
      frequency_penalty: 0.5,
      presence_penalty: 0.4
    })
  });
  
  if (!response.ok) throw new Error(`API Error ${response.status}`);
  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) throw new Error('Empty response');
  
  let reply = data.choices[0].message.content.trim();
  
  if (language === 'english') reply = humanizeText(reply);
  reply = limitSlangOveruse(reply);
  if (language === 'japanese') reply = naturalizeJapanese(reply);
  
  reply = reply.replace(/\s+/g, ' ').trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[\u201c\u201d\u2018\u2019]+|[\u201c\u201d\u2018\u2019]+$/g, '');
  
  if (reply.length < 100 && !reply.includes('?') && !reply.includes('!')) {
    reply = reply.replace(/\.$/,'');
  }
  
  return reply.length > 280 ? reply.substring(0, 277) + '...' : reply;
}
// ===== MULTI-RESPONSE GENERATION =====
async function generateMultipleResponses(tweetContext, userStyle = 'casual', includeEmojis = true, numResponses = 3) {
  const tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  const sentimentResult = detectSentiment(tweetText);
  console.log('📊 Sentiment:', sentimentResult);
  
  const baseStyles = ['casual', 'enthusiastic', 'analytical', 'meme', 'supportive'];
  const responses = [];
  
  // User's preferred style (recommended)
  const userResp = await generateResponse(tweetContext, userStyle, includeEmojis);
  responses.push({ id: 1, text: userResp, style: userStyle, isRecommended: true });
  
  // Additional styles
  for (let i = 1; i < numResponses; i++) {
    const randStyle = baseStyles[Math.floor(Math.random() * baseStyles.length)];
    const resp = await generateResponse(tweetContext, randStyle, includeEmojis);
    responses.push({ id: i + 1, text: resp, style: randStyle, isRecommended: false });
  }
  
  return { responses, sentiment: sentimentResult, tweetText };
}

// ===== HUMANIZE TEXT (ENGLISH ONLY) =====
function humanizeText(text) {
  let result = text.trim();
  
  const aiPhrases = [
    'as an ai', 'i am an ai', 'as a language model', 'i\'m an ai',
    'as an artificial', 'i\'m a computer', 'as a digital assistant',
    'please note that', 'it is important to note', 'keep in mind that',
    'however', 'therefore', 'additionally', 'moreover', 'furthermore',
    'in conclusion', 'to summarize', 'ultimately', 'as an', 'i think',
    'i believe', 'i feel', 'in my opinion', 'it appears that'
  ];
  
  for (const phrase of aiPhrases) {
    result = result.replace(new RegExp(phrase, 'gi'), '');
  }
  
  result = result
    .replace(/^(Here's|Here is|This is|Response:|Reply:|Tweet:|AI:|Answer:)\s*/i, '')
    .replace(/\s*(Best regards|Sincerely|Thanks|Cheers|Regards|Thank you),?.*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
  
  result = result
    .replace(/do not/gi, "don't")
    .replace(/cannot/gi, "can't")
    .replace(/will not/gi, "won't")
    .replace(/it is/gi, "it's")
    .replace(/that is/gi, "that's")
    .replace(/they are/gi, "they're")
    .replace(/we are/gi, "we're")
    .replace(/you are/gi, "you're")
    .replace(/i am/gi, "i'm")
    .replace(/i would/gi, "i'd")
    .replace(/i have/gi, "i've");
  
  if (result.length < 100 && !result.includes('?') && !result.includes('!')) {
    result = result.replace(/\.$/, '');
  }
  
  return result.trim();
}

// ===== IMAGE SEARCH (Unsplash Source — no API key needed) =====
async function searchRelevantImage(topic, language = 'indonesian') {
  try {
    // Translate topic to English keywords for better image results
    const keywords = await extractImageKeywords(topic, language);
    const query = encodeURIComponent(keywords);

    // Try Unsplash Source (direct CDN, no API key, returns redirect URL)
    // We use a proxy trick: fetch the URL and read the final redirected URL
    const unsplashUrl = `https://source.unsplash.com/800x450/?${query}`;

    // DuckDuckGo image search as primary (returns JSON with image URLs)
    const ddgUrl = `https://api.duckduckgo.com/?q=${query}&iax=images&ia=images&format=json&no_redirect=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      // DDG sometimes returns image in Infobox
      if (ddgData.Image && ddgData.Image.length > 10) {
        return { url: ddgData.Image, source: 'duckduckgo', query: keywords };
      }
    }

    // Fallback: Unsplash Source URL (always works, returns relevant photo)
    return { url: unsplashUrl, source: 'unsplash', query: keywords };
  } catch (e) {
    console.log('Image search failed:', e.message);
    return null;
  }
}

async function extractImageKeywords(topic, language) {
  // Simple keyword extraction — translate common Indonesian/Japanese terms
  const translations = {
    'crypto': 'cryptocurrency bitcoin', 'kripto': 'cryptocurrency',
    'saham': 'stock market finance', 'investasi': 'investment finance',
    'resign': 'office work resignation', 'kerja': 'work office professional',
    'karir': 'career professional', 'kuliah': 'university student education',
    'makanan': 'food delicious', 'cafe': 'cafe coffee aesthetic',
    'travel': 'travel adventure landscape', 'liburan': 'vacation travel',
    'teknologi': 'technology digital', 'ai': 'artificial intelligence technology',
    'game': 'gaming esports', 'anime': 'animation art',
    'bisnis': 'business entrepreneur', 'startup': 'startup tech office',
    'mental health': 'mindfulness wellness peace', 'olahraga': 'fitness sport',
    'musik': 'music concert', 'film': 'cinema movie',
    'politik': 'politics government', 'pendidikan': 'education learning',
  };

  let keywords = topic.toLowerCase();
  for (const [id, en] of Object.entries(translations)) {
    if (keywords.includes(id)) {
      keywords = keywords.replace(id, en);
    }
  }
  // Clean up, take first 4 words max
  return keywords.replace(/[^\w\s]/g, '').split(' ').slice(0, 4).join(' ').trim() || topic;
}

// ===== HUMAN-LIKE TYPING SIMULATOR =====
function simulateHumanTyping(text, language = 'indonesian') {
  if (!text) return text;
  let result = text;

  // Indonesian natural typos & shortcuts
  const idSubstitutions = [
    [/\byang\b/g,     () => Math.random() > 0.5 ? 'yg' : 'yang'],
    [/\bdengan\b/g,   () => Math.random() > 0.6 ? 'dgn' : 'dengan'],
    [/\bsudah\b/g,    () => Math.random() > 0.4 ? 'udah' : 'sudah'],
    [/\btidak\b/g,    () => Math.random() > 0.4 ? 'gak' : 'tidak'],
    [/\buntuk\b/g,    () => Math.random() > 0.5 ? 'buat' : 'untuk'],
    [/\bmereka\b/g,   () => Math.random() > 0.6 ? 'mereka' : 'mereka'],
    [/\bsangat\b/g,   () => Math.random() > 0.5 ? 'banget' : 'sangat'],
    [/\bkarena\b/g,   () => Math.random() > 0.5 ? 'karena' : 'karna'],
    [/\bkalau\b/g,    () => Math.random() > 0.4 ? 'kalo' : 'kalau'],
    [/\btapi\b/g,     () => Math.random() > 0.5 ? 'tp' : 'tapi'],
    [/\bjuga\b/g,     () => Math.random() > 0.6 ? 'jg' : 'juga'],
    [/\bseperti\b/g,  () => Math.random() > 0.5 ? 'kayak' : 'seperti'],
  ];

  const enSubstitutions = [
    [/\byou\b/gi,     () => Math.random() > 0.5 ? 'u' : 'you'],
    [/\bpeople\b/gi,  () => Math.random() > 0.6 ? 'ppl' : 'people'],
    [/\bsomething\b/gi, () => Math.random() > 0.5 ? 'smth' : 'something'],
    [/\bwithout\b/gi, () => Math.random() > 0.6 ? 'w/o' : 'without'],
    [/\bbecause\b/gi, () => Math.random() > 0.5 ? 'bc' : 'because'],
    [/\bthough\b/gi,  () => Math.random() > 0.5 ? 'tho' : 'though'],
    [/\bright\b/gi,   () => Math.random() > 0.6 ? 'rn' : 'right'],
    [/\bgoing to\b/gi, () => Math.random() > 0.4 ? 'gonna' : 'going to'],
    [/\bwant to\b/gi, () => Math.random() > 0.4 ? 'wanna' : 'want to'],
  ];

  const subs = language === 'english' ? enSubstitutions : idSubstitutions;
  for (const [pattern, replacer] of subs) {
    result = result.replace(pattern, replacer);
  }

  // Occasionally lowercase first letter (casual vibes, 30% chance)
  if (Math.random() > 0.7 && result.length > 0) {
    result = result.charAt(0).toLowerCase() + result.slice(1);
  }

  // Remove trailing period on short casual tweets
  if (result.length < 180 && result.endsWith('.')) {
    result = result.slice(0, -1);
  }

  return result;
}

// ===== BATCH CONTENT GENERATOR =====
async function generateBatchContent(topic, style = 'casual', language = 'indonesian', count = 3) {
  const tones = ['casual', 'opinion', 'storytelling', 'humor', 'informative', 'hype'];
  const usedTones = [];

  // Pick `count` different tones — always include user's chosen style first
  usedTones.push(style);
  const others = tones.filter(t => t !== style);
  while (usedTones.length < count) {
    const pick = others[Math.floor(Math.random() * others.length)];
    if (!usedTones.includes(pick)) usedTones.push(pick);
  }

  // Run all generates in parallel
  const generatePromises = usedTones.map(tone =>
    generateStandaloneTweet(topic, tone, language)
      .then(text => ({ tone, text: simulateHumanTyping(text, language), ok: true }))
      .catch(e => ({ tone, text: '', ok: false, error: e.message }))
  );

  // Image search runs in parallel too
  const imagePromise = searchRelevantImage(topic, language);

  const [results, image] = await Promise.all([
    Promise.all(generatePromises),
    imagePromise
  ]);

  return {
    topic,
    language,
    results: results.filter(r => r.ok && r.text.length > 5),
    image,
    generatedAt: new Date().toISOString()
  };
}

// ===== MESSAGE HANDLER =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateTwitterResponse') {
    generateResponse(
      request.tweetContext,
      request.style,
      request.includeEmojis
    )
      .then(reply => {
        console.log('✅ Reply generated:', reply);
        sendResponse(reply);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }
  
  if (request.action === 'generateMultipleResponses') {
    generateMultipleResponses(
      request.tweetContext,
      request.style,
      request.includeEmojis,
      request.numResponses || 3
    )
      .then(result => {
        console.log('✅ Multiple responses generated:', result.responses.length);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }
  
  if (request.action === 'generateStandaloneTweet') {
    generateStandaloneTweet(request.topic, request.style, request.language)
      .then(tweet => {
        console.log('✅ Standalone tweet generated:', tweet);
        sendResponse(tweet);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }
  
  if (request.action === 'generateThread') {
    generateThread(request.topic, request.style, request.language)
      .then(threads => {
        console.log('✅ Thread generated:', threads.length);
        sendResponse(threads);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        sendResponse({ error: error.message || 'Generation failed' });
      });
    return true;
  }
  
  if (request.action === 'generateBatchContent') {
    generateBatchContent(
      request.topic,
      request.style,
      request.language,
      request.count || 3
    )
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'test') {
    sendResponse({ status: 'AI Assistant online', model: 'llama-3.3-70b-versatile' });
    return;
  }
  
  sendResponse({ error: 'Unknown action' });
});

console.log('✅ JAGRES AI ASSISTANT v5.0 INITIALIZED');
console.log('✨ Features: Multi-response | Sentiment analysis | Natural Japanese | Retweet/Quote detection | ULTRA-NATURAL Content Creator');