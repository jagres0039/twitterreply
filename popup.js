// ================================
// JAGRES AI ASSISTANT v2.0 - POPUP SCRIPT (FIXED)
// ================================

// === STATUS MESSAGE =====
function showStatus(message, type) {
  type = type || 'success';
  var el = document.getElementById('statusMessage');
  el.textContent = message;
  el.className = 'show ' + type;
  setTimeout(function() { el.className = '; }, 3000);
}

function createShakeEffect(element) {
  if (!element) return;
  element.classList.add('shake');
  setTimeout(function() { element.classList.remove('shake'); }, 300);
}

function escapeHtml(text) {
  var div = document.createElement('div');
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

// ===== API KEY =====
document.getElementById('saveKey').addEventListener('click', function() {
  var key = document.getElementById('apiKey').value.trim();
  if (!key.startsWith('gsk_')) {
    showStatus('⚠️ Invalid API key — must start with gsk_', 'error');
    createShakeEffect(document.getElementById('apiKey'));
    return;
  }
  chrome.storage.sync.set({ groqApiKey: key }, function() {
    showStatus('✅ API Key saved successfully!', 'success');
    document.getElementById('apiKey').value = '';
    document.getElementById('apiKey').placeholder = '••••••• (saved)';
  });
});

// Load saved key indicator
chrome.storage.sync.get(['groqApiKey'], function(result) {
  if (result.groqApiKey) {
    document.getElementById('apiKey').placeholder = '••••••••• (saved)';
  }
});

// ===== CONTENT CREATOR: SINGLE TWEET =====
document.getElementById('generateTweet').addEventListener('click', function() {
  var topic = document.getElementById('tweetTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('tweetTopic'));
    return;
  }

  var style = document.getElementById('tweetStyle').value;
  var language = document.getElementById('tweetLanguage').value;

  document.getElementById('loading').classList.add('show');
  document.getElementById('tweetResult').classList.remove('show');
  document.getElementById('threadResult').classList.remove('show');

  chrome.runtime.sendMessage(
    { action: 'generateStandaloneTweet', topic: topic, style: style, language: language },
    function(result) {
      document.getElementById('loading').classList.remove('show');

      if (chrome.runtime.lastError) {
        showStatus('❌ ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (result && result.error) {
        showStatus('❌ ' + result.error, 'error');
        return;
      }

      var text = typeof result === 'string' ? result : (result.text || String(result));
      document.getElementById('tweetResultText').textContent = text;
      document.getElementById('tweetResult').classList.add('show');
      showStatus('⚡ Tweet generated!', 'success');
    }
  );
});

// Copy tweet
document.getElementById('copyTweet').addEventListener('click', function() {
  var text = document.getElementById('tweetResultText').textContent;
  navigator.clipboard.writeText(text).then(function() {
    showStatus('📋 Copied to clipboard!', 'success');
  });
});

// Regenerate tweet
document.getElementById('regenTweet').addEventListener('click', function() {
  document.getElementById('generateTweet').click();
});

// ===== CONTENT CREATOR: THREAD =====
document.getElementById('generateThread').addEventListener('click', function() {
  var topic = document.getElementById('tweetTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('tweetTopic'));
    return;
  }

  var style = document.getElementById('tweetStyle').value;
  var language = document.getElementById('tweetLanguage').value;

  document.getElementById('loading').classList.add('show');
  document.getElementById('tweetResult').classList.remove('show');
  document.getElementById('threadResult').classList.remove('show');

  chrome.runtime.sendMessage(
    { action: 'generateThread', topic: topic, style: style, language: language },
    function(result) {
      document.getElementById('loading').classList.remove('show');

      if (chrome.runtime.lastError) {
        showStatus('❌ ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (result && result.error) {
        showStatus('❌ ' + result.error, 'error');
        return;
      }

      var threads = Array.isArray(result) ? result : [result];
      var container = document.getElementById('threadContainer');
      container.innerHTML = '';

      threads.forEach(function(tweet, i) {
        var div = document.createElement('div');
        div.className = 'thread-tweet';
        var icon = i === 0 ? '👇' : i === threads.length - 1 ? '🔚' : '↓';
        div.innerHTML = '<div class="thread-tweet-label">TWEET ' + (i + 1) + '/' + threads.length + ' + icon + '</div>' +
          '<div class="thread-tweet-text">' + escapeHtml(tweet) + '</div>' +
          '<button class="thread-tweet-copy" data-text="' + escapeAttr(tweet) + '">📋 Copy Tweet ' + (i + 1) + '</button>';
        container.appendChild(div);
      });

      container.querySelectorAll('.thread-tweet-copy').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          var text = e.target.getAttribute('data-text');
          navigator.clipboard.writeText(text).then(function() {
            e.target.textContent = '✅ Copied!';
            setTimeout(function() { e.target.textContent = '📋 Copy'; }, 2000);
            showStatus('📋 Copied!', 'success');
          });
        });
      });

      document.getElementById('threadResult').classList.add('show');
      showStatus('🧵 Thread generated!', 'success');
    }
  );
});

// ===== BATCH GENERATOR =====
document.getElementById('generateBatch').addEventListener('click', function() {
  var topic = document.getElementById('batchTopic').value.trim();
  if (!topic) {
    showStatus('⚠️ Enter a topic first', 'error');
    createShakeEffect(document.getElementById('batchTopic'));
    return;
  }

  var style = document.getElementById('tweetStyle') ? document.getElementById('tweetStyle').value : 'casual';
  var language = document.getElementById('tweetLanguage') ? document.getElementById('tweetLanguage').value : 'indonesian';

  document.getElementById('batchLoading').classList.add('show');
  document.getElementById('batchResult').classList.remove('show');

  chrome.runtime.sendMessage(
    { action: 'generateBatchContent', topic: topic, style: style, language: language, count: 3 },
    function(result) {
      document.getElementById('batchLoading').classList.remove('show');

      if (chrome.runtime.lastError) {
        showStatus('❌ ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (result && result.error) {
        showStatus('❌ ' + result.error, 'error');
        return;
      }

      var container = document.getElementById('batchContainer');
      container.innerHTML = '';

      var tweets = result.results || [];
      tweets.forEach(function(item, i) {
        var div = document.createElement('div');
        div.className = 'batch-tweet';
        div.innerHTML = '<div class="batch-tweet-tone">' + escapeHtml(item.tone || 'Variation ' + (i + 1)) + '</div>' +
          '<div class="batch-tweet-text">' + escapeHtml(item.text) + '</div>' +
          '<button class="batch-tweet-copy" data-text="' + escapeAttr(item.text) + '">📋 Copy</button>';
        container.appendChild(div);
      });

      container.querySelectorAll('.batch-tweet-copy').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          var text = e.target.getAttribute('data-text');
          navigator.clipboard.writeText(text).then(function() {
            e.target.textContent = '✅ Copied!';
            setTimeout(function() { e.target.textContent = '📋 Copy'; }, 2000);
            showStatus('📋 Copied!', 'success');
          });
        });
      });

      document.getElementById('batchResult').classList.add('show');
      showStatus('📦 Batch generated!', 'success');
    }
  );
});

