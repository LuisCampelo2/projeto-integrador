/* LIFT – roteamento por hash (compatível com GitHub Pages e abertura direta do index.html) */
(function () {
  'use strict';
  const L = window.LIFT;
  const routes = [];

  L.route = function (pattern, def) {
    const keys = [];
    const src = '^' + pattern.replace(/[.+*?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$';
    routes.push(Object.assign({ pattern, re: new RegExp(src), keys }, def));
  };

  function parse() {
    let raw = location.hash.replace(/^#/, '');
    try { raw = decodeURI(raw); } catch (e) { /* mantém o valor bruto */ }
    raw = raw || '/';
    const i = raw.indexOf('?');
    const path = (i >= 0 ? raw.slice(0, i) : raw) || '/';
    const query = {};
    new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '').forEach((v, k) => { query[k] = v; });
    return { path, query };
  }

  L.router = {
    current: null,
    go(path) {
      if (location.hash === '#' + path) L.router.render();
      else location.hash = path;
    },
    replace(path) {
      const base = location.href.split('#')[0];
      try { history.replaceState(null, '', base + '#' + path); } catch (e) { location.hash = path; return; }
      L.router.render();
    },
    refresh() { L.router.render({ keepScroll: true }); },
    render(opts) {
      opts = opts || {};
      const { path, query } = parse();
      let route = null;
      const params = {};
      for (const r of routes) {
        const mm = r.re.exec(path);
        if (mm) { route = r; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(mm[i + 1]); }); break; }
      }
      const session = L.auth.current();
      if (!route) { L.router.replace(session ? L.auth.home(session.role) : '/welcome'); return; }
      if (route.role && route.role !== 'public') {
        if (!session) { L.router.replace('/welcome'); return; }
        if (session.role !== route.role) { L.router.replace(L.auth.home(session.role)); return; }
      }
      if (route.guest && session) { L.router.replace(L.auth.home(session.role)); return; }

      const app = document.getElementById('app');
      const oldContent = app.querySelector('.content');
      const prevScroll = opts.keepScroll && oldContent ? oldContent.scrollTop : 0;
      if (!opts.keepScroll) L.ui.closeSheet();

      const ctx = { params, query, path, session, db: L.store.db };
      let out;
      try { out = route.render(ctx); } catch (err) { console.error(err); out = { html: L.ui.errorScreen() }; }
      if (out == null) return; /* a tela redirecionou */
      if (typeof out === 'string') out = { html: out };

      app.innerHTML = '<div class="screen' + (opts.keepScroll ? '' : ' screen-enter') + (out.cls ? ' ' + out.cls : '') + '">' + out.html + (out.nav ? L.ui.bottomNav(out.nav, out.tab) : '') + '</div>';
      document.title = (out.title ? out.title + ' · ' : '') + 'LIFT';
      const content = app.querySelector('.content');
      if (content) content.scrollTop = prevScroll;
      L.router.current = { path, query, params, route };
      if (out.after) out.after(app, ctx);
      if (!opts.keepScroll) {
        const h = app.querySelector('h1');
        if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
      }
      if (L.demo && L.demo.sync) L.demo.sync();
    },
  };
})();
