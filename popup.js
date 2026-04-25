// ================================
// JAGRES AI ASSISTANT v2.0 - POPUP SCRIPT
// With Custom Persona Manager
// ================================

// === STATUS MESSAGE =====
function showStatus(message, type = 'success') {
  const el = document.getElementById('statusMessage');
  el.textContent = message;
  el.className = `show ${type}`;
  setTimeout(() => { el.className = '; }, 3000);
}

function createShakeEffect(element) {
  if (!element) return;
  element.classList.add('shake');
  setTimeout(() => element.classList.remove('shake'), 300);
}

// ===== API KEY ====
document.getElementById('saveKey').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
  if (!key.startsWith('gsk_')) {
    showStatus('⚠️ Invalid API key — must start with gsk_', 'error');
    createShakeEffect(document.getElementById('apiKey'));
    return;
  }
  chrome.storage.sync.set({ groqApiKey: key }, () => {
    showStatus('✅ API Key saved!', 'success');
    document.getElementById('apiKey').value = '';
    document.getElementById('apiKey').placeholder = '••••••••••••••••';
  });
});

// Load saved key indicator
chrome.storage.sync.get(['groqApiKey'], (result) => {
  if (result.groqApiKey) {
    document.getElementById('apiKey').placeholder = '••••••••• (saved)';
  }
});

// ===== CONTENT CREATOR: SINGLE TWEET =====
document.getElementById('generateTweet').addEventListener('click', async () => {
  const topic = document.getElementById('tweetTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('tweetTopic'));
    return;
  }

  const style = document.getElementById('tweetStyle').value;
  const language = document.getElementById('tweetLanguage').value;

  document.getElementById('loading').classList.add('show');
  document.getElementById('tweetResult').classList.remove('show');
  document.getElementById('threadResult').classList.remove('show');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'generateStandaloneTweet',
      topic, style, language
    });

    document.getElementById('loading').classList.remove('show');

    if (result.error) {
      showStatus('❌ ' + result.error, 'error');
      return;
    }

    const text = typeof result === 'string' ? result : result.text || result;
    document.getElementById('tweetResultText').textContent = text;
    document.getElementById('tweetResult').classList.add('show');
    showStatus('⚡ Tweet generated!', 'success');
  } catch (err) {
    document.getElementById('loading').classList.remove('show');
    showStatus('❌ ' + err.message, 'error');
  }
});

// Copy tweet
document.getElementById('copyTweet').addEventListener('click', () => {
  const text = document.getElementById('tweetResultText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    showStatus('📋 Copied to clipboard!', 'success');
  });
});

// Regenerate tweet
document.getElementById('regenTweet').addEventListener('click', () => {
  document.getElementById('generateTweet').click();
});

// ===== CONTENT CREATOR: THREAD =====
document.getElementById('generateThread').addEventListener('click', async () => {
  const topic = document.getElementById('tweetTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('tweetTopic'));
    return;
  }

  const style = document.getElementById('tweetStyle').value;
  const language = document.getElementById('tweetLanguage').value;

  document.getElementById('loading').classList.add('show');
  document.getElementById('tweetResult').classList.remove('show');
  document.getElementById('threadResult').classList.remove('show');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'generateThread',
      topic, style, language
    });

    document.getElementById('loading').classList.remove('show');

    if (result.error) {
      showStatus('❌ ' + result.error, 'error');
      return;
    }

    const threads = Array.isArray(result) ? result : [result];
    const container = document.getElementById('threadContainer');
    container.innerHTML = '';

    threads.forEach((tweet, i) => {
      const div = document.createElement('div');
      div.className = 'thread-tweet';
      div.innerHTML = `
        <div class="thread-tweet-label">TWEET ${i + 1}/${threads.length} ${i === 0 ? '👇' : i === threads.length - 1 ? '🔚' : '↓'}</div>
        <div class="thread-tweet-text">${escapeHtml(tweet)}</div>
        <button class="thread-tweet-copy" data-text="${escapeAtr(tweet)}">📋 Copy Tweet ${i + 1}</button>
      `;
      container.appendChild(div);
    });

    // Copy handlers
    container.querySelectorAll('.thread-tweet-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        navigator.clipboard.writeText(e.target.dataset.text).then(() => {
          e.target.textContent = '✅ Copied!';
          setTimeout(() => { e.target.textContent = e.target.textContent.replace('✅ Copied!', '📋 Copy'); }, 2000);
          showStatus('📋 Copied!', 'success');
        });
      });
    });

    document.getElementById('threadResult').classList.add('show');
    showStatus('🧵 Thread generated!', 'success');
  } catch (err) {
    document.getElementById('loading').classList.remove('show');
    showStatus('❌ ' + err.message, 'error');
  }
});

