document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  setupEventListeners();
  setupStylePreview();
  initElegantEffects();
});

async function loadSettings() {
  const result = await chrome.storage.sync.get([
    'groqApiKey', 'responseStyle', 'autoDetect', 'showButton', 'includeEmojis', 'universalMode'
  ]);
  
  if (result.groqApiKey) {
    document.getElementById('apiKey').value = '••••••••••••••••••••••••••••••••••••••••';
    showStatus('Neural connection established successfully', 'success');
  }
  
  document.getElementById('responseStyle').value = result.responseStyle || 'bullish';
  updateStylePreview(result.responseStyle || 'bullish');
  
  updateToggle('autoDetect', result.autoDetect !== false);
  updateToggle('showButton', result.showButton !== false);
  updateToggle('includeEmojis', result.includeEmojis !== false);
  updateToggle('universalMode', result.universalMode !== false);
  
  updateModeIndicator(result.universalMode !== false);
}

function setupEventListeners() {
  document.getElementById('saveKey').addEventListener('click', saveApiKey);
  document.getElementById('responseStyle').addEventListener('change', handleStyleChange);
  
  // Content Creator Handlers
  document.getElementById('generateContent')?.addEventListener('click', generateContent);
  document.getElementById('generateBatch')?.addEventListener('click', generateBatch);
  document.getElementById('copyContent')?.addEventListener('click', copyContent);
  
  document.getElementById('autoDetect').addEventListener('click', () => toggleSetting('autoDetect'));
  document.getElementById('showButton').addEventListener('click', () => toggleSetting('showButton'));
  document.getElementById('includeEmojis').addEventListener('click', () => toggleSetting('includeEmojis'));
  document.getElementById('universalMode').addEventListener('click', () => toggleSetting('universalMode'));
}

function setupStylePreview() {
  const styleExamples = {
    bullish: "Natural output: 'This looks incredibly promising! The potential here is remarkable and the fundamentals are solid.'",
    analytical: "Technical analysis: 'Chart patterns indicate strong support levels with bullish momentum building across key indicators.'",
    community: "Community focus: 'Amazing to see the community rallying together. This collective energy is genuinely inspiring.'",
    fomo: "Urgency creation: 'This opportunity is generating significant attention. The timing seems particularly favorable right now.'",
    cautious: "Balanced perspective: 'Interesting developments worth monitoring closely. Always important to research thoroughly before decisions.'",
    meme: "Cultural humor: 'This definitely hits different. The vibes are immaculate and probably nothing... but maybe everything.'"
  };
  
  window.styleExamples = styleExamples;
}

function handleStyleChange(event) {
  const style = event.target.value;
  updateStylePreview(style);
  
  chrome.storage.sync.set({ responseStyle: style }, () => {
    console.log('Response style updated:', style);
    showStatus(`Protocol updated to ${style} mode`, 'success');
  });
  
  createElegantRipple(event.target);
}

function updateStylePreview(style) {
  const preview = document.getElementById('stylePreview');
  const exampleText = window.styleExamples[style] || '';
  
  preview.style.opacity = '0';
  setTimeout(() => {
    preview.textContent = exampleText;
    preview.style.opacity = '1';
  }, 150);
}

