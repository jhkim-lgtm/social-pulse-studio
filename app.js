(() => {
  'use strict';

  const STORAGE = {
    theme: 'pulse.theme',
    selected: 'pulse.selectedContent',
    sources: 'pulse.sources',
    queue: 'pulse.publishQueue',
    campaigns: 'pulse.campaigns',
    studio: 'pulse.studio',
    tasks: 'pulse.tasks'
  };

  const images = {
    brandDefault: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=82',
    brandProduct: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82',
    brandCampaign: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=82',
    fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=82',
    object: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82',
    portrait: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=82',
    interior: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=82',
    skincare: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=82',
    coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=82',
    travel: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=82',
    tech: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82',
    food: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=82',
    architecture: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=82',
    wellness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=82',
    beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=82'
  };

  /* Discovery = 외부 급상승 콘텐츠 실데이터 (assets/trending-content.js, tools/fetch_trending.py로 수집).
     소스: TikTok Creative Center(국가별 급상승 크리에이터 영상, 실제 미리보기 mp4 로컬 저장) ·
     Douyin 热点榜(실시간 핫토픽) · TikTok CC KR 주간 해시태그.
     목적: 터지는 콘텐츠를 빠르게 파악해 소싱/기획하고, 트위스트해 자사 채널 콘텐츠로 재제작. */
  const discoveryItems = (window.TRENDING_DISCOVERY || []).map((raw, index) => {
    const creator = raw.creator || '';
    return {
      id: index + 1,
      platform: raw.platform,
      group: raw.group || raw.platform,
      vertical: raw.vertical || null,
      creator,
      creatorName: raw.creatorName || creator,
      avatar: creator.replace(/^@/, '').slice(0, 2).toUpperCase() || 'TR',
      title: raw.title,
      hashtag: raw.hashtag || null,
      topic: raw.topic || '',
      views: raw.views || 0,
      likes: raw.likes ?? null,
      velocity: raw.velocity ?? null,
      velocityLive: Boolean(raw.velocityLive),
      rankValue: raw.rankValue ?? raw.views ?? 0,
      metricLabel: raw.metricLabel || '보조 지표',
      metricValue: raw.metricValue ?? '—',
      badge: raw.badge || 'LIVE',
      age: raw.age || '',
      image: raw.poster,
      previewUrl: raw.poster,
      assetUrl: raw.asset,
      originalUrl: raw.originalUrl,
      mediaType: raw.mediaType,
      mode: 'live',
      rightsStatus: 'reference-only',
      source: raw.source
    };
  });

  /* viral score = 그룹 내 핵심 지표(조회·热度 또는 분당 좋아요) 상대 순위를 76~99로 정규화.
     소스마다 지표 단위가 달라 그룹별로 따로 순위를 매긴다. */
  const scoreGroups = {};
  discoveryItems.forEach(item => (scoreGroups[item.group] = scoreGroups[item.group] || []).push(item));
  Object.values(scoreGroups).forEach(group => {
    [...group].sort((a, b) => a.rankValue - b.rankValue).forEach((item, rank) => {
      item.score = group.length > 1 ? Math.round(76 + (rank / (group.length - 1)) * 23) : 90;
    });
  });

  function formatMetric(value) {
    return typeof value === 'number' ? formatNumber(value) : String(value ?? '—');
  }

  const state = {
    activeView: 'overview',
    platform: 'all',
    query: '',
    sort: 'viral',
    detailId: null,
    selected: Number(localStorage.getItem(STORAGE.selected)) || null,
    sources: readJSON(STORAGE.sources, []),
    queue: readJSON(STORAGE.queue, null) || defaultQueue(),
    campaigns: readJSON(STORAGE.campaigns, null) || defaultCampaigns(),
    weekOffset: 0,
    studio: readJSON(STORAGE.studio, { format: 'feed', layout: 'editorial', color: '#2768ff', align: 'left', zoom: 80 })
  };

  /* 이전 데모가 Discovery 원본을 예약 썸네일로 복사했던 로컬 데이터도 브랜드 전용 자산으로 안전하게 이전한다. */
  const defaultQueueImages = { 101: images.brandDefault, 102: images.brandProduct, 103: images.brandCampaign };
  state.queue = state.queue.map(entry => {
    if (defaultQueueImages[entry.id]) return { ...entry, image: defaultQueueImages[entry.id] };
    const source = discoveryItems.find(item => item.id === entry.creative?.sourceId);
    return source && entry.image === source.image ? { ...entry, image: images.brandDefault } : entry;
  });
  saveJSON(STORAGE.queue, state.queue);

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }

  function formatNumber(number) {
    if (number >= 1000000) return `${(number / 1000000).toFixed(number >= 10000000 ? 0 : 1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(number >= 100000 ? 0 : 1)}K`;
    return String(number);
  }

  function localISO(date = new Date()) {
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 10);
  }

  function dateFromToday(offset) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return localISO(date);
  }

  function defaultQueue() {
    return [
      { id: 101, title: '좋은 브랜드는 한눈에 기억됩니다', channels: ['Instagram'], platform: 'Instagram', date: dateFromToday(0), time: '19:00', format: '릴스', image: images.brandDefault, demo: true },
      { id: 102, title: '브랜드 헤리티지 카드 #08', channels: ['Instagram', 'TikTok'], platform: 'Instagram', date: dateFromToday(1), time: '11:30', format: '피드', image: images.brandProduct, demo: true },
      { id: 103, title: '우리가 공간을 고르는 기준', channels: ['YouTube'], platform: 'YouTube', date: dateFromToday(3), time: '18:00', format: '쇼츠', image: images.brandCampaign, demo: true }
    ];
  }

  function defaultCampaigns() {
    return [
      { id: 201, name: '브랜드 헤리티지 · 8월', goal: '도달', budget: 120000, spend: '₩1.8M', result: '486K', roas: '—', status: '진행 중 (데모)' },
      { id: 202, name: '리드 제너레이션 · 여름', goal: '웹사이트 전환', budget: 180000, spend: '₩1.4M', result: '742건', roas: '4.2x', status: '진행 중 (데모)' },
      { id: 203, name: '1CLUB 브랜드 필름', goal: '영상 조회', budget: 90000, spend: '₩1.0M', result: '218K', roas: '2.9x', status: '종료 (데모)' }
    ];
  }

  function platformClass(platform) {
    if (platform.includes('Instagram')) return 'instagram';
    if (platform.includes('TikTok')) return 'tiktok';
    if (platform.includes('YouTube')) return 'youtube';
    return 'douyin';
  }

  function showView(view, updateHash = true) {
    const allowed = ['overview', 'discovery', 'studio', 'publish', 'analytics', 'ads'];
    if (!allowed.includes(view)) view = 'overview';
    state.activeView = view;
    $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
    $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (updateHash) history.replaceState(null, '', `#${view}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'studio') updateStudioReference();
    if (view === 'publish') { renderQueue(); renderCalendar(); }
  }

  function setupNavigation() {
    $$('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
    $$('[data-view-jump]').forEach(button => button.addEventListener('click', () => showView(button.dataset.viewJump)));
    window.addEventListener('hashchange', () => showView(location.hash.slice(1), false));
    showView(location.hash.slice(1) || 'overview', false);
  }

  function setupTheme() {
    const saved = localStorage.getItem(STORAGE.theme);
    const initial = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(initial);
    $('#themeToggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
    $('#themeToggle').setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
    applyBrandLogos();
  }

  function applyBrandLogos() {
    const logos = window.BRAND_LOGOS || {};
    $$('img[data-brand-logo]').forEach(image => {
      const requested = image.dataset.brandLogo;
      const variant = requested === 'auto' ? (document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') : requested;
      if (logos[variant]) image.src = logos[variant];
    });
  }

  function discoveryMedia(item, extra = '') {
    if (item.mediaType === 'hashtag') {
      return `<div class="discovery-media hashtag-media" ${extra}><span class="hashtag-big">${escapeHTML(item.hashtag || item.title)}</span>`;
    }
    return `<div class="discovery-media" style="background-image:url('${item.image}')" ${extra}>`;
  }

  function renderDiscovery() {
    let list = [...discoveryItems];
    if (state.platform !== 'all') {
      list = state.platform === 'Global'
        ? list.filter(item => item.group !== 'IG-Media')
        : list.filter(item => item.vertical === state.platform);
    }
    if (state.query) {
      const query = state.query.toLocaleLowerCase('ko');
      list = list.filter(item => `${item.title} ${item.creator} ${item.platform} ${item.topic} ${item.vertical || ''}`.toLocaleLowerCase('ko').includes(query));
    }
    list.sort((a, b) => {
      if (state.sort === 'views') return b.views - a.views;
      return b.score - a.score;
    });

    $('#resultCount').textContent = list.length;
    $('#discoveryEmpty').hidden = list.length > 0;
    $('#discoveryGrid').innerHTML = list.map(item => {
      const cls = platformClass(item.platform);
      return `
        <article class="discovery-card" data-id="${item.id}">
          ${discoveryMedia(item, `tabindex="0" role="button" aria-label="${escapeHTML(item.title)} 원본 보기"`)}
            <span class="card-platform"><i class="${cls}"></i>${escapeHTML(item.platform)}</span>
            <span class="viral-badge"><span>VIRAL</span><b>${item.score}</b></span>
            <span class="velocity-badge"><svg><use href="#i-bolt"/></svg>${escapeHTML(item.badge)}</span>
            ${item.mediaType === 'video' ? '<span class="play-button"><svg><use href="#i-play"/></svg></span>' : ''}
          </div>
          <div class="discovery-body">
            <div class="creator-row"><span class="creator-avatar">${item.avatar}</span><b>${escapeHTML(item.creator)}</b><span>· ${escapeHTML(item.age)}</span></div>
            <h3>${escapeHTML(item.title)}</h3>
            <div class="card-stats">${item.views > 0 ? `<span><svg><use href="#i-play"/></svg>${formatNumber(item.views)}</span>` : item.likes != null ? `<span><svg><use href="#i-heart"/></svg>좋아요 ${formatNumber(item.likes)}</span>` : ''}<span><svg><use href="#i-heart"/></svg>${escapeHTML(item.metricLabel)} ${formatMetric(item.metricValue)}</span>${item.topic ? `<span><svg><use href="#i-trend"/></svg>${escapeHTML(item.topic)}</span>` : ''}</div>
            <div class="source-badges">${item.vertical ? `<span class="source-badge snapshot">${escapeHTML(item.vertical)}</span>` : ''}<span class="source-badge">${escapeHTML(item.source)}</span><span class="source-badge rights">레퍼런스 · 권리 확인 필요</span></div>
            <div class="card-actions">
              <button class="card-original"><svg><use href="#i-play"/></svg>원본 보기</button>
              <button class="card-action"><svg><use href="#i-edit"/></svg>Studio에서 트위스트</button>
            </div>
          </div>
        </article>`;
    }).join('');

    $$('.discovery-card').forEach(card => {
      const id = Number(card.dataset.id);
      const open = () => openDiscoveryDetail(id);
      $('.card-action', card).addEventListener('click', open);
      $('.card-original', card).addEventListener('click', open);
      $('.discovery-media', card).addEventListener('click', open);
      $('.discovery-media', card).addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
  }

  function renderOverviewSignals() {
    const top = [...discoveryItems].sort((a, b) => b.score - a.score).slice(0, 4);
    $('#overviewSignals').innerHTML = top.map(item => `
      <button class="signal-item" data-signal-id="${item.id}">
        <span class="signal-thumb" style="${item.image ? `background-image:url('${item.image}')` : 'background:linear-gradient(135deg,#2768ff,#725cff)'}"></span>
        <span class="signal-item-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.platform)} · ${escapeHTML(item.creator)}</span></span>
        <span class="velocity"><b>${escapeHTML(item.badge)}</b><small>${escapeHTML(item.age)}</small></span>
      </button>`).join('');
    $$('[data-signal-id]').forEach(button => button.addEventListener('click', () => openDiscoveryDetail(Number(button.dataset.signalId))));
  }

  function setupDiscoveryFilters() {
    $$('.filter-chip').forEach(button => button.addEventListener('click', () => {
      $$('.filter-chip').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.platform = button.dataset.platform;
      renderDiscovery();
    }));
    $('#discoverySearch').addEventListener('input', event => { state.query = event.target.value.trim(); renderDiscovery(); });
    $('#discoverySort').addEventListener('change', event => { state.sort = event.target.value; renderDiscovery(); });
  }

  function selectDiscovery(id) {
    state.selected = id;
    localStorage.setItem(STORAGE.selected, id);
    delete state.studio.customImage;
    const item = discoveryItems.find(entry => entry.id === id);
    if (item) state.studio.format = item.mediaType === 'video' ? 'reel' : 'feed';
    saveJSON(STORAGE.studio, state.studio);
    applyStudioState();
    updateStudioReference();
    showView('studio');
    showToast('레퍼런스를 캔버스에 불러왔어요', '원본 위에서 트위스트 시안을 잡아보세요. 원본 요소를 그대로 게시하려면 권리 확인이 필요합니다.');
  }

  function openDiscoveryDetail(id) {
    const item = discoveryItems.find(entry => entry.id === id);
    if (!item) return;
    state.detailId = id;
    const cls = platformClass(item.platform);
    const preview = $('#originalPreview');
    preview.style.backgroundImage = item.previewUrl ? `url('${item.previewUrl}')` : 'linear-gradient(135deg,#2768ff,#725cff)';
    preview.classList.toggle('is-video', item.mediaType === 'video');
    let hashtagBig = $('.hashtag-big', preview);
    if (item.mediaType === 'hashtag') {
      if (!hashtagBig) {
        hashtagBig = document.createElement('span');
        hashtagBig.className = 'hashtag-big';
        preview.appendChild(hashtagBig);
      }
      hashtagBig.hidden = false;
      hashtagBig.textContent = item.hashtag || item.title;
    } else if (hashtagBig) {
      hashtagBig.hidden = true;
    }
    let previewVideo = $('video', preview);
    if (item.mediaType === 'video') {
      if (!previewVideo) {
        previewVideo = document.createElement('video');
        previewVideo.muted = true;
        previewVideo.loop = true;
        previewVideo.autoplay = true;
        previewVideo.playsInline = true;
        previewVideo.controls = true;
        preview.appendChild(previewVideo);
      }
      previewVideo.hidden = false;
      previewVideo.poster = item.previewUrl;
      if (previewVideo.dataset.src !== item.assetUrl) {
        previewVideo.src = item.assetUrl;
        previewVideo.dataset.src = item.assetUrl;
      }
      previewVideo.play().catch(() => { /* autoplay policy */ });
    } else if (previewVideo) {
      previewVideo.pause();
      previewVideo.hidden = true;
    }
    $('.original-play', preview).hidden = item.mediaType === 'video';
    $('#originalPlatform').innerHTML = `<i class="${cls}"></i>${escapeHTML(item.platform)}`;
    $('#originalStatus').textContent = item.mode === 'live' ? 'LIVE SOURCE' : 'DEMO SAMPLE';
    $('#originalStatus').classList.toggle('live', item.mode === 'live');
    $('#originalAvatar').textContent = item.avatar;
    $('#originalCreator').textContent = item.creator;
    $('#originalAge').textContent = `· ${item.age}`;
    $('#originalContentTitle').textContent = item.title;
    const isLikesFirst = item.group === 'IG-Media';
    $('#originalViewsLabel').textContent = item.platform === 'Douyin' ? '热度' : (isLikesFirst ? '좋아요' : '조회');
    $('#originalViews').textContent = formatNumber(isLikesFirst ? (item.likes || 0) : item.views);
    $('#originalLikesLabel').textContent = item.metricLabel;
    $('#originalLikes').textContent = formatMetric(item.metricValue);
    $('#originalVelocityLabel').textContent = '급상승';
    $('#originalVelocity').textContent = item.badge;
    $('#originalScore').textContent = item.score;
    $('#originalSource').textContent = item.source;
    $('#originalRightsCopy').textContent = '외부 크리에이터/플랫폼의 급상승 콘텐츠입니다. 구조·훅·포맷을 분석해 트위스트 제작에 활용하고, 원본 요소를 그대로 쓰려면 게시 전 권리 확인이 필요합니다.';
    const external = $('#originalExternalLink');
    const href = item.originalUrl || item.assetUrl;
    external.hidden = !href;
    if (href) external.href = href;
    $('span', external).textContent = `${item.platform} 원본 보기`;
    const dialog = $('#discoveryDetailModal');
    if (!dialog.open) dialog.showModal();
  }

  function setupDiscoveryDetail() {
    $('#discoveryDetailModal').addEventListener('close', () => {
      $('#originalPreview video')?.pause();
    });
    $('#useDiscoveryReference').addEventListener('click', () => {
      const id = state.detailId;
      $('#discoveryDetailModal').close();
      if (id) selectDiscovery(id);
    });
    $('#viewOriginalReference').addEventListener('click', () => {
      if (state.selected) openDiscoveryDetail(state.selected);
    });
  }

  function updateStudioReference() {
    const item = discoveryItems.find(entry => entry.id === state.selected);
    if (item) {
      $('#inspirationThumb').style.backgroundImage = item.image ? `url('${item.image}')` : 'linear-gradient(135deg,#2768ff,#725cff)';
      $('#inspirationTitle').textContent = item.title;
      $('#inspirationMeta').textContent = `Viral ${item.score} · ${item.badge} · ${item.creator} · 레퍼런스 리믹스`;
      $('#viewOriginalReference').hidden = false;
    } else {
      $('#viewOriginalReference').hidden = true;
    }
    /* 선택한 레퍼런스의 실제 미디어(로컬 저장본)를 캔버스에 올려 트위스트 시안을 잡는다.
       로컬 업로드(customImage)가 있으면 업로드가 우선. 미디어가 없는 항목(해시태그)은 브랜드 기본 자산. */
    const canvas = $('#socialCanvas');
    let canvasVideo = $('.canvas-video', canvas);
    const useOriginal = item && item.assetUrl && !state.studio.customImage;
    if (useOriginal && item.mediaType === 'video') {
      if (!canvasVideo) {
        canvasVideo = document.createElement('video');
        canvasVideo.className = 'canvas-video';
        canvasVideo.muted = true;
        canvasVideo.loop = true;
        canvasVideo.autoplay = true;
        canvasVideo.playsInline = true;
        canvas.insertBefore(canvasVideo, $('.canvas-gradient', canvas));
      }
      canvasVideo.hidden = false;
      canvasVideo.poster = item.previewUrl;
      if (canvasVideo.dataset.src !== item.assetUrl) {
        canvasVideo.src = item.assetUrl;
        canvasVideo.dataset.src = item.assetUrl;
      }
      canvasVideo.play().catch(() => { /* autoplay policy */ });
      $('.canvas-image').style.backgroundImage = `url('${item.previewUrl}')`;
    } else {
      if (canvasVideo) { canvasVideo.pause(); canvasVideo.hidden = true; }
      const previewImage = state.studio.customImage || (useOriginal ? item.assetUrl : images.brandDefault);
      $('.canvas-image').style.backgroundImage = `url('${previewImage}')`;
    }
  }

  function selectedStudioThumb() {
    const item = discoveryItems.find(entry => entry.id === state.selected);
    return state.studio.customImage || item?.previewUrl || images.brandDefault;
  }

  function makeStudioPreview(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#f2f4f6';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .82));
      };
      image.onerror = reject;
      image.src = source;
    });
  }

  function setupStudio() {
    $$('.control-tabs button').forEach(button => button.addEventListener('click', () => {
      $$('.control-tabs button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      $$('.control-pane').forEach(pane => pane.classList.toggle('active', pane.dataset.controlPane === button.dataset.controlTab));
    }));

    $$('[data-format]').forEach(button => button.addEventListener('click', () => {
      $$('[data-format]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.studio.format = button.dataset.format;
      applyStudioState();
    }));
    $$('[data-layout]').forEach(button => button.addEventListener('click', () => {
      $$('[data-layout]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.studio.layout = button.dataset.layout;
      applyStudioState();
    }));
    $$('.color-swatch').forEach(button => button.addEventListener('click', () => {
      $$('.color-swatch').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.studio.color = button.dataset.color;
      applyStudioState();
    }));
    $$('[data-align]').forEach(button => button.addEventListener('click', () => {
      $$('[data-align]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.studio.align = button.dataset.align;
      applyStudioState();
    }));

    const hookInput = $('#hookInput');
    const captionInput = $('#captionInput');
    hookInput.addEventListener('input', () => {
      $('#hookCount').textContent = hookInput.value.length;
      $('#canvasHook').textContent = hookInput.value || '첫 문장을 입력하세요';
      saveStudioText();
    });
    captionInput.addEventListener('input', () => { $('#captionCount').textContent = captionInput.value.length; saveStudioText(); });

    $('#generateHook').addEventListener('click', () => {
      const hooks = ['스크롤을 멈춘 건, 단 하나의 장면이었습니다.', '오래 기억되는 브랜드에는 이유가 있습니다.', '더 많이 보여주지 않아도, 더 선명할 수 있습니다.', '사람들이 저장하는 장면은 따로 있습니다.'];
      hookInput.value = hooks[Math.floor(Math.random() * hooks.length)];
      hookInput.dispatchEvent(new Event('input'));
      showToast('데모 훅을 만들었어요', '브랜드 톤을 반영한 샘플 문장입니다.');
    });

    $('#generateCopy').addEventListener('click', () => {
      const copyByTone = {
        confident: '좋은 브랜드는 더 많이 말하지 않습니다.\n단 하나의 선명한 장면으로 오래 기억됩니다.\n\n우리만의 헤리티지를 지금의 감각으로 다시 보여주세요.\n\n#브랜드헤리티지 #브랜드콘텐츠 #1CLUB',
        warm: '어떤 장면은 오래 마음에 남습니다.\n우리가 지나온 시간과 앞으로 만들 이야기를, 한 장면에 정성스럽게 담았어요.\n\n당신이 기억하는 우리의 순간은 무엇인가요?\n\n#브랜드스토리 #함께만든시간 #1CLUB',
        witty: '설명은 짧게, 기억은 길게.\n브랜드의 10년을 한 장면에 꾹 눌러 담았습니다.\n\n저장해두고 다음 콘텐츠 만들 때 슬쩍 꺼내보세요.\n\n#콘텐츠레퍼런스 #브랜드한스푼 #1CLUB',
        premium: '시간이 쌓여 태도가 됩니다.\n본질만 남긴 한 장면에 우리의 기준을 담았습니다.\n\nThe heritage, reimagined.\n\n#BrandHeritage #QuietConfidence #1CLUB'
      };
      const button = $('#generateCopy');
      button.disabled = true;
      button.innerHTML = '<span class="loading-dot"></span> 생성 중';
      window.setTimeout(() => {
        captionInput.value = copyByTone[$('#toneSelect').value];
        captionInput.dispatchEvent(new Event('input'));
        button.disabled = false;
        button.innerHTML = '<svg><use href="#i-spark"/></svg>AI 카피 생성';
        showToast('데모 카피를 만들었어요', '실제 AI 호출 없이 준비된 샘플을 적용했습니다.');
      }, 650);
    });

    $('#zoomOut').addEventListener('click', () => { state.studio.zoom = Math.max(60, state.studio.zoom - 10); applyStudioState(); });
    $('#zoomIn').addEventListener('click', () => { state.studio.zoom = Math.min(110, state.studio.zoom + 10); applyStudioState(); });
    $('#previewThemeButton').addEventListener('click', () => $('#canvasStage').classList.toggle('preview-dark'));
    const localImageInput = $('#localImageInput');
    $('#mockUpload').addEventListener('click', () => localImageInput.click());
    localImageInput.addEventListener('change', () => {
      const file = localImageInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일을 선택해주세요', '영상은 정적 데모에서 프레임 추출을 지원하지 않습니다.', false);
        localImageInput.value = '';
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        showToast('12MB 이하 이미지를 선택해주세요', '브라우저 프리뷰를 위한 데모 제한입니다.', false);
        localImageInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', async () => {
        const canvasVideo = $('.canvas-video');
        if (canvasVideo) { canvasVideo.pause(); canvasVideo.hidden = true; }
        $('.canvas-image').style.backgroundImage = `url('${reader.result}')`;
        try {
          state.studio.customImage = await makeStudioPreview(reader.result);
          saveJSON(STORAGE.studio, state.studio);
        } catch { /* the full local preview still remains available for this session */ }
        showToast('로컬 이미지를 적용했어요', '파일은 외부로 전송되지 않고 프리뷰와 데모 예약에만 사용됩니다.');
      });
      reader.readAsDataURL(file);
    });
    $('.canvas-tip button').addEventListener('click', () => {
      state.studio.layout = 'center';
      applyStudioState();
      $$('.control-tabs button').find(button => button.dataset.controlTab === 'design')?.click();
      showToast('AI 제안을 적용했어요', '핵심 오브제가 중앙에 오도록 레이아웃을 바꿨어요.');
    });
    $('#sendToPublish').addEventListener('click', () => openScheduleModal());

    const savedText = readJSON('pulse.studioText', null);
    if (savedText) {
      hookInput.value = savedText.hook || hookInput.value;
      /* 구버전 저장분의 리터럴 \n 문자열을 실제 줄바꿈으로 정리 */
      captionInput.value = (savedText.caption || captionInput.value).replace(/\\n/g, '\n');
      $('#toneSelect').value = savedText.tone || 'confident';
    }
    $('#toneSelect').addEventListener('change', saveStudioText);
    hookInput.dispatchEvent(new Event('input'));
    captionInput.dispatchEvent(new Event('input'));
    applyStudioState();
  }

  function saveStudioText() {
    saveJSON('pulse.studioText', { hook: $('#hookInput').value, caption: $('#captionInput').value, tone: $('#toneSelect').value });
  }

  function applyStudioState() {
    const canvas = $('#socialCanvas');
    canvas.classList.toggle('feed-format', state.studio.format === 'feed');
    canvas.classList.toggle('reel-format', state.studio.format === 'reel');
    canvas.classList.remove('layout-editorial', 'layout-center', 'layout-minimal', 'align-left', 'align-center');
    canvas.classList.add(`layout-${state.studio.layout}`, `align-${state.studio.align}`);
    canvas.style.setProperty('--accent', state.studio.color);
    canvas.style.setProperty('--canvas-scale', state.studio.zoom / 80);
    $('#zoomValue').textContent = `${state.studio.zoom}%`;
    $$('[data-format]').forEach(button => button.classList.toggle('active', button.dataset.format === state.studio.format));
    $$('[data-layout]').forEach(button => button.classList.toggle('active', button.dataset.layout === state.studio.layout));
    $$('.color-swatch').forEach(button => button.classList.toggle('active', button.dataset.color === state.studio.color));
    $$('[data-align]').forEach(button => button.classList.toggle('active', button.dataset.align === state.studio.align));
    applyBrandLogos();
    saveJSON(STORAGE.studio, state.studio);
  }

  function setupModals() {
    $$('[data-open]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.open)));
    $$('.modal').forEach(dialog => {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close('cancel');
      });
    });
    $$('.integration').forEach(button => button.addEventListener('click', () => {
      showToast('연동 설정 데모', '실제 OAuth 연결을 시작하지 않았습니다.');
    }));
  }

  function openModal(id) {
    const dialog = document.getElementById(id);
    if (dialog && !dialog.open) dialog.showModal();
  }

  function setupSources() {
    updateSourceCount();
    renderUserSources();
    $('#sourceForm').addEventListener('submit', event => {
      if (event.submitter?.value === 'cancel') return;
      event.preventDefault();
      const form = $('#sourceForm');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      state.sources.push({ id: Date.now(), platform: data.get('platform'), handle: data.get('handle'), group: data.get('group'), status: 'Demo' });
      saveJSON(STORAGE.sources, state.sources);
      updateSourceCount();
      renderUserSources();
      form.reset();
      $('#sourceModal').close();
      showToast('타겟 소스를 추가했어요', '이 브라우저에 Demo 상태로 저장됐습니다.');
    });
  }

  function updateSourceCount() {
    const baseCreators = new Set(discoveryItems.map(item => item.creator)).size;
    const count = baseCreators + state.sources.length;
    $('#sourceSummary').innerHTML = `<b>${count}</b>개 계정`;
  }

  function renderUserSources() {
    const wrap = $('#userSourcesWrap');
    wrap.hidden = state.sources.length === 0;
    $('#userSourceCount').textContent = state.sources.length;
    $('#userSourceList').innerHTML = state.sources.map(source => `
      <div class="user-source-item">
        <span class="channel-logo ${platformClass(source.platform)}">${escapeHTML(source.platform.slice(0, 2).toUpperCase())}</span>
        <p><b>${escapeHTML(source.handle)}</b><small>${escapeHTML(source.platform)} · ${escapeHTML(source.group)} · Demo</small></p>
        <button type="button" class="icon-btn" data-remove-source="${source.id}" aria-label="${escapeHTML(source.handle)} 삭제"><svg><use href="#i-x"/></svg></button>
      </div>`).join('');
    $$('[data-remove-source]').forEach(button => button.addEventListener('click', () => {
      state.sources = state.sources.filter(source => source.id !== Number(button.dataset.removeSource));
      saveJSON(STORAGE.sources, state.sources);
      updateSourceCount();
      renderUserSources();
      showToast('타겟 소스를 삭제했어요', '브라우저의 Demo 목록에서 제거했습니다.');
    }));
  }

  function setupTasks() {
    const saved = readJSON(STORAGE.tasks, [true, false, false]);
    $$('.task input').forEach((input, index) => {
      input.checked = Boolean(saved[index]);
      input.closest('.task').classList.toggle('done', input.checked);
      input.addEventListener('change', () => {
        input.closest('.task').classList.toggle('done', input.checked);
        saveJSON(STORAGE.tasks, $$('.task input').map(item => item.checked));
      });
    });
  }

  function setupPublishing() {
    $('#newSchedule').addEventListener('click', openScheduleModal);
    $('#scheduleForm').addEventListener('submit', event => {
      if (event.submitter?.value === 'cancel') return;
      event.preventDefault();
      const form = $('#scheduleForm');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const channels = data.getAll('channel');
      if (!channels.length) { showToast('채널을 선택해주세요', '데모 예약에 사용할 채널이 필요해요.', false); return; }
      state.queue.unshift({
        id: Date.now(), title: $('#hookInput').value.trim().slice(0, 50) || data.get('caption').split('\n')[0].slice(0, 50) || '새 콘텐츠', channels,
        platform: channels[0], date: data.get('date'), time: data.get('time'), format: state.studio.format === 'reel' ? '릴스' : '피드',
        image: selectedStudioThumb(), demo: true,
        creative: {
          sourceId: state.selected, layout: state.studio.layout, color: state.studio.color, align: state.studio.align,
          hook: $('#hookInput').value, caption: data.get('caption'), tone: $('#toneSelect').value
        }
      });
      saveJSON(STORAGE.queue, state.queue);
      $('#scheduleModal').close();
      renderQueue();
      renderCalendar();
      updateQueueCounts();
      showToast('데모 예약을 저장했어요', '실제 채널에는 발행되지 않습니다.');
    });
    $('#prevWeek').addEventListener('click', () => { state.weekOffset -= 1; renderCalendar(); });
    $('#nextWeek').addEventListener('click', () => { state.weekOffset += 1; renderCalendar(); });
    $('#todayButton').addEventListener('click', () => { state.weekOffset = 0; renderCalendar(); });
    renderQueue();
    renderCalendar();
    updateQueueCounts();
  }

  function openScheduleModal() {
    const form = $('#scheduleForm');
    form.elements.date.value = dateFromToday(1);
    form.elements.time.value = '19:00';
    form.elements.caption.value = $('#captionInput').value;
    $('.media-preview-small > div').style.backgroundImage = `url('${selectedStudioThumb()}')`;
    $('.media-preview-small small').textContent = state.studio.format === 'reel' ? '1080 × 1920 · 릴스' : '1080 × 1350 · 피드';
    openModal('scheduleModal');
  }

  function renderQueue() {
    const container = $('#publishQueue');
    if (!state.queue.length) {
      container.innerHTML = '<div class="empty-state"><h3>대기 중인 데모 예약이 없어요</h3><p>Studio에서 콘텐츠를 만들어 추가해보세요.</p></div>';
      return;
    }
    container.innerHTML = state.queue.map(item => `
      <article class="queue-item">
        <div class="queue-thumb" style="background-image:url('${item.image}')"></div>
        <div class="queue-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.channels.join(' · '))} · ${escapeHTML(item.date)} ${escapeHTML(item.time)}</span><em>데모 예약 · ${escapeHTML(item.format)}</em></div>
        <button class="icon-btn queue-delete" data-delete-queue="${item.id}" aria-label="데모 예약 삭제"><svg><use href="#i-more"/></svg></button>
      </article>`).join('');
    $$('[data-delete-queue]').forEach(button => button.addEventListener('click', () => {
      state.queue = state.queue.filter(item => item.id !== Number(button.dataset.deleteQueue));
      saveJSON(STORAGE.queue, state.queue);
      renderQueue(); renderCalendar(); updateQueueCounts();
      showToast('데모 예약을 삭제했어요', '실제 채널에는 변경이 없습니다.');
    }));
  }

  function updateQueueCounts() {
    const count = state.queue.length;
    $('#queueNavCount').textContent = count;
    $('#queueCountPill').textContent = `${count}건 · Demo`;
    $('#overviewQueueCount').innerHTML = `${count}<small>건</small>`;
  }

  function renderCalendar() {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() + state.weekOffset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    $('#calendarTitle').textContent = start.getMonth() === end.getMonth()
      ? `${start.getFullYear()}년 ${start.getMonth() + 1}월`
      : `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    $('#weekGrid').innerHTML = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const iso = localISO(date);
      const events = state.queue.filter(item => item.date === iso);
      return `<div class="week-day ${iso === localISO(new Date()) ? 'today' : ''}"><div class="week-day-head">${dayNames[date.getDay()]}<b>${date.getDate()}</b></div>${events.map(event => `<button class="calendar-event" style="--event-color:${event.platform.includes('Instagram') ? '#df456d' : event.platform.includes('YouTube') ? '#ff1d25' : '#3182f6'}"><small>${escapeHTML(event.time)} · DEMO</small><b>${escapeHTML(event.title)}</b></button>`).join('')}</div>`;
    }).join('');
  }

  function renderAnalyticsTable() {
    const top = [...discoveryItems].sort((a, b) => b.views - a.views).slice(0, 5);
    $('#analyticsTable').innerHTML = top.map(item => `
      <tr><td><div class="content-cell"><i style="${item.image ? `background-image:url('${item.image}')` : 'background:linear-gradient(135deg,#2768ff,#725cff)'}"></i><span><strong>${escapeHTML(item.title)}</strong></span></div></td><td>${escapeHTML(item.creator)}</td><td>${escapeHTML(item.age)}</td><td><strong>${formatNumber(item.views)}</strong></td><td>${escapeHTML(item.badge)}</td><td>${escapeHTML(item.metricLabel)} ${formatMetric(item.metricValue)}</td><td><span class="performance-tag">Viral ${item.score}</span></td></tr>`).join('');
  }

  function setupAds() {
    $('#createCampaign').addEventListener('click', () => openModal('campaignModal'));
    $('#boostPost').addEventListener('click', () => openModal('campaignModal'));
    $('#campaignForm').addEventListener('submit', event => {
      if (event.submitter?.value === 'cancel') return;
      event.preventDefault();
      const form = $('#campaignForm');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      state.campaigns.unshift({ id: Date.now(), name: data.get('name'), goal: data.get('goal'), budget: Number(data.get('budget')), spend: '₩0', result: '—', roas: '—', status: '광고 초안' });
      saveJSON(STORAGE.campaigns, state.campaigns);
      renderCampaigns();
      $('#campaignModal').close();
      showToast('광고 초안을 저장했어요', '실제 광고 계정에는 생성되거나 집행되지 않습니다.');
    });
    renderCampaigns();
  }

  function renderCampaigns() {
    $('#campaignList').innerHTML = state.campaigns.map(campaign => `
      <article class="campaign-item">
        <span class="campaign-icon"><svg><use href="#i-megaphone"/></svg></span>
        <span class="campaign-title"><strong>${escapeHTML(campaign.name)}</strong><span>${escapeHTML(campaign.goal)} · 일 ₩${Number(campaign.budget).toLocaleString('ko-KR')}</span></span>
        <span class="campaign-stat"><small>사용 금액</small><b>${escapeHTML(campaign.spend)}</b></span>
        <span class="campaign-stat"><small>결과</small><b>${escapeHTML(campaign.result)}</b></span>
        <span class="campaign-stat"><small>ROAS</small><b>${escapeHTML(campaign.roas)}</b></span>
        <button class="icon-btn" aria-label="캠페인 메뉴" title="${escapeHTML(campaign.status)}"><svg><use href="#i-more"/></svg></button>
      </article>`).join('');
  }

  let toastTimer;
  function showToast(title, message, success = true) {
    const toast = $('#toast');
    $('#toastTitle').textContent = title;
    $('#toastMessage').textContent = message;
    toast.querySelector('span').style.background = success ? '#20b58b' : '#f65b58';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
  }

  function init() {
    $('#todayLabel').textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()).replace(/ (.)요일$/, ' · $1요일');
    setupTheme();
    setupNavigation();
    setupDiscoveryFilters();
    setupDiscoveryDetail();
    setupStudio();
    setupModals();
    setupSources();
    setupTasks();
    setupPublishing();
    setupAds();
    renderDiscovery();
    renderOverviewSignals();
    renderAnalyticsTable();
    updateStudioReference();
    const totalCount = $('#discoveryTotalCount');
    if (totalCount) totalCount.textContent = discoveryItems.length;
    const navCount = $('#discoveryNavCount');
    if (navCount) navCount.textContent = discoveryItems.length;
    if (window.TRENDING_FETCHED_AT) {
      const stamp = window.TRENDING_FETCHED_AT;
      const topbar = $('#topbarFetchedAt');
      if (topbar) topbar.textContent = `${stamp} 수집 · TikTok CC · Douyin 热点榜 · KR 해시태그`;
      const label = $('#fetchedAtLabel');
      if (label) label.textContent = `${stamp} 수집 스냅샷`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
