/* ============================================================
   四中校园墙 · 前端
   零依赖，原生 JS；数据全部来自本地 Python 服务
   ============================================================ */

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
  const fmt = (n) => n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
    : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);

  /* ---------------------------------------------------------- 图标 */

  const ICONS = {
    discover: '<circle cx="12" cy="12" r="9"/><path d="M15.4 8.6l-2.2 5.2-5.2 2.2 2.2-5.2z"/>',
    follow: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.6c0-3.3 2.7-5.1 6-5.1s6 1.8 6 5.1"/><path d="M16.2 5.4a3.3 3.3 0 010 5.2"/><path d="M18.4 14.9c1.9.7 2.9 2.3 2.9 4.7"/>',
    message: '<path d="M21 11.6a8.4 8.4 0 01-9 8.4 9.4 9.4 0 01-3.4-.6L3 21l1.7-4.6A8.2 8.2 0 013.6 11.6 8.4 8.4 0 0112 3.2a8.4 8.4 0 019 8.4z"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="M16 16l4.6 4.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    heart: '<path d="M12 20.4S3.8 15.3 3.8 9.9A4.2 4.2 0 0112 7.6a4.2 4.2 0 018.2 2.3c0 5.4-8.2 10.5-8.2 10.5z"/>',
    heartFill: '<path d="M12 20.4S3.8 15.3 3.8 9.9A4.2 4.2 0 0112 7.6a4.2 4.2 0 018.2 2.3c0 5.4-8.2 10.5-8.2 10.5z" fill="currentColor" stroke="none"/>',
    comment: '<path d="M20.4 11.6a8 8 0 01-8.6 8 9 9 0 01-3.2-.6L3.6 20.4l1.6-4.4a7.9 7.9 0 01-1.4-4.4 8 8 0 018.6-8 8 8 0 018 8z"/>',
    share: '<path d="M12 15V4M12 4L8.5 7.5M12 4l3.5 3.5"/><path d="M5 13v5.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V13"/>',
    chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    bell: '<path d="M18 9a6 6 0 10-12 0c0 6-2.6 6.6-2.6 8.4h17.2C20.6 15.6 18 15 18 9z"/><path d="M10.4 20.6a1.7 1.7 0 003.2 0"/>',
    moon: '<path d="M20.6 13.4A8.6 8.6 0 1110.6 3.4a6.8 6.8 0 0010 10z"/>',
    shield: '<path d="M12 3.2l7 3v5.7c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9V6.2z"/><path d="M9.2 12l2 2 3.6-3.8"/>',
    help: '<circle cx="12" cy="12" r="8.8"/><path d="M9.6 9.4a2.5 2.5 0 014.9.6c0 1.7-2.5 2-2.5 3.8"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.4"/><circle cx="12" cy="7.9" r=".95" fill="currentColor" stroke="none"/>',
    bookmark: '<path d="M6.4 4h11.2v16.2L12 16.4l-5.6 3.8z"/>',
    file: '<path d="M14 3.4H7.4A1.9 1.9 0 005.5 5.3v13.4a1.9 1.9 0 001.9 1.9h9.2a1.9 1.9 0 001.9-1.9V8z"/><path d="M14 3.4V8h4.5"/><path d="M9 12h6M9 15.5h4"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.2V12l3 1.9"/>',
    send: '<path d="M20.5 3.5L3.8 10.2l6 2.3 2.3 6z"/><path d="M20.5 3.5l-10.7 9"/>',
    image: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.4"/><circle cx="8.6" cy="9.4" r="1.5"/><path d="M20.6 15.4l-4.8-4.8-8 8"/>',
    emoji: '<circle cx="12" cy="12" r="8.8"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M8.6 14.2a4 4 0 006.8 0"/>',
    flame: '<path d="M12 3.2c2.9 3.7 4.8 5.8 4.8 8.8a4.8 4.8 0 01-9.6 0c0-2 .9-3.4 2-4.9.4 1.4 1.4 2 2 2 .4-1.9.8-3.9.8-5.9z"/>',
    pin: '<path d="M9.4 4h5.2l-.8 5.2 2.6 2.6H7.6l2.6-2.6z"/><path d="M12 11.8V20"/>',
    check: '<path d="M5 12.8l4.2 4.2L19 6.8"/>',
    checkCheck: '<path d="M2.8 12.6l4 4L14.6 9"/><path d="M9.6 15.4l1.2 1.2L22 5.6"/>',
    edit: '<path d="M4 20h4.2L19 9.2l-4.2-4.2L4 15.8z"/><path d="M13.4 6.4l4.2 4.2"/>',
    hash: '<path d="M9.4 4L7.8 20M16.2 4l-1.6 16M4.4 9.2h15.4M3.6 14.8h15.4"/>',
  };

  function icon(name, size = 22, sw = 1.8) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  /* ---------------------------------------------------------- 全局状态 */

  const TABS = [
    { id: 'discover', label: '发现', icon: 'discover' },
    { id: 'follow', label: '关注', icon: 'follow' },
    { id: 'messages', label: '消息', icon: 'message' },
    { id: 'profile', label: '个人', icon: 'user' },
  ];

  const S = {
    state: null,
    route: { name: 'discover', id: null },
    settings: { dark: false, notify: true },
    scroll: { discover: 0, follow: 0, messages: 0, profile: 0 },
    compose: { topicId: 9, text: '' },
    token: 0,
    loaded: false,
  };

  const SETTINGS_KEY = 'sz_wall_settings_v1';
  const DEVICE_KEY = 'sz_wall_device_v2';

  let DEVICE = '';
  try { DEVICE = localStorage.getItem(DEVICE_KEY) || ''; } catch (e) { DEVICE = ''; }

  function saveDevice(id) {
    DEVICE = id;
    try { localStorage.setItem(DEVICE_KEY, id); } catch (e) {}
  }
  function clearDevice() {
    DEVICE = '';
    try { localStorage.removeItem(DEVICE_KEY); } catch (e) {}
  }
  function newDeviceId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    const buf = new Uint8Array(16);
    try { crypto.getRandomValues(buf); } catch (e) {
      for (let i = 0; i < 16; i++) buf[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function loadSettings() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch (e) { saved = null; }
    if (saved && typeof saved === 'object') {
      if (typeof saved.dark === 'boolean') S.settings.dark = saved.dark;
      if (typeof saved.notify === 'boolean') S.settings.notify = saved.notify;
    } else {
      try { S.settings.dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
    }
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S.settings)); } catch (e) {}
  }
  function applyTheme() {
    document.documentElement.dataset.theme = S.settings.dark ? 'dark' : 'light';
    const meta = $('#themeColor');
    if (meta) meta.setAttribute('content', S.settings.dark ? '#0D0E11' : '#F4F5F7');
  }

  /* ---------------------------------------------------------- 接口 */

  async function api(path, { method = 'GET', body } = {}) {
    let res;
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (DEVICE) headers['X-Device'] = DEVICE;
    try {
      res = await fetch('/api' + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch (e) {
      throw new Error('连不上服务器，检查一下网络');
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((data && (data.message || data.error)) || '出错了，稍后再试');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ---------------------------------------------------------- 提示 / 弹层 */

  function toast(msg) {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function openSheet(html, onMount) {
    const layer = document.createElement('div');
    layer.className = 'sheet-layer';
    layer.innerHTML = `<div class="scrim" data-action="close-sheet"></div><div class="sheet">${html}</div>`;
    $('#layers').appendChild(layer);
    if (onMount) onMount(layer);
    return layer;
  }
  function closeSheet() {
    const layer = $('.sheet-layer');
    if (layer) layer.remove();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) {}
      ta.remove();
      return ok;
    }
  }

  /* ---------------------------------------------------------- 渲染基础 */

  function avatar(user, size = 40, extra = '') {
    const ch = (user.name || '?').trim().charAt(0);
    const st = `width:${size}px;height:${size}px;font-size:${Math.round(size * .4)}px;--a:${user.colorA || '#FF8A5C'};--b:${user.colorB || '#FF4D6D'}`;
    return `<span class="avatar ${extra}" style="${st}"><span>${esc(ch)}</span></span>`;
  }

  function emptyBlock(iconName, title, text) {
    return `<div class="empty"><div class="empty-icon">${icon(iconName, 26, 1.6)}</div><div class="empty-title">${title}</div><div class="empty-text">${text}</div></div>`;
  }

  function artBlock(kind) {
    if (!kind) return '';
    const cls = kind === 'spring' ? 'art-spring' : 'art-moon';
    return `<div class="art ${cls}" role="img" aria-label="帖子配图"></div>`;
  }

  function likeButton(p, cls = 'foot-btn') {
    return `<button class="${cls} ${p.liked ? 'liked' : ''}" data-action="like" data-id="${p.id}" aria-pressed="${p.liked}" aria-label="点赞">
      <span class="heart">${icon(p.liked ? 'heartFill' : 'heart', 18)}</span>
      <span class="like-num">${p.likes ? fmt(p.likes) : ''}</span>
    </button>`;
  }

  function postCard(p) {
    const canFollow = !p.author.following && !p.mine;
    return `<article class="post" data-post="${p.id}">
      <div class="post-head">
        ${avatar(p.author, 40, p.author.online ? 'online' : '')}
        <div class="post-meta">
          <div class="name-line">
            <span class="pname">${esc(p.author.name)}</span>
            ${p.author.official ? '<span class="badge-off">官方</span>' : ''}
            ${p.pinned ? `<span class="pin-tag">${icon('pin', 10, 2.2)}置顶</span>` : ''}
          </div>
          <div class="sub">${esc(p.author.grade)} · ${esc(p.time)}</div>
        </div>
        ${canFollow ? `<button class="follow-btn" data-action="follow" data-id="${p.author.id}">${icon('plus', 12, 2.6)}关注</button>` : ''}
      </div>
      <div class="post-text" data-action="open-post" data-id="${p.id}">${nl2br(p.content)}</div>
      ${artBlock(p.art)}
      <button class="tag" data-action="open-topic" data-id="${p.topic.id}">#${esc(p.topic.name)}</button>
      <div class="post-foot">
        ${likeButton(p)}
        <button class="foot-btn" data-action="open-post" data-id="${p.id}" aria-label="评论">
          ${icon('comment', 18)}${p.commentCount ? `<span>${p.commentCount}</span>` : '<span>评论</span>'}
        </button>
        <button class="foot-btn share" data-action="share" data-id="${p.id}" aria-label="分享">${icon('share', 18)}</button>
      </div>
    </article>`;
  }

  function timelineItem(p) {
    return `<article class="tl-item">
      ${avatar(p.author, 40, p.author.online ? 'online' : '')}
      <div class="tl-body">
        <div class="tl-head">
          <span class="tl-name">${esc(p.author.name)}</span>
          <span class="tl-time">${esc(p.time)}</span>
          ${p.pinned ? `<span class="pin-tag">${icon('pin', 10, 2.2)}置顶</span>` : ''}
        </div>
        <div class="tl-text" data-action="open-post" data-id="${p.id}">${nl2br(p.content)}</div>
        ${artBlock(p.art)}
        <button class="tag tl-tag" data-action="open-topic" data-id="${p.topic.id}">#${esc(p.topic.name)}</button>
        <div class="tl-foot">
          ${likeButton(p)}
          <button class="foot-btn" data-action="open-post" data-id="${p.id}">
            ${icon('comment', 17)}${p.commentCount ? `<span>${p.commentCount}</span>` : ''}
          </button>
        </div>
      </div>
    </article>`;
  }

  function chatRow(c) {
    const pinned = c.pinned ? `<span class="pin-mini">${icon('pin', 11, 2.2)}</span>` : '';
    const official = c.peer.official ? '<span class="badge-off">官方</span>' : '';
    return `<button class="chat-row ${c.pinned ? 'pinned' : ''}" data-action="open-chat" data-id="${c.id}">
      ${avatar(c.peer, 48, c.peer.online ? 'online' : '')}
      <div class="chat-main">
        <div class="chat-top">
          <span class="chat-name">${pinned}<span class="nm">${esc(c.peer.name)}</span>${official}</span>
          <span class="chat-time">${esc(c.lastTime)}</span>
        </div>
        <div class="chat-bottom">
          <span class="chat-prev">${c.mine ? '<span class="prefix">我：</span>' : ''}${esc(c.last)}</span>
          ${c.unread ? `<span class="unread">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
        </div>
      </div>
    </button>`;
  }

  /* ---------------------------------------------------------- 底部导航 */

  function renderTabbar() {
    const bar = $('#tabbar');
    bar.innerHTML = TABS.map((t) => `
      <button class="tab" data-action="tab" data-tab="${t.id}" aria-label="${t.label}">
        <span class="tab-ic">${icon(t.icon, 23, 1.9)}</span>
        <span class="tab-lb">${t.label}</span>
        ${t.id === 'messages' ? '<span class="tab-badge" id="tabBadge" hidden></span>' : ''}
      </button>`).join('') + '<span class="tab-pill" id="tabPill"></span>';
  }

  function positionPill(name) {
    const pill = $('#tabPill');
    if (!pill) return;
    const el = $(`.tab[data-tab="${name}"]`);
    if (!el || !el.offsetWidth) return;
    const x = el.offsetLeft + el.offsetWidth / 2 - 23;
    pill.style.transform = `translateX(${x}px)`;
  }

  function syncTabbar(name) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    const unread = S.state ? S.state.unread : 0;
    const badge = $('#tabBadge');
    if (badge) {
      const show = !!S.settings.notify && unread > 0;
      badge.hidden = !show;
      badge.textContent = unread > 99 ? '99+' : String(unread);
    }
    if (!document.body.classList.contains('immersive')) positionPill(name);
  }

  function updateChrome(name) {
    const immersive = !TABS.some((t) => t.id === name);
    document.body.classList.toggle('immersive', immersive);
    const fab = $('#fab');
    if (fab) fab.classList.toggle('hide', immersive || (name !== 'discover' && name !== 'follow'));
    syncTabbar(name);
  }

  /* ---------------------------------------------------------- 路由 */

  function parseHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    const [name, id] = raw.split('/');
    const known = ['discover', 'follow', 'messages', 'profile', 'chat', 'post', 'topic', 'compose', 'my-posts'];
    return { name: known.includes(name) ? name : 'discover', id: id || null };
  }

  function go(hash) {
    if (location.hash === hash) return;
    location.hash = hash;
  }

  function paint(html, opts = {}) {
    const scr = $('#screen');
    const immersive = !!opts.immersive;
    scr.classList.remove('enter');
    scr.className = 'screen' + (immersive ? ' screen--immersive' : '') + ' enter';
    scr.innerHTML = html;
    void scr.offsetWidth;
    const top = opts.bottom ? 99999 : (opts.scroll || 0);
    scr.scrollTop = top;
    if (opts.bottom) {
      const body = $('#chatBody');
      if (body) body.scrollTop = body.scrollHeight;
    }
  }

  async function renderRoute() {
    const token = ++S.token;
    const r = S.route;
    updateChrome(r.name);

    if (!S.state) return;

    if (r.name === 'chat') return renderChat(r.id, token);
    if (r.name === 'post') return renderPost(r.id, token);
    if (r.name === 'compose') return renderCompose();
    if (r.name === 'topic') return renderTopic(r.id);
    if (r.name === 'my-posts') return renderMyPosts();

    const map = { discover: viewDiscover, follow: viewFollow, messages: viewMessages, profile: viewProfile };
    const scroll = S.scroll[r.name] || 0;
    paint(map[r.name](), { scroll });
    bindScreen();
  }

  window.addEventListener('hashchange', () => {
    if (TABS.some((t) => t.id === S.route.name)) S.scroll[S.route.name] = $('#screen').scrollTop || 0;
    S.route = parseHash();
    renderRoute();
  });

  /* ---------------------------------------------------------- 视图：发现 */

  function viewDiscover() {
    const s = S.state;
    const topics = s.topics.filter((t) => t.count > 0);
    return `
    <header class="topbar">
      <div class="brand"><span class="brand-main">四中</span><span class="brand-sub">校园墙</span></div>
      <div class="top-actions">
        <button class="icon-btn" data-action="search" aria-label="搜索">${icon('search', 21)}</button>
      </div>
    </header>
    <section class="topics">
      <div class="sec-head">
        <h2 class="sec-title"><span class="spark">${icon('flame', 16, 2)}</span>正在热议</h2>
        <button class="sec-more" data-action="all-topics">全部话题 ${icon('chevronRight', 13, 2)}</button>
      </div>
      <div class="topic-scroll">
        ${topics.map((t, i) => `
          <button class="topic-chip ${i < 3 ? 'is-hot' : ''}" data-action="open-topic" data-id="${t.id}">
            <span class="chip-emoji">${t.emoji}</span><span>#${esc(t.name)}</span>
            <span class="chip-count">${t.count}</span>
          </button>`).join('')}
      </div>
    </section>
    <section class="feed-wrap">
      <div class="sec-head">
        <h2 class="sec-title">校园新鲜事</h2>
        <span class="sec-count">共 ${s.posts.length} 条</span>
      </div>
      <div class="feed">${s.posts.map(postCard).join('')}</div>
    </section>`;
  }

  /* ---------------------------------------------------------- 视图：关注 */

  function viewFollow() {
    const s = S.state;
    const ids = new Set(s.following.map((u) => u.id));
    const feed = s.posts.filter((p) => ids.has(p.author.id));
    return `
    <header class="topbar">
      <h1 class="page-title">关注</h1>
      <button class="link-btn" data-action="manage-follow">管理</button>
    </header>
    <section class="follow-strip">
      <div class="sec-head">
        <h2 class="sec-title">我关注的 <span class="sec-count">${s.following.length}</span></h2>
      </div>
      ${s.following.length ? `<div class="follow-scroll">
        ${s.following.map((u) => `
          <button class="follow-cell" data-action="manage-follow">
            <span class="avatar-ring">${avatar(u, 56)}</span>
            <span class="follow-name">${esc(u.name)}</span>
          </button>`).join('')}
      </div>` : emptyBlock('follow', '还没有关注的人', '在发现页看到喜欢的同学，点「关注」就会出现在这里')}
    </section>
    <section class="timeline">
      <div class="sec-head">
        <h2 class="sec-title">最新动态</h2>
        <span class="sec-count">${feed.length} 条</span>
      </div>
      ${feed.length ? feed.map(timelineItem).join('') : emptyBlock('message', '这里还很安静', '关注几个同学，他们的新帖子会第一时间出现在这里')}
    </section>`;
  }

  /* ---------------------------------------------------------- 视图：消息 */

  function viewMessages() {
    const s = S.state;
    return `
    <header class="topbar">
      <h1 class="page-title">消息</h1>
      <button class="icon-btn" data-action="read-all" aria-label="全部已读" title="全部已读">${icon('checkCheck', 21)}</button>
    </header>
    <div class="chat-list">
      ${s.chats.length ? s.chats.map(chatRow).join('') : emptyBlock('message', '还没有会话', '私信同学后，聊天会出现在这里')}
    </div>`;
  }

  /* ---------------------------------------------------------- 视图：个人 */

  function viewProfile() {
    const s = S.state;
    const me = s.me;
    return `
    <header class="topbar"><h1 class="page-title">个人</h1></header>
    <section class="profile-hero">
      <div class="hero-bg"></div>
      <button class="edit-btn" data-action="edit-profile">编辑资料</button>
      <div class="hero-main">
        <span class="hero-avatar">${avatar(me, 84)}</span>
        <div class="hero-name">${esc(me.name)}</div>
        <div class="hero-handle">${me.handle ? "@" + esc(me.handle) + " · " : ""}${esc(me.grade)}</div>
        <div class="hero-bio">${esc(me.bio)}</div>
        <div class="hero-tags">${(me.tags || []).map((t) => `<span class="hero-tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </section>
    <section class="stats">
      <button class="stat clickable" data-action="my-posts">
        <div class="stat-num">${s.stats.posts}</div><div class="stat-label">帖子</div>
      </button>
      <button class="stat clickable" data-action="go-follow">
        <div class="stat-num">${s.stats.following}</div><div class="stat-label">关注</div>
      </button>
      <div class="stat">
        <div class="stat-num">${fmt(s.stats.followers)}</div><div class="stat-label">粉丝</div>
      </div>
    </section>
    <section class="menu-card">
      <button class="menu-row" data-action="my-posts">
        <span class="menu-ic">${icon('file', 20)}</span><span class="menu-label">我的帖子</span>
        <span class="menu-value">${s.stats.posts}</span><span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
      <button class="menu-row" data-action="soon" data-name="收藏">
        <span class="menu-ic">${icon('bookmark', 20)}</span><span class="menu-label">我的收藏</span>
        <span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
      <button class="menu-row" data-action="soon" data-name="草稿箱">
        <span class="menu-ic">${icon('clock', 20)}</span><span class="menu-label">草稿箱</span>
        <span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
    </section>
    <section class="menu-card">
      <div class="menu-row">
        <span class="menu-ic">${icon('bell', 20)}</span><span class="menu-label">通知提醒</span>
        <button class="switch ${S.settings.notify ? 'on' : ''}" data-action="toggle" data-key="notify" role="switch" aria-checked="${S.settings.notify}" aria-label="通知提醒"></button>
      </div>
      <div class="menu-row">
        <span class="menu-ic">${icon('moon', 20)}</span><span class="menu-label">深色模式</span>
        <button class="switch ${S.settings.dark ? 'on' : ''}" data-action="toggle" data-key="dark" role="switch" aria-checked="${S.settings.dark}" aria-label="深色模式"></button>
      </div>
      <button class="menu-row" data-action="privacy">
        <span class="menu-ic">${icon('shield', 20)}</span><span class="menu-label">隐私与安全</span>
        <span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
      <button class="menu-row" data-action="help">
        <span class="menu-ic">${icon('help', 20)}</span><span class="menu-label">帮助与反馈</span>
        <span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
      <button class="menu-row" data-action="about">
        <span class="menu-ic">${icon('info', 20)}</span><span class="menu-label">关于校园墙</span>
        <span class="chev">${icon('chevronRight', 16, 2)}</span>
      </button>
    </section>
    <button class="logout" data-action="logout">退出登录</button>
    <div class="version">四中校园墙 v1.0 · 私人圈子<br>仅限校内同学 · 请友善发言</div>`;
  }

  /* ---------------------------------------------------------- 视图：话题 / 我的帖子 */

  function renderTopic(id) {
    const t = S.state.topics.find((x) => x.id === Number(id));
    if (!t) { go('#/discover'); return; }
    const posts = S.state.posts.filter((p) => p.topic.id === t.id);
    paint(`
      <header class="topbar">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <h1 class="page-title" style="font-size:17px">话题</h1>
        <span style="width:38px"></span>
      </header>
      <div class="topic-hero">
        <div class="topic-hero-emoji">${t.emoji}</div>
        <div style="min-width:0">
          <div class="topic-hero-name">#${esc(t.name)}</div>
          <div class="topic-hero-sub">${posts.length} 条帖子 · 四中同学都在聊</div>
        </div>
        <button class="topic-join" data-action="compose-topic" data-id="${t.id}">参与</button>
      </div>
      <div class="feed">${posts.length ? posts.map(postCard).join('') : emptyBlock('message', '这个话题还没有帖子', '来发第一条吧')}</div>`, { scroll: 0 });
    bindScreen();
  }

  function renderMyPosts() {
    const posts = S.state.posts.filter((p) => p.mine);
    paint(`
      <header class="topbar">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <h1 class="page-title" style="font-size:17px">我的帖子</h1>
        <span style="width:38px"></span>
      </header>
      <div class="feed">${posts.length ? posts.map(postCard).join('') : emptyBlock('file', '还没有发过帖子', '点右下角的 + ，说点什么吧')}</div>`, { scroll: 0 });
    bindScreen();
  }

  /* ---------------------------------------------------------- 视图：聊天 */

  async function renderChat(id, token) {
    paint(`<div class="chat-screen">
      <header class="chat-head">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <div class="chat-head-info"><div class="ch-info"><div class="ch-name">聊天</div><div class="ch-status">加载中…</div></div></div>
      </header>
      <div class="chat-body"></div>
    </div>`, { immersive: true });

    let chat;
    try {
      chat = await api(`/chats/${id}`);
    } catch (e) {
      toast(e.message);
      go('#/messages');
      return;
    }
    if (token !== S.token) return;

    const c = S.state.chats.find((x) => x.id === Number(id));
    const peer = chat.peer;
    paint(`<div class="chat-screen">
      <header class="chat-head">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <div class="chat-head-info">
          ${avatar(peer, 32, peer.online ? 'online' : '')}
          <div class="ch-info">
            <div class="ch-name">${esc(peer.name)}</div>
            <div class="ch-status ${peer.online ? 'online' : ''}"><span class="dot"></span>${peer.online ? '在线' : (peer.official ? '官方账号' : '离线')}</div>
          </div>
        </div>
        <button class="icon-btn" data-action="chat-more" data-id="${id}" aria-label="更多">${icon('more', 22)}</button>
      </header>
      <div class="chat-body" id="chatBody">${chat.messages.length ? '<div class="chat-fill"></div>' : ''}${renderMessages(chat.messages)}</div>
      <form class="chat-composer" id="chatForm" data-id="${id}">
        <input class="composer-input" id="chatInput" placeholder="说点什么…" autocomplete="off" maxlength="500">
        <button class="send-btn" id="chatSend" type="submit" aria-label="发送">${icon('send', 18)}</button>
      </form>
    </div>`, { immersive: true });

    const body = $('#chatBody');
    if (body) body.scrollTop = body.scrollHeight;

    if (c && c.unread) {
      c.unread = 0;
      S.state.unread = S.state.chats.reduce((a, b) => a + (b.unread || 0), 0);
      syncTabbar(S.route.name);
      api(`/chats/${id}/read`, { method: 'POST' }).catch(() => {});
    }
  }

  function renderMessages(msgs) {
    if (!msgs.length) return emptyBlock('message', '还没有聊天记录', '打个招呼吧');
    let out = '';
    let lastDate = '';
    msgs.forEach((m, i) => {
      if (m.date !== lastDate) {
        out += `<div class="day">${dayLabel(m.createdAt)}</div>`;
        lastDate = m.date;
      }
      const next = msgs[i + 1];
      const showTime = !next || (new Date(next.createdAt) - new Date(m.createdAt)) > 4 * 60 * 1000;
      out += `<div class="msg ${m.mine ? 'me' : 'them'}">
        <div class="bubble">${nl2br(m.content)}</div>
        ${showTime ? `<div class="msg-time">${esc(m.time)}</div>` : ''}
      </div>`;
    });
    return out;
  }

  function dayLabel(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, now)) return '今天';
    const y = new Date(now.getTime() - 86400000);
    if (sameDay(d, y)) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  /* ---------------------------------------------------------- 视图：帖子详情 */

  async function renderPost(id, token) {
    paint(`<div class="detail-screen">
      <header class="detail-head">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <span class="detail-title">帖子详情</span>
      </header>
      <div class="detail-body"></div>
    </div>`, { immersive: true });

    let data;
    try {
      data = await api(`/posts/${id}`);
    } catch (e) {
      toast(e.message);
      go('#/discover');
      return;
    }
    if (token !== S.token) return;

    const { post, comments } = data;
    paint(`<div class="detail-screen">
      <header class="detail-head">
        <button class="icon-btn" data-action="back" aria-label="返回">${icon('chevronLeft', 24)}</button>
        <span class="detail-title">帖子详情</span>
      </header>
      <div class="detail-body">
        <div class="detail-post">
          <div class="post-head">
            ${avatar(post.author, 44, post.author.online ? 'online' : '')}
            <div class="post-meta">
              <div class="name-line">
                <span class="pname">${esc(post.author.name)}</span>
                ${post.author.official ? '<span class="badge-off">官方</span>' : ''}
                ${post.pinned ? `<span class="pin-tag">${icon('pin', 10, 2.2)}置顶</span>` : ''}
              </div>
              <div class="sub">${esc(post.author.grade)} · ${esc(post.time)}</div>
            </div>
            ${!post.author.following && !post.mine ? `<button class="follow-btn" data-action="follow" data-id="${post.author.id}">${icon('plus', 12, 2.6)}关注</button>` : ''}
          </div>
          <div class="post-text">${nl2br(post.content)}</div>
          ${artBlock(post.art)}
          <button class="tag" data-action="open-topic" data-id="${post.topic.id}">#${esc(post.topic.name)}</button>
          <div class="detail-meta">${esc(post.time)} · ${post.likes} 人点赞</div>
          <div class="detail-actions">
            <button class="pill-btn ${post.liked ? 'liked' : ''}" data-action="like" data-id="${post.id}" data-pill="1" aria-pressed="${post.liked}">
              <span class="heart">${icon(post.liked ? 'heartFill' : 'heart', 18)}</span>
              <span class="like-num">${post.likes ? fmt(post.likes) : '点赞'}</span>
            </button>
            <button class="pill-btn" data-action="share" data-id="${post.id}">${icon('share', 18)} 分享</button>
            ${!post.mine && !post.author.demo ? `<button class="pill-btn" data-action="message-user" data-id="${post.author.id}">${icon('message', 18)} 私信</button>` : ''}
          </div>
        </div>
        <div class="comments-head">
          <div class="comments-title">全部评论 <span id="commentCount">${comments.length}</span></div>
        </div>
        <div class="comments" id="commentList">${comments.length ? comments.map(commentRow).join('') : emptyBlock('comment', '还没有评论', '来抢第一个沙发')}</div>
      </div>
      <form class="detail-composer" id="commentForm" data-id="${post.id}">
        <input class="composer-input" id="commentInput" placeholder="说点什么…" autocomplete="off" maxlength="300">
        <button class="send-btn" id="commentSend" type="submit" aria-label="发送">${icon('send', 18)}</button>
      </form>
    </div>`, { immersive: true });
  }

  function commentRow(c) {
    return `<div class="comment">
      ${avatar(c.author, 32)}
      <div>
        <div class="comment-head">
          <span class="comment-name">${esc(c.author.name)}</span>
          ${c.author.official ? '<span class="badge-off">官方</span>' : ''}
          <span class="comment-time">${esc(c.time)}</span>
          <span class="comment-like">${icon('heart', 14)} ${c.likes ? c.likes : ''}</span>
        </div>
        <div class="comment-text">${nl2br(c.content)}</div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- 视图：发帖 */

  function renderCompose() {
    const c = S.compose;
    paint(`<div class="compose-screen">
      <header class="compose-head">
        <button class="compose-cancel" data-action="back">取消</button>
        <span class="compose-title">发帖子</span>
        <button class="publish-btn ${c.text.trim() ? 'ready' : ''}" id="publishBtn" data-action="publish">发布</button>
      </header>
      <div class="compose-body">
        <textarea class="compose-textarea" id="composeText" maxlength="500" placeholder="分享此刻的校园…" enterkeyhint="enter">${esc(c.text)}</textarea>
        <div class="compose-body-label">选择话题</div>
        <div class="compose-topic-row" id="topicOpts">
          ${S.state.topics.map((t) => `<button class="topic-opt ${t.id === c.topicId ? 'active' : ''}" data-action="pick-topic" data-id="${t.id}">${t.emoji} ${esc(t.name)}</button>`).join('')}
        </div>
        <div class="compose-hint">发布后会出现在「发现」里。请友善发言：不挂人、不传谣、不泄露他人隐私，违规帖子会被墙墙下架。</div>
      </div>
      <div class="compose-foot">
        <button class="compose-tool" data-action="soon" data-name="图片">${icon('image', 19)} 图片</button>
        <button class="compose-tool" data-action="soon" data-name="表情">${icon('emoji', 19)} 表情</button>
        <span class="counter" id="counter">${c.text.length}/500</span>
      </div>
    </div>`, { immersive: true });

    const ta = $('#composeText');
    if (ta) {
      ta.focus();
      try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
    }
  }

  /* ---------------------------------------------------------- 交互动作 */

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    switch (action) {
      case 'tab':
        if (S.route.name === el.dataset.tab) {
          $('#screen').scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          go('#/' + el.dataset.tab);
        }
        break;
      case 'back':
        if (history.length > 1) history.back();
        else go('#/discover');
        break;
      case 'search':
        openSearch();
        break;
      case 'all-topics':
        openTopicsSheet();
        break;
      case 'open-topic':
        closeSheet();
        closeSearch();
        go('#/topic/' + id);
        break;
      case 'compose-topic':
        S.compose.topicId = Number(id);
        S.compose.text = '';
        go('#/compose');
        break;
      case 'open-post':
        closeSearch();
        go('#/post/' + id);
        break;
      case 'open-chat':
        closeSheet();
        go('#/chat/' + id);
        break;
      case 'like':
        toggleLike(Number(id));
        break;
      case 'compose':
        S.compose = { topicId: 9, text: '' };
        go('#/compose');
        break;
      case 'follow':
        await followUser(Number(id), el);
        break;
      case 'share':
        sharePost(Number(id));
        break;
      case 'message-user': {
        try {
          const r = await api('/chats', { method: 'POST', body: { userId: Number(id) } });
          S.state = await api('/state');
          go('#/chat/' + r.chatId);
        } catch (err) {
          toast(err.message);
        }
        break;
      }
      case 'logout':
        openSheet(`
          <div class="sheet-head">
            <span class="sheet-title">退出登录</span>
            <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
          </div>
          <div class="sheet-body">
            <div class="policy"><p>退出后需要重新输入邀请码和昵称，已经发过的帖子、聊天都不会丢。</p></div>
            <button class="btn-primary" data-action="logout-confirm" style="background:var(--danger)">确认退出</button>
          </div>`);
        break;
      case 'logout-confirm':
        closeSheet();
        clearDevice();
        S.state = null;
        S.route = { name: 'discover', id: null };
        history.replaceState(null, '', '#/discover');
        showOnboarding();
        break;
      case 'manage-follow':
        openFollowSheet();
        break;
      case 'my-posts':
        go('#/my-posts');
        break;
      case 'go-follow':
        go('#/follow');
        break;
      case 'edit-profile':
        openEditProfile();
        break;
      case 'toggle':
        toggleSetting(el.dataset.key);
        break;
      case 'publish':
        publishPost();
        break;
      case 'pick-topic':
        S.compose.topicId = Number(id);
        $$('#topicOpts .topic-opt').forEach((b) => b.classList.toggle('active', Number(b.dataset.id) === S.compose.topicId));
        break;
      case 'close-sheet':
        closeSheet();
        break;
      case 'close-search':
        closeSearch();
        break;
      case 'read-all':
        markAllRead();
        break;
      case 'privacy':
        openPrivacySheet();
        break;
      case 'help':
        openHelpSheet();
        break;
      case 'about':
        openAboutSheet();
        break;
      case 'soon':
        toast(`「${el.dataset.name || '这个功能'}」还在路上，先期待一下`);
        break;
      case 'retry':
        location.reload();
        break;
      case 'chat-more':
        openChatSheet(Number(id));
        break;
      case 'unfollow':
        await unfollowFromSheet(Number(id));
        break;
      case 'topics-close':
        closeSheet();
        break;
      default:
        break;
    }
  });

  /* ---- 点赞 */

  async function toggleLike(id) {
    const post = (S.state.posts || []).find((p) => p.id === id);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
    paintLikeState(id, post);

    try {
      const res = await api(`/posts/${id}/like`, { method: 'POST' });
      post.liked = res.liked;
      post.likes = res.likes;
      paintLikeState(id, post);
    } catch (err) {
      post.liked = !post.liked;
      post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
      paintLikeState(id, post);
      toast(err.message);
    }
  }

  function paintLikeState(id, post) {
    $$(`[data-action="like"][data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('liked', post.liked);
      if (btn.dataset.pill) {
        const box = btn.querySelector('.heart');
        if (box) box.innerHTML = icon(post.liked ? 'heartFill' : 'heart', 18);
        const num = btn.querySelector('.like-num');
        if (num) num.textContent = post.likes ? fmt(post.likes) : '点赞';
      } else {
        const box = btn.querySelector('.heart');
        if (box) box.innerHTML = icon(post.liked ? 'heartFill' : 'heart', 18);
        const num = btn.querySelector('.like-num');
        if (num) num.textContent = post.likes ? fmt(post.likes) : '';
        btn.setAttribute('aria-pressed', String(post.liked));
        if (post.liked) {
          const h = btn.querySelector('.heart');
          if (h) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
        }
      }
    });
    const meta = $('.detail-meta');
    if (meta) meta.textContent = `${post.time} · ${post.likes} 人点赞`;
  }

  /* ---- 关注 */

  async function followUser(userId, btn) {
    if (btn) btn.disabled = true;
    try {
      const res = await api(`/follow/${userId}`, { method: 'POST' });
      S.state = res.state;
      S.cacheRef = null;
      const top = $('#screen').scrollTop;
      await renderRoute();
      $('#screen').scrollTop = top;
      if (btn) btn.disabled = false;
      toast(res.following ? '已关注' : '已取消关注');
    } catch (err) {
      if (btn) btn.disabled = false;
      toast(err.message);
    }
  }

  async function unfollowFromSheet(userId) {
    try {
      const res = await api(`/follow/${userId}`, { method: 'POST' });
      S.state = res.state;
      closeSheet();
      const top = $('#screen').scrollTop;
      await renderRoute();
      $('#screen').scrollTop = top;
      toast('已取消关注');
    } catch (err) {
      toast(err.message);
    }
  }

  /* ---- 分享 */

  async function sharePost(id) {
    const url = location.origin + location.pathname + '#/post/' + id;
    const ok = await copyText(url);
    toast(ok ? '链接已复制，发给同学就能打开' : '复制失败，请手动复制地址栏链接');
  }

  /* ---- 发帖 */

  async function publishPost() {
    const ta = $('#composeText');
    const text = (ta ? ta.value : S.compose.text).trim();
    if (!text) { toast('说点什么再发布吧'); return; }
    const btn = $('#publishBtn');
    if (btn) { btn.disabled = true; btn.textContent = '发布中'; }
    try {
      const res = await api('/posts', { method: 'POST', body: { content: text, topicId: S.compose.topicId } });
      S.state = res.state;
      S.compose = { topicId: 9, text: '' };
      S.scroll.discover = 0;
      if (btn) { btn.disabled = false; btn.textContent = '发布'; }
      toast('发布成功');
      if (S.route.name === 'compose') {
        history.replaceState(null, '', '#/discover');
        S.route = { name: 'discover', id: null };
        await renderRoute();
      } else {
        go('#/discover');
      }
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = '发布'; }
      toast(err.message);
    }
  }

  /* ---- 设置 */

  function toggleSetting(key) {
    if (key === 'dark') {
      S.settings.dark = !S.settings.dark;
      applyTheme();
    } else if (key === 'notify') {
      S.settings.notify = !S.settings.notify;
      toast(S.settings.notify ? '已开启消息提醒' : '已关闭消息提醒');
    }
    saveSettings();
    const btn = $(`.switch[data-key="${key}"]`);
    if (btn) {
      btn.classList.toggle('on', !!S.settings[key]);
      btn.setAttribute('aria-checked', String(!!S.settings[key]));
    }
    syncTabbar(S.route.name);
  }

  async function markAllRead() {
    try {
      await api('/read-all', { method: 'POST' });
      S.state.chats.forEach((c) => { c.unread = 0; });
      S.state.unread = 0;
      syncTabbar(S.route.name);
      await renderRoute();
      toast('全部已读');
    } catch (err) {
      toast(err.message);
    }
  }

  /* ---- 聊天发送 */

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (form.id === 'chatForm') {
      e.preventDefault();
      await sendMessage(form);
    } else if (form.id === 'commentForm') {
      e.preventDefault();
      await sendComment(form);
    }
  });

  async function sendMessage(form) {
    const input = $('#chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const chatId = Number(form.dataset.id);
    input.value = '';
    autosize(input);
    setSendState(input, $('#chatSend'));

    const now = new Date();
    const temp = {
      mine: true, content: text,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    };
    appendMessage(temp);
    const body = $('#chatBody');
    if (body) body.scrollTop = body.scrollHeight;

    try {
      const res = await api(`/chats/${chatId}/messages`, { method: 'POST', body: { content: text } });
      const chat = S.state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.last = text;
        chat.mine = true;
        chat.lastTime = res.message.time;
        chat.lastAt = res.message.createdAt;
      }
    } catch (err) {
      toast(err.message);
    }
  }

  function appendMessage(m) {
    const body = $('#chatBody');
    if (!body) return;
    const empty = body.querySelector('.empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'msg ' + (m.mine ? 'me' : 'them');
    div.innerHTML = `<div class="bubble">${nl2br(m.content)}</div><div class="msg-time">${esc(m.time)}</div>`;
    body.appendChild(div);
  }

  async function sendComment(form) {
    const input = $('#commentInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const postId = Number(form.dataset.id);
    const btn = $('#commentSend');
    if (btn) btn.disabled = true;
    try {
      const res = await api(`/posts/${postId}/comments`, { method: 'POST', body: { content: text } });
      const list = $('#commentList');
      if (list) {
        const empty = list.querySelector('.empty');
        if (empty) empty.remove();
        list.insertAdjacentHTML('beforeend', commentRow(res.comment));
      }
      const count = $('#commentCount');
      if (count) count.textContent = res.commentCount;
      const p = S.state.posts.find((x) => x.id === postId);
      if (p) p.commentCount = res.commentCount;
      input.value = '';
      input.focus();
      toast('评论成功');
    } catch (err) {
      toast(err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ---- 输入框 */

  function autosize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 116) + 'px';
  }

  function setSendState(input, btn) {
    if (!btn) return;
    btn.classList.toggle('on', !!input.value.trim());
  }

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'composeText') {
      S.compose.text = t.value;
      const counter = $('#counter');
      if (counter) counter.textContent = `${t.value.length}/500`;
      const btn = $('#publishBtn');
      if (btn) btn.classList.toggle('ready', !!t.value.trim());
    } else if (t.id === 'chatInput') {
      autosize(t);
      setSendState(t, $('#chatSend'));
    } else if (t.id === 'commentInput') {
      setSendState(t, $('#commentSend'));
    } else if (t.id === 'searchInput') {
      renderSearchResults(t.value);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#searchLayer')) closeSearch();
      else closeSheet();
    }
    if (e.target && e.target.id === 'chatInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      const form = $('#chatForm');
      if (form) form.requestSubmit();
    }
  });

  /* ---- 滚动时顶栏阴影（可选微交互） */

  document.addEventListener('scroll', () => {
    const scr = $('#screen');
    const bar = scr && scr.querySelector('.topbar');
    if (bar) bar.classList.toggle('stuck', (scr.scrollTop || 0) > 4);
  }, true);

  function bindScreen() {
    $$('.screen.enter > *').forEach((el, i) => {
      if (i > 2) return;
    });
  }

  /* ---------------------------------------------------------- 搜索 */

  function openSearch() {
    if ($('#searchLayer')) return;
    const layer = document.createElement('div');
    layer.className = 'search-screen';
    layer.id = 'searchLayer';
    layer.innerHTML = `
      <div class="search-head">
        <div class="search-box">
          ${icon('search', 18)}
          <input id="searchInput" placeholder="搜索帖子、话题" autocomplete="off" enterkeyhint="search">
        </div>
        <button class="search-cancel" data-action="close-search">取消</button>
      </div>
      <div class="search-body" id="searchBody">
        <div class="search-group-title">热门话题</div>
        <div class="search-topics">
          ${S.state.topics.slice(0, 6).map((t) => `<button class="topic-chip" data-action="open-topic" data-id="${t.id}"><span class="chip-emoji">${t.emoji}</span>#${esc(t.name)}</button>`).join('')}
        </div>
        <div class="search-group-title">大家都在看</div>
        ${S.state.posts.slice(0, 5).map(searchRow).join('')}
      </div>`;
    $('#layers').appendChild(layer);
    const input = $('#searchInput');
    input.focus();
    setTimeout(() => input.focus(), 120);
  }

  function closeSearch() {
    const layer = $('#searchLayer');
    if (layer) layer.remove();
  }

  function searchRow(p) {
    return `<button class="search-row" data-action="open-post" data-id="${p.id}">
      <div class="search-row-top">
        <span class="search-row-name">${esc(p.author.name)}</span>
        <span class="search-row-time">${esc(p.time)}</span>
      </div>
      <div class="search-row-text">${nl2br(p.content.length > 70 ? p.content.slice(0, 70) + '…' : p.content)}</div>
      <div class="search-row-topic">#${esc(p.topic.name)}</div>
    </button>`;
  }

  function renderSearchResults(q) {
    const body = $('#searchBody');
    if (!body) return;
    const kw = q.trim().toLowerCase();
    if (!kw) {
      body.innerHTML = `
        <div class="search-group-title">热门话题</div>
        <div class="search-topics">${S.state.topics.slice(0, 6).map((t) => `<button class="topic-chip" data-action="open-topic" data-id="${t.id}"><span class="chip-emoji">${t.emoji}</span>#${esc(t.name)}</button>`).join('')}</div>
        <div class="search-group-title">大家都在看</div>
        ${S.state.posts.slice(0, 5).map(searchRow).join('')}`;
      return;
    }
    const topics = S.state.topics.filter((t) => t.name.toLowerCase().includes(kw));
    const posts = S.state.posts.filter((p) => (p.content + p.author.name + p.topic.name).toLowerCase().includes(kw)).slice(0, 20);
    let html = '';
    if (topics.length) {
      html += `<div class="search-group-title">话题</div><div class="search-topics">${topics.map((t) => `<button class="topic-chip" data-action="open-topic" data-id="${t.id}"><span class="chip-emoji">${t.emoji}</span>#${esc(t.name)}</button>`).join('')}</div>`;
    }
    if (posts.length) {
      html += `<div class="search-group-title">帖子 · ${posts.length}</div>${posts.map(searchRow).join('')}`;
    }
    if (!html) html = emptyBlock('search', '没有找到相关内容', '换个关键词试试，比如「月亮」「食堂」');
    body.innerHTML = html;
  }

  /* ---------------------------------------------------------- 各类弹层 */

  function openTopicsSheet() {
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">全部话题</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <div class="all-topics">
          ${S.state.topics.map((t) => `<button class="all-topic" data-action="open-topic" data-id="${t.id}">
            <span class="all-topic-emoji">${t.emoji}</span>
            <span class="all-topic-name">#${esc(t.name)}</span>
            <span class="all-topic-count">${t.count} 条</span>
          </button>`).join('')}
        </div>
      </div>`);
  }

  function openFollowSheet() {
    const list = S.state.following;
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">我关注的人</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        ${list.length ? list.map((u) => `
          <div class="sheet-user">
            ${avatar(u, 42)}
            <div class="sheet-user-info">
              <div class="sheet-user-name">${esc(u.name)}</div>
              <div class="sheet-user-sub">${esc(u.grade)} · ${esc(u.bio)}</div>
            </div>
            <button class="mini-btn danger" data-action="unfollow" data-id="${u.id}">取消关注</button>
          </div>`).join('') : emptyBlock('follow', '还没有关注的人', '去发现页逛逛吧')}
      </div>`);
  }

  function openEditProfile() {
    const me = S.state.me;
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">编辑资料</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <label class="field">
          <span class="field-label">昵称</span>
          <input class="field-input" id="editName" maxlength="16" value="${esc(me.name)}">
        </label>
        <label class="field">
          <span class="field-label">简介</span>
          <textarea class="field-area" id="editBio" maxlength="60" placeholder="一句话介绍自己">${esc(me.bio)}</textarea>
        </label>
        <button class="btn-primary" id="saveProfile">保存</button>
      </div>`);

    const save = $('#saveProfile');
    if (save) {
      save.addEventListener('click', async () => {
        const name = $('#editName').value.trim();
        const bio = $('#editBio').value.trim();
        if (!name) { toast('昵称不能为空'); return; }
        save.disabled = true;
        try {
          const res = await api('/me', { method: 'PATCH', body: { name, bio } });
          S.state.me = res.me;
          closeSheet();
          await renderRoute();
          toast('资料已更新');
        } catch (err) {
          save.disabled = false;
          toast(err.message);
        }
      });
    }
  }

  function openPrivacySheet() {
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">隐私与安全</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <div class="policy">
          <h3>这是一个私人圈子</h3>
          <p>校园墙只在你和同学们连接同一个 Wi-Fi 时可用，内容不会上传到任何第三方服务器。</p>
          <h3>我们建议</h3>
          <p>不发布他人的姓名、班级、照片和联系方式；不挂人、不传谣；遇到不舒服的内容，告诉墙墙。</p>
          <h3>数据在哪里</h3>
          <p>所有帖子、评论和聊天都保存在运行服务的电脑上（data/campus.db）。关掉电脑上的服务，手机就访问不到了。</p>
        </div>
      </div>`);
  }

  function openHelpSheet() {
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">帮助与反馈</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <div class="policy">
          <h3>怎么发帖子？</h3>
          <p>在「发现」或「关注」页点右下角的 + ，写完内容、选一个话题，点「发布」。</p>
          <h3>怎么关注同学？</h3>
          <p>帖子右上角的「关注」按钮，点一下就会出现在「关注」页。</p>
          <h3>怎么添加到手机桌面？</h3>
          <p>iPhone：Safari 打开后点「分享」→「添加到主屏幕」。<br>安卓：Chrome 打开后点右上角菜单 →「添加到主屏幕」。</p>
          <h3>手机打不开？</h3>
          <p>确认手机和电脑连的是同一个 Wi-Fi；确认电脑上的校园墙窗口还开着；如果还是不行，可能是 Windows 防火墙拦截了，运行「允许手机访问.bat」。</p>
        </div>
      </div>`);
  }

  function openAboutSheet() {
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">关于校园墙</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <div class="about-box">
          <img class="about-logo" src="icons/icon-192.png" alt="四中校园墙">
          <div>
            <div class="about-name">四中校园墙</div>
            <div class="about-ver">v1.0 · 私人圈子版</div>
          </div>
        </div>
        <div class="policy">
          <p>四中人自己的校园论坛：话题、帖子、关注、聊天。不需要应用商店，添加到桌面就能像 App 一样打开。</p>
          <h3>怎么添加到桌面</h3>
          <p>iPhone Safari：点底部「分享」→「添加到主屏幕」。<br>安卓 Chrome：点右上角「⋮」→「添加到主屏幕」。</p>
          <h3>数据说明</h3>
          <p>内容保存在运行服务的电脑上，删除 data/campus.db 会重置为初始演示数据。</p>
        </div>
      </div>`);
  }

  function openChatSheet(id) {
    const c = S.state.chats.find((x) => x.id === Number(id));
    if (!c) return;
    openSheet(`
      <div class="sheet-head">
        <span class="sheet-title">${esc(c.peer.name)}</span>
        <button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon('close', 20)}</button>
      </div>
      <div class="sheet-body">
        <div class="sheet-user">
          ${avatar(c.peer, 52, c.peer.online ? 'online' : '')}
          <div class="sheet-user-info">
            <div class="sheet-user-name">${esc(c.peer.name)}</div>
            <div class="sheet-user-sub">${esc(c.peer.grade)} · ${esc(c.peer.bio)}</div>
          </div>
        </div>
        <p class="sheet-note">聊天记录只保存在运行校园墙的电脑上。</p>
      </div>`);
  }

  /* ---------------------------------------------------------- 启动 */

  function bootSkeleton() {
    $('#screen').className = 'screen';
    $('#screen').innerHTML = `
      <header class="topbar"><div class="brand"><span class="brand-main">四中</span><span class="brand-sub">校园墙</span></div></header>
      <div class="skeleton">
        <div class="sk-strip"></div>
        <div class="sk-card"></div>
        <div class="sk-card"></div>
        <div class="sk-card"></div>
      </div>`;
  }

  function bootError(err) {
    $('#screen').className = 'screen';
    $('#screen').innerHTML = `<div class="error-screen">
      <div class="empty-icon">${icon('message', 28, 1.6)}</div>
      <div class="error-title">没能连上校园墙</div>
      <div class="error-text">${esc(err && err.message ? err.message : '请确认电脑上的服务还开着')}<br>然后点下面重试</div>
      <button class="btn-primary" style="width:180px" data-action="retry">重试</button>
    </div>`;
  }

  function hideBoot() {
    const bootEl = $('#boot');
    if (bootEl) bootEl.classList.add('hide');
    setTimeout(() => { if (bootEl) bootEl.remove(); }, 600);
  }

  function showOnboarding(msg) {
    S.state = null;
    document.body.classList.add('immersive');
    const scr = $('#screen');
    scr.className = 'screen screen--immersive';
    scr.innerHTML = `
      <div class="onboard">
        <div class="onboard-top">
          <div class="onboard-logo">四中<span>校园墙</span></div>
          <div class="onboard-slogan">四中人自己的墙</div>
        </div>
        <form class="onboard-card" id="joinForm" autocomplete="off">
          <h1>加入圈子</h1>
          <p class="onboard-sub">第一次来，先留个名字</p>
          <label class="field">
            <span class="field-label">邀请码</span>
            <input class="field-input" id="joinInvite" placeholder="问墙墙要一个" autocomplete="off" autocapitalize="characters">
          </label>
          <label class="field">
            <span class="field-label">昵称</span>
            <input class="field-input" id="joinName" maxlength="16" placeholder="比如：晚自习的月亮" autocomplete="off">
          </label>
          <label class="field">
            <span class="field-label">班级（选填）</span>
            <input class="field-input" id="joinGrade" maxlength="20" placeholder="比如：高二(3)班" autocomplete="off">
          </label>
          <p class="join-error" id="joinError"></p>
          <button class="btn-primary" id="joinBtn" type="submit">进入校园墙</button>
        </form>
        <div class="onboard-foot">一个邀请码，一群自己人</div>
      </div>`;
    const form = $('#joinForm');
    if (form) form.addEventListener('submit', joinCircle);
    if (msg) {
      const box = $('#joinError');
      if (box) box.textContent = msg;
    }
  }

  async function joinCircle(e) {
    e.preventDefault();
    const invite = $('#joinInvite').value.trim();
    const name = $('#joinName').value.trim();
    const grade = $('#joinGrade').value.trim();
    const errBox = $('#joinError');
    const btn = $('#joinBtn');
    errBox.textContent = '';
    if (!invite) { errBox.textContent = '先填一下邀请码'; return; }
    if (!name) { errBox.textContent = '起个昵称吧'; return; }
    btn.disabled = true;
    btn.textContent = '正在加入…';
    try {
      const deviceId = newDeviceId();
      const res = await api('/register', { method: 'POST', body: { deviceId, name, grade, invite } });
      saveDevice(deviceId);
      S.state = res.state;
      S.loaded = true;
      if (!location.hash) history.replaceState(null, '', '#/discover');
      S.route = parseHash();
      await renderRoute();
      toast('欢迎加入四中校园墙');
    } catch (err) {
      errBox.textContent = err.message;
      btn.disabled = false;
      btn.textContent = '进入校园墙';
    }
  }

  async function boot() {
    loadSettings();
    const forcedTheme = new URLSearchParams(location.search).get('theme');
    if (forcedTheme === 'light' || forcedTheme === 'dark') S.settings.dark = forcedTheme === 'dark';
    applyTheme();
    renderTabbar();
    positionPill('discover');

    if (!DEVICE) {
      showOnboarding();
      hideBoot();
      return;
    }

    bootSkeleton();
    try {
      const [state] = await Promise.all([api('/state'), sleep(650)]);
      S.state = state;
      S.loaded = true;
      if (!location.hash) history.replaceState(null, '', '#/discover');
      S.route = parseHash();
      await renderRoute();
      hideBoot();
    } catch (err) {
      if (err.status === 401) {
        clearDevice();
        showOnboarding('身份过期了，重新加入一下吧');
        hideBoot();
        return;
      }
      bootError(err);
      hideBoot();
    }
  }

  window.addEventListener('resize', () => {
    if (!document.body.classList.contains('immersive')) positionPill(S.route.name);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  boot();
})();
