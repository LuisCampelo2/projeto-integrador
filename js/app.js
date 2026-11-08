/* LIFT – inicialização e delegação de eventos */
(function () {
  'use strict';
  const L = window.LIFT;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';

  function onClick(e) {
    const t = e.target.closest('[data-action]');
    if (!t || t.disabled || !document.getElementById('device').contains(t)) return;
    const fn = L.actions[t.dataset.action];
    if (!fn) return;
    e.preventDefault();
    try { fn(t, e); } catch (err) { console.error(err); L.ui.toast('Algo deu errado. Tente novamente.', 'error'); }
  }
  function onSubmit(e) {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const fn = L.forms[f.dataset.form];
    if (fn) { try { fn(f, e); } catch (err) { console.error(err); L.ui.toast('Algo deu errado. Tente novamente.', 'error'); } }
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset && t.dataset.mask && L.mask[t.dataset.mask]) {
      const nv = L.mask[t.dataset.mask](t.value);
      if (nv !== t.value) t.value = nv;
    }
    if (t.classList && t.classList.contains('is-invalid') && t.type !== 'radio') {
      t.classList.remove('is-invalid');
      t.removeAttribute('aria-invalid');
      const f = t.form;
      const er = f && f.querySelector('[data-err="' + t.name + '"]');
      if (er) { er.hidden = true; er.textContent = ''; }
    }
    const h = t.closest && t.closest('[data-input]');
    if (h && L.inputs[h.dataset.input]) L.inputs[h.dataset.input](h, e);
  }
  function onChange(e) {
    const t = e.target.closest && e.target.closest('[data-change]');
    if (t && L.changes[t.dataset.change]) L.changes[t.dataset.change](t, e);
    if (e.target.type === 'radio' || e.target.type === 'checkbox') {
      const f = e.target.form;
      if (f) {
        f.querySelectorAll('[name="' + e.target.name + '"]').forEach((x) => { x.classList.remove('is-invalid'); x.removeAttribute('aria-invalid'); });
        const er = f.querySelector('[data-err="' + e.target.name + '"]');
        if (er) { er.hidden = true; er.textContent = ''; }
      }
    }
  }
  function onKeydown(e) {
    const t = e.target;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (e.key === 'Escape') {
      if (L.demo.isOpen()) { L.demo.close(); return; }
      if (L.ui.sheetOpen()) { L.ui.closeSheet(); return; }
    }
    if (e.key === 'Tab') {
      const scope = L.demo.isOpen() ? document.getElementById('demoPanel') : L.ui.sheetOpen() ? document.querySelector('#sheet-root .sheet') : null;
      if (scope) {
        const items = Array.from(scope.querySelectorAll(FOCUSABLE)).filter((x) => x.offsetParent !== null);
        if (items.length) {
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && (document.activeElement === first || !scope.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && (document.activeElement === last || !scope.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
        }
      }
    }
    if (t.classList && t.classList.contains('code-box') && e.key === 'Backspace' && !t.value) {
      const prev = t.form.querySelectorAll('.code-box')[Number(t.dataset.i) - 1];
      if (prev) { prev.value = ''; prev.focus(); L.auth.checkCode(t.form); e.preventDefault(); }
    }
    if (!typing && e.shiftKey && (e.key === 'D' || e.key === 'd') && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); L.demo.toggle(); }
  }
  function onPaste(e) {
    const t = e.target;
    if (!t.classList || !t.classList.contains('code-box')) return;
    e.preventDefault();
    const text = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
    const boxes = Array.from(t.form.querySelectorAll('.code-box'));
    let i = Number(t.dataset.i);
    text.split('').forEach((ch) => { if (boxes[i]) { boxes[i].value = ch; i++; } });
    (boxes[Math.min(i, 5)] || t).focus();
    L.auth.checkCode(t.form);
  }
  function clock() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const n = new Date();
    el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
  }

  function init() {
    L.store.load();
    L.billing.refresh();
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('paste', onPaste);
    window.addEventListener('hashchange', () => L.router.render());
    clock();
    setInterval(clock, 20000);
    L.demo.init();
    L.router.render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
