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

// ===== TWEET STYLE DETECTION =====
// Reads the writing style of the source tweet so the reply can mirror it
// (casing, formality, slang density, laughter intensity). This is the core
// of "match the vibe of the tweet" — replaces random Math.random() heuristics.
function detectTweetStyle(text) {
  const t = (text || '').trim();
  const length = t.length;

  // ----- capitalization
  const hasUpper  = /[A-Z]/.test(t);
  const hasLower  = /[a-z]/.test(t);
  const isAllCaps = hasUpper && !hasLower && length > 5;
  const isAllLower = !hasUpper && hasLower;
  const startsLower = /^[a-z]/.test(t);

  // ----- slang vs formal markers (Indonesian)
  const idSlangRe  = /\b(gue|gw|gua|lu|lo|elu|wkwk+|kw+|anjay|anjir|njir|cuy|bro|bjir|bgt|sih|aja|deh|dong|kek|kayak|emg|emang|udah|udh|ud|gak|ga|nggak|engga|kalo|gimana|gabut|mager|lemes|ngeselin|capek|cape)\b/gi;
  const idFormalRe = /\b(saya|anda|tidak|sangat|sekali|sudah|adalah|merupakan|melakukan|membuat|terdapat|bahwa|sebagai|namun|demikian|seperti|kemudian|akhirnya|hendaknya|memang|sungguh)\b/gi;

  // ----- english slang / formal
  const enSlangRe  = /\b(lol|lmao+|lmfao+|rofl|fr|fr+|ong|ngl|tbh|imo|imho|af|wtf|omg|bruh|deadass|bestie|literally|actually|periodt|girl|y'all|gonna|wanna|gotta|kinda|sorta|innit)\b/gi;
  const enFormalRe = /\b(however|therefore|furthermore|moreover|nevertheless|consequently|indeed|hence|thus|whereas|albeit|notwithstanding|aforementioned)\b/gi;

  // ----- japanese formality
  const hasJpKeigo = /(です|ます|でした|ました|ございます|いただきます)/.test(t);
  const hasJpCasual = /(だよ|だね|じゃん|っしょ|やん|わ$|な$|だ$|ぜ$|ぞ$)/.test(t);

  // ----- laughter intensity
  const idLaugh = (t.match(/\b(wk{1,}|kw{1,}|haha+|hehe+|huhu+)\b/gi) || []).length;
  const jpLaugh = (t.match(/(草+|笑+|w{2,}|ww+|^|\s)w(\s|$)/g) || []).length;
  const enLaugh = (t.match(/\b(haha+|hehe+|lol+|lmao+|lmfao+|rofl)\b/gi) || []).length;
  const laughLevel = idLaugh + jpLaugh + enLaugh;

  // ----- punctuation density
  const periodCount = (t.match(/\./g)  || []).length;
  const exclamCount = (t.match(/[!！]/g) || []).length;
  const questionCount = (t.match(/[?？]/g) || []).length;
  const hasEllipsis = /\.{2,}|…/.test(t);
  const emojiCount = (t.match(EMOJI_REGEX) || []).length;

  // ----- structural
  const hasHashtag = /#\w+/.test(t);
  const hasMention = /@\w+/.test(t);
  const hasUrl     = /https?:\/\//.test(t);

  const idSlang  = (t.match(idSlangRe)  || []).length;
  const idFormal = (t.match(idFormalRe) || []).length;
  const enSlang  = (t.match(enSlangRe)  || []).length;
  const enFormal = (t.match(enFormalRe) || []).length;

  // ----- formality score (0 = ultra-casual shitpost, 10 = press-release formal)
  let formality = 5;
  if (idSlang + enSlang >= 3) formality -= 3;
  else if (idSlang + enSlang >= 1) formality -= 2;
  if (idFormal + enFormal >= 2) formality += 2;
  else if (idFormal + enFormal >= 1) formality += 1;
  if (hasJpKeigo && !hasJpCasual) formality += 2;
  if (hasJpCasual && !hasJpKeigo) formality -= 1;
  if (isAllLower && length > 30) formality -= 2;
  if (startsLower) formality -= 1;
  if (laughLevel >= 2) formality -= 2;
  if (periodCount > length / 40) formality += 1; // many periods → essay-ish
  if (!periodCount && length > 25 && !questionCount && !exclamCount) formality -= 1;
  formality = Math.max(0, Math.min(10, formality));

  return {
    length,
    isAllCaps,
    isAllLower,
    startsLower,
    formality,
    laughLevel,
    emojiCount,
    hasEllipsis,
    hasHashtag,
    hasMention,
    hasUrl,
    idSlang, idFormal, enSlang, enFormal,
    hasJpKeigo, hasJpCasual
  };
}

// ===== TWEET VIBE DETECTION =====
// Classifies *what kind of tweet this is* so the reply can match the intent.
// E.g. don't joke at a vent, don't seriously analyse a meme.
function detectVibe(text) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();

  const patterns = {
    vent: [
      /capek banget|capek bgt|cape banget|cape bgt/i,
      /\bpusing\b|\bkesel\b|\bkesal\b|\bmuak\b|\blelah\b|\bsedih\b|\bsakit hati\b/i,
      /\bfml\b|\bugh\b|\bkenapa sih\b|\bsick of\b|\btired of\b/i,
      /疲れた|つらい|しんどい|もうやだ|きつい|やってられん/
    ],
    flex: [
      /\b(just|finally|akhirnya|baru aja)\b.*(closed|landed|signed|got|achieved|launched|launching|hit|reached)\b/i,
      /\bgue\b\s+(beli|punya|baru|udah)\b/i,
      /ついに|やっと.*(手に入|達成|買|GET)/,
      /\b(my|our)\b.*(milestone|record|launch|new app|new project)/i
    ],
    joke: [
      /(wkwk+|kw+|haha+|hehe+|lol+|lmao+|草+|ww+|笑+)/i,
      /\bpov\b|\bme when\b|\bkalo lu\b.*be like\b/i,
      /\bno thoughts head empty\b/i,
      /それな|わかる|やば(?!い)/
    ],
    rant: [
      /\bkenapa\b.*\bsih\b/i,
      /\bkok\b.*(sih|bisa|gitu)/i,
      /\bI (hate|can't stand)\b/i,
      /\bbenci(in)?\b/i
    ],
    announce: [
      /^(saya|kami|gua|gue|we|I)\s/i,
      /\b(launching|launched|releasing|released|shipping|shipped|opening|akhirnya rilis|udah keluar|baru rilis)\b/i,
      /\b(announcing|announce|introducing|introduces)\b/i
    ],
    meme: [
      /^pov:?\b/i,
      /\bbe like\b/i,
      /^this 100%$/i,
      /\bgenuinely\b\s+\b(no thoughts|head empty)\b/i,
      /\b(real|fr+|ong)\b\s*$/i
    ],
    seek_advice: [
      /\bgimana\s+ya\b|\bgimana\s+cara\b|\bada tips\b|\bsaran\b/i,
      /\bhow do (i|you|we)\b|\bhow to\b|\bany tips\b|\badvice\b/i,
      /どうすれば|どうしたら/
    ],
    question: [/[?？]\s*$/]
  };

  const scores = {};
  for (const [vibe, ps] of Object.entries(patterns)) {
    scores[vibe] = ps.reduce((n, p) => n + (p.test(t) || p.test(lower) ? 1 : 0), 0);
  }

  let best = 'neutral', max = 0;
  for (const [v, s] of Object.entries(scores)) {
    if (s > max) { max = s; best = v; }
  }
  return { vibe: best, scores };
}

// ===== MODEL PARAMS PER TONE =====
// Different intents want different sampling: serious answers want focus,
// jokes/roasts want creativity, supportive wants low repetition.
function getModelParams(tone, language) {
  const base = language === 'japanese' ? 0.70
             : language === 'indonesian' ? 0.78
             : 0.72;
  const table = {
    auto:     { temperature: base,         top_p: 0.92, frequency_penalty: 0.5,  presence_penalty: 0.4 },
    serious:  { temperature: base - 0.15,  top_p: 0.88, frequency_penalty: 0.4,  presence_penalty: 0.3 },
    funny:    { temperature: base + 0.15,  top_p: 0.95, frequency_penalty: 0.5,  presence_penalty: 0.45 },
    question: { temperature: base - 0.20,  top_p: 0.85, frequency_penalty: 0.35, presence_penalty: 0.3 },
    roast:    { temperature: base + 0.18,  top_p: 0.95, frequency_penalty: 0.55, presence_penalty: 0.45 },
    support:  { temperature: base - 0.05,  top_p: 0.90, frequency_penalty: 0.4,  presence_penalty: 0.55 }
  };
  const p = { ...(table[tone] || table.auto) };
  // Clamp
  p.temperature = Math.max(0.3, Math.min(1.2, p.temperature));
  p.top_p       = Math.max(0.5, Math.min(0.99, p.top_p));
  return p;
}

// ===== STYLE HINT → PROMPT STRING =====
// Renders the style/vibe detection into a short directive the LLM will follow.
function buildStyleDirective(style, vibe, language) {
  const formalLabel =
    style.formality <= 2 ? 'ultra-casual shitpost' :
    style.formality <= 4 ? 'casual' :
    style.formality <= 6 ? 'neutral' :
    style.formality <= 8 ? 'semi-formal' : 'formal/essay';

  const caseLabel =
    style.isAllCaps  ? 'ALL CAPS (mirror sparingly, do NOT shout the whole reply)' :
    style.isAllLower ? 'all lowercase (mirror this)' :
    style.startsLower ? 'starts lowercase (mirror this)' :
    'normal capitalization';

  const laughLabel =
    style.laughLevel >= 3 ? 'very laughy (wkwk/haha/lol/草 heavy)' :
    style.laughLevel >= 1 ? 'mildly laughy' : 'no laughter';

  const vibeMap = {
    indonesian: {
      vent: 'OP lagi curhat — validasi & empati, JANGAN nge-joke',
      flex: 'OP lagi pamer — sah ngegoda halus atau ngucapin selamat',
      joke: 'OP lagi bercanda — bales lucu, jangan diseriusin',
      rant: 'OP lagi marah-marah — validasi, jangan kasih solusi',
      announce: 'OP ngumumin sesuatu — kasih komentar singkat',
      meme: 'OP nge-meme — pake referensi yang sama, jangan jelasin',
      seek_advice: 'OP minta saran — kasih saran konkret, gak ngambang',
      question: 'OP nanya — jawab langsung, jangan basa-basi',
      neutral: 'reaksi natural sesuai konten'
    },
    english: {
      vent: 'OP is venting — validate, do NOT joke or fix',
      flex: 'OP is flexing — light congrats or a playful jab is fine',
      joke: 'OP is joking — match the humor, do NOT take it literally',
      rant: 'OP is ranting — validate, do not problem-solve',
      announce: 'OP is announcing — short reaction is enough',
      meme: 'OP is doing a meme — use the same referent, do not explain',
      seek_advice: 'OP wants advice — give one concrete suggestion',
      question: 'OP is asking — answer directly, no filler',
      neutral: 'natural reaction to the content'
    },
    japanese: {
      vent: 'OPは愚痴ってる — 共感のみ、茶化さない',
      flex: 'OPは自慢してる — 軽い祝福か遊び心のあるツッコミOK',
      joke: 'OPはボケてる — ノる、真面目に取らない',
      rant: 'OPはキレてる — 共感、解決策は出さない',
      announce: 'OPは告知してる — 短い反応で十分',
      meme: 'OPはミーム — 同じノリで返す、解説しない',
      seek_advice: 'OPは助言を求めてる — 具体的な案を一つ',
      question: 'OPは質問してる — 直接答える',
      neutral: 'コンテンツに対する自然な反応'
    }
  };
  const vibeText = (vibeMap[language] || vibeMap.english)[vibe.vibe] || (vibeMap[language] || vibeMap.english).neutral;

  const lines = {
    indonesian: [
      `GAYA TWEET ASLI (MATCH INI):`,
      `- Tingkat formal: ${style.formality}/10 (${formalLabel})`,
      `- Kapitalisasi: ${caseLabel}`,
      `- Tingkat tawa: ${laughLabel}`,
      `- Emoji di tweet asli: ${style.emojiCount}`,
      `- Vibe: ${vibe.vibe} — ${vibeText}`
    ],
    english: [
      `SOURCE TWEET STYLE (MIRROR THIS):`,
      `- Formality: ${style.formality}/10 (${formalLabel})`,
      `- Casing: ${caseLabel}`,
      `- Laughter level: ${laughLabel}`,
      `- Emoji in source: ${style.emojiCount}`,
      `- Vibe: ${vibe.vibe} — ${vibeText}`
    ],
    japanese: [
      `元ツイートのスタイル（合わせる）:`,
      `- フォーマル度: ${style.formality}/10 (${formalLabel})`,
      `- 大文字小文字: ${caseLabel}`,
      `- 笑い度: ${laughLabel}`,
      `- 元の絵文字数: ${style.emojiCount}`,
      `- バイブ: ${vibe.vibe} — ${vibeText}`
    ]
  };
  return (lines[language] || lines.english).join('\n');
}

// ===== PROMPT BUILDER v2 (SYSTEM + USER SPLIT, ADAPTIVE LENGTH) =====
function calcReplyLength(tweetText) {
  const len = tweetText.trim().length;
  // Keep replies SHORT — Twitter is a conversation, not a blog
  if (len < 40)  return { label: "ULTRA SINGKAT: 1 kalimat pendek, max 10 kata. Kayak balas WA.", tokens: 35 };
  if (len < 100) return { label: "SINGKAT: 1 kalimat, max 15 kata. DILARANG lebih dari 1 kalimat.", tokens: 50 };
  if (len < 180) return { label: "PENDEK: max 2 kalimat pendek. Total max 25 kata.", tokens: 70 };
  return           { label: "SEDANG: max 2-3 kalimat. Total max 40 kata. Jangan essay.", tokens: 95 };
}

function buildSystemPrompt(language, persona = '') {
  // Few-shot examples per language. Expanded to cover diverse vibes:
  // vent · flex · joke · roast · question · advice · supportive · meme · announce.
  // Format kept simple (Tweet → 2-3 Replies) so the model learns the shape.
  const fewShots = {
    indonesian: `
CONTOH REPLY NATURAL DI TWITTER INDONESIA (pelajari gaya, jangan copy literal):

[VENT — curhat]
Tweet: "lagi capek banget sama kerjaan, tiap hari overtime tapi gak naik gaji juga"
Reply A: "anjir relate, gue juga ngalamin tahun lalu sampe akhirnya resign"
Reply B: "burnout itu serius bro, kalo udah segini mending mulai mikirin exit plan"
Reply C: "loyalty di tempat yang gak appreciate cuma bikin lo cape doang"

[JOKE — humor]
Tweet: "diet hari ini gagal lagi wkwkwk, godaan martabak terlalu kuat"
Reply A: "diet itu emang lebih cocok dimulai besok wkwk"
Reply B: "martabak emang gak salah, lo yg lemah iman"
Reply C: "fyi besok juga ada godaan baru, sabar ya"

[FLEX — pamer]
Tweet: "akhirnya offer dari company impian gue dateng juga, after 6 months grinding"
Reply A: "selamat bro, ini hasil grind nya kebayar"
Reply B: "6 bulan worth it banget kayanya, congrats"
Reply C: "jangan lupa renegotiate gaji-nya, lo udah leverage skrg"

[QUESTION — nanya tulus]
Tweet: "ada yg pengalaman pake productivity app yg bener2 ngefek? udah coba banyak tapi gak konsisten"
Reply A: "yg ngefek bukan app-nya, tapi kebiasaan ngebuka app itu tiap pagi"
Reply B: "Sunsama lumayan, tp inti masalah biasanya bukan tool"
Reply C: "coba sederhanain dulu — kalo lo gak konsisten di app fancy, app simple jg sama aja"

[ROAST — halus]
Tweet: "gue baru investasi 1 juta di koin meme, semoga to the moon"
Reply A: "doa lo bagus, plan exit lo apa?"
Reply B: "to the moon biasanya artinya ke 0, hati2"
Reply C: "elu lebih percaya doa daripada DYOR ya"

[SUPPORTIVE — empati]
Tweet: "putus sama pacar setelah 3 tahun, ngerasa kosong banget"
Reply A: "3 tahun bukan waktu pendek, wajar kosong dulu beberapa minggu"
Reply B: "gak ada timeline pasti buat sembuh, ambil waktu lo"
Reply C: "kosong itu ruang baru, bukan akhir — pelan2 aja"

[ANNOUNCE — ngumumin]
Tweet: "akhirnya gue rilis side project yg gue garap 6 bulan, link di bio"
Reply A: "ngeklik link bio dulu, semoga sukses bro"
Reply B: "ship pertama itu yg paling susah, mantap"
Reply C: "udah dicek, UI nya bersih banget"

[META/MEME]
Tweet: "POV: lo lagi mau tidur tapi tiba2 inget kesalahan 5 tahun lalu"
Reply A: "otak emang penjahat paling konsisten di dunia"
Reply B: "kenapa harus jam 2 pagi sih waktu yg dipilih"
Reply C: "gua malah inget yg 10 tahun lalu, lo masih beginner"`.trim(),

    english: `
EXAMPLES OF NATURAL TWITTER REPLIES (study the vibe, don't copy literal):

[VENT]
Tweet: "burnt out from work, overtime every day and still no raise"
Reply A: "this is the textbook sign that loyalty is not being reciprocated"
Reply B: "burnout this bad means it's exit-plan time, not push-through time"
Reply C: "the company will replace you in a week — return the energy"

[JOKE]
Tweet: "diet failed again today lol, donuts won"
Reply A: "diet works best when it starts tomorrow"
Reply B: "donuts are undefeated and that's just science"
Reply C: "you didn't fail, you just rescheduled"

[FLEX]
Tweet: "finally got the offer from my dream company after 6 months of grinding"
Reply A: "congrats man, the grind paid off"
Reply B: "6 months feels long until you're on the other side. nice work"
Reply C: "you have leverage now — don't forget to negotiate hard"

[QUESTION]
Tweet: "anyone found a productivity app that actually sticks? tried like 7 already"
Reply A: "the app isn't the problem, it's whether you open it at 8am every day"
Reply B: "Sunsama is solid but the real fix is fewer commitments not better tools"
Reply C: "you don't need a new app, you need a calendar block called 'work'"

[ROAST]
Tweet: "just put $1k into a meme coin, fingers crossed"
Reply A: "great. what's your exit plan?"
Reply B: "to the moon usually means to zero, just so you know"
Reply C: "your prayer game is stronger than your DYOR game"

[SUPPORTIVE]
Tweet: "broke up with my partner of 3 years, feeling empty"
Reply A: "3 years is real, empty for a few weeks is the price"
Reply B: "no timeline on this. take whatever space you need"
Reply C: "empty just means space — give it time before you fill it"

[ANNOUNCE]
Tweet: "finally shipped the side project I've been on for 6 months, link in bio"
Reply A: "clicking now. congrats on shipping — that's the hardest part"
Reply B: "shipping is the milestone, not the launch. good work"
Reply C: "checked it out, the UI is genuinely clean"

[META/MEME]
Tweet: "POV: you're about to sleep and suddenly remember something cringe from 5 years ago"
Reply A: "brain is the most consistent villain in human history"
Reply B: "why is 2am always the chosen hour"
Reply C: "i'm getting flashbacks from 10 years ago, you're a rookie"`.trim(),

    japanese: `
日本語Twitterの自然な返信例（スタイルを学ぶ、コピーしない）:

[VENT — 愚痴]
ツイート: "毎日残業なのに給料上がらない、もう疲れた"
返信A: "それは忠誠心が報われてないやつ、転職検討マジ"
返信B: "そのレベルの疲れはpush throughじゃなくてexit planの時"
返信C: "会社は1週間で代わり見つけるよ、こっちもドライでいい"

[JOKE — 冗談]
ツイート: "またダイエット失敗 草 ドーナツが強すぎる"
返信A: "ダイエットは明日からが本番（永遠に）"
返信B: "ドーナツは無敗、これは科学"
返信C: "失敗じゃなくて延期、ポジティブに行こう"

[FLEX — 自慢]
ツイート: "半年の努力の末、第一志望から内定もらった！"
返信A: "おめでとう、半年の grind が報われたね"
返信B: "ここからは交渉力ある側、強気で行け"
返信C: "ちゃんと祝っといて、明日から忙しくなるぞ"

[QUESTION — 質問]
ツイート: "続く生産性アプリってある？7個試したけど続かない"
返信A: "アプリの問題じゃなくて朝8時に開く習慣の問題かも"
返信B: "Sunsamaいいけど結局やることを減らすのが先"
返信C: "新しいアプリより、カレンダーに『仕事』ってブロック1個"

[ROAST — いじり]
ツイート: "ミームコインに10万入れた、月に行きたい"
返信A: "おお、出口戦略は？"
返信B: "to the moonって大抵 to the zero だよ、念のため"
返信C: "祈り力 > DYOR力 だね"

[SUPPORTIVE — 共感]
ツイート: "3年付き合った彼女と別れた。空っぽ"
返信A: "3年は本物、しばらく空っぽが当たり前"
返信B: "回復に決まった日数なんてない、自分のペースで"
返信C: "空っぽ＝余白、すぐ埋めようとしないで"

[ANNOUNCE — 告知]
ツイート: "半年作ってたサイドプロジェクト、やっと公開した。bioにリンク"
返信A: "ぽちった。ship したのが一番すごい、おめでとう"
返信B: "リリースより ship 完了がマイルストーン、ナイス"
返信C: "見たけどUIめっちゃ綺麗"

[META/MEME]
ツイート: "POV: 寝ようとした瞬間に5年前の黒歴史を思い出す"
返信A: "脳は人類史上最も安定したヴィラン"
返信B: "なぜ深夜2時を選ぶ"
返信C: "俺は10年前の思い出してる、まだ初心者だな"`.trim()
  };

  // Persona: show GOOD openers / GOOD endings instead of long "don't" lists.
  // Positive prompting performs better than negative prompting.
  const basePersona = {
    indonesian: `Kamu orang Indonesia asli, 20-an, aktif di Twitter/X tiap hari.
Nulis kayak lagi chat sama temen — singkat, spontan, punya opini sendiri, kadang sarkas.

CARA BUKA REPLY YANG NATURAL (boleh pakai/varianya):
  "anjir relate", "lol", "wkwk", "fair sih", "iya bener", "gue mikir gini", "mending lu coba",
  "btw", "tapi tapi", "intinya", "nah ini", "real sih"

CARA TUTUP REPLY YANG NATURAL:
  "wkwk", "fair?", "ya gak sih", "deh", "anjay", "real" — atau langsung berhenti tanpa filler.

PRINSIP:
- Match panjang & gaya tweet aslinya. Tweet 1 kalimat? Bales 1 kalimat.
- Punya stance/opini, jangan netral diplomatis.
- Lebih baik 1 kalimat tajam daripada 3 kalimat hambar.
- Emoji opsional, maksimal 1 — taro di tengah/akhir, bukan di awal.

Output: HANYA teks reply. Tanpa label, tanpa tanda kutip, langsung isi.`,

    english: `You're a real person, mid-20s, chronically online on Twitter/X.
You write like you text — short, direct, opinionated, sometimes dry/sarcastic.

NATURAL OPENERS (use these or variants):
  "lol", "ngl", "fr", "honestly", "the thing is", "this", "real", "imagine", "lowkey",
  "ok but", "thing is", "yeah no" — or just start with the noun/verb directly.

NATURAL ENDINGS:
  "lol", "fr", "ngl", "tbh", "deadass", "real" — or just end clean. No "hope this helps".

PRINCIPLES:
- Mirror the tweet's length and energy. 1-sentence tweet → 1-sentence reply.
- Have a take. Don't be diplomatically neutral.
- One sharp sentence beats three bland ones.
- Emoji optional, max 1, never at the start.

Output: ONLY the reply text. No labels, no outer quotes, no preamble.`,

    japanese: `あなたは20代の日本人。毎日Twitter/Xを使ってる。
LINEで友達に送るような感覚で書く — 短く、率直、自分の意見あり、たまに皮肉。

自然な書き出し（これらかバリエーション）:
  「それな」「わかる」「いやマジで」「ぶっちゃけ」「逆に」「いや」「これ」「正直」「俺は」「むしろ」

自然な終わり方:
  「な」「わ」「だわ」「やん」「草」「ww」「マジ」 — または余計な言葉なしで止める。

原則:
- ツイートの長さと温度に合わせる。1文なら1文で返す。
- スタンスを持つ。中立的に逃げない。
- 1文の鋭さ > 3文の薄さ
- 絵文字は任意、最大1個、文頭には置かない

出力: 返信テキストのみ。ラベル・引用符・前置きなし。`
  };

  const shots = fewShots[language] || fewShots.english;
  const base = persona
    ? ((language === 'indonesian'
          ? `KARAKTER KUSTOM (override default kalo conflict):\n${persona}\n\n`
          : language === 'japanese'
          ? `カスタムキャラ（デフォルトより優先）:\n${persona}\n\n`
          : `CUSTOM CHARACTER (overrides default on conflict):\n${persona}\n\n`)
        + (basePersona[language] || basePersona.english))
    : (basePersona[language] || basePersona.english);

  return `${base}\n\n${shots}`;
}

function buildUserPrompt(tweetText, language, topic, sentiment, enrichedContext = '', replyTone = 'auto', styleHint = null, vibeHint = null, includeEmojis = true) {
  const lengthGuide = calcReplyLength(tweetText);
  const style = styleHint || detectTweetStyle(tweetText);
  const vibe  = vibeHint  || detectVibe(tweetText);
  const styleDirective = buildStyleDirective(style, vibe, language);

  const sentimentToneMap = {
    positive: { id: 'Nada: positif & supportif', jp: 'トーン: ポジティブ', en: 'Tone: positive & supportive' },
    negative: { id: 'Nada: empati & solutif',   jp: 'トーン: 共感的',     en: 'Tone: empathetic & solution-focused' },
    neutral:  { id: 'Nada: netral & informatif', jp: 'トーン: ニュートラル', en: 'Tone: neutral & informative' }
  };
  const replyToneMap = {
    serious:  { id: 'Balas SERIUS & substantif',           jp: '真剣に返信',         en: 'Reply SERIOUSLY and substantively' },
    funny:    { id: 'Balas dengan HUMOR, witty, ringan',   jp: 'ユーモアで返信',     en: 'Reply with HUMOR, witty and light' },
    question: { id: 'Balik NANYA, bikin mereka mikir',     jp: '質問で返す',         en: 'Reply by ASKING a question back' },
    roast:    { id: 'ROAST HALUS, sarkastis ringan',       jp: '軽いいじり',         en: 'LIGHT ROAST, mildly sarcastic' },
    support:  { id: 'SUPPORTIF, validasi & empati',        jp: 'サポート・共感',     en: 'SUPPORTIVE, validate & empathize' }
  };
  const manualTone = replyToneMap[replyTone];
  const tone = manualTone || sentimentToneMap[sentiment] || sentimentToneMap.neutral;

  const emojiInstruction = {
    indonesian: includeEmojis
      ? 'Emoji: boleh max 1, opsional, jangan di awal.'
      : 'Emoji: JANGAN PAKAI emoji sama sekali.',
    english: includeEmojis
      ? 'Emoji: optional, max 1, never at the start.'
      : 'Emoji: do NOT use any emoji at all.',
    japanese: includeEmojis
      ? '絵文字: 任意・最大1個・文頭NG'
      : '絵文字: 絵文字を一切使わないこと'
  };
  const emojiLine = emojiInstruction[language] || emojiInstruction.english;

  const prompts = {
    indonesian:
`PANJANG: ${lengthGuide.label}
TOPIK: ${topic} | ${tone.id}
${emojiLine}

${styleDirective}

CARA REPLY:
- Match gaya tweet asli persis (formality, kapital, slang)
- Jawab langsung kalo nanya, opini sendiri kalo sharing
- Komentari isi gambar/link kalo ada, bukan generik
- 1 kalimat tajam > 3 kalimat hambar
${enrichedContext}

TWEET: "${tweetText}"

Reply:`.trim(),

    japanese:
`長さ: ${lengthGuide.label}
トピック: ${topic} | ${tone.jp}
${emojiLine}

${styleDirective}

返信ルール:
- 元ツイートの文体・口調・敬語/タメ口を必ず合わせる
- 質問なら直接・簡潔に、意見なら自分の視点
- 画像/リンク本文に触れる、汎用的にならない
- 鋭い1文 > 薄い3文
${enrichedContext}

ツイート: "${tweetText}"

返信:`.trim(),

    english:
`LENGTH: ${lengthGuide.label}
TOPIC: ${topic} | ${tone.en}
${emojiLine}

${styleDirective}

HOW TO REPLY:
- Match the source tweet's exact style (formality, casing, slang)
- Direct answer if it's a question, your take if it's an opinion
- Comment on the actual image/link content, never generic
- One sharp sentence beats three bland ones
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

// ===== EMOJI HELPERS (use Extended_Pictographic so digits/`#`/`*` aren't matched) =====
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;
const EMOJI_RUN_REGEX = /(\p{Extended_Pictographic})\1{2,}/gu;

function limitEmoji(text, max = 2) {
  text = text.replace(EMOJI_RUN_REGEX, '$1$1');
  const emojis = text.match(EMOJI_REGEX) || [];
  if (emojis.length > max) {
    let count = 0;
    text = text.replace(EMOJI_REGEX, m => (++count <= max) ? m : '');
  }
  return text;
}

function stripEmoji(text) {
  return text.replace(EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();
}

// ===== HUMAN-LIKE POST-PROCESSING (CRITICAL FIX) =====
function humanizeIndonesianTweet(text, styleHint = {}) {
  // 1. LIMIT EMOJI MAX 2 (HAPUS SPAM) — Extended_Pictographic supaya angka/`#`/`*` aman
  text = limitEmoji(text, 2);

  // 2. GANTI KATA FORMAL → CASUAL (only when tweet itself reads casual)
  const isCasual = (styleHint.formality ?? 4) <= 5;
  const formalToCasual = isCasual ? [
    [/\bsaya\b/gi, 'gue'], [/\b(anda|kamu)\b/gi, 'lu'],
    [/\b(sangat|sekali)\b/gi, 'banget'],
    [/\btidak\b/gi, 'gak'], [/\bbelum\b/gi, 'belom'],
    [/\bterima kasih\b/gi, 'makasih'],
    [/\bmaaf\b/gi, 'maap'], [/\btahu\b/gi, 'tau']
  ] : [];
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
  
  // 4. SLANG INJECTOR — only when tweet itself is laughy / casual
  if (isCasual && (styleHint.laughLevel ?? 0) >= 1) {
    const contextSlangs = [
      { trigger: /\benak|sedap|nikmat\b/i, slang: ' wkwk' },
      { trigger: /\bsusah|ribet|pusing\b/i, slang: ' hadeh' },
      { trigger: /\bkeren|bagus|kualitas\b/i, slang: ' mantap' },
      { trigger: /\bmahal|duit|uang\b/i, slang: ' aduh' }
    ];
    for (const { trigger, slang } of contextSlangs) {
      if (trigger.test(text) && !text.includes(slang.trim())) {
        text = text.replace(/([.!?])?\s*$/, `${slang}$1`);
        break;
      }
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
// Note: deliberately NO blanket ます→る / です→"" transform — it breaks irregular
// verbs (ある→あるる, いる→いるる) and noun copulas (学生です→学生). We let the
// LLM handle conjugation; we only clean punctuation, brackets, and runaway slang.
function naturalizeJapanese(text, styleHint = {}) {
  if (!text) return text;

  // Remove decorative brackets
  text = text
    .replace(/「|」|『|』|（|）/g, '')
    .replace(/\[|\]/g, '');

  // Collapse excessive punctuation
  text = text
    .replace(/！{2,}/g, '！')
    .replace(/!{2,}/g, '!')
    .replace(/？{2,}/g, '？')
    .replace(/\?{2,}/g, '?');

  // Collapse repeated slang/emoji-words
  text = text
    .replace(/(ぴえん){2,}/gi, 'ぴえん')
    .replace(/(草){2,}/gi, '草')
    .replace(/(うける){2,}/gi, 'うける')
    .replace(/w{3,}/gi, 'ww');

  // Only strip です/ます when the source tweet itself is plainly casual
  // (avoids breaking 学生です / あります / います)
  if ((styleHint.formality ?? 4) <= 3) {
    // safe-ish: drop sentence-final です after い-adjectives (すごいです → すごい)
    text = text.replace(/([\u3041-\u3093ぁ-んい])です([。！？!?\s]|$)/g, '$1$2');
  }

  // Trim leading/trailing whitespace & dangling punctuation
  text = text.trim().replace(/^[\s！？!?\.,、。]+|[\s！？!?\.,、。]+$/g, '');

  // Limit length
  if (text.length > 100) text = text.substring(0, 97) + '…';

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
async function generateResponse(tweetContext, userStyle = 'casual', includeEmojis = true, forceTone = null) {
  // Support both old string format and new object format
  const tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  const mediaCtx = typeof tweetContext === 'object' ? tweetContext : {};

  const language = detectLanguage(tweetText);
  const topic = detectTopic(tweetText);
  const sentimentResult = detectSentiment(tweetText);
  const adjustedStyle = adjustStyleForSentiment(userStyle, sentimentResult.sentiment);

  // NEW: style/vibe detection — drives prompt directive AND post-processing
  const style = detectTweetStyle(tweetText);
  const vibe  = detectVibe(tweetText);

  console.log('🔍 Detected - Language:', language, '| Topic:', topic,
              '| Sentiment:', sentimentResult.sentiment, '| Style:', adjustedStyle,
              '| Formality:', style.formality, '| Vibe:', vibe.vibe);

  const enrichedContext = buildMediaContext(mediaCtx);
  const { groqApiKey, userPersona, replyTone: storedTone, blacklistWords } = await chrome.storage.sync.get(['groqApiKey', 'userPersona', 'replyTone', 'blacklistWords']);
  const replyTone = forceTone || storedTone || 'auto';
  const systemPrompt = buildSystemPrompt(language, userPersona || '');
  const userPrompt   = buildUserPrompt(tweetText, language, topic, sentimentResult.sentiment, enrichedContext, replyTone || 'auto', style, vibe, includeEmojis);
  const lengthGuide  = calcReplyLength(tweetText);
  const modelParams  = getModelParams(replyTone, language);
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
      ...modelParams
    })
  });

  if (!response.ok) throw new Error(`API Error ${response.status}`);
  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) throw new Error('Empty response');

  let reply = data.choices[0].message.content.trim();

  // Apply language-specific style-aware humanizer
  if (language === 'english') reply = humanizeText(reply, style);
  else if (language === 'indonesian') reply = humanizeIndonesian(reply, style);
  reply = limitSlangOveruse(reply);
  if (language === 'japanese') reply = naturalizeJapanese(reply, style);

  reply = reply.replace(/\s+/g, ' ').trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[\u201c\u201d\u2018\u2019]+|[\u201c\u201d\u2018\u2019]+$/g, '');

  if (reply.length < 100 && !reply.includes('?') && !reply.includes('!')) {
    reply = reply.replace(/\.$/,'');
  }

  // includeEmojis=false → strip any emoji that snuck in despite the prompt
  if (!includeEmojis) reply = stripEmoji(reply);

  // Blacklist filter
  if (blacklistWords && blacklistWords.length > 0) {
    for (const word of blacklistWords) {
      if (!word.trim()) continue;
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('\\b' + escaped + '\\b', 'gi');
      reply = reply.replace(re, '');
    }
    reply = reply.replace(/  +/g, ' ').trim();
  }

  return reply.length > 280 ? reply.substring(0, 277) + '...' : reply;
}
// ===== MULTI-RESPONSE GENERATION =====
async function generateMultipleResponses(tweetContext, userStyle = 'casual', includeEmojis = true, numResponses = 3, replyTone = 'auto') {
  const tweetText = typeof tweetContext === 'string' ? tweetContext : tweetContext.text;
  const sentimentResult = detectSentiment(tweetText);
  console.log('📊 Sentiment:', sentimentResult);

  const baseStyles = ['casual', 'enthusiastic', 'analytical', 'meme', 'supportive'];

  // Plan the styles up front so total count stays correct even if some calls fail.
  const planned = [{ style: userStyle, isRecommended: true }];
  for (let i = 1; i < numResponses; i++) {
    // Pick distinct styles when possible to avoid 3 identical-looking replies
    const candidates = baseStyles.filter(s => !planned.some(p => p.style === s));
    const pool = candidates.length ? candidates : baseStyles;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    planned.push({ style: pick, isRecommended: false });
  }

  // Parallel fan-out — 3 API calls in ~1 round-trip instead of 3.
  const settled = await Promise.allSettled(
    planned.map(p => generateResponse(tweetContext, p.style, includeEmojis, replyTone))
  );

  const responses = [];
  settled.forEach((r, idx) => {
    if (r.status === 'fulfilled' && r.value) {
      responses.push({
        id: responses.length + 1,
        text: r.value,
        style: planned[idx].style,
        isRecommended: planned[idx].isRecommended
      });
    } else if (r.status === 'rejected') {
      console.warn(`[generateMultipleResponses] variant ${idx + 1} failed:`, r.reason?.message || r.reason);
    }
  });

  // If everything failed, surface the first error so the UI can show it
  if (responses.length === 0) {
    const firstErr = settled.find(r => r.status === 'rejected');
    throw firstErr?.reason || new Error('All reply variants failed');
  }

  return { responses, sentiment: sentimentResult, tweetText };
}

// ===== HUMANIZE TEXT (ENGLISH) — style-aware =====
function humanizeText(text, styleHint = {}) {
  let r = text.trim();

  // Strip AI preamble phrases
  r = r.replace(/^(here'?s?( a| my| the)?|this is( a)?|response:|reply:|tweet:|ai:|answer:|sure[,!]?|of course[,!]?|great[,!]?|absolutely[,!]?|certainly[,!]?|indeed[,!]?)\s*/gi, '');

  // Strip formal AI connectors mid-sentence
  const formalPhrases = [
    /\bit is worth noting that\b/gi, /\bplease note that\b/gi,
    /\bit is important to\b/gi, /\bkeep in mind that\b/gi,
    /\bin conclusion[,.]?\s*/gi, /\bto summarize[,.]?\s*/gi,
    /\bfurthermore[,.]?\s*/gi, /\bmoreover[,.]?\s*/gi,
    /\badditionally[,.]?\s*/gi, /\bin addition[,.]?\s*/gi,
    /\bas an ai\b/gi, /\bi('m| am) an ai\b/gi,
    /\bbest regards.*$/gi, /\bsincerely.*$/gi,
    /\bhope this helps.*$/gi, /\bhope that helps.*$/gi,
  ];
  for (const p of formalPhrases) r = r.replace(p, '');

  // Contractions — only apply when the source tweet itself reads casual
  const casual = (styleHint.formality ?? 4) <= 6;
  if (casual) {
    r = r
      .replace(/\bdo not\b/gi, "don't").replace(/\bcannot\b/gi, "can't")
      .replace(/\bwill not\b/gi, "won't").replace(/\bwould not\b/gi, "wouldn't")
      .replace(/\bit is\b/gi, "it's").replace(/\bthat is\b/gi, "that's")
      .replace(/\bthey are\b/gi, "they're").replace(/\bwe are\b/gi, "we're")
      .replace(/\byou are\b/gi, "you're").replace(/\bi am\b/gi, "i'm")
      .replace(/\bi would\b/gi, "i'd").replace(/\bi have\b/gi, "i've")
      .replace(/\bI would have\b/gi, "I would've").replace(/\bshould not\b/gi, "shouldn't");
  }

  // Mirror capitalization style: if tweet starts lowercase, we start lowercase too
  if (styleHint.startsLower && /^[A-Z]/.test(r)) {
    r = r.charAt(0).toLowerCase() + r.slice(1);
  }

  // Clean up
  r = r.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
  if (r.length < 120 && !r.includes('?') && !r.includes('!')) r = r.replace(/\.$/, '');

  return r;
}

function humanizeIndonesian(text, styleHint = {}) {
  let r = text.trim();

  // Strip formal opener phrases common in AI Indonesian
  const formalID = [
    /^(memang benar bahwa|hal ini menunjukkan|perlu diketahui bahwa|sebagai informasi|dengan demikian|adapun|terlebih lagi|tidak dapat dipungkiri bahwa|pada dasarnya)[,.]?\s*/gi,
    /^(tentunya|pastinya|sudah pasti|sudah tentu)[,.]?\s*/gi,
    /\bsebagaimana disebutkan\b/gi, /\bhal tersebut\b/gi,
    /\bdengan kata lain\b/gi, /\bsecara keseluruhan\b/gi,
    /\bpada akhirnya\b/gi, /\bsemoga bermanfaat.*$/gi,
    /\bjangan lupa like.*$/gi, /\bfollow untuk.*$/gi,
  ];
  for (const p of formalID) r = r.replace(p, '');

  // Style-aware shortenings — formality from the tweet decides the level
  const formality = styleHint.formality ?? 4;
  if (formality <= 3) {
    // Heavy casual: full slang replacement (deterministic — gak random lagi)
    r = r
      .replace(/\btidak\b/gi, 'gak')
      .replace(/\bsudah\b/gi, 'udah')
      .replace(/\bkalau\b/gi, 'kalo')
      .replace(/\bsangat\b/gi, 'banget')
      .replace(/\bseperti\b/gi, 'kayak')
      .replace(/\bkarena\b/gi, 'karna')
      .replace(/\buntuk\b/gi, 'buat')
      .replace(/\bsaya\b/gi, 'gue')
      .replace(/\b(anda|kamu)\b/gi, 'lu');
  } else if (formality <= 6) {
    // Light casual: only the safe ones
    r = r
      .replace(/\btidak\b/gi, 'gak')
      .replace(/\bsudah\b/gi, 'udah');
  }
  // formality >= 7 → leave formal as-is, mirror the tweet

  // Mirror lowercase style if the tweet started lowercase
  if (styleHint.startsLower && /^[A-Z]/.test(r)) {
    r = r.charAt(0).toLowerCase() + r.slice(1);
  }

  // Drop trailing period on short casual replies (only if tweet itself is casual)
  r = r.replace(/\s+/g, ' ').trim();
  if (formality <= 5 && r.length < 150 && r.endsWith('.')) r = r.slice(0, -1);

  return r;
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

// ===== HUMAN-LIKE POST-PROCESSOR =====
// NOTE: deliberately DOES NOT re-run humanizeIndonesian / humanizeText / etc.
// generateStandaloneTweet already runs humanizeIndonesianTweet on the result
// for Indonesian; reply path calls humanizeIndonesian / humanizeText directly.
// Calling another humanizer here was double-processing the same text and
// occasionally produced odd slang mixes (e.g. "saya gak tahu, saya tidak ...").
// This function now only does light surface tweaks safe to apply on top.
function simulateHumanTyping(text, language = 'indonesian') {
  if (!text) return text;
  let r = text;

  // Drop trailing period 25% of the time (short tweet vibe)
  if (Math.random() > 0.75 && r.endsWith('.')) r = r.slice(0, -1);

  return r.replace(/\s+/g, ' ').trim();
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
      request.numResponses || 3,
      request.replyTone || 'auto'
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