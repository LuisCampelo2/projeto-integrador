/* LIFT – persistência local (LocalStorage) e utilitários de data e valor */
(function () {
  'use strict';
  const L = (window.LIFT = window.LIFT || {});
  const KEY = 'lift.mockup.db.v2';
  let db = null;

  function read() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { window.localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }

  L.store = {
    load() {
      const raw = read();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1) { db = parsed; return db; }
        } catch (e) { /* dados corrompidos: recria a base */ }
      }
      db = L.seed();
      L.store.save();
      return db;
    },
    get db() { return db || L.store.load(); },
    save() {
      if (!write(JSON.stringify(db)) && L.ui && L.ui.toast) {
        L.ui.toast('Não foi possível salvar neste navegador. Os dados valem só até fechar a página.', 'warning');
      }
    },
    reset() { db = L.seed(); L.store.save(); },
  };

  L.uid = (p) => (p || 'id') + '_' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 7);

  const WD = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const WDS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WD1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const pad = (n) => String(n).padStart(2, '0');

  L.d = {
    WD, WDS, WD1, MONTHS, MS,
    today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); },
    iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    parse(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); },
    add(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; },
    todayIso() { return L.d.iso(L.d.today()); },
    addIso(s, n) { return L.d.iso(L.d.add(L.d.parse(s), n)); },
    diff(a, b) { return Math.round((L.d.parse(a) - L.d.parse(b)) / 864e5); },
    fmt(s) { if (!s) return '—'; const d = L.d.parse(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
    short(s) { if (!s) return '—'; const d = L.d.parse(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
    long(s) { const d = L.d.parse(s); return WD[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()]; },
    wd(s) { return WDS[L.d.parse(s).getDay()]; },
    monthLabel(y, m) { return L.d.cap(MONTHS[m]) + ' ' + y; },
    mins(t) { const p = String(t || '0:0').split(':').map(Number); return p[0] * 60 + (p[1] || 0); },
    hm(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); },
    nowHm() { const n = new Date(); return pad(n.getHours()) + ':' + pad(n.getMinutes()); },
    relative(s) {
      const k = L.d.diff(s, L.d.todayIso());
      if (k === 0) return 'Hoje';
      if (k === 1) return 'Amanhã';
      if (k === -1) return 'Ontem';
      return L.d.wd(s) + ', ' + L.d.short(s);
    },
    cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; },
    stamp() { return L.d.todayIso() + 'T' + L.d.nowHm(); },
  };

  L.money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  L.num = (v, dec) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec == null ? 1 : dec });
})();
