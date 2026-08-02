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

  const discoveryItems = [
    { id: 1, platform: 'Instagram', creator: '@atelier.seoul', avatar: 'AT', title: '제품 하나만 남겼더니 저장률이 3배 오른 비주얼', velocity: 428, score: 96, views: 884000, likes: 68200, age: '12분 전', image: images.object, source: '공개 프로필 샘플' },
    { id: 2, platform: 'Douyin', creator: '@新消费研究所', avatar: 'DY', title: '0.5초마다 장면을 전환하는 제품 언박싱 구조', velocity: 391, score: 94, views: 2100000, likes: 148000, age: '18분 전', image: images.skincare, source: '데이터 파트너 샘플' },
    { id: 3, platform: 'TikTok', creator: '@mono.objects', avatar: 'MO', title: '말 없이 손의 움직임만으로 완주율을 만든 영상', velocity: 356, score: 92, views: 1260000, likes: 93400, age: '23분 전', image: images.coffee, source: '공개 트렌드 샘플' },
    { id: 4, platform: 'YouTube Shorts', creator: '@branddecoded', avatar: 'BD', title: '30년 브랜드 역사를 18초로 압축한 타임라인', velocity: 318, score: 91, views: 754000, likes: 51800, age: '31분 전', image: images.architecture, source: '공개 채널 샘플' },
    { id: 5, platform: 'Instagram', creator: '@quiet.luxury.lab', avatar: 'QL', title: '텍스트를 7단어로 줄인 프리미엄 브랜드 릴스', velocity: 286, score: 89, views: 612000, likes: 46700, age: '36분 전', image: images.portrait, source: '공개 프로필 샘플' },
    { id: 6, platform: 'TikTok', creator: '@wearitdaily', avatar: 'WD', title: '같은 옷을 7일간 입어본 리얼 후기 포맷', velocity: 264, score: 88, views: 982000, likes: 77100, age: '42분 전', image: images.fashion, source: '공개 트렌드 샘플' },
    { id: 7, platform: 'Douyin', creator: '@品牌美学志', avatar: '美', title: '하나의 컬러만 반복해 기억점을 만든 캠페인', velocity: 239, score: 86, views: 1680000, likes: 121000, age: '48분 전', image: images.beauty, source: '데이터 파트너 샘플' },
    { id: 8, platform: 'YouTube Shorts', creator: '@workbetter', avatar: 'WB', title: '전후 비교를 첫 화면에 배치한 생산성 쇼츠', velocity: 218, score: 85, views: 546000, likes: 39800, age: '54분 전', image: images.tech, source: '공개 채널 샘플' },
    { id: 9, platform: 'Instagram', creator: '@slowtable', avatar: 'ST', title: '레시피보다 분위기를 먼저 보여준 푸드 콘텐츠', velocity: 196, score: 83, views: 438000, likes: 34600, age: '1시간 전', image: images.food, source: '공개 프로필 샘플' },
    { id: 10, platform: 'TikTok', creator: '@breathwork.club', avatar: 'BC', title: '시청자가 함께 따라 하게 만드는 15초 루틴', velocity: 174, score: 82, views: 726000, likes: 54200, age: '1시간 전', image: images.wellness, source: '공개 트렌드 샘플' },
    { id: 11, platform: 'Instagram', creator: '@stay.somewhere', avatar: 'SS', title: '여행지를 사람 대신 소리로 소개한 감각적 릴스', velocity: 151, score: 80, views: 391000, likes: 29700, age: '1시간 전', image: images.travel, source: '공개 프로필 샘플' },
    { id: 12, platform: 'YouTube Shorts', creator: '@design.minute', avatar: 'DM', title: '공간의 핵심 디테일 하나만 설명하는 20초 포맷', velocity: 134, score: 78, views: 318000, likes: 22400, age: '2시간 전', image: images.interior, source: '공개 채널 샘플' }
  ];

  /* 정적 데모의 가상 계정에는 플랫폼 원문 URL을 꾸며 넣지 않는다. 실제 연동 데이터만 originalUrl을 가진다. */
  discoveryItems.forEach(item => {
    Object.assign(item, {
      mode: 'demo',
      mediaType: 'image',
      previewUrl: item.image,
      originalUrl: null,
      assetUrl: item.image,
      rightsStatus: 'reference-only'
    });
  });

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

  function renderDiscovery() {
    let list = [...discoveryItems];
    if (state.platform !== 'all') list = list.filter(item => item.platform === state.platform);
    if (state.query) {
      const query = state.query.toLocaleLowerCase('ko');
      list = list.filter(item => `${item.title} ${item.creator} ${item.platform}`.toLocaleLowerCase('ko').includes(query));
    }
    list.sort((a, b) => {
      if (state.sort === 'velocity') return b.velocity - a.velocity;
      if (state.sort === 'views') return b.views - a.views;
      return b.score - a.score;
    });

    $('#resultCount').textContent = list.length;
    $('#discoveryEmpty').hidden = list.length > 0;
    $('#discoveryGrid').innerHTML = list.map(item => {
      const cls = platformClass(item.platform);
      return `
        <article class="discovery-card" data-id="${item.id}">
          <div class="discovery-media" style="background-image:url('${item.image}')" tabindex="0" role="button" aria-label="${escapeHTML(item.title)} 원본 보기">
            <span class="card-platform"><i class="${cls}"></i>${escapeHTML(item.platform)}</span>
            <span class="viral-badge"><span>VIRAL</span><b>${item.score}</b></span>
            <span class="velocity-badge"><svg><use href="#i-bolt"/></svg>+${item.velocity}/분</span>
            <span class="play-button"><svg><use href="#i-play"/></svg></span>
          </div>
          <div class="discovery-body">
            <div class="creator-row"><span class="creator-avatar">${item.avatar}</span><b>${escapeHTML(item.creator)}</b><span>· ${item.age}</span></div>
            <h3>${escapeHTML(item.title)}</h3>
            <div class="card-stats"><span><svg><use href="#i-play"/></svg>${formatNumber(item.views)}</span><span><svg><use href="#i-heart"/></svg>${formatNumber(item.likes)}</span><span><svg><use href="#i-trend"/></svg>${((item.likes / item.views) * 100).toFixed(1)}%</span></div>
            <div class="source-badges"><span class="source-badge snapshot">1분 snapshot 차분</span><span class="source-badge">10분 관측</span><span class="source-badge">방금 전 갱신</span><span class="source-badge">${escapeHTML(item.source)}</span><span class="source-badge rights">권리 확인 필요</span></div>
            <div class="card-actions">
              <button class="card-original"><svg><use href="#i-play"/></svg>원본 보기</button>
              <button class="card-action"><svg><use href="#i-edit"/></svg>Studio에서 만들기</button>
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
    $('#overviewSignals').innerHTML = discoveryItems.slice(0, 4).map(item => `
      <button class="signal-item" data-signal-id="${item.id}">
        <span class="signal-thumb" style="background-image:url('${item.image}')"></span>
        <span class="signal-item-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.platform)} · ${escapeHTML(item.creator)}</span></span>
        <span class="velocity"><b>+${item.velocity}/분</b><small>좋아요 증가</small></span>
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
    saveJSON(STORAGE.studio, state.studio);
    updateStudioReference();
    showView('studio');
    showToast('Studio로 가져왔어요', '원본을 재사용하지 않고 구조와 아이디어만 참고합니다.');
  }

  function openDiscoveryDetail(id) {
    const item = discoveryItems.find(entry => entry.id === id);
    if (!item) return;
    state.detailId = id;
    const cls = platformClass(item.platform);
    $('#originalPreview').style.backgroundImage = `url('${item.previewUrl}')`;
    $('#originalPreview').classList.toggle('is-video', item.mediaType === 'video');
    $('#originalPlatform').innerHTML = `<i class="${cls}"></i>${escapeHTML(item.platform)}`;
    $('#originalStatus').textContent = item.mode === 'live' ? 'LIVE SOURCE' : 'DEMO SAMPLE';
    $('#originalStatus').classList.toggle('live', item.mode === 'live');
    $('#originalAvatar').textContent = item.avatar;
    $('#originalCreator').textContent = item.creator;
    $('#originalAge').textContent = `· ${item.age}`;
    $('#originalContentTitle').textContent = item.title;
    $('#originalViews').textContent = formatNumber(item.views);
    $('#originalLikes').textContent = formatNumber(item.likes);
    $('#originalVelocity').textContent = `+${item.velocity}/분`;
    $('#originalScore').textContent = item.score;
    $('#originalSource').textContent = item.source;
    $('#originalRightsCopy').textContent = item.mode === 'live'
      ? '수집된 원문 링크입니다. 제작 전 저작권과 플랫폼 정책을 확인하세요.'
      : '실제 플랫폼 게시물이 아닌 UI 시연용 샘플입니다. 아래 링크는 샘플 이미지 출처로 연결됩니다.';
    const external = $('#originalExternalLink');
    const href = item.originalUrl || item.assetUrl;
    external.hidden = !href;
    if (href) external.href = href;
    $('span', external).textContent = item.originalUrl ? '플랫폼 원본 콘텐츠 보기' : '샘플 원본 이미지 보기';
    const dialog = $('#discoveryDetailModal');
    if (!dialog.open) dialog.showModal();
  }

  function setupDiscoveryDetail() {
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
      $('#inspirationThumb').style.backgroundImage = `url('${item.image}')`;
      $('#inspirationTitle').textContent = item.title;
      $('#inspirationMeta').textContent = `Viral ${item.score} · +${item.velocity}/분 · ${item.platform} · 구조 분석용`;
      $('#viewOriginalReference').hidden = false;
    } else {
      $('#viewOriginalReference').hidden = true;
    }
    /* 레퍼런스 원본은 작은 참고 썸네일에만 두고 제작 캔버스에는 재사용하지 않는다. */
    const previewImage = state.studio.customImage || images.brandDefault;
    $('.canvas-image').style.backgroundImage = `url('${previewImage}')`;
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
      captionInput.value = savedText.caption || captionInput.value;
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
    const count = 8 + state.sources.length;
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
        image: state.studio.customImage || images.brandDefault, demo: true,
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
    $('.media-preview-small > div').style.backgroundImage = `url('${state.studio.customImage || images.brandDefault}')`;
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
    $('#analyticsTable').innerHTML = discoveryItems.slice(0, 5).map((item, index) => `
      <tr><td><div class="content-cell"><i style="background-image:url('${item.image}')"></i><span><strong>${escapeHTML(item.title)}</strong></span></div></td><td>${escapeHTML(item.platform)}</td><td>2026.07.${28 - index}</td><td><strong>${formatNumber(item.views)}</strong></td><td>${(8.9 - index * .4).toFixed(1)}%</td><td>${formatNumber(Math.round(item.likes * .22))}</td><td><span class="performance-tag">상위 ${6 + index * 3}%</span></td></tr>`).join('');
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
  }

  document.addEventListener('DOMContentLoaded', init);
})();