// ===== BATCH GENERATOR ====
document.getElementById('generateBatch').addEventListener('click', async () => {
  const topic = document.getElementById('batchTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('batchTopic'));
    return;
  }

  const style = document.getElementById('tweetStyle')?.value || 'casual';
  const language = document.getElementById('tweetLanguage')?.value || 'indonesian';

  document.getElementById('batchLoading').classList.add('show');
  document.getElementById('batchResult').classList.remove('show');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'generateBatchContent',
      topic, style, language, count: 3
    });

    document.getElementById('batchLoading').classList.remove('show');

    if (result.error) {
      showStatus('❌ ' + result.error, 'error');
      return;
    }

    const container = document.getElementById('batchContainer');
    container.innerHTML = '';

    const tweets = result.results || [];
    tweets.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'batch-tweet';
      div.innerHTML = `
        <div class="batch-tweet-tone">${item.tone || 'Variation ' + (i + 1)}</div>
        <div class="batch-tweet-text">${escapeHtml(item.text)}</div>
        <button class="batch-tweet-copy" data-text="${escapeAttr(item.text)}">📋 Copy</button>
      `;
      container.appendChild(div);
    });

    // Image suggestion
    if (result.image && result.image.url) {
      const imgDiv = document.createElement('div');
      imgDiv.style.cssText = 'margin-top:8px; text-align:center;';
      imgDiv.innerHTML = `
        <div style="font-size:9px; color:#ce93d8; margin-bottom:4px; letter-spacing:1px;">SUGGESTED IMAGE</div>
        <img src="${result.image.url}" style="max-width:100%; border-radius:8px; border:1px solid rgba(255,215,0,0.15);" />
      `;
      container.appendChild(imgDiv);
    }

    // Copy handlers
    container.querySelectorAll('.batch-tweet-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        navigator.clipboard.writeText(e.target.dataset.text).then(() => {
          e.target.textContent = '✅ Copied!';
          setTimeout(() => { e.target.textContent = '📋 Copy'; }, 2000);
          showStatus('📋 Copied!', 'success');
        });
      });
    });

    document.getElementById('batchResult').classList.add('show');
    showStatus('📦 Batch generated!', 'success');
  } catch (err) {
    document.getElementById('batchLoading').classList.remove('show');
    showStatus('❌ ' + err.message, 'error');
  }
});

// === PERSONA MANAGER =====
const BUILTIN_PERSONA_IDS = ['default', 'motivator', 'roaster', 'techbro', 'wibu', 'philosopher', 'gossiper'];

async function loadPersonas() {
  try {
    const result = await chrome.runtime.sendMessage({ action: 'getPersonas' });
    if (result.error) throw new Error(result.error);
    renderPersonaGrid(result.personas, result.activePersonaId);
    updateActivePersonaDisplay(result.personas, result.activePersonaId);
  } catch (e) {
    console.error('Failed to load personas:', e);
  }
}

function renderPersonaGrid(personas, activeId) {
  const grid = document.getElementById('personaGrid');
  if (!grid) return;
  grid.innerHTML = '';

  personas.forEach(persona => {
    const card = document.createElement('div');
    card.className = `persona-card${persona.id === activeId ? ' active' : ''}`;
    card.dataset.id = persona.id;

    const isCustom = !BUILTIN_PERSONA_IDS.includes(persona.id);
    card.innerHTML = `
      <span class="persona-emoji">${persona.emoji || '🤖'}</span>
      <div class="persona-card-name">${escapeHtml(persona.name)}</div>
      <div class="persona-card-desc">${escapeHtml(persona.description || '')}</div>
      ${isCustom ? '<button class="persona-delete-btn">✕</button>' : ''}
    `;

    // Select persona
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.persona-delete-btn')) return;
      const res = await chrome.runtime.sendMessage({ action: 'setActivePersona', personaId: persona.id });
      if (res.success) {
        grid.querySelectorAll('.persona-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateActivePersonaDisplay(personas, persona.id);
        showStatus(`🎭 Persona: ${persona.emoji} ${persona.name}`, 'success');
      }
    });

    // Delete custom persona
    if (isCustom) {
      const deleteBtn = card.querySelector('.persona-delete-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete persona "${persona.name}"?`)) return;
        const res = await chrome.runtime.sendMessage({ action: 'deleteCustomPersona', personaId: persona.id });
        if (res.success) {
          loadPersonas();
          showStatus(`🗑️ Persona "${persona.name}" deleted`, 'warning');
        }
      });
    }

    grid.appendChild(card);
  });
}

function updateActivePersonaDisplay(personas, activeId) {
  const display = document.getElementById('activePersonaName');
  if (!display) return;
  const active = personas.find(p => p.id === activeId) || personas[0];
  display.textContent = `${active.emoji || '🤖'} ${active.name}`;
}

// Save custom persona
document.getElementById('savePersona').addEventListener('click', async () => {
  const name = document.getElementById('personaName').value.trim();
  const emoji = document.getElementById('personaEmoji').value.trim() || '🎭';
  const desc = document.getElementById('personaDesc').value.trim();
  const tone = document.getElementById('personaTone').value;
  const instruction = document.getElementById('personaInstruction').value.trim();

  if (!name) {
    showStatus('⚠️ Persona name is required', 'error');
    createShakeEffect(document.getElementById('personaName'));
    return;
  }
  if (!instruction) {
    showStatus('⚠️ Character instruction is required', 'error');
    createShakeEffect(document.getElementById('personaInstruction'));
    return;
  }

  const persona = {
    id: 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(),
    name,
    emoji,
    description: desc || instruction.substring(0, 60) + '...',
    tone,
    customInstruction: instruction,
    language: 'auto',
    createdAt: new Date().toISOString()
  };

  const res = await chrome.runtime.sendMessage({ action: 'saveCustomPersona', persona });
  if (res.success) {
    // Clear form
    document.getElementById('personaName').value = '';
    document.getElementById('personaEmoji').value = '';
    document.getElementById('personaDesc').value = '';
    document.getElementById('personaInstruction').value = '';
    // Set as active
    await chrome.runtime.sendMessage({ action: 'setActivePersona', personaId: persona.id });
    loadPersonas();
    showStatus(`🎭 Persona "${name}" created & activated!`, 'success');
  } else {
    showStatus('❌ Failed to save persona', 'error');
  }
});

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ===== INIT =====
loadPersonas();