async function generateContent() {
  const topic = document.getElementById('contentTopic').value.trim();
  const type  = document.getElementById('contentType').value;
  const language = document.getElementById('contentLang').value || 'indonesian';
  const style = document.getElementById('contentTone').value || 'casual';
  
  // VALIDASI TOPIK
  if (!topic) {
    showStatus('⚠️ Please enter a topic', 'error');
    createShakeEffect(document.getElementById('contentTopic'));
    return;
  }
  
  // TAMPILKAN LOADING
  const button = document.getElementById('generateContent');
  const originalText = button.textContent;
  button.textContent = 'GENERATING...';
  button.disabled = true;
  button.style.background = 'linear-gradient(135deg, #ffce54, #40e0ff)';
  document.getElementById('contentPreview').textContent = '';
  document.getElementById('contentPreview').style.display = 'none';
  document.getElementById('contentActions').style.display = 'none';
  
  try {
    showStatus('🔍 Searching topic context...', 'warning');
    await new Promise(r => setTimeout(r, 300));
    showStatus('⚡ Generating content...', 'warning');
    
    // GENERATE CONTENT
    let result;
    if (type === 'single') {
      result = await chrome.runtime.sendMessage({
        action: 'generateStandaloneTweet',
        topic,
        style,
        language
      });
    } else {
      result = await chrome.runtime.sendMessage({
        action: 'generateThread',
        topic,
        style,
        language
      });
    }
    
    // HANDLE ERROR DARI API
    if (result && result.error) {
      throw new Error(result.error);
    }
    
    // TAMPILKAN HASIL
    const preview = document.getElementById('contentPreview');
    const actions = document.getElementById('contentActions');
    
    if (type === 'single') {
      // Store raw text as data attr for reliable copy
      preview.dataset.rawText = result;
      preview.innerHTML = `<div class="tweet-card">${result.replace(/\n/g, '<br>')}</div>`;
      preview.style.display = 'block';
      actions.innerHTML = `<button id="copyContent" class="copy-btn-main">📋 COPY TWEET</button>`;
      actions.style.display = 'flex';
      document.getElementById('copyContent').addEventListener('click', () => copyRaw(result));
      showStatus('✅ Tweet generated!', 'success');
    } else {
      // Thread: each tweet gets its own copy button
      preview.dataset.rawText = result.join('\n\n---\n\n');
      preview.innerHTML = result.map((t, i) => `
        <div class="tweet-card" style="margin-bottom:12px;">
          <div style="font-size:10px;color:#40e0ff;margin-bottom:6px;font-family:'Orbitron',sans-serif;letter-spacing:1px;">TWEET ${i+1}</div>
          <div class="tweet-text">${t.replace(/\n/g, '<br>')}</div>
          <button class="copy-single-btn" data-idx="${i}">📋 Copy</button>
        </div>`).join('');
      preview.style.display = 'block';
      actions.innerHTML = `<button id="copyContent" class="copy-btn-main">📋 COPY ALL THREAD</button>`;
      actions.style.display = 'flex';
      // Per-tweet copy
      preview.querySelectorAll('.copy-single-btn').forEach(btn => {
        btn.addEventListener('click', () => copyRaw(result[parseInt(btn.dataset.idx)]));
      });
      document.getElementById('copyContent').addEventListener('click', () => copyRaw(result.join('\n\n')));
      showStatus('✅ Thread generated!', 'success');
    }
    
    createSuccessRipple(button);
  } 
  catch (error) {
    // TAMPILKAN PESAN ERROR YANG JELAS
    const errorMessage = error.message || 'Content generation failed';
    
    // TAMPILKAN PETUNJUK UNTUK KONFLIK EXTENSION
    if (errorMessage.includes('403') || errorMessage.includes('privacy')) {
      showStatus(
        '⚠️ Twitter detected privacy extensions\n\n1. Disable AdBlock/Privacy Badger\n2. Reload Twitter\n3. Try again',
        'error'
      );
    } 
    else {
      showStatus(`❌ ${errorMessage}`, 'error');
    }
    
    createShakeEffect(document.getElementById('contentTopic'));
  }
  finally {
    button.textContent = originalText;
    button.disabled = false;
    button.style.background = 'linear-gradient(135deg, #ff40e0, #40e0ff)';
  }
}

// ===== BATCH GENERATOR =====
const TONE_LABELS = {
  casual: '😎 Santai', storytelling: '📖 Story', opinion: '🔥 Opini',
  humor: '😂 Humor', informative: '💡 Insight', hype: '⚡ Hype'
};

