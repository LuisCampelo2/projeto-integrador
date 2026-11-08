/* LIFT – RF01 · Acesso e Perfis (Telas 01 a 09: entrada, autenticação e direcionamento por perfil) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();

  /* ---------- Sessão (simula o token JWT) ---------- */
  L.auth = {
    current() {
      const s = db().session;
      if (!s) return null;
      const u = db().users.find((x) => x.id === s.userId);
      if (!u || !u.active) return null;
      return { user: u, role: u.role };
    },
    home(role) { return { personal: '/p/home', student: '/a/agenda', admin: '/admin' }[role] || '/welcome'; },
    login(u) { db().session = { userId: u.id, token: 'jwt.' + L.uid('t'), at: D.stamp() }; save(); },
    logout() { db().session = null; save(); },
    trainer() {
      const c = L.auth.current();
      if (!c) return null;
      if (c.role === 'personal') return db().trainers.find((t) => t.id === c.user.refId) || null;
      if (c.role === 'student') { const s = L.auth.student(); return s ? db().trainers.find((t) => t.id === s.trainerId) || null : null; }
      return null;
    },
    student() {
      const c = L.auth.current();
      if (!c || c.role !== 'student') return null;
      return db().students.find((s) => s.id === c.user.refId) || null;
    },
    landing(u) {
      if (u.role !== 'personal') return L.auth.home(u.role);
      const tr = db().trainers.find((t) => t.id === u.refId);
      if (tr && !tr.plan) return '/plans?flow=signup';
      if (tr && !(tr.onboarding && tr.onboarding.done)) return '/onboarding/1';
      return '/p/home';
    },
  };

  L.actions.logout = async () => {
    const ok = await ui.confirm({ title: 'Sair da conta?', text: 'Você precisará entrar novamente para acessar seus dados.', ok: 'Sair', danger: true });
    if (!ok) return;
    L.auth.logout();
    ui.toast('Você saiu da conta.', 'info');
    L.router.go('/welcome');
  };
  L.actions.switchProfile = () => { L.auth.logout(); L.router.go('/welcome'); };

  const roleKey = (r) => (r === 'aluno' ? 'aluno' : r === 'admin' ? 'admin' : 'personal');
  const loginPath = (r) => (r === 'admin' ? '/login/admin' : '/login?role=' + roleKey(r));

  /* ---------- Abertura: verifica a sessão ativa ---------- */
  L.route('/', {
    role: 'public',
    render() {
      return {
        cls: 'screen-splash',
        html: '<main class="splash">' + L.logo(64) + '<div class="spinner spinner-sm" role="status" aria-label="Carregando"></div></main>',
        after() {
          setTimeout(() => {
            if (!L.router.current || L.router.current.path !== '/') return;
            const s = L.auth.current();
            L.router.replace(s ? L.auth.landing(s.user) : '/welcome');
          }, 700);
        },
      };
    },
  });

  /* ---------- Tela 01 · Seleção de papel ---------- */
  L.route('/welcome', {
    role: 'public', guest: true,
    render() {
      return {
        title: 'Bem-vindo', cls: 'screen-welcome',
        html: '<main class="content welcome">' +
          '<div class="welcome-hero">' + L.logo(54) + '<h1 class="welcome-title">Bem-vindo ao LIFT</h1><p class="welcome-sub">Como você vai usar o app?</p></div>' +
          '<div class="role-list">' +
          '<a class="role-card" href="#/login?role=personal"><span class="role-icon">' + icon('dumbbell', 24) + '</span><span class="role-text"><strong>Sou Personal</strong><small>Gerencio alunos, treinos e cobranças</small></span>' + icon('chevron-right', 20, 'role-chev') + '</a>' +
          '<a class="role-card" href="#/login?role=aluno"><span class="role-icon role-icon-alt">' + icon('activity', 24) + '</span><span class="role-text"><strong>Sou Aluno</strong><small>Acompanho meus treinos e aulas</small></span>' + icon('chevron-right', 20, 'role-chev') + '</a>' +
          '</div>' +
          '<div class="welcome-foot"><a class="link-subtle" href="#/login/admin">Acesso administrativo</a></div>' +
          '</main>',
      };
    },
  });

  /* ---------- Tela 02 · Login (Personal / Aluno) ---------- */
  function loginForm(role) {
    return '<form class="form" data-form="login" data-role="' + role + '" novalidate>' +
      '<div class="form-alert" hidden></div>' +
      ui.field({ name: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', icon: 'mail', attrs: 'autocomplete="email" inputmode="email"' }) +
      ui.field({ name: 'password', label: 'Senha', type: 'password', placeholder: 'Sua senha', icon: 'lock', toggle: true, attrs: 'autocomplete="current-password"' }) +
      '<div class="form-row-end"><a class="link link-sm" href="#/forgot?role=' + role + '">Esqueci minha senha</a></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Entrar</button>' +
      '<button class="btn btn-ghost btn-block btn-sm" type="button" data-action="fillDemo" data-role="' + role + '">' + icon('zap', 16) + ' Usar conta de demonstração</button>' +
      '</form>';
  }
  L.route('/login', {
    role: 'public', guest: true,
    render(ctx) {
      const role = ctx.query.role === 'aluno' ? 'aluno' : 'personal';
      const isP = role === 'personal';
      return {
        title: 'Entrar',
        html: ui.appBar({ title: 'Login', back: '/welcome' }) +
          '<main class="content">' +
          ui.segLinks([{ key: 'personal', label: 'Personal', href: '/login?role=personal' }, { key: 'aluno', label: 'Aluno', href: '/login?role=aluno' }], role) +
          '<div class="auth-brand">' + L.logo(40) + '<p>' + (isP ? 'Gerencie seus alunos em um só lugar' : 'Seus treinos e aulas na palma da mão') + '</p></div>' +
          loginForm(role) +
          '<p class="auth-foot">' + (isP ? 'Ainda não tem conta? <a class="link" href="#/signup">Criar conta</a>' : 'Primeiro acesso? <a class="link" href="#/first-access">Tenho um código de convite</a>') + '</p>' +
          '</main>',
      };
    },
  });
  L.route('/login/admin', {
    role: 'public', guest: true,
    render() {
      return {
        title: 'Acesso administrativo',
        html: ui.appBar({ title: 'Acesso administrativo', back: '/welcome' }) +
          '<main class="content">' +
          '<div class="auth-brand">' + L.logo(40) + '<p>Área restrita à equipe LIFT</p></div>' +
          loginForm('admin') + '</main>',
      };
    },
  });
  L.actions.fillDemo = (btn) => {
    const f = btn.form;
    const email = { personal: 'personal@lift.com.br', aluno: 'aluno@lift.com.br', admin: 'admin@lift.com.br' }[btn.dataset.role];
    f.querySelector('[name=email]').value = email;
    f.querySelector('[name=password]').value = L.PASSWORD_DEMO;
    L.form.clear(f);
    f.querySelector('[type=submit]').focus();
  };
  L.forms.login = async (f) => {
    /* Modo demonstração: qualquer e-mail e qualquer senha são aceitos (só não podem ficar vazios).
       Se o e-mail for de uma conta existente do perfil escolhido, entra nela;
       senão, entra na conta demonstrativa do perfil (Daniel, Mariana ou Equipe LIFT). */
    const v = L.form.validate(f, [
      ['email', L.valid.required, 'Informe seu e-mail.'],
      ['password', L.valid.required, 'Informe sua senha.'],
    ]);
    if (!v) return;
    const want = { personal: 'personal', aluno: 'student', admin: 'admin' }[f.dataset.role];
    await ui.busy('Verificando credenciais…', 650);
    const demoId = { personal: 'u_t1', student: 'u_s1', admin: 'u_admin' }[want];
    let u = db().users.find((x) => x.role === want && x.email.toLowerCase() === v.email.toLowerCase());
    if (!u || !u.active) u = db().users.find((x) => x.id === demoId);
    u.active = true;
    L.auth.login(u);
    ui.toast('Olá, ' + L.first(u.name) + '!');
    L.router.go(L.auth.landing(u));
  };

  /* ---------- Tela 03 · Cadastro do Personal ---------- */
  L.route('/signup', {
    role: 'public', guest: true,
    render() {
      return {
        title: 'Criar conta',
        html: ui.appBar({ title: 'Criar conta – Personal', back: '/login?role=personal' }) +
          '<main class="content">' + ui.steps(1, 3, 'Dados de acesso') +
          '<form class="form" data-form="signup" novalidate>' +
          '<div class="form-alert" hidden></div>' +
          ui.field({ name: 'name', label: 'Nome completo', placeholder: 'Nome e sobrenome', attrs: 'autocomplete="name"' }) +
          ui.field({ name: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', attrs: 'autocomplete="email" inputmode="email"' }) +
          ui.field({ name: 'phone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000', mask: 'phone', attrs: 'autocomplete="tel" inputmode="tel"' }) +
          ui.field({ name: 'password', label: 'Senha', type: 'password', placeholder: 'Mínimo 8 caracteres', toggle: true, attrs: 'autocomplete="new-password" data-input="pwReq"' }) +
          ui.field({ name: 'confirm', label: 'Confirmar senha', type: 'password', placeholder: 'Repita a senha', toggle: true, attrs: 'autocomplete="new-password" data-input="pwReq"' }) +
          ui.pwReq(true) +
          '<label class="check-row"><input type="checkbox" name="terms" value="1"><span class="check-box" aria-hidden="true">' + icon('check', 14) + '</span><span>Li e aceito os <a class="link" href="#/signup" data-action="showTerms">Termos de Uso</a> e a Política de Privacidade.</span></label>' +
          ui.errSlot('terms') +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Continuar</button>' +
          '</form><p class="auth-foot">Já tem conta? <a class="link" href="#/login?role=personal">Entrar</a></p></main>',
      };
    },
  });
  L.actions.showTerms = () => {
    ui.sheet({
      title: 'Termos de Uso', focusFirst: false,
      body: '<div class="prose"><p>O LIFT é uma ferramenta de gestão para profissionais de educação física. Ao criar sua conta, você se compromete a usar os dados dos seus alunos apenas para a prestação dos seus serviços.</p><p>Os dados de saúde informados pelos alunos são tratados como dados pessoais sensíveis e só ficam visíveis para o personal vinculado.</p><p>Você pode cancelar sua assinatura a qualquer momento em Financeiro › Meus pagamentos.</p></div>',
      footer: '<button type="button" class="btn btn-primary btn-block" data-action="sheetClose">Entendi</button>',
    });
  };
  L.forms.signup = async (f) => {
    const v = L.form.validate(f, [
      ['name', (x) => x && x.split(/\s+/).length >= 2 && x.length >= 5, 'Informe nome e sobrenome.'],
      ['email', L.valid.email, 'Informe um e-mail válido.'],
      ['email', (x) => !db().users.some((u) => u.email.toLowerCase() === String(x).toLowerCase()), 'Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.'],
      ['phone', (x) => String(x || '').replace(/\D/g, '').length >= 10, 'Informe um telefone com DDD.'],
      ['password', L.valid.pw, 'A senha não atende aos requisitos abaixo.'],
      ['confirm', (x, all) => x === all.password, 'As senhas não coincidem.'],
      ['terms', (x) => x === '1', 'É preciso aceitar os Termos de Uso para continuar.'],
    ]);
    if (!v) return;
    await ui.busy('Criando sua conta…', 800);
    const today = D.todayIso();
    const tid = L.uid('t');
    const letters = v.name.normalize('NFD').replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean);
    const ini = ((letters[0] || 'L')[0] + ((letters[letters.length - 1] || 'F')[0])).toUpperCase();
    let code;
    do { code = ini + String(1000 + Math.floor(Math.random() * 9000)); } while (db().trainers.some((t) => t.inviteCode === code));
    db().trainers.push({
      id: tid, name: v.name, email: v.email, phone: v.phone, cref: '', inviteCode: code, plan: null, planStatus: 'sem_plano',
      trialUsed: false, trialEnds: null, nextCharge: null, cardLast4: null, cardBrand: null, createdAt: today, pixKey: '',
      subHistory: [], onboarding: { done: false },
    });
    const u = { id: L.uid('u'), role: 'personal', refId: tid, name: v.name, email: v.email, password: v.password, active: true, createdAt: today };
    db().users.push(u);
    L.auth.login(u);
    ui.toast('Conta criada! Agora escolha seu plano.');
    L.router.go('/plans?flow=signup');
  };

  /* ---------- Tela 04 · Primeiro acesso do Aluno (código de convite) ---------- */
  L.route('/first-access', {
    role: 'public', guest: true,
    render() {
      ui.state.inviteTrainer = null;
      let boxes = '';
      for (let i = 0; i < 6; i++) boxes += '<input class="code-box" name="c' + i + '" maxlength="2" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Caractere ' + (i + 1) + ' de 6 do código" data-mask="code" data-input="code" data-i="' + i + '">';
      return {
        title: 'Primeiro acesso',
        html: ui.appBar({ title: 'Primeiro acesso – Aluno', back: '/login?role=aluno' }) +
          '<main class="content"><form class="form" data-form="firstAccess" novalidate>' +
          '<div class="code-intro"><h2 class="h2">Peça o código ao seu personal</h2><p class="muted">Ele aparece no perfil do professor, no app LIFT.</p></div>' +
          '<fieldset class="code-field"><legend class="sr-only">Código de convite</legend><div class="code-boxes">' + boxes + '</div></fieldset>' +
          '<div class="code-status" id="codeStatus" aria-live="polite"></div>' +
          '<div class="form-alert" hidden></div>' +
          '<div class="first-fields" id="firstFields" aria-disabled="true">' +
          ui.field({ name: 'name', label: 'Nome completo', placeholder: 'Nome e sobrenome', attrs: 'autocomplete="name"' }) +
          ui.field({ name: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', attrs: 'autocomplete="email" inputmode="email"' }) +
          ui.field({ name: 'password', label: 'Senha', type: 'password', placeholder: 'Mínimo 8 caracteres', toggle: true, attrs: 'autocomplete="new-password" data-input="pwReq"' }) +
          ui.pwReq(false) + '</div>' +
          '<button class="btn btn-primary btn-block btn-lg" type="submit" id="firstSubmit" disabled>Criar minha conta</button>' +
          '</form></main>',
        after(app) { const b = app.querySelector('.code-box'); if (b) setTimeout(() => b.focus(), 50); },
      };
    },
  });
  L.auth.checkCode = function (f) {
    const boxes = Array.from(f.querySelectorAll('.code-box'));
    const code = boxes.map((b) => b.value).join('');
    const status = f.querySelector('#codeStatus');
    const submit = f.querySelector('#firstSubmit');
    const fields = f.querySelector('#firstFields');
    boxes.forEach((b) => { b.classList.remove('is-invalid', 'is-valid'); b.removeAttribute('aria-invalid'); });
    ui.state.inviteTrainer = null;
    if (code.length < 6) {
      status.innerHTML = '';
      submit.disabled = true;
      fields.setAttribute('aria-disabled', 'true');
      return;
    }
    const tr = db().trainers.find((t) => t.inviteCode && t.inviteCode.toUpperCase() === code.toUpperCase());
    const tu = tr && db().users.find((u) => u.refId === tr.id && u.role === 'personal');
    if (tr && tu && tu.active) {
      ui.state.inviteTrainer = tr.id;
      boxes.forEach((b) => b.classList.add('is-valid'));
      status.innerHTML = '<div class="linked">' + ui.avatar(tr.name, 'sm') + '<span>Personal vinculado: <strong>' + esc(tr.name) + '</strong></span>' + icon('check-circle', 18) + '</div>';
      submit.disabled = false;
      fields.removeAttribute('aria-disabled');
    } else {
      boxes.forEach((b) => { b.classList.add('is-invalid'); b.setAttribute('aria-invalid', 'true'); });
      status.innerHTML = '<p class="code-error" role="alert">' + icon('alert', 16) + ' Código inválido. Confira com seu personal e tente novamente.</p>';
      submit.disabled = true;
      fields.setAttribute('aria-disabled', 'true');
    }
  };
  L.inputs.code = (inp) => {
    const boxes = Array.from(inp.form.querySelectorAll('.code-box'));
    const i = Number(inp.dataset.i);
    if (inp.value && i < 5) boxes[i + 1].focus();
    L.auth.checkCode(inp.form);
  };
  L.forms.firstAccess = async (f) => {
    if (!ui.state.inviteTrainer) { L.form.alert(f, 'Informe um código de convite válido para continuar.'); return; }
    const v = L.form.validate(f, [
      ['name', (x) => x && x.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'],
      ['email', L.valid.email, 'Informe um e-mail válido.'],
      ['email', (x) => !db().users.some((u) => u.email.toLowerCase() === String(x).toLowerCase()), 'Este e-mail já está cadastrado. Entre com sua senha.'],
      ['password', L.valid.pw, 'A senha não atende aos requisitos abaixo.'],
    ]);
    if (!v) return;
    await ui.busy('Criando sua conta…', 800);
    const tr = db().trainers.find((t) => t.id === ui.state.inviteTrainer);
    const today = D.todayIso();
    const sid = L.uid('s');
    db().students.push({
      id: sid, trainerId: tr.id, name: v.name, email: v.email, phone: '', age: null, sex: '', goal: '', status: 'ativo',
      monthly: (tr.onboarding && tr.onboarding.base) || 0, weight: null, height: null, bodyFat: null, gym: '', joined: today, isNew: true,
      anamnese: null, habits: null, photos: [], progress: [],
    });
    const u = { id: L.uid('u'), role: 'student', refId: sid, name: v.name, email: v.email, password: v.password, active: true, createdAt: today };
    db().users.push(u);
    L.notify(sid, 'info', 'Bem-vindo(a) ao LIFT! Preencha sua anamnese para que ' + L.first(tr.name) + ' monte seus treinos com segurança.', '/a/anamnese');
    L.auth.login(u);
    ui.toast('Conta criada! Você está vinculado(a) a ' + tr.name + '.');
    L.router.go('/a/agenda');
  };

  /* ---------- Telas 05 e 06 · Recuperação de senha ---------- */
  L.route('/forgot', {
    role: 'public', guest: true,
    render(ctx) {
      const role = roleKey(ctx.query.role);
      const sent = ctx.query.sent === '1' && ui.state.forgotSent;
      const head = ui.appBar({ title: 'Recuperar senha', back: loginPath(role) });
      if (sent) {
        return {
          title: 'Verifique seu e-mail',
          html: head + '<main class="content"><div class="state-card">' +
            '<div class="state-icon">' + icon('mail', 28) + '</div><h2 class="h2">Verifique seu e-mail</h2>' +
            '<p class="muted">Se o e-mail <strong>' + esc(ui.state.forgotSent.email) + '</strong> estiver cadastrado, você receberá um link para redefinir a senha. O link é válido por 30 minutos.</p></div>' +
            '<div class="btn-stack"><button class="btn btn-secondary btn-block" data-action="go" data-to="/reset">' + icon('link', 18) + ' Abrir link recebido por e-mail</button>' +
            '<button class="btn btn-ghost btn-block" data-action="go" data-to="/forgot?role=' + role + '">Usar outro e-mail</button></div>' +
            '<p class="auth-foot"><a class="link" href="#' + loginPath(role) + '">Voltar ao login</a></p></main>',
        };
      }
      return {
        title: 'Recuperar senha',
        html: head + '<main class="content"><div class="state-card state-card-plain">' +
          '<div class="state-icon">' + icon('lock', 28) + '</div><h2 class="h2">Esqueceu sua senha?</h2>' +
          '<p class="muted">Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.</p></div>' +
          '<form class="form" data-form="forgot" data-role="' + role + '" novalidate>' +
          ui.field({ name: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', icon: 'mail', value: (ui.state.forgotSent && ui.state.forgotSent.email) || '', attrs: 'autocomplete="email" inputmode="email"' }) +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Enviar link</button></form>' +
          '<p class="auth-foot"><a class="link" href="#' + loginPath(role) + '">Voltar ao login</a></p></main>',
      };
    },
  });
  L.forms.forgot = async (f) => {
    const v = L.form.validate(f, [['email', L.valid.email, 'Informe um e-mail válido.']]);
    if (!v) return;
    await ui.busy('Enviando link…', 750);
    ui.state.forgotSent = { email: v.email, role: f.dataset.role };
    L.router.go('/forgot?role=' + f.dataset.role + '&sent=1');
  };

  L.route('/reset', {
    role: 'public', guest: true,
    render() {
      const role = (ui.state.forgotSent && ui.state.forgotSent.role) || 'personal';
      return {
        title: 'Nova senha',
        html: ui.appBar({ title: 'Nova senha', back: loginPath(role) }) +
          '<main class="content"><p class="muted lead">Crie uma nova senha para sua conta' + (ui.state.forgotSent ? ' <strong>' + esc(ui.state.forgotSent.email) + '</strong>' : '') + '.</p>' +
          '<form class="form" data-form="reset" novalidate>' +
          ui.field({ name: 'password', label: 'Nova senha', type: 'password', placeholder: 'Mínimo 8 caracteres', toggle: true, attrs: 'autocomplete="new-password" data-input="pwReq"' }) +
          ui.field({ name: 'confirm', label: 'Confirmar nova senha', type: 'password', placeholder: 'Repita a senha', toggle: true, attrs: 'autocomplete="new-password" data-input="pwReq"' }) +
          '<p class="label">Requisitos</p>' + ui.pwReq(true) +
          '<button class="btn btn-primary btn-block btn-lg" type="submit" data-pw-submit disabled>Salvar nova senha</button></form></main>',
      };
    },
  });
  L.forms.reset = async (f) => {
    const v = L.form.values(f);
    if (!L.valid.pw(v.password) || v.password !== v.confirm) return;
    await ui.busy('Salvando nova senha…', 700);
    const sent = ui.state.forgotSent;
    const role = (sent && sent.role) || 'personal';
    if (sent) {
      const u = db().users.find((x) => x.email.toLowerCase() === sent.email.toLowerCase());
      if (u) { u.password = v.password; save(); }
    }
    ui.state.forgotSent = null;
    ui.toast('Senha atualizada! Entre com a nova senha.');
    L.router.go(loginPath(role));
  };
})();
