'use strict';
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#site-navigation');
function closeMenu(){if(!menuButton||!navigation)return;menuButton.setAttribute('aria-expanded','false');navigation.classList.remove('is-open');}
if(menuButton&&navigation){
 menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('is-open',open);});
 navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 function closeFromOutside(event) {
   if (menuButton.getAttribute('aria-expanded') === 'true' &&
       !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
 }
 document.addEventListener('pointerdown', closeFromOutside);
 document.addEventListener('focusin', closeFromOutside);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
 window.matchMedia('(min-width: 761px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
 menuButton.closest('.site-header').classList.add('menu-ready');
}
const workFilters = document.querySelector('.filters[aria-label="Filter projects"]');
if (workFilters) {
  const buttons = [...workFilters.querySelectorAll('[data-project-filter]')];
  const cards = [...document.querySelectorAll('[data-project-category]')];
  const status = document.querySelector('#filter-status');

  function showWork(requested) {
    const selected = buttons.some(button => button.dataset.projectFilter === requested) ? requested : 'all';
    let visible = 0;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.projectFilter === selected));
    }
    for (const card of cards) {
      const show = selected === 'all' || card.dataset.projectCategory.split(' ').includes(selected);
      card.hidden = !show;
      card.toggleAttribute('data-featured', show && visible === 0);
      if (show) visible++;
    }
    status.textContent = visible + (visible === 1 ? ' project shown' : ' projects shown');
  }

  function restoreWork() {
    showWork(new URL(window.location.href).searchParams.get('work'));
  }
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const url = new URL(window.location.href);
      const filter = button.dataset.projectFilter;
      if (filter === 'all') url.searchParams.delete('work');
      else url.searchParams.set('work', filter);
      history.replaceState(history.state, '', url);
      showWork(filter);
    });
  }
  restoreWork();
  workFilters.hidden = false;
  window.addEventListener('popstate', restoreWork);
}

const projectReturns = document.querySelectorAll('[data-back-to-projects]');
if (projectReturns.length && document.referrer) {
  const from = new URL(document.referrer);
  const filter = from.searchParams.get('work');
  if (from.origin === location.origin && ['/', '/index.html'].includes(from.pathname)) {
    const search = ['web', 'data'].includes(filter) ? '?work=' + filter : '';
    for (const link of projectReturns) {
      link.href = '/' + search + '#' + (link.dataset.backToProjects || 'projects');
    }
  }
}
const copyButton=document.querySelector('[data-copy-email]');
if(copyButton){copyButton.addEventListener('click',async()=>{
 const status=document.querySelector('#copy-status');
 try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(copyButton.dataset.copyEmail);if(status)status.textContent='Email address copied.';}
 catch{if(status)status.textContent='Email: '+copyButton.dataset.copyEmail;}
});}
const dialog=document.querySelector('#image-dialog');
if(dialog){
 const opener=document.querySelector('[data-open-image]');
 const close=dialog.querySelector('.dialog-close');
 opener?.addEventListener('click',()=>{if(typeof dialog.showModal==='function')dialog.showModal();else window.open(opener.dataset.openImage,'_blank','noopener');});
 close?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}

// Mouse coordinates position a background light inside the button.
(() => {
  const motion = window.matchMedia('(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)');
  let active = null;
  let frame = 0;
  let clientX = 0;
  let clientY = 0;

  function reset() {
    if (!active) return;
    cancelAnimationFrame(frame);
    frame = 0;
    active.classList.remove('pointer-tracking');
    active = null;
  }

  function paint() {
    frame = 0;
    const rect = active.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    active.style.setProperty('--light-x', (x * 100).toFixed(1) + '%');
    active.style.setProperty('--light-y', (y * 100).toFixed(1) + '%');
    active.classList.add('pointer-tracking');
  }

  function track(event) {
    if (!motion.matches || event.pointerType !== 'mouse') {
      reset();
      return;
    }
    const button = event.currentTarget;
    if (button !== active) {
      reset();
      active = button;
      button.classList.add('pointer-button');
    }
    clientX = event.clientX;
    clientY = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  }

  for (const button of document.querySelectorAll('.button, .nav-contact, button:not([data-open-image])')) {
    button.addEventListener('pointerenter', track);
    button.addEventListener('pointermove', track);
    button.addEventListener('pointerleave', reset);
    button.addEventListener('pointercancel', reset);
  }
  motion.addEventListener('change', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('scroll', reset, {capture: true, passive: true});
  document.addEventListener('keydown', reset);
})();

// Let native links own focus, history and scroll restoration.
(() => {
  const phoneMotion = window.matchMedia('(max-width: 760px) and (prefers-reduced-motion: no-preference)');
  const root = document.documentElement;
  let scrollTimer;
  document.addEventListener('click', event => {
    if (!phoneMotion.matches || event.defaultPrevented || event.button !== 0 ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || !link.hash || !document.getElementById(link.hash.slice(1))) return;
    root.classList.add('following-section');
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => root.classList.remove('following-section'), 1000);
  });

  // Browsers without a native page transition can still ease in the next page.
  const visit = window.performance?.getEntriesByType?.('navigation')[0];
  if (!phoneMotion.matches || visit?.type !== 'navigate' || !document.referrer ||
      new URL(document.referrer).origin !== window.location.origin) return;
  function easeArrival() {
    root.classList.add('page-arrival');
    window.setTimeout(() => root.classList.remove('page-arrival'), 250);
  }
  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', event => {
      if (!event.viewTransition) easeArrival();
    }, {once: true});
  } else {
    easeArrival();
  }
})();