async function generateBatch() {
  const topic = document.getElementById('batchTopic').value.trim();
  const language = document.getElementById('batchLang').value || 'indonesian';

  if (!topic) {
    showStatus('⚠️ Masukkan topik dulu', 'error');
    document.getElementById('batchTopic').focus();
    return;
  }

  const btn = document.getElementById('generateBatch');
  const resultsDiv = document.getElementById('batchResults');
  const imgEl = document.getElementById('batchImage');
  const imgCaption = document.getElementById('batchImageCaption');

  btn.disabled = true;
  btn.textContent = '🔍 Searching & generating...';
  resultsDiv.innerHTML = '';
  imgEl.style.display = 'none';
  imgCaption.style.display = 'none';

  try {
    showStatus('⚡ Generating 3 variasi konten...', 'warning');

    const result = await chrome.runtime.sendMessage({
      action: 'generateBatchContent',
      topic,
      style: 'casual',
      language,
      count: 3
    });

    if (result.error) throw new Error(result.error);

    // Show image if found
    if (result.image && result.image.url) {
      imgEl.src = result.image.url;
      imgEl.style.display = 'block';
      imgCaption.style.display = 'block';
      imgCaption.textContent = `📷 "${result.image.query}" — klik buka full`;
      imgEl.onclick = () => chrome.tabs.create({ url: result.image.url });
      // Hide if image fails to load
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        imgCaption.style.display = 'none';
      };
    }

    // Render batch cards
    if (!result.results || result.results.length === 0) {
      throw new Error('No results generated');
    }

    resultsDiv.innerHTML = '';
    result.results.forEach((item, idx) => {
      const charCount = item.text.length;
      const card = document.createElement('div');
      card.className = 'batch-card';
      card.dataset.idx = idx;
      card.innerHTML = `
        <div class="batch-card-header">
          <span class="batch-tone-badge">${TONE_LABELS[item.tone] || item.tone}</span>
          <span class="batch-char-count">${charCount}/280</span>
        </div>
        <div class="batch-card-text">${escapeHtml(item.text)}</div>
        <div class="batch-card-actions">
          <button class="batch-copy-btn">📋 COPY</button>
          <button class="batch-select-btn">⭐ PILIH INI</button>
        </div>`;

      // Copy button
      card.querySelector('.batch-copy-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        copyRaw(item.text);
      });

      // Select button — highlight card
      card.querySelector('.batch-select-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        resultsDiv.querySelectorAll('.batch-card').forEach(c => c.classList.remove('batch-selected'));
        card.classList.add('batch-selected');
        copyRaw(item.text);
        showStatus('✅ Terpilih & di-copy!', 'success');
      });

      resultsDiv.appendChild(card);
    });

    showStatus(`✅ ${result.results.length} variasi siap!`, 'success');
  } catch (err) {
    showStatus(`❌ ${err.message}`, 'error');
    resultsDiv.innerHTML = `<div style="color:#ff6b6b;font-size:12px;padding:8px;">Error: ${escapeHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 GENERATE BATCH';
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function copyContent() {
  const preview = document.getElementById('contentPreview');
  const text = preview.dataset.rawText || preview.textContent || '';
  copyRaw(text);
}

function copyRaw(text) {
  if (!text) { showStatus('❌ Nothing to copy', 'error'); return; }
  // Always use execCommand in extension popup — most reliable in MV3
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    // Must be in viewport for execCommand to work
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length); // iOS compat
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      showStatus('✅ Copied!', 'success');
    } else {
      // Last resort: clipboard API
      navigator.clipboard?.writeText(text)
        .then(() => showStatus('✅ Copied!', 'success'))
        .catch(() => showStatus('❌ Copy failed — coba pilih teks manual', 'error'));
    }
  } catch(e) {
    navigator.clipboard?.writeText(text)
      .then(() => showStatus('✅ Copied!', 'success'))
      .catch(() => showStatus('❌ Copy failed', 'error'));
  }
}

// ===== API KEY VALIDATION =====
async function validateApiKey(apiKey) {
  if (!apiKey || apiKey.length < 35) {
    return { valid: false, error: 'API key length insufficient' };
  }
  
  if (!apiKey.startsWith('gsk_')) {
    return { valid: false, error: 'Invalid key format - must begin with gsk_' };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Validation test' }],
        max_tokens: 5
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Authentication failed - invalid API key' };
    } else if (response.status === 429) {
      return { valid: false, error: 'Rate limit exceeded' };
    } else {
      return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { valid: false, error: 'Connection timeout occurred' };
    }
    return { valid: false, error: 'Network connectivity issue: ' + error.message };
  }
}

async function saveApiKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const currentStyle = document.getElementById('responseStyle').value;
  const button = document.getElementById('saveKey');
  const originalText = button.textContent;
  
  if (!apiKey || apiKey === '••••••••••••••••••••••••••••••••••••••••') {
    showStatus('Please provide a valid API key', 'error');
    createShakeEffect(document.getElementById('apiKey'));
    return;
  }
  
  try {
    button.textContent = 'Validating connection...';
    button.disabled = true;
    button.style.background = 'linear-gradient(135deg, #ffce54, #40e0ff)';
    
    showStatus('Establishing neural connection...', 'warning');
    
    const validation = await validateApiKey(apiKey);
    
    if (validation.valid) {
      await chrome.storage.sync.set({ 
        groqApiKey: apiKey,
        responseStyle: currentStyle
      });
      
      showStatus('Neural connection established successfully', 'success');
      document.getElementById('apiKey').value = '••••••••••••••••••••••••••••••••••••••••';
      createSuccessRipple(button);
    } else {
      showStatus(`Connection failed: ${validation.error}`, 'error');
      createShakeEffect(document.getElementById('apiKey'));
    }
    
  } catch (error) {
    showStatus('Unexpected validation error occurred', 'error');
    console.error('API validation error:', error);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
    button.style.background = 'linear-gradient(135deg, #ff40e0, #40e0ff)';
  }
}

function toggleSetting(settingName) {
  const toggleElement = document.getElementById(settingName);
  const isActive = toggleElement.classList.contains('active');
  
  if (isActive) {
    toggleElement.classList.remove('active');
    chrome.storage.sync.set({ [settingName]: false });
  } else {
    toggleElement.classList.add('active');
    chrome.storage.sync.set({ [settingName]: true });
  }
  
  createToggleRipple(toggleElement);
  
  if (settingName === 'universalMode') {
    updateModeIndicator(!isActive);
  }
}

function updateToggle(settingName, isActive) {
  const toggleElement = document.getElementById(settingName);
  if (isActive) {
    toggleElement.classList.add('active');
  } else {
    toggleElement.classList.remove('active');
  }
}

function updateModeIndicator(universalMode) {
  const indicator = document.getElementById('modeIndicator');
  if (universalMode) {
    indicator.textContent = 'Neural network active for all Twitter accounts';
    indicator.style.borderColor = 'rgba(100, 255, 218, 0.3)';
    indicator.style.background = 'linear-gradient(135deg, rgba(100, 255, 218, 0.1), rgba(64, 224, 255, 0.1))';
  } else {
    indicator.textContent = 'Neural network limited to crypto detection';
    indicator.style.borderColor = 'rgba(255, 206, 84, 0.3)';
    indicator.style.background = 'linear-gradient(135deg, rgba(255, 206, 84, 0.1), rgba(255, 159, 64, 0.1))';
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('keyStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  if (type === 'success') {
    createSuccessEffect(statusDiv);
  } else if (type === 'error') {
    createErrorEffect(statusDiv);
  }
  
  setTimeout(() => {
    statusDiv.style.opacity = '0';
    setTimeout(() => {
      if (statusDiv.textContent === message) {
        statusDiv.textContent = '';
        statusDiv.className = '';
        statusDiv.style.opacity = '1';
      }
    }, 300);
  }, 6000);
}

// Elegant Effect Functions
function initElegantEffects() {
  setInterval(() => {
    if (Math.random() < 0.02) {
      createAmbientGlow();
    }
  }, 5000);
}

function createElegantRipple(element) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(64, 224, 255, 0.6) 0%, transparent 70%);
    transform: scale(0);
    animation: elegantRipple 0.6s ease-out;
    pointer-events: none;
    width: 100px;
    height: 100px;
    left: 50%;
    top: 50%;
    margin-left: -50px;
    margin-top: -50px;
  `;
  
  element.parentNode.style.position = 'relative';
  element.parentNode.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

function createSuccessRipple(element) {
  element.style.boxShadow = '0 0 30px rgba(100, 255, 218, 0.5)';
  element.style.transform = 'scale(1.02)';
  
  setTimeout(() => {
    element.style.boxShadow = '';
    element.style.transform = 'scale(1)';
  }, 600);
}

function createShakeEffect(element) {
  element.style.animation = 'elegantShake 0.5s ease-in-out';
  element.style.borderColor = '#ff4040';
  
  setTimeout(() => {
    element.style.animation = '';
    element.style.borderColor = 'rgba(64, 224, 255, 0.2)';
  }, 500);
}

function createToggleRipple(element) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: absolute;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(64, 224, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: toggleGlow 0.4s ease-out;
    pointer-events: none;
  `;
  
  element.parentNode.style.position = 'relative';
  element.parentNode.appendChild(glow);
  
  setTimeout(() => glow.remove(), 400);
}

function createSuccessEffect(element) {
  element.style.transform = 'translateY(-2px) scale(1.01)';
  element.style.boxShadow = '0 4px 16px rgba(100, 255, 218, 0.3)';
  
  setTimeout(() => {
    element.style.transform = '';
    element.style.boxShadow = '';
  }, 500);
}

function createErrorEffect(element) {
  element.style.transform = 'translateX(-2px)';
  element.style.boxShadow = '0 0 16px rgba(255, 64, 64, 0.3)';
  
  setTimeout(() => {
    element.style.transform = 'translateX(2px)';
  }, 100);
  
  setTimeout(() => {
    element.style.transform = '';
    element.style.boxShadow = '';
  }, 200);
}

function createAmbientGlow() {
  const sections = document.querySelectorAll('.section');
  const randomSection = sections[Math.floor(Math.random() * sections.length)];
  
  randomSection.style.boxShadow = '0 0 20px rgba(64, 224, 255, 0.1)';
  setTimeout(() => {
    randomSection.style.boxShadow = '';
  }, 2000);
}

const elegantStyles = document.createElement('style');
elegantStyles.textContent = `
  @keyframes elegantRipple {
    to { transform: scale(4); opacity: 0; }
  }
  
  @keyframes elegantShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  
  @keyframes toggleGlow {
    to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
  }
`;
document.head.appendChild(elegantStyles);