// ===== PERSONA MANAGER =====
var BUILTIN_PERSONA_IDS = ['default', 'motivator', 'roaster', 'techbro', 'wibu', 'philosopher', 'gossiper'];

function loadPersonas() {
  chrome.runtime.sendMessage({ action: 'getPersonas' }, function(result) {
    if (chrome.runtime.lastError) {
      console.error('Failed to load personas:', chrome.runtime.lastError);
      return;
    }
    if (result && result.error) {
      console.error('Failed to load personas:', result.error);
      return;
    }
    if (result && result.personas) {
      renderPersonaGrid(result.personas, result.activePersonaId);
      updateActivePersonaDisplay(result.personas, result.activePersonaId);
    }
  });
}

function renderPersonaGrid(personas, activeId) {
  var grid = document.getElementById('personaGrid');
  if (!grid) return;
  grid.innerHTML = '';

  personas.forEach(function(persona) {
    var card = document.createElement('div');
    card.className = 'persona-card' + (persona.id === activeId ? ' active' : '');
    card.setAttribute('data-id', persona.id);

    var isCustom = BUILTIN_PERSONA_IDS.indexOf(persona.id) === -1;
    card.innerHTML = '<span class="persona-emoji">' + (persona.emoji || '🤖') + '</span>' +
      '<div class="persona-card-name">' + escapeHtml(persona.name) + '</div>' +
      '<div class="persona-card-desc">' + escapeHtml(persona.description || '') + '</div>' +
      (isCustom ? '<button class="persona-delete-btn">✕</button>' : ');

    // Select persona
    card.addEventListener('click', function(e) {
      if (e.target.closest('.persona-delete-btn')) return;
      chrome.runtime.sendMessage({ action: 'setActivePersona', personaId: persona.id }, function(res) {
        if (res && res.success) {
          grid.querySelectorAll('.persona-card').forEach(function(c) { c.classList.remove('active'); });
          card.classList.add('active');
          updateActivePersonaDisplay(personas, persona.id);
          showStatus('🎭 Persona: ' + persona.emoji + ' ' + persona.name, 'success');
        }
      });
    });

    // Delete custom persona
    if (isCustom) {
      var deleteBtn = card.querySelector('.persona-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!confirm('Delete persona "' + persona.name + '"?')) return;
          chrome.runtime.sendMessage({ action: 'deleteCustomPersona', personaId: persona.id }, function(res) {
            if (res && res.success) {
              loadPersonas();
              showStatus('🗑️ Persona "' + persona.name + '" deleted', 'warning');
            }
          });
        });
      }
    }

    grid.appendChild(card);
  });
}

function updateActivePersonaDisplay(personas, activeId) {
  var display = document.getElementById('activePersonaName');
  if (!display) return;
  var active = null;
  for (var i = 0; i < personas.length; i++) {
    if (personas[i].id === activeId) {
      active = personas[i];
      break;
    }
  }
  if (!active) active = personas[0];
  display.textContent = (active.emoji || '🤖') + ' ' + active.name;
}

// Save custom persona
document.getElementById('savePersona').addEventListener('click', function() {
  var name = document.getElementById('personaName').value.trim();
  var emoji = document.getElementById('personaEmoji').value.trim() || '🎭';
  var desc = document.getElementById('personaDesc').value.trim();
  var tone = document.getElementById('personaTone').value;
  var instruction = document.getElementById('personaInstruction').value.trim();

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

  var persona = {
    id: 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(),
    name: name,
    emoji: emoji,
    description: desc || instruction.substring(0, 60) + '...',
    tone: tone,
    customInstruction: instruction,
    language: 'auto',
    createdAt: new Date().toISOString()
  };

  chrome.runtime.sendMessage({ action: 'saveCustomPersona', persona: persona }, function(res) {
    if (res && res.success) {
      // Clear form
      document.getElementById('personaName').value = '';
      document.getElementById('personaEmoji').value = '';
      document.getElementById('personaDesc').value = '';
      document.getElementById('personaInstruction').value = '';

      // Set as active
      chrome.runtime.sendMessage({ action: 'setActivePersona', personaId: persona.id }, function() {
        loadPersonas();
        showStatus('🎭 Persona "' + name + '" created & activated!', 'success');
      });
    } else {
      showStatus('❌ Failed to save persona', 'error');
    }
  });
});

// ===== INIT ====
loadPersonas();
