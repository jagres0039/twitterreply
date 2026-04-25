const TWITTER_SELECTORS = {
  tweetText: '[data-testid="tweetText"]',
  replyTextarea: '[data-testid="tweetTextarea_0"]',
  replyEditor: '.public-DraftEditor-content',
  replyBlock: '.public-DraftStyleDefault-block',
  replySpan: '[data-offset-key]',
  tweetContainer: '[data-testid="tweet"]',
  replyButton: '[data-testid="reply"]'
};

class TwitterAIAssistant {
  constructor() {
    this.settings = {};
    this.currentTweetContext = null;
    this.isMonitoring = false;
    this.debugMode = true;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.isGenerating = false;
    this.init();
  }

  async init() {
    this.log('🚀 Initializing Twitter AI Assistant...');
    try {
      await this.loadSettings();
      this.setupTwitterObserver();
      this.setupReplyDetection();
      this.monitorPageChanges();
      this.log('✅ Twitter AI Assistant initialized successfully');
    } catch (error) {
      this.log('❌ Initialization failed:', error);
    }
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[AI Assistant] ${message}`, data || '');
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'groqApiKey', 'responseStyle', 'autoDetect', 'showButton', 
        'includeEmojis', 'universalMode'
      ]);
      
      this.settings = {
        apiKey: result.groqApiKey || '',
        style: result.responseStyle || 'bullish',
        autoDetect: result.autoDetect !== false,
        showButton: result.showButton !== false,
        includeEmojis: result.includeEmojis !== false,
        universalMode: result.universalMode !== false
      };
      
      this.log('Settings loaded - Current style:', this.settings.style);
      
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.responseStyle) {
          this.settings.style = changes.responseStyle.newValue;
          this.log('🔄 Style updated to:', this.settings.style);
        }
      });
      
    } catch (error) {
      this.log('❌ Failed to load settings:', error);
      this.settings = {
        apiKey: '',
        style: 'bullish',
        autoDetect: true,
        showButton: true,
        includeEmojis: true,
        universalMode: true
      };
    }
  }

  monitorPageChanges() {
    let currentUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        this.handlePageChange();
      }
    }).observe(document, {subtree: true, childList: true});
  }

  handlePageChange() {
    this.currentTweetContext = null;
    this.retryCount = 0;
    this.isGenerating = false;
    setTimeout(() => this.setupCurrentPageContext(), 1500);
  }

  setupCurrentPageContext() {
    try {
      const tweetElements = document.querySelectorAll(TWITTER_SELECTORS.tweetText);
      
      if (tweetElements.length > 0) {
        const targetElement = tweetElements[0];
        this.currentTweetContext = this.extractTweetContextFromElement(targetElement);
        
        if (this.currentTweetContext) {
          this.log('✅ Tweet context detected:', {
            text: this.currentTweetContext.text.substring(0, 50) + '...',
            isRetweet: this.currentTweetContext.isRetweet,
            isQuoteTweet: this.currentTweetContext.isQuoteTweet
          });
        }
      }
    } catch (error) {
      this.log('❌ Error setting up context:', error);
    }
  }

  extractTweetContextFromElement(tweetElement) {
    try {
      const isRetweet = tweetElement.closest('article')?.querySelector('[data-testid="socialContext"]');
      const isQuoteTweet = tweetElement.closest('article')?.querySelector('[data-testid="tweet"] article');
      
      let tweetText = '';
      
      if (isRetweet) {
        this.log('🔄 Detected retweet, extracting original tweet content');
        const originalTweetArticle = tweetElement.closest('article')?.querySelector('article div[data-testid="tweetText"]');
        if (originalTweetArticle) {
          tweetText = this.extractCleanTweetText(originalTweetArticle);
        } else {
          const article = tweetElement.closest('article');
          if (article) {
            const clone = article.cloneNode(true);
            const socialContext = clone.querySelector('[data-testid="socialContext"]');
            if (socialContext) socialContext.remove();
            const tweetTexts = clone.querySelectorAll('div[data-testid="tweetText"]');
            if (tweetTexts.length > 1) {
              tweetText = this.extractCleanTweetText(tweetTexts[1]);
            } else if (tweetTexts.length === 1) {
              tweetText = this.extractCleanTweetText(tweetTexts[0]);
            }
          }
        }
      }
      else if (isQuoteTweet) {
        this.log('💬 Detected quote tweet, extracting quoted content');
        const quotedArticle = tweetElement.closest('article')?.querySelectorAll('article')[1];
        if (quotedArticle) {
          const quotedTextElement = quotedArticle.querySelector('div[data-testid="tweetText"]');
          if (quotedTextElement) {
            tweetText = this.extractCleanTweetText(quotedTextElement);
          }
        }
      }
      else {
        tweetText = this.extractCleanTweetText(tweetElement);
      }
      
      if (!tweetText.trim()) {
        this.log('⚠️ Tweet text empty, trying fallback extraction');
        const article = tweetElement.closest('article');
        if (article) {
          const allTexts = article.querySelectorAll('div[data-testid="tweetText"]');
          if (allTexts.length > 0) {
            tweetText = Array.from(allTexts)
              .map(el => this.extractCleanTweetText(el))
              .filter(t => t.trim().length > 10)
              .sort((a, b) => b.length - a.length)[0] || '';
          }
        }
      }
      
      const isCryptoRelated = this.isCryptoRelated(tweetText);
      const author = this.extractAuthorFromPage();
      
      // ✅ NEW: Extract media/links/card context from tweet
      const mediaContext = this.extractMediaContext(tweetElement);
      
      return {
        text: tweetText,
        isCryptoRelated,
        author,
        accountHandle: this.extractAccountHandle(),
        extractedAt: new Date().toISOString(),
        isUniversalMode: this.settings.universalMode,
        url: window.location.href,
        isRetweet: !!isRetweet,
        isQuoteTweet: !!isQuoteTweet,
        // ✅ NEW: Media/link/card data
        hasImage: mediaContext.hasImage,
        hasVideo: mediaContext.hasVideo,
        imageAlts: mediaContext.imageAlts,
        cardTitle: mediaContext.cardTitle,
        cardDescription: mediaContext.cardDescription,
        cardUrl: mediaContext.cardUrl,
        externalLinks: mediaContext.externalLinks,
        replyChain: this.extractReplyChain()
      };
    } catch (error) {
      this.log('❌ Error extracting tweet context:', error);
      return null;
    }
  }

  extractCleanTweetText(tweetElement) {
    try {
      const clone = tweetElement.cloneNode(true);
      const mentions = clone.querySelectorAll('a[href^="/"]');
      mentions.forEach(mention => mention.replaceWith(mention.textContent));
      const emojis = clone.querySelectorAll('img[alt]');
      emojis.forEach(emoji => emoji.replaceWith(emoji.alt));
      return clone.textContent.trim();
    } catch (error) {
      this.log('❌ Error cleaning tweet text:', error);
      return tweetElement.textContent || '';
    }
  }

  extractAuthorFromPage() {
    try {
      const selectors = [
        '[data-testid="UserName"] span',
        '[data-testid="User-Name"] span',
        '.css-1dbjc4n .css-901oao span'
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      return 'unknown';
    } catch (error) {
      this.log('❌ Error extracting author:', error);
      return 'unknown';
    }
  }

  extractAccountHandle() {
    try {
      const url = window.location.href;
      const handleMatch = url.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
      return handleMatch ? handleMatch[1] : 'unknown';
    } catch (error) {
      this.log('❌ Error extracting handle:', error);
      return 'unknown';
    }
  }

  // ✅ NEW: Extract images, videos, cards, links from a tweet article
  extractMediaContext(tweetElement) {
    try {
      const article = tweetElement.closest('article') || document;
      
      // Images: scrape alt text from tweet photos
      const imageEls = article.querySelectorAll('[data-testid="tweetPhoto"] img, [data-testid="tweet_image_expandable_container"] img');
      const imageAlts = Array.from(imageEls)
        .map(img => img.getAttribute('alt') || '')
        .filter(alt => alt && alt !== 'Image' && alt.length > 3);
      const hasImage = imageEls.length > 0;

      // Videos
      const videoEls = article.querySelectorAll('[data-testid="videoPlayer"], video');
      const hasVideo = videoEls.length > 0;

      // Card (link preview)
      const cardTitleEl = article.querySelector('[data-testid="card.layoutSmall.media"] ~ div span, [data-testid="card.layoutLarge.media"] ~ div span, [data-testid*="card"] [data-testid="card.layoutSmall.detail"] span, [class*="card"] span');
      const cardTitle = cardTitleEl?.textContent?.trim() || '';

      // Try broader card selectors
      let cardDescription = '';
      let cardUrl = '';
      const cardLinks = article.querySelectorAll('a[href^="https"]');
      for (const link of cardLinks) {
        const href = link.href || '';
        if (!href.includes('twitter.com') && !href.includes('x.com') && href.startsWith('http')) {
          cardUrl = href;
          // Get text nearby the card link as description
          const nearbyText = link.closest('div')?.textContent?.trim();
          if (nearbyText && nearbyText.length > 10 && nearbyText.length < 200) {
            cardDescription = nearbyText;
          }
          break;
        }
      }

      // External links mentioned in tweet text
      const tweetLinks = [];
      const linkEls = article.querySelectorAll('[data-testid="tweetText"] a[href]');
      for (const a of linkEls) {
        const href = a.href;
        if (href && !href.includes('twitter.com') && !href.includes('x.com')) {
          tweetLinks.push(href);
        }
      }

      return {
        hasImage,
        hasVideo,
        imageAlts,
        cardTitle,
        cardDescription,
        cardUrl,
        externalLinks: tweetLinks
      };
    } catch (e) {
      return { hasImage: false, hasVideo: false, imageAlts: [], cardTitle: '', cardDescription: '', cardUrl: '', externalLinks: [] };
    }
  }

  // ✅ NEW: Extract up to 3 previous tweets in a reply thread for context
  extractReplyChain() {
    try {
      const articles = document.querySelectorAll('[data-testid="tweet"]');
      const chain = [];
      for (let i = 0; i < Math.min(articles.length - 1, 3); i++) {
        const textEl = articles[i].querySelector('[data-testid="tweetText"]');
        const nameEl = articles[i].querySelector('[data-testid="UserName"] span');
        if (textEl) {
          chain.push({
            author: nameEl?.textContent?.trim() || 'unknown',
            text: textEl.textContent?.trim() || ''
          });
        }
      }
      return chain;
    } catch (e) {
      return [];
    }
  }

  setupTwitterObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector && node.querySelector(TWITTER_SELECTORS.replyEditor)) {
              setTimeout(() => this.handleReplyTextareaAppeared(), 500);
            }
            if (node.querySelector && node.querySelector(TWITTER_SELECTORS.tweetText)) {
              setTimeout(() => this.setupCurrentPageContext(), 300);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setupReplyDetection() {
    document.addEventListener('click', async (e) => {
      const replyButton = e.target.closest(TWITTER_SELECTORS.replyButton);
      if (replyButton) {
        this.log('💬 Reply button clicked');
        setTimeout(() => {
          this.setupCurrentPageContext();
          this.handleReplyTextareaAppeared();
        }, 1000);
      }
    });
  }

  handleReplyTextareaAppeared() {
    try {
      const replyEditor = document.querySelector(TWITTER_SELECTORS.replyEditor);
      if (replyEditor && !replyEditor.dataset.aiAssistAdded && this.shouldShowAIButton()) {
        this.log('✅ Adding AI button to reply editor');
        this.addAIButton(replyEditor);
      }
    } catch (error) {
      this.log('❌ Error handling reply textarea:', error);
    }
  }

  shouldShowAIButton() {
    if (!this.settings.showButton || !this.currentTweetContext) return false;
    if (this.settings.universalMode) return true;
    if (this.settings.autoDetect) return this.currentTweetContext.isCryptoRelated;
    return true;
  }

  addAIButton(replyEditor) {
    try {
      const aiButton = this.createAIButton();
      const firstBlock = replyEditor.querySelector('[data-block="true"]') || 
                        replyEditor.querySelector('.public-DraftStyleDefault-block') ||
                        replyEditor;
      if (firstBlock) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'cyberpunk-ai-container';
        buttonContainer.appendChild(aiButton);
        firstBlock.parentNode.insertBefore(buttonContainer, firstBlock);
        replyEditor.dataset.aiAssistAdded = 'true';
        this.log('✅ AI button added successfully');
      }
    } catch (error) {
      this.log('❌ Error adding AI button:', error);
    }
  }

  createAIButton() {
    const button = document.createElement('button');
    button.className = 'cyberpunk-ai-button';
    button.innerHTML = `
      <span class="cyberpunk-icon">⚡</span>
      <span class="cyberpunk-text">COPY AI REPLY</span>
      <span class="cyberpunk-glow"></span>
    `;
    button.type = 'button';
    button.title = 'Generate AI response and save to clipboard';
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.isGenerating) {
        this.log('⚠️ Already generating, ignoring click');
        return;
      }
      this.log('⚡ AI button clicked');
      await this.generateAndCopyResponse();
    });
    
    return button;
  }

  async generateAndCopyResponse() {
    this.log('⚡ Starting AI response generation...');
    
    if (!this.settings.apiKey) {
      this.showAlert('⚠️ API KEY NOT CONFIGURED\n\nPlease configure your **Groq API key** in the extension popup.\n\nGet your key from: console.groq.com');
      return;
    }

    if (!this.currentTweetContext) {
      this.showAlert('⚠️ NO TWEET CONTEXT DETECTED\n\nPlease refresh the page and try again.\n\nMake sure you\'re replying to a tweet.');
      return;
    }

    const button = document.querySelector('.cyberpunk-ai-button');
    if (!button) return;

    const originalHTML = button.innerHTML;
    this.isGenerating = true;
    button.innerHTML = `<span class="cyberpunk-loading">🌀</span><span class="cyberpunk-text loading">GENERATING JAGRES...</span>`;
    button.classList.add('loading');

    try {
      const response = await this.sendMultiResponseRequest();
      if (!response || !response.responses) throw new Error('Invalid response format');
      
      // SHOW MODAL WITH PROPER EVENT HANDLERS
      this.showResponseSelector(response.responses, response.sentiment);
      
      button.innerHTML = `<span class="cyberpunk-icon">✅</span><span class="cyberpunk-text">OPTIONS READY!</span>`;
      button.classList.add('success');
      
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('loading', 'success');
        this.isGenerating = false;
      }, 3000);
      
    } catch (error) {
      this.log('❌ AI error:', error);
      this.handleAIError(error);
      button.innerHTML = `<span class="cyberpunk-icon">❌</span><span class="cyberpunk-text">ERROR</span>`;
      button.classList.add('error');
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('loading', 'error');
        this.isGenerating = false;
      }, 3000);
    }
  }

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.log('✅ Text copied using Clipboard API');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('Copy command failed');
      }
    } catch (error) {
      this.log('❌ Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard: ' + error.message);
    }
  }

  async sendMultiResponseRequest() {
    await this.loadSettings();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('AI service timeout')), 30000);
      chrome.runtime.sendMessage({
        action: 'generateMultipleResponses',
        tweetContext: this.currentTweetContext,
        style: this.settings.style,
        includeEmojis: this.settings.includeEmojis,
        numResponses: 3
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  handleAIError(error) {
    let errorTitle = '❌ AI SYSTEM ERROR';
    let errorMessage = error.message;
    if (error.message.includes('API key') || error.message.includes('401')) {
      errorTitle = '❌ AUTHENTICATION FAILED';
      errorMessage = 'Invalid API key detected.\n\nPlease verify your **Groq API key** in extension settings.\n\nGet a new key from: console.groq.com';
    } else if (error.message.includes('429')) {
      errorTitle = '❌ RATE LIMIT EXCEEDED';
      errorMessage = 'Rate limit reached.\n\nPlease wait before retrying.\n\nGroq free tier allows 10K requests/day.';
    } else if (error.message.includes('timeout')) {
      errorTitle = '❌ REQUEST TIMEOUT';
      errorMessage = 'Request timed out.\n\nThe AI service is busy. Try again in a moment.';
    } else if (error.message.includes('network')) {
      errorTitle = '❌ CONNECTIVITY ISSUE';
      errorMessage = 'Network connection problem.\n\nCheck your internet connection.';
    } else if (error.message.includes('clipboard')) {
      errorTitle = '❌ CLIPBOARD ERROR';
      errorMessage = 'Failed to copy to clipboard.\n\nYour browser may not support clipboard access.';
    }
    this.showAlert(`${errorTitle}\n\n${errorMessage}`);
  }

  showAlert(message) {
    const existingAlert = document.querySelector('.cyberpunk-alert');
    if (existingAlert) existingAlert.remove();
    const alert = document.createElement('div');
    alert.className = 'cyberpunk-alert';
    alert.innerHTML = `
      <div class="cyberpunk-alert-content">
        <div class="cyberpunk-alert-header">❌ AI ASSISTANT</div>
        <div class="cyberpunk-alert-message">${message}</div>
        <button class="cyberpunk-alert-close">OK</button>
      </div>
    `;
    document.body.appendChild(alert);
    alert.querySelector('.cyberpunk-alert-close').addEventListener('click', () => alert.remove());
    setTimeout(() => alert.remove(), 15000);
  }

  showSuccess(message) {
    const success = document.createElement('div');
    success.className = 'cyberpunk-success';
    success.textContent = message;
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 5000);
  }

  // ✅ FIXED: MODAL WITH PROPER EVENT DELEGATION
  showResponseSelector(responses, sentiment) {
    const modal = document.createElement('div');
    modal.className = 'response-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
      background: rgba(0,0,0,0.85); z-index: 9999999; display: flex; 
      align-items: center; justify-content: center; backdrop-filter: blur(5px);
    `;
    
    const sentimentColor = sentiment.sentiment === 'positive' ? '#00ff00' : 
                          sentiment.sentiment === 'negative' ? '#ff4040' : '#ffd700';
    
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); border: 2px solid #00ffff; 
                  border-radius: 16px; padding: 25px; max-width: 550px; width: 90%; max-height: 85vh; 
                  overflow-y: auto; box-shadow: 0 0 40px rgba(0,255,255,0.4);">
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(0,255,255,0.3);">
          <h3 style="font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 22px; 
                     background: linear-gradient(135deg, #40e0ff, #ff40e0); -webkit-background-clip: text; 
                     -webkit-text-fill-color: transparent; margin: 0 0 8px 0;">🎯 AI RESPONSE OPTIONS</h3>
          <div style="font-size: 13px; color: #8892b0; font-family: 'JetBrains Mono', monospace;">
            Sentiment: <span style="color: ${sentimentColor}; font-weight: bold; text-transform: uppercase;">
              ${sentiment.sentiment}
            </span> (Score: ${sentiment.score})
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          ${responses.map((resp, idx) => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(64,224,255,0.25); border-radius: 12px; 
                        padding: 18px; transition: all 0.3s ease; position: relative; cursor: pointer;"
                 onmouseover="this.style.borderColor='rgba(64,224,255,0.5)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(64,224,255,0.15)'"
                 onmouseout="this.style.borderColor='rgba(64,224,255,0.25)'; this.style.transform='none'; this.style.boxShadow='none'">
              ${resp.isRecommended ? `
                <div style="position: absolute; top: 8px; right: 10px; background: rgba(255,215,0,0.2); color: #ffd700; 
                            border: 1px solid rgba(255,215,0,0.4); border-radius: 4px; padding: 2px 8px; font-size: 10px; 
                            font-family: 'Orbitron', sans-serif; font-weight: 700; letter-spacing: 0.5px;">RECOMMENDED</div>
              ` : ''}
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; 
                          border-bottom: 1px solid rgba(64,224,255,0.15);">
                <span style="width: 26px; height: 26px; background: linear-gradient(135deg, #40e0ff, #ff40e0); 
                             border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                             font-weight: bold; font-size: 13px; color: #000; flex-shrink: 0;">${idx + 1}</span>
                <span style="font-family: 'Orbitron', sans-serif; font-size: 11px; color: #40e0ff; text-transform: uppercase; 
                             letter-spacing: 0.8px; font-weight: 600; padding: 3px 8px; background: rgba(64,224,255,0.1); 
                             border-radius: 5px;">${resp.style.toUpperCase()}</span>
              </div>
              <div style="font-family: 'Rajdhani', sans-serif; font-size: 15px; color: #e0e6ed; line-height: 1.6; 
                          min-height: 50px; margin-bottom: 12px;">${resp.text}</div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="copy-btn" data-text="${resp.text.replace(/"/g, '&quot;').replace(/'/g, '&apos;')}">
                  📋 COPY
                </button>
                <button class="preview-btn" data-text="${resp.text.replace(/"/g, '&quot;').replace(/'/g, '&apos;')}">
                  👁️ PREVIEW
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center; padding-top: 15px; border-top: 1px solid rgba(64,224,255,0.2);">
          <button class="use-random-btn">🎲 USE RANDOM</button>
          <button class="close-modal-btn">CLOSE</button>
        </div>
      </div>
    `;
    
    // Add styles to buttons
    const style = document.createElement('style');
    style.textContent = `
      .response-modal button {
        padding: 7px 16px;
        border: none;
        border-radius: 8px;
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s;
      }
      .copy-btn {
        background: linear-gradient(135deg, #40e0ff, #ff40e0);
        color: #000;
      }
      .preview-btn {
        background: rgba(64,224,255,0.15);
        border: 1px solid rgba(64,224,255,0.4);
        color: #40e0ff;
      }
      .use-random-btn {
        padding: 10px 24px;
        background: linear-gradient(135deg, #ffd700, #ffaa00);
        color: #000;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(255,215,0,0.3);
      }
      .close-modal-btn {
        padding: 10px 24px;
        border: 1px solid rgba(255,64,64,0.4);
        background: rgba(255,64,64,0.15);
        color: #ff4040;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .copy-btn:hover, .preview-btn:hover, .use-random-btn:hover, .close-modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // ✅ EVENT DELEGATION PROPER
    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    
    // Copy button handler
    modal.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-text');
        this.copyToClipboard(text)
          .then(() => { this.showSuccess('✅ Response copied to clipboard!'); closeModal(); })
          .catch(err => this.showAlert(`❌ Copy failed: ${err.message}`));
      });
    });
    
    // Preview button handler
    modal.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-text');
        alert(`Preview:\n\n${text}`);
      });
    });
    
