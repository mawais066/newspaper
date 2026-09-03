/**
 * AwaisNews - Master Application Controller
 * Handles UI interactions, live real-time auto-refresh stream, speech synthesis, bookmarks, and modal views.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentCategory: 'general',
    currentCountry: 'global',
    currentSort: 'publishedAt',
    searchQuery: '',
    articles: [],
    savedArticles: JSON.parse(localStorage.getItem('awaisnews_bookmarks') || '[]'),
    currentArticle: null,
    viewMode: 'grid',
    breakingIndex: 0,
    theme: localStorage.getItem('awaisnews_theme') || 'dark',
    speechSynth: window.speechSynthesis,
    speechUtterance: null,
    isPlayingAudio: false,
    autoRefreshTimer: null
  };

  // DOM Elements Cache
  const DOM = {
    dateDisplay: document.getElementById('current-date-time'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    categoryNavItems: document.querySelectorAll('.nav-item'),
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    countrySelect: document.getElementById('country-select'),
    sortSelect: document.getElementById('sort-select'),
    refreshNewsBtn: document.getElementById('refresh-news-btn'),
    sectionTitle: document.getElementById('current-section-title'),
    sourceStatus: document.getElementById('source-status'),
    heroContainer: document.getElementById('hero-editorial'),
    articlesGrid: document.getElementById('articles-grid'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    viewGridBtn: document.getElementById('view-grid-btn'),
    viewListBtn: document.getElementById('view-list-btn'),
    breakingBanner: document.getElementById('breaking-banner'),
    breakingLink: document.getElementById('breaking-link'),
    prevBreakingBtn: document.getElementById('prev-breaking'),
    nextBreakingBtn: document.getElementById('next-breaking'),
    
    // AI Chat Elements
    floatingAiLauncher: document.getElementById('floating-ai-launcher'),
    aiChatDrawer: document.getElementById('ai-chat-drawer'),
    btnCloseChat: document.getElementById('btn-close-chat'),
    btnClearChat: document.getElementById('btn-clear-chat'),
    chatMessages: document.getElementById('chat-messages'),
    chatUserInput: document.getElementById('chat-user-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    aiQuickPrompt: document.getElementById('ai-quick-prompt'),
    btnQuickAiSubmit: document.getElementById('btn-quick-ai-submit'),
    quickChips: document.querySelectorAll('.quick-chip'),
    trendingLinks: document.querySelectorAll('.trend-title'),

    // Modals
    articleModal: document.getElementById('article-modal'),
    articleModalBody: document.getElementById('article-modal-body'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    digestModal: document.getElementById('digest-modal'),
    digestModalContent: document.getElementById('digest-modal-content'),
    btnMorningDigest: document.getElementById('btn-morning-digest'),
    digestCloseBtn: document.getElementById('digest-close-btn'),
    btnListenDigest: document.getElementById('btn-listen-digest'),
    btnPrintDigest: document.getElementById('btn-print-digest'),
    digestDate: document.getElementById('digest-date'),
    bookmarksModal: document.getElementById('bookmarks-modal'),
    bookmarksList: document.getElementById('bookmarks-list'),
    btnBookmarksView: document.getElementById('btn-bookmarks-view'),
    bookmarksCloseBtn: document.getElementById('bookmarks-close-btn'),
    btnClearBookmarks: document.getElementById('btn-clear-bookmarks'),
    bookmarkCount: document.getElementById('bookmark-count'),
    settingsModal: document.getElementById('settings-modal'),
    btnAiSettings: document.getElementById('btn-ai-settings'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    cfgAiKey: document.getElementById('cfg-ai-key'),
    cfgVoiceSelect: document.getElementById('cfg-voice-select'),

    // Audio Bar
    audioPlayerBar: document.getElementById('audio-player-bar'),
    audioNowPlaying: document.getElementById('audio-now-playing'),
    audioBtnPause: document.getElementById('audio-btn-pause'),
    audioBtnStop: document.getElementById('audio-btn-stop'),

    // Editorial Links
    btnReadEditorial: document.getElementById('btn-read-editorial'),
    logoRefresh: document.getElementById('logo-refresh'),
    footerYear: document.getElementById('footer-year')
  };

  init();

  function init() {
    setupTheme();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateBookmarkBadge();
    loadVoiceList();
    bindEvents();
    loadNews();

    // Real-Time Auto-Refresh: Poll for fresh breaking stories every 45 seconds
    state.autoRefreshTimer = setInterval(() => {
      if (!document.hidden && !state.searchQuery) {
        loadNews(false, true);
      }
    }, 45000);

    if (DOM.footerYear) {
      DOM.footerYear.textContent = new Date().getFullYear();
    }
  }

  function setupTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('awaisnews_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (DOM.themeIcon) {
      DOM.themeIcon.className = state.theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (DOM.dateDisplay) {
      DOM.dateDisplay.innerHTML = `<i class="fa-regular fa-calendar"></i> ${now.toLocaleDateString('en-US', options)}`;
    }
  }

  function loadVoiceList() {
    if (!state.speechSynth) return;
    const populate = () => {
      const voices = state.speechSynth.getVoices();
      if (!DOM.cfgVoiceSelect) return;
      DOM.cfgVoiceSelect.innerHTML = '<option value="auto">Default Natural Voice</option>';
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${v.name} (${v.lang})`;
        DOM.cfgVoiceSelect.appendChild(opt);
      });
    };
    populate();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populate;
    }
  }

  function bindEvents() {
    DOM.themeToggleBtn?.addEventListener('click', toggleTheme);

    DOM.categoryNavItems.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.categoryNavItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.category;
        state.currentCategory = cat || 'general';
        if (country) {
          state.currentCountry = country;
          if (DOM.countrySelect) DOM.countrySelect.value = country;
        }

        state.searchQuery = '';
        if (DOM.searchInput) DOM.searchInput.value = '';
        DOM.searchClearBtn?.classList.add('hidden');
        updateSectionHeader();
        loadNews(true);
      });
    });

    let searchDebounce;
    DOM.searchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.length > 0) {
        DOM.searchClearBtn?.classList.remove('hidden');
      } else {
        DOM.searchClearBtn?.classList.add('hidden');
      }
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = val;
        updateSectionHeader();
        loadNews(true);
      }, 400);
    });

    DOM.searchClearBtn?.addEventListener('click', () => {
      if (DOM.searchInput) DOM.searchInput.value = '';
      DOM.searchClearBtn.classList.add('hidden');
      state.searchQuery = '';
      updateSectionHeader();
      loadNews(true);
    });

    DOM.countrySelect?.addEventListener('change', (e) => {
      state.currentCountry = e.target.value;
      loadNews(true);
    });

    DOM.sortSelect?.addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      loadNews(true);
    });

    DOM.refreshNewsBtn?.addEventListener('click', () => {
      DOM.refreshNewsBtn.classList.add('fa-spin');
      loadNews(true).finally(() => {
        setTimeout(() => DOM.refreshNewsBtn?.classList.remove('fa-spin'), 600);
      });
    });

    DOM.viewGridBtn?.addEventListener('click', () => {
      state.viewMode = 'grid';
      DOM.viewGridBtn.classList.add('active');
      DOM.viewListBtn?.classList.remove('active');
      DOM.articlesGrid?.classList.remove('list-view');
    });

    DOM.viewListBtn?.addEventListener('click', () => {
      state.viewMode = 'list';
      DOM.viewListBtn.classList.add('active');
      DOM.viewGridBtn?.classList.remove('active');
      DOM.articlesGrid?.classList.add('list-view');
    });

    DOM.prevBreakingBtn?.addEventListener('click', prevBreakingNews);
    DOM.nextBreakingBtn?.addEventListener('click', nextBreakingNews);

    DOM.floatingAiLauncher?.addEventListener('click', toggleAiDrawer);
    DOM.btnCloseChat?.addEventListener('click', toggleAiDrawer);
    DOM.btnClearChat?.addEventListener('click', () => {
      if (DOM.chatMessages) {
        DOM.chatMessages.innerHTML = `
          <div class="chat-message bot">
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-bubble"><p>Chat history cleared. How can the AI News Assistant help you today?</p></div>
          </div>`;
      }
    });

    DOM.btnSendChat?.addEventListener('click', sendChatMessage);
    DOM.chatUserInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    DOM.btnQuickAiSubmit?.addEventListener('click', () => {
      const q = DOM.aiQuickPrompt?.value.trim();
      if (!q) return;
      openAiDrawerWithPrompt(q);
      if (DOM.aiQuickPrompt) DOM.aiQuickPrompt.value = '';
    });

    DOM.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        openAiDrawerWithPrompt(query);
      });
    });

    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        if (DOM.chatUserInput) {
          DOM.chatUserInput.value = query;
          sendChatMessage();
        }
      });
    });

    DOM.trendingLinks.forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        const search = t.dataset.search || t.textContent;
        if (DOM.searchInput) {
          DOM.searchInput.value = search;
          DOM.searchClearBtn?.classList.remove('hidden');
        }
        state.searchQuery = search;
        updateSectionHeader();
        loadNews(true);
      });
    });

    // Modals
    DOM.modalCloseBtn?.addEventListener('click', () => closeModal(DOM.articleModal));
    DOM.digestCloseBtn?.addEventListener('click', () => closeModal(DOM.digestModal));
    DOM.bookmarksCloseBtn?.addEventListener('click', () => closeModal(DOM.bookmarksModal));

    DOM.btnMorningDigest?.addEventListener('click', openMorningDigest);
    DOM.btnBookmarksView?.addEventListener('click', openBookmarksModal);
    DOM.btnClearBookmarks?.addEventListener('click', clearBookmarks);

    DOM.audioBtnPause?.addEventListener('click', toggleAudioPlayPause);
    DOM.audioBtnStop?.addEventListener('click', stopAudioNarration);

    DOM.btnListenDigest?.addEventListener('click', () => {
      const digestText = document.getElementById('digest-modal-content')?.innerText || 'Morning briefing summary from AwaisNews';
      playAudioNarration("AwaisNews Executive Morning Briefing", digestText);
    });

    DOM.btnPrintDigest?.addEventListener('click', () => {
      window.print();
    });

    DOM.btnReadEditorial?.addEventListener('click', () => {
      openArticleModal({
        id: 'editorial-lead',
        title: 'The Era of Hyper-Fast Intelligence: Why Real-Time Verifiable Journalism Matters More Than Ever',
        description: 'As global newsrooms face unprecedented information volume, editorial precision and verifiable sources remain the cornerstone of public trust.',
        content: 'Throughout the history of print and digital media, velocity and precision have maintained a tense duality. In modern digital publishing, newsrooms can now instantaneously cross-correlate eyewitness dispatches with verified international registries. AwaisNews is founded upon this golden standard: unyielding fidelity to truth, elevated by analytical clarity and comprehensive reporting for readers worldwide.',
        source: { name: 'Awais Editorial Board' },
        author: 'Chief Editor & Editorial Desk',
        publishedAt: new Date().toISOString(),
        urlToImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        category: 'technology'
      });
    });

    DOM.logoRefresh?.addEventListener('click', (e) => {
      e.preventDefault();
      state.currentCategory = 'general';
      state.currentCountry = 'global';
      state.searchQuery = '';
      if (DOM.countrySelect) DOM.countrySelect.value = 'global';
      if (DOM.searchInput) DOM.searchInput.value = '';
      DOM.categoryNavItems.forEach(b => b.classList.remove('active'));
      DOM.categoryNavItems[0]?.classList.add('active');
      updateSectionHeader();
      loadNews(true);
    });

    document.querySelectorAll('.foot-cat').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = a.dataset.category;
        state.currentCategory = cat;
        DOM.categoryNavItems.forEach(b => {
          b.classList.toggle('active', b.dataset.category === cat);
        });
        updateSectionHeader();
        loadNews(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.getElementById('foot-open-briefing')?.addEventListener('click', (e) => {
      e.preventDefault();
      openMorningDigest();
    });
    document.getElementById('foot-open-assistant')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAiDrawer();
    });
    document.getElementById('foot-open-bookmarks')?.addEventListener('click', (e) => {
      e.preventDefault();
      openBookmarksModal();
    });

    [DOM.articleModal, DOM.digestModal, DOM.bookmarksModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [DOM.articleModal, DOM.digestModal, DOM.bookmarksModal].forEach(m => closeModal(m));
        if (DOM.aiChatDrawer?.classList.contains('open')) toggleAiDrawer();
      }
    });
  }

  function updateSectionHeader() {
    if (!DOM.sectionTitle) return;
    const cInfo = NewsEngine.COUNTRY_MAP?.[state.currentCountry] || { name: 'Global', flag: '🌐' };
    const cPrefix = state.currentCountry !== 'global' ? `${cInfo.flag} ${cInfo.name} • ` : '';

    if (state.searchQuery) {
      DOM.sectionTitle.textContent = `Search Results: "${state.searchQuery}"`;
    } else {
      const titles = {
        general: `${cPrefix}Today's Headlines & Front Page`,
        technology: `${cPrefix}Technology & Innovation`,
        business: `${cPrefix}Business & Financial Markets`,
        world: `${cPrefix}World Affairs & International Relations`,
        science: `${cPrefix}Science, Frontiers & Space`,
        sports: `${cPrefix}Sports & Athletic Competitions`,
        entertainment: `${cPrefix}Arts, Culture & Entertainment`,
        health: `${cPrefix}Health, Medicine & Longevity`
      };
      DOM.sectionTitle.textContent = titles[state.currentCategory] || `${cPrefix}Global Headlines`;
    }
  }

  async function loadNews(forceRefresh = false, isBackgroundSync = false) {
    if (!isBackgroundSync && DOM.articlesGrid) {
      DOM.articlesGrid.innerHTML = `
        <div class="hero-skeleton" style="height: 260px;"></div>
        <div class="hero-skeleton" style="height: 260px;"></div>
      `;
    }

    try {
      const result = await NewsEngine.fetchNews({
        category: state.currentCategory,
        query: state.searchQuery,
        country: state.currentCountry,
        sortBy: state.currentSort,
        forceRefresh: forceRefresh
      });

      state.articles = result.articles;
      if (DOM.sourceStatus) {
        DOM.sourceStatus.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> ${result.source} • <span style="color: var(--accent-emerald);">Live 24/7</span>`;
      }

      renderHeroStory(state.articles[0]);
      renderArticlesGrid(state.articles.slice(1));
      setupBreakingNews(state.articles);

    } catch (err) {
      console.error('Failed to load news:', err);
      if (!isBackgroundSync && DOM.articlesGrid) {
        DOM.articlesGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <p style="color: var(--accent-crimson); font-size: 1.1rem; margin-bottom: 12px;"><i class="fa-solid fa-triangle-exclamation"></i> Live News stream synchronizing...</p>
            <button onclick="location.reload()" class="btn-read-full">Reload AwaisNews</button>
          </div>
        `;
      }
    }
  }

  function renderHeroStory(article) {
    if (!DOM.heroContainer) return;
    if (!article) {
      DOM.heroContainer.innerHTML = '';
      return;
    }

    const aiMeta = QwenAI.analyzeArticle(article);
    const isSaved = state.savedArticles.some(a => a.title === article.title);

    DOM.heroContainer.innerHTML = `
      <div class="hero-lead-card">
        <div class="hero-img-wrap">
          <img src="${escapeHtml(article.urlToImage)}" alt="${escapeHtml(article.title)}" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80'">
          <span class="hero-badge-overlay"><i class="fa-solid fa-star"></i> COVER STORY</span>
        </div>
        <div class="hero-info-wrap">
          <div>
            <div class="hero-meta-top">
              <span class="source-tag"><i class="fa-solid fa-tower-broadcast"></i> ${escapeHtml(article.source?.name || 'Awais News')}</span>
              <span>•</span>
              <span><i class="fa-regular fa-clock"></i> ${formatTimeAgo(article.publishedAt)}</span>
              <span>•</span>
              <span>${aiMeta.readTime}</span>
            </div>
            <h2 class="hero-title" style="cursor: pointer;" data-action="open-hero">${escapeHtml(article.title)}</h2>
            <p class="hero-snippet">${escapeHtml(article.description || article.content || '')}</p>
            
            <div class="hero-ai-insight">
              <div class="hero-ai-insight-head">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Executive Editorial Insight
              </div>
              <p><strong>Verdict:</strong> ${aiMeta.sentiment} • <strong>Neutrality:</strong> ${aiMeta.factualityScore}</p>
            </div>
          </div>

          <div class="hero-footer-bar">
            <div class="hero-author-date">
              By <strong>${escapeHtml(article.author || 'Awais Editorial Staff')}</strong>
            </div>
            <div class="hero-actions">
              <button class="btn-ai-summary-pill" data-action="ai-summary">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Quick Summary
              </button>
              <button class="btn-read-full" data-action="open-hero">
                Read Full Story <i class="fa-solid fa-arrow-right"></i>
              </button>
              <button class="btn-bookmark-action ${isSaved ? 'saved' : ''}" data-action="bookmark-hero" title="Bookmark Article">
                <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    DOM.heroContainer.querySelectorAll('[data-action="open-hero"]').forEach(el => {
      el.addEventListener('click', () => openArticleModal(article));
    });

    DOM.heroContainer.querySelector('[data-action="ai-summary"]')?.addEventListener('click', () => {
      openArticleModal(article, true);
    });

    DOM.heroContainer.querySelector('[data-action="bookmark-hero"]')?.addEventListener('click', (e) => {
      toggleBookmark(article);
      const btn = e.currentTarget;
      const isNowSaved = state.savedArticles.some(a => a.title === article.title);
      btn.className = `btn-bookmark-action ${isNowSaved ? 'saved' : ''}`;
      btn.innerHTML = `<i class="fa-${isNowSaved ? 'solid' : 'regular'} fa-bookmark"></i>`;
    });
  }

  function renderArticlesGrid(articles) {
    if (!DOM.articlesGrid) return;
    if (!articles || articles.length === 0) {
      DOM.articlesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fa-solid fa-newspaper" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>No further articles found matching the current criteria.</p>
        </div>
      `;
      return;
    }

    DOM.articlesGrid.innerHTML = articles.map((article, index) => {
      const isSaved = state.savedArticles.some(a => a.title === article.title);
      return `
        <article class="news-card" data-index="${index}">
          <div class="card-img-wrap">
            <img src="${escapeHtml(article.urlToImage)}" alt="${escapeHtml(article.title)}" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'">
            <span class="card-category-tag">${escapeHtml(article.category || state.currentCategory)}</span>
          </div>
          <div class="card-body">
            <div>
              <div class="card-meta">
                <span class="source-name"><i class="fa-solid fa-globe"></i> ${escapeHtml(article.source?.name || 'Awais News')}</span>
                <span><i class="fa-regular fa-clock"></i> ${formatTimeAgo(article.publishedAt)}</span>
              </div>
              <h4 class="card-title" style="cursor: pointer;">${escapeHtml(article.title)}</h4>
              <p class="card-excerpt">${escapeHtml(article.description || '')}</p>
            </div>
            <div class="card-footer">
              <button class="card-ai-btn" data-action="card-ai">
                <i class="fa-solid fa-wand-magic-sparkles"></i> AI Summary
              </button>
              <div class="card-actions-right">
                <button class="btn-card-icon" data-action="card-tts" title="Listen to Story">
                  <i class="fa-solid fa-volume-high"></i>
                </button>
                <button class="btn-card-icon ${isSaved ? 'saved' : ''}" data-action="card-save" title="Save Story">
                  <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    DOM.articlesGrid.querySelectorAll('.news-card').forEach((card, idx) => {
      const article = articles[idx];
      card.querySelector('.card-title')?.addEventListener('click', () => openArticleModal(article));
      card.querySelector('.card-img-wrap')?.addEventListener('click', () => openArticleModal(article));
      
      card.querySelector('[data-action="card-ai"]')?.addEventListener('click', () => {
        openArticleModal(article, true);
      });

      card.querySelector('[data-action="card-tts"]')?.addEventListener('click', () => {
        playAudioNarration(article.title, `${article.title}. ${article.description || article.content || ''}`);
      });

      card.querySelector('[data-action="card-save"]')?.addEventListener('click', (e) => {
        toggleBookmark(article);
        const btn = e.currentTarget;
        const isNowSaved = state.savedArticles.some(a => a.title === article.title);
        btn.innerHTML = `<i class="fa-${isNowSaved ? 'solid' : 'regular'} fa-bookmark"></i>`;
        btn.classList.toggle('saved', isNowSaved);
      });
    });
  }

  function setupBreakingNews(articles) {
    if (!articles || articles.length === 0) return;
    state.breakingIndex = 0;
    updateBreakingBanner();
  }

  function updateBreakingBanner() {
    if (!DOM.breakingLink || !state.articles[state.breakingIndex]) return;
    const item = state.articles[state.breakingIndex];
    DOM.breakingLink.textContent = item.title;
    DOM.breakingLink.onclick = (e) => {
      e.preventDefault();
      openArticleModal(item);
    };
  }

  function prevBreakingNews() {
    if (state.articles.length === 0) return;
    state.breakingIndex = (state.breakingIndex - 1 + state.articles.length) % state.articles.length;
    updateBreakingBanner();
  }

  function nextBreakingNews() {
    if (state.articles.length === 0) return;
    state.breakingIndex = (state.breakingIndex + 1) % state.articles.length;
    updateBreakingBanner();
  }

  setInterval(nextBreakingNews, 8000);

  /**
   * Article Modal with Detailed Coverage and without external original link
   */
  async function openArticleModal(article, scrollToAi = false) {
    if (!DOM.articleModal || !DOM.articleModalBody) return;
    state.currentArticle = article;
    const aiAnalysis = QwenAI.analyzeArticle(article);
    const summary = await QwenAI.generateSummary(article);
    const isSaved = state.savedArticles.some(a => a.title === article.title);

    const leadSnippet = article.description ? `<p class="lead-paragraph" style="font-weight: 500; font-size: 1.2rem; line-height: 1.7; margin-bottom: 20px; color: var(--text-primary); border-left: 3px solid var(--accent-gold); padding-left: 16px;">${escapeHtml(article.description)}</p>` : '';
    
    let mainContent = article.content || '';
    mainContent = mainContent.replace(/\[\+\d+\s*chars\]/g, '').trim();

    DOM.articleModalBody.innerHTML = `
      <div class="reader-header">
        <span class="reader-category">${escapeHtml(article.category || 'Special Report')}</span>
        <h1 class="reader-title">${escapeHtml(article.title)}</h1>
        
        <div class="reader-meta-bar">
          <div>
            <strong>By ${escapeHtml(article.author || 'Awais Editorial Board')}</strong> • 
            <span>${escapeHtml(article.source?.name || 'Awais Global News')}</span> • 
            <span>${new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div class="reader-actions-bar">
            <button class="reader-action-btn" id="modal-tts-btn">
              <i class="fa-solid fa-volume-high"></i> Listen to Audio
            </button>
            <button class="reader-action-btn" id="modal-save-btn">
              <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save'}
            </button>
            <button class="reader-action-btn" id="modal-share-btn">
              <i class="fa-solid fa-share-nodes"></i> Share
            </button>
          </div>
        </div>
      </div>

      <div class="reader-ai-box" id="reader-ai-section">
        <div class="reader-ai-header">
          <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Executive Key Insights & Takeaways</h4>
        </div>
        <ul class="ai-bullets">
          ${summary.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
        <div class="sentiment-pills">
          <span class="sentiment-pill"><i class="fa-solid fa-gauge"></i> Sentiment: <strong>${escapeHtml(aiAnalysis.sentiment)}</strong></span>
          <span class="sentiment-pill"><i class="fa-solid fa-shield-halved"></i> Factuality: <strong>${escapeHtml(aiAnalysis.factualityScore)}</strong></span>
          <span class="sentiment-pill"><i class="fa-solid fa-clock"></i> Reading Time: <strong>${escapeHtml(aiAnalysis.readTime)}</strong></span>
        </div>
      </div>

      <div class="reader-img-wrap">
        <img src="${escapeHtml(article.urlToImage)}" alt="${escapeHtml(article.title)}" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80'">
      </div>

      <div class="reader-body-text">
        ${leadSnippet}
        
        <p>${escapeHtml(mainContent || 'This developing story is being monitored around the clock by AwaisNews journalists. Comprehensive facts, eyewitness accounts, and institutional statements are verified before publication to ensure complete accuracy.')}</p>
        
        <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin: 24px 0 12px 0; color: var(--accent-gold);">Background & Significance</h3>
        <p>Analysts and industry observers note that this development represents an important milestone within its broader regional and global framework. Market participants, policy advisors, and researchers are assessing both near-term impacts and long-range implications as further details emerge.</p>
        
        <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin: 24px 0 12px 0; color: var(--accent-gold);">Key Stakeholder Perspectives</h3>
        <p>Official spokespersons and independent experts emphasize the importance of transparent data sharing, regulatory adherence, and continuous stakeholder engagement to navigate the evolving dynamics surrounding this story.</p>
        
        <p style="font-size: 0.95rem; color: var(--text-muted); margin-top: 24px; padding-top: 16px; border-top: 1px dashed var(--border-subtle);">
          <em>Reported and verified by the AwaisNews International Editorial Desk. Continuous updates are streamed live to readers across all digital editions.</em>
        </p>
      </div>

      <div class="reader-footer" style="justify-content: flex-end;">
        <button class="btn-ai-summary-pill" id="modal-ask-ai-btn">
          <i class="fa-solid fa-robot"></i> Ask AI Assistant About This Story
        </button>
      </div>
    `;

    openModal(DOM.articleModal);

    document.getElementById('modal-tts-btn')?.addEventListener('click', () => {
      playAudioNarration(article.title, `${article.title}. ${article.description || ''}. ${mainContent}`);
    });

    document.getElementById('modal-save-btn')?.addEventListener('click', (e) => {
      toggleBookmark(article);
      const isNowSaved = state.savedArticles.some(a => a.title === article.title);
      e.currentTarget.innerHTML = `<i class="fa-${isNowSaved ? 'solid' : 'regular'} fa-bookmark"></i> ${isNowSaved ? 'Saved' : 'Save'}`;
    });

    document.getElementById('modal-share-btn')?.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: article.title, text: article.description, url: window.location.href });
      } else {
        navigator.clipboard.writeText(`${article.title} - Read on AwaisNews: ${window.location.href}`);
        alert('Article link copied to clipboard!');
      }
    });

    document.getElementById('modal-ask-ai-btn')?.addEventListener('click', () => {
      closeModal(DOM.articleModal);
      openAiDrawerWithPrompt(`Provide a comprehensive in-depth analysis and key implications of the article: "${article.title}"`);
    });

    if (scrollToAi) {
      setTimeout(() => {
        document.getElementById('reader-ai-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }

  function openMorningDigest() {
    if (!DOM.digestModal || !DOM.digestModalContent) return;
    const digest = QwenAI.generateMorningDigest(state.articles);

    if (DOM.digestDate) DOM.digestDate.textContent = digest.date;

    DOM.digestModalContent.innerHTML = `
      <div style="background: var(--bg-card); padding: 20px; border-radius: var(--radius-md); margin-bottom: 24px; border: 1px solid var(--accent-ai);">
        <h3 style="color: var(--accent-ai); font-size: 1.1rem; margin-bottom: 8px;"><i class="fa-solid fa-compass"></i> Executive Global Overview</h3>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary);">${escapeHtml(digest.leadSummary)}</p>
      </div>

      <div class="digest-grid">
        ${digest.sections.map(sec => `
          <div class="digest-block">
            <h4><i class="fa-solid ${sec.icon}"></i> ${escapeHtml(sec.title)}</h4>
            <p><strong>Lead Event:</strong> ${escapeHtml(sec.insight)}</p>
            <p style="margin-top: 6px; color: var(--accent-gold);"><strong>Strategic Takeaway:</strong> ${escapeHtml(sec.takeaway)}</p>
          </div>
        `).join('')}
      </div>
    `;

    openModal(DOM.digestModal);
  }

  function openBookmarksModal() {
    if (!DOM.bookmarksModal || !DOM.bookmarksList) return;
    renderBookmarksList();
    openModal(DOM.bookmarksModal);
  }

  function renderBookmarksList() {
    if (!DOM.bookmarksList) return;
    if (state.savedArticles.length === 0) {
      DOM.bookmarksList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <i class="fa-regular fa-bookmark" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>No saved articles yet. Bookmark stories from the feed to read offline.</p>
        </div>
      `;
      return;
    }

    DOM.bookmarksList.innerHTML = state.savedArticles.map((article, idx) => `
      <div class="saved-item">
        <div class="saved-item-info" style="cursor: pointer;" data-index="${idx}">
          <h5>${escapeHtml(article.title)}</h5>
          <small><i class="fa-regular fa-clock"></i> ${formatTimeAgo(article.publishedAt)} • ${escapeHtml(article.source?.name || 'Awais News')}</small>
        </div>
        <button class="danger-btn" data-delete-idx="${idx}" title="Remove Bookmark">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');

    DOM.bookmarksList.querySelectorAll('.saved-item-info').forEach(info => {
      info.addEventListener('click', () => {
        const article = state.savedArticles[info.dataset.index];
        closeModal(DOM.bookmarksModal);
        openArticleModal(article);
      });
    });

    DOM.bookmarksList.querySelectorAll('[data-delete-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.deleteIdx, 10);
        state.savedArticles.splice(idx, 1);
        localStorage.setItem('awaisnews_bookmarks', JSON.stringify(state.savedArticles));
        updateBookmarkBadge();
        renderBookmarksList();
      });
    });
  }

  function toggleBookmark(article) {
    const idx = state.savedArticles.findIndex(a => a.title === article.title);
    if (idx >= 0) {
      state.savedArticles.splice(idx, 1);
    } else {
      state.savedArticles.unshift(article);
    }
    localStorage.setItem('awaisnews_bookmarks', JSON.stringify(state.savedArticles));
    updateBookmarkBadge();
  }

  function clearBookmarks() {
    if (confirm('Clear all saved articles in library?')) {
      state.savedArticles = [];
      localStorage.removeItem('awaisnews_bookmarks');
      updateBookmarkBadge();
      renderBookmarksList();
    }
  }

  function updateBookmarkBadge() {
    if (DOM.bookmarkCount) {
      DOM.bookmarkCount.textContent = state.savedArticles.length;
    }
  }



  function toggleAiDrawer() {
    DOM.aiChatDrawer?.classList.toggle('open');
    if (DOM.aiChatDrawer?.classList.contains('open')) {
      DOM.chatUserInput?.focus();
    }
  }

  function openAiDrawerWithPrompt(promptText) {
    if (!DOM.aiChatDrawer?.classList.contains('open')) {
      toggleAiDrawer();
    }
    if (DOM.chatUserInput) {
      DOM.chatUserInput.value = promptText;
      sendChatMessage();
    }
  }

  async function sendChatMessage() {
    const text = DOM.chatUserInput?.value.trim();
    if (!text || !DOM.chatMessages) return;

    appendChatMessage('user', text);
    if (DOM.chatUserInput) DOM.chatUserInput.value = '';

    const botMsgId = `bot-msg-${Date.now()}`;
    appendChatMessage('bot', '<i class="fa-solid fa-spinner fa-spin"></i> Searching live wires & compiling intelligence...', botMsgId);

    const context = state.articles.slice(0, 3).map(a => a.title).join('; ');
    const botResponse = await QwenAI.askAssistant(text, context);

    const bubbleEl = document.getElementById(botMsgId)?.querySelector('.msg-bubble');
    if (bubbleEl) {
      const replyText = typeof botResponse === 'string' ? botResponse : (botResponse.reply || '');
      const articles = Array.isArray(botResponse?.articles) ? botResponse.articles : [];

      let contentHtml = `<div class="chat-response-text">${formatMarkdown(replyText)}</div>`;

      if (articles && articles.length > 0) {
        contentHtml += `
          <div class="chat-news-section">
            <div class="chat-news-header">
              <i class="fa-solid fa-newspaper" style="color: var(--accent-ai);"></i> <strong>Live Matched News Stories (${articles.length}):</strong>
            </div>
            <div class="chat-news-list">
              ${articles.map((art, idx) => `
                <div class="chat-news-card">
                  <div class="chat-card-thumb">
                    <img src="${escapeHtml(art.urlToImage)}" alt="${escapeHtml(art.title)}" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80'">
                  </div>
                  <div class="chat-card-content">
                    <h5 class="chat-card-title">${escapeHtml(art.title)}</h5>
                    <div class="chat-card-meta">
                      <span><i class="fa-regular fa-clock"></i> ${formatTimeAgo(art.publishedAt)}</span>
                      <span>• ${escapeHtml(art.source?.name || 'Awais News')}</span>
                    </div>
                    <div class="chat-card-actions">
                      <button class="chat-btn-read" data-action="read-modal" data-art-idx="${idx}">
                        <i class="fa-solid fa-book-open"></i> Read Full
                      </button>
                      <button class="chat-btn-audio" data-action="listen-audio" data-art-idx="${idx}" title="Listen Story">
                        <i class="fa-solid fa-volume-high"></i> Listen
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      bubbleEl.innerHTML = contentHtml;

      // Attach click events for the news cards inside chat
      if (articles && articles.length > 0) {
        bubbleEl.querySelectorAll('[data-action="read-modal"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.artIdx, 10);
            const selectedArt = articles[idx];
            if (selectedArt) openArticleModal(selectedArt);
          });
        });

        bubbleEl.querySelectorAll('[data-action="listen-audio"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.artIdx, 10);
            const selectedArt = articles[idx];
            if (selectedArt) {
              playAudioNarration(selectedArt.title, `${selectedArt.title}. ${selectedArt.description || selectedArt.content || ''}`);
            }
          });
        });
      }
    }

    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  }

  function appendChatMessage(sender, content, id = '') {
    if (!DOM.chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    if (id) msgDiv.id = id;

    msgDiv.innerHTML = `
      <div class="msg-avatar"><i class="fa-solid ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i></div>
      <div class="msg-bubble">${sender === 'user' ? escapeHtml(content) : content}</div>
    `;

    DOM.chatMessages.appendChild(msgDiv);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  }

  function playAudioNarration(title, text) {
    if (!state.speechSynth) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    state.speechSynth.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);

    const voiceIdx = DOM.cfgVoiceSelect?.value;
    if (voiceIdx && voiceIdx !== 'auto') {
      const voices = state.speechSynth.getVoices();
      if (voices[voiceIdx]) utter.voice = voices[voiceIdx];
    }

    utter.rate = 1.0;
    utter.pitch = 1.0;

    utter.onstart = () => {
      state.isPlayingAudio = true;
      if (DOM.audioPlayerBar) DOM.audioPlayerBar.classList.remove('hidden');
      if (DOM.audioNowPlaying) DOM.audioNowPlaying.textContent = title;
      if (DOM.audioBtnPause) DOM.audioBtnPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
    };

    utter.onend = () => {
      state.isPlayingAudio = false;
      if (DOM.audioPlayerBar) DOM.audioPlayerBar.classList.add('hidden');
    };

    utter.onerror = () => {
      state.isPlayingAudio = false;
      if (DOM.audioPlayerBar) DOM.audioPlayerBar.classList.add('hidden');
    };

    state.speechUtterance = utter;
    state.speechSynth.speak(utter);
  }

  function toggleAudioPlayPause() {
    if (!state.speechSynth) return;
    if (state.speechSynth.paused) {
      state.speechSynth.resume();
      if (DOM.audioBtnPause) DOM.audioBtnPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else if (state.speechSynth.speaking) {
      state.speechSynth.pause();
      if (DOM.audioBtnPause) DOM.audioBtnPause.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  }

  function stopAudioNarration() {
    if (state.speechSynth) {
      state.speechSynth.cancel();
    }
    state.isPlayingAudio = false;
    if (DOM.audioPlayerBar) DOM.audioPlayerBar.classList.add('hidden');
  }

  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  function formatTimeAgo(isoDate) {
    if (!isoDate) return 'Just now';
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (isNaN(diff) || diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHtml(text);
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/^•\s*(.*)$/gm, '<li>$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    parsed = parsed.replace(/\n/g, '<br>');
    return parsed;
  }
});
