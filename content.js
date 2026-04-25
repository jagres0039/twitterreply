// ================================
// JAGRES AI ASSISTANT v2.0 - CONTENT SCRIPT
// Twitter/X Integration with Persona Selector
// ================================

class TwitterAIAssistant {
  constructor() {
    this.isGenerating = false;
    this.observer = null;
    this.injectedButtons = new WeakSet();
    this.init();
  }

  init() {
    console.log('⚡ JAGRES AI v2.0 Content Script loaded');
    this.startObserver();
    this.injectButtons();
  }

  startObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldInject = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldInject = true;
          break;
        }
      }
      if (shouldInject) {
        clearTimeout(this._injectTimeout);
        this._injectTimeout = setTimeout(() => this.injectButtons(), 300);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  injectButtons() {
    // Find all reply action bars (the row with reply, retweet, like, etc.)
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');

    tweetArticles.forEach(article => {
      if (this.injectedButtons.has(article)) return;

      const actionBar = article.querySelector('[role="group"]');
      if (!actionBar) return;

      // Check if button already exists
      if (actionBar.querySelector('.jagres-ai-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'jagres-ai-btn';
      btn.innerHTML = '⚡ AI REPLY';
      btn.title = 'Generate AI Reply with JAGRES';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.isGenerating) {
          this.showToast('⏳ Generating... please wait');
          return;
        }

        const tweetData = this.extractTweetData(article);
        if (!tweetData || !tweetData.text) {
          this.showToast('❌ Could not extract tweet text');
          return;
        }

        this.isGenerating = true;
        btn.innerHTML = '⚡ GENERATING...';
        btn.classList.add('generating');

        try {
          const result = await this.generateMultipleReplies(tweetData);
          if (result.error) {
            this.showToast('❌ ' + result.error);
          } else {
            await this.showResponseSelector(result, article);
          }
        } catch (err) {
          console.error('JAGRES Error:', err);
          this.showToast('❌ ' + err.message);
        } finally {
          this.isGenerating = false;
          btn.innerHTML = '⚡ AI REPLY';
          btn.classList.remove('generating');
        }
      });

      actionBar.appendChild(btn);
      this.injectedButtons.add(article);
    });
  }

  extractTweetData(article) {
    try {
      // Get tweet text
      const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
      const text = tweetTextEl ? tweetTextEl.innerText.trim() : '';

      // Get author
      const authorEl = article.querySelector('[data-testid="User-Name"]');
      const authorLinks = authorEl ? authorEl.querySelectorAll('a') : [];
      let author = '';
      let handle = '';
      if (authorLinks.length >= 1) {
        author = authorLinks[0].textContent.trim();
      }
      if (authorLinks.length >= 2) {
        handle = authorLinks[1].textContent.trim();
      }

      // Check for media
      const hasImage = !!article.querySelector('[data-testid="tweetPhoto"]');
      const hasVideo = !!article.querySelector('[data-testid="videoPlayer"]');

      // Get image alt texts
      const imageAlts = [];
      article.querySelectorAll('[data-testid="tweetPhoto"] img').forEach(img => {
        if (img.alt && img.alt !== 'Image') imageAlts.push(img.alt);
      });

      // Get card/link preview
      const card = article.querySelector('[data-testid="card.wrapper"]');
      let cardTitle = '';
      let cardDescription = '';
      let cardUrl = '';
      if (card) {
        const cardTitleEl = card.querySelector('[data-testid="card.layoutLarge.detail"] span, [data-testid="card.layoutSmall.detail"] span');
        if (cardTitleEl) cardTitle = cardTitleEl.textContent.trim();
        const cardDescEl = card.querySelector('[data-testid="card.layoutLarge.detail"] + span, [data-testid="card.layoutSmall.detail"] + span');
        if (cardDescEl) cardDescription = cardDescEl.textContent.trim();
        const cardLink = card.querySelector('a[href]');
        if (cardLink) cardUrl = cardLink.href;
      }

      // Get external links
      const externalLinks = [];
      article.querySelectorAll('[data-testid="tweetText"] a[href]').forEach(a => {
        const href = a.href;
        if (href && !href.includes('twitter.com') && !href.includes('x.com') && !href.startsWith('javascript')) {
          externalLinks.push(href);
        }
      });

      // Get reply chain context (parent tweets)
      const replyChain = [];
      const allArticles = document.querySelectorAll('article[data-testid="tweet"]');
      const articleIndex = Array.from(allArticles).indexOf(article);
      if (articleIndex > 0) {
        // Get up to 2 parent tweets for context
        for (let i = Math.max(0, articleIndex - 2); i < articleIndex; i++) {
          const parentArticle = allArticles[i];
          const parentText = parentArticle.querySelector('[data-testid="tweetText"]');
          const parentAuthor = parentArticle.querySelector('[data-testid="User-Name"] a');
          if (parentText) {
            replyChain.push({
              author: parentAuthor ? parentAuthor.textContent.trim() : 'unknown',
              text: parentText.innerText.trim().substring(0, 100)
            });
          }
        }
      }

      return {
        text,
        author,
        handle,
        hasImage,
        hasVideo,
        imageAlts,
        cardTitle,
        cardDescription,
        cardUrl,
        externalLinks,
        replyChain
      };
    } catch (e) {
      console.error('Extract error:', e);
      return { text: '' };
    }
  }

  async generateMultipleReplies(tweetData) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'generateMultipleResponses',
          tweetContext: tweetData,
          style: 'casual',
          includeEmojis: true,
          numResponses: 3
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  async getPersonaSelector() {
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getPersonas' }, (res) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(res);
        });
      });
      if (!result || !result.personas) return '';

      const options = result.personas.map(p =>
        `<option value="${p.id}" ${p.id === result.activePersonaId ? 'selected' : ''}>${p.emoji} ${p.name}</option>`
      ).join('');
      return `
        <div class="jagres-persona-selector">
          <label class="jagres-persona-label">🎭 PERSONA:</label>
          <select class="jagres-persona-select persona-select">
            ${options}
          </select>
        </div>
      `;
    } catch (e) {
      console.error('Persona selector error:', e);
      return '';
    }
  }

  async showResponseSelector(result, article) {
    // Remove existing modal
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'jagres-modal-overlay';
    modal.id = 'jagres-modal';

    // Get persona selector HTML
    const personaSelectorHTML = await this.getPersonaSelector();

    const responses = result.responses || [];
    const sentiment = result.sentiment || {};

    let responsesHTML = '';
    responses.forEach((resp, index) => {
      const label = resp.isRecommended ? '⭐ RECOMMENDED' : `Option ${index + 1}`;
      const styleLabel = resp.style ? resp.style.toUpperCase() : '';
      responsesHTML += `
        <div class="jagres-response-card" data-index="${index}">
          <div class="jagres-response-header">
            <span class="jagres-response-label">${label}</span>
            <span class="jagres-response-style">${styleLabel}</span>
          </div>
          <div class="jagres-response-text">${this.escapeHtml(resp.text)}</div>
          <div class="jagres-response-actions">
            <button class="jagres-copy-btn" data-text="${this.escapeAtr(resp.text)}">📋 COPY</button>
            <button class="jagres-paste-btn" data-text="${this.escapeAttr(resp.text)}">📝 PASTE & REPLY</button>
          </div>
        </div>
      `;
    });

    const sentimentHTML = sentiment.sentiment
      ? `<div class="jagres-sentiment">
           Sentiment: ${sentiment.sentiment === 'positive' ? '😊' : sentiment.sentiment === 'negative' ? '😞' : '😐'} 
           ${sentiment.sentiment.toUpperCase()}
         </div>`
      : '';

    modal.innerHTML = `
      <div class="jagres-modal">
        <div class="jagres-modal-header">
          <span class="jagres-modal-title">⚡ JAGRES AI REPLY</span>
          <button class="jagres-modal-close" id="jagres-close">✕</button>
        </div>
        ${personaSelectorHTML}
        ${sentimentHTML}
        <div class="jagres-responses-container">
          ${responsesHTML}
        </div>
        <div class="jagres-modal-footer">
          <button class="jagres-regenerate-btn" id="jagres-regenerate">🔄 REGENERATE</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('#jagres-close').addEventListener('click', () => this.closeModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    // Persona switch in modal
    const personaSelect = modal.querySelector('.persona-select');
    if (personaSelect) {
      personaSelect.addEventListener('change', async (e) => {
        const personaId = e.target.value;
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'setActivePersona', personaId }, resolve);
        });
        // Re-generate with new persona
        this.closeModal();
        this.isGenerating = false;

        // Find the button and trigger regeneration
        const btn = article.querySelector('.jagres-ai-btn');
        if (btn) btn.click();
      });
    }

    // Copy buttons
    modal.querySelectorAll('.jagres-copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const text = e.target.dataset.text;
        try {
          await navigator.clipboard.writeText(text);
          e.target.textContent = '✅ COPIED!';
          this.showToast('✅ Copied to clipboard!');
          setTimeout(() => { e.target.textContent = '📋 COPY'; }, 2000);
        } catch (err) {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          e.target.textContent = '✅ COPIED!';
          this.showToast('✅ Copied to clipboard!');
          setTimeout(() => { e.target.textContent = '📋 COPY'; }, 2000);
        }
      });
    });

    // Paste & Reply buttons
    modal.querySelectorAll('.jagres-paste-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const text = e.target.dataset.text;
        this.closeModal();

        // Click the reply button on the tweet
        const replyBtn = article.querySelector('[data-testid="reply"]');
        if (replyBtn) {
          replyBtn.click();
          // Wait for reply box to appear
          setTimeout(() => {
            this.pasteIntoReplyBox(text);
          }, 1000);
        } else {
          // Fallback: just copy
          await navigator.clipboard.writeText(text);
          this.showToast('📋 Copied! Reply box not found — paste manually');
        }
      });
    });

    // Regenerate button
    modal.querySelector('#jagres-regenerate').addEventListener('click', async () => {
      this.closeModal();
      this.isGenerating = false;
      const btn = article.querySelector('.jagres-ai-btn');
      if (btn) btn.click();
    });
  }

  pasteIntoReplyBox(text) {
    // Try to find the reply compose box
    const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                     document.querySelector('[role="textbox"][data-testid]') ||
                     document.querySelector('.DraftEditor-root [contenteditable="true"]') ||
                     document.querySelector('[contenteditable="true"][role="textbox"]');

    if (replyBox) {
      replyBox.focus();

      // Use execCommand for contenteditable
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(replyBox);
      selection.removeAllRanges();
      selection.addRange(range);

      // Insert text
      document.execCommand('insertText', false, text);

      // Dispatch input event
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      replyBox.dispatchEvent(new Event('change', { bubbles: true }));

      this.showToast('✅ Reply pasted! Review and send');
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 Copied! Paste into reply box (Ctrl+V)');
      });
    }
  }

  closeModal() {
    const existing = document.getElementById('jagres-modal');
    if (existing) existing.remove();
  }

  showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.jagres-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'jagres-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeAtr(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Initialize
const jagresAssistant = new TwitterAIAssistant();