    // Random button handler
    modal.querySelector('.use-random-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const randomText = responses[Math.floor(Math.random() * responses.length)].text;
      this.copyToClipboard(randomText)
        .then(() => { this.showSuccess('✅ Random response copied!'); closeModal(); })
        .catch(err => this.showAlert(`❌ Copy failed: ${err.message}`));
    });
    
    // Close button handler
    modal.querySelector('.close-modal-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  isCryptoRelated(text) {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
      'blockchain', 'defi', 'nft', 'altcoin', 'hodl', 'dyor', 'pump',
      'dump', 'moon', 'lambo', 'diamond hands', 'paper hands', 'whale',
      'bull market', 'bear market', 'to the moon', 'dip', 'ath', 'trading',
      'binance', 'coinbase', 'exchange', 'wallet', 'satoshi', 'gm', 'gn',
      'wagmi', 'ngmi', 'ser', 'anon', 'fren', 'probably nothing',
      'dex', 'swap', 'liquidity', 'yield', 'farming', 'staking', 'dao',
      'web3', 'metaverse', 'solana', 'cardano', 'polygon', 'avalanche',
      'chainlink', 'uniswap', 'opensea', 'metamask', 'ledger', 'cold storage',
      'kaspa', 'kas', 'pow', 'blockdag', 'zealous', 'enthusiastic'
    ];
    return cryptoKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }
}

try {
  window.twitterAI = new TwitterAIAssistant();
  console.log('✅ GROQ TWITTER AI ASSISTANT ONLINE');
} catch (error) {
  console.error('❌ AI ASSISTANT INITIALIZATION FAILED:', error);
}

window.debugAI = {
  checkStatus: () => {
    console.log('✅ AI ASSISTANT STATUS:');
    console.log('Settings:', window.twitterAI?.settings);
    console.log('Current Style:', window.twitterAI?.settings?.style);
    console.log('Context:', window.twitterAI?.currentTweetContext);
    console.log('API Key:', !!window.twitterAI?.settings?.apiKey);
    console.log('Is Generating:', window.twitterAI?.isGenerating);
  },
  testStyle: async (style) => {
    console.log(`🔄 Testing ${style} style...`);
    if (window.twitterAI) {
      window.twitterAI.settings.style = style;
      console.log(`✅ Style changed to: ${style}`);
      chrome.storage.sync.set({ responseStyle: style });
    }
  },
  forceReload: () => {
    window.twitterAI = new TwitterAIAssistant();
    console.log('✅ AI Assistant reloaded');
  }
};