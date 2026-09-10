/**
 * RATHOD HUB - ULTRA-PREMIUM MOBILE APP INTERACTIVITY & ANIMATION ENGINE
 * Powers smooth screen transitions, animated counters, celebration confetti,
 * splash screen dismissal, and touch spring micro-interactions.
 */

(function () {
  'use strict';

  // 1. Dismiss Splash Screen Gracefully
  function initSplashDismissal() {
    const splash = document.getElementById('rh-splash-screen');
    if (!splash) return;

    setTimeout(() => {
      splash.classList.add('rh-splash-fade-out');
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 500);
    }, 1500);
  }

  // 2. Animated Number Counters (for XP, Streaks, Questions)
  function animateValue(element, start, end, duration, prefix = '', suffix = '') {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(easeProgress * (end - start) + start);
      element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // 3. Trigger Confetti Celebration (Pure JS / Canvas Particle Effect)
  window.triggerRhCelebration = function () {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ef2b2b', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rotation += p.vRot;
        p.opacity -= 0.015;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      frame++;
      if (alive && frame < 90) {
        requestAnimationFrame(render);
      } else {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }
    requestAnimationFrame(render);
  };

  // 4. Hook Tab Switcher for Smooth Transitions, Dock Active State & Counter Animation
  function hookTabAnimations() {
    if (window._rhTabHooked) return;
    window._rhTabHooked = true;

    // Update dock items active classes
    function updateDockActive(tab) {
      const mapping = {
        home: 'mob-home',
        materials: 'mob-materials',
        focus: 'mob-focus',
        chatroom: 'mob-chat',
      };
      const activeId = mapping[tab];
      document.querySelectorAll('.rh-dock-item').forEach((item) => {
        if (activeId && item.id === activeId) {
          item.classList.add('rh-active');
        } else {
          item.classList.remove('rh-active');
        }
      });
    }

    const originalSwitchTab = window.switchTab;
    if (typeof originalSwitchTab === 'function') {
      window.switchTab = function (tab) {
        originalSwitchTab(tab);
        updateDockActive(tab);
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const appEl = document.getElementById('app');
          if (appEl) appEl.scrollTop = 0;
          const contentEl = document.querySelector('.rh-content');
          if (contentEl) contentEl.scrollTop = 0;
        } catch (_) {}

        // If switching to home, animate counters
        if (tab === 'home') {
          setTimeout(() => {
            const xpEl = document.getElementById('home-xp');
            if (xpEl && xpEl.textContent) {
              const val = parseInt(xpEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
              if (val > 0) animateValue(xpEl, 0, val, 600, '', ' XP');
            }
          }, 150);
        }
      };
    }
  }


  // 5. Lightweight Ultra VIP polish (no heavy fixed blur layers)
  function initVipExperience() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function enhance(root = document) {
      const hero = root.querySelector?.('.rh-home-hero');
      if (hero && !hero.dataset.vipReady) {
        hero.dataset.vipReady = '1';
        hero.classList.add('rh-vip-hero');
        const kicker = hero.querySelector('.rh-hero-kicker');
        if (kicker && !hero.querySelector('.rh-vip-chip')) {
          const chip = document.createElement('div');
          chip.className = 'rh-vip-chip';
          chip.innerHTML = '<span>◆</span> RATHOD ELITE EXPERIENCE';
          kicker.before(chip);
        }
        if (!reduceMotion) {
          const field = document.createElement('div');
          field.className = 'rh-vip-particles';
          field.setAttribute('aria-hidden', 'true');
          field.innerHTML = Array.from({length: 5}, (_, i) => `<i style="--i:${i}"></i>`).join('');
          hero.prepend(field);
        }
      }
      root.querySelectorAll?.('.rh-metric-capsule,.rh-subject-chip,.rh-feature,.rh-rail-card,.rh-featured-action-card,.qb-card,#study-rooms-box > div').forEach((card) => {
        if (card.dataset.vipCard) return;
        card.dataset.vipCard = '1';
        card.classList.add('rh-vip-card');
        if (finePointer) card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX-r.left}px`);
          card.style.setProperty('--my', `${e.clientY-r.top}px`);
        }, {passive:true});
      });
    }
    enhance();
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; enhance(); });
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  // 6. Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSplashDismissal();
      hookTabAnimations();
      initVipExperience();
    });
  } else {
    initSplashDismissal();
    hookTabAnimations();
    initVipExperience();
  }
})();
