/* LIFT – RF02 · Onboarding e Planos (Telas 10 a 17) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();

  L.PLANS = [
    { id: 'free', name: 'Free', price: 0, limit: 3, limitLabel: 'Até 3 alunos', features: ['Fichas de treino', 'Agenda de aulas', 'Chat com alunos'] },
    { id: 'starter', name: 'Starter', price: 19.9, limit: 15, limitLabel: 'Até 15 alunos', features: ['Tudo do Free', 'Ficha de treino em PDF', 'Financeiro básico'] },
    { id: 'profissional', name: 'Profissional', price: 32.9, limit: 40, limitLabel: 'Até 40 alunos', features: ['Tudo do Starter', 'Precificação automática', 'Relatórios completos'], popular: true },
    { id: 'elite', name: 'Elite', price: 36.9, limit: 0, limitLabel: 'Alunos ilimitados', features: ['Tudo do Profissional', 'Múltiplos espaços', 'Suporte prioritário'] },
  ];
  L.plan = (id) => L.PLANS.find((p) => p.id === id) || null;
  L.DECLINED_CARDS = ['4000000000000002'];
  L.cardBrand = (d) => (/^4/.test(d) ? 'Visa' : /^5[1-5]/.test(d) ? 'Mastercard' : /^3[47]/.test(d) ? 'Amex' : /^(636|504|509|650)/.test(d) ? 'Elo' : 'Cartão');
  const activeCount = (tr) => db().students.filter((s) => s.trainerId === tr.id && s.status === 'ativo').length;

  /* ---------- Tela 10 · Planos de assinatura ---------- */
  L.route('/plans', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const mode = ctx.query.mode === 'change' ? 'change' : 'signup';
      if (ui.state.planMode !== mode) { ui.state.planMode = mode; ui.state.plan = null; }
      const sel = ui.state.plan || (mode === 'change' && tr.plan) || 'profissional';
      ui.state.plan = sel;
      const p = L.plan(sel);
      let label;
      if (mode === 'signup') label = p.price ? 'Continuar · 30 dias grátis' : 'Continuar com o Free';
      else label = sel === tr.plan && tr.planStatus !== 'cancelada' ? 'Este é o seu plano atual' : 'Mudar para o ' + p.name;
      const disabled = mode === 'change' && sel === tr.plan && tr.planStatus !== 'cancelada';
      return {
        title: 'Planos',
        html: ui.appBar({ title: mode === 'change' ? 'Alterar plano' : 'Escolha seu plano', back: mode === 'change' ? '/p/finance?tab=assinatura' : null }) +
          '<main class="content">' + (mode === 'signup' ? ui.steps(2, 3, 'Plano') : '') +
          '<p class="plans-banner">' + icon('star', 16) + (tr.trialUsed ? ' Cancele quando quiser, sem multa' : ' 30 dias grátis nos planos pagos') + '</p>' +
          '<div class="plan-list" role="radiogroup" aria-label="Planos do LIFT">' + L.PLANS.map((pl) =>
            '<button type="button" role="radio" aria-checked="' + (pl.id === sel) + '" class="plan-card' + (pl.id === sel ? ' is-selected' : '') + '" data-action="selectPlan" data-key="' + pl.id + '">' +
            '<span class="plan-top"><span class="plan-name">' + pl.name +
            (pl.popular ? ' <span class="tag">Mais popular</span>' : '') +
            (mode === 'change' && tr.plan === pl.id ? ' <span class="tag tag-muted">Atual</span>' : '') + '</span>' +
            '<span class="plan-price">' + (pl.price ? L.money(pl.price) + '<small>/mês</small>' : 'Grátis') + '</span></span>' +
            '<span class="plan-limit">' + icon('users', 14) + ' ' + pl.limitLabel + '</span>' +
            '<span class="plan-feats">' + pl.features.map((f) => '<span>' + icon('check', 14) + f + '</span>').join('') + '</span>' +
            '<span class="plan-radio" aria-hidden="true"></span></button>').join('') + '</div>' +
          '<div class="sticky-actions"><button class="btn btn-primary btn-block btn-lg" data-action="planContinue" data-mode="' + mode + '"' + (disabled ? ' disabled' : '') + '>' + esc(label) + '</button>' +
          '<button class="btn btn-ghost btn-block btn-sm" data-action="comparePlans">Comparar planos</button></div></main>',
      };
    },
  });
  L.actions.selectPlan = (el) => { ui.state.plan = el.dataset.key; L.router.refresh(); };
  L.actions.comparePlans = () => {
    const rows = [
      ['Preço', (p) => (p.price ? L.money(p.price) : 'Grátis')],
      ['Alunos', (p) => (p.limit ? 'até ' + p.limit : 'ilimitado')],
      ['Fichas e agenda', () => true],
      ['Ficha em PDF', (p) => p.id !== 'free'],
      ['Financeiro', (p) => p.id !== 'free'],
      ['Precificação automática', (p) => p.id === 'profissional' || p.id === 'elite'],
      ['Relatórios completos', (p) => p.id === 'profissional' || p.id === 'elite'],
      ['Múltiplos espaços', (p) => p.id === 'elite'],
      ['Suporte prioritário', (p) => p.id === 'elite'],
    ];
    const cell = (v) => (v === true ? '<span class="yes">' + icon('check', 16) + '<span class="sr-only">Sim</span></span>' : v === false ? '<span class="no" aria-label="Não">—</span>' : esc(v));
    ui.sheet({
      title: 'Comparar planos', cls: 'sheet-wide', focusFirst: false,
      body: '<div class="table-wrap"><table class="compare"><thead><tr><th scope="col"><span class="sr-only">Recurso</span></th>' + L.PLANS.map((p) => '<th scope="col">' + p.name + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map(([k, fn]) => '<tr><th scope="row">' + k + '</th>' + L.PLANS.map((p) => '<td>' + cell(fn(p)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>',
      footer: '<button class="btn btn-primary btn-block" data-action="sheetClose">Fechar</button>',
    });
  };
  L.actions.planContinue = async (el) => {
    const mode = el.dataset.mode;
    const tr = L.auth.trainer();
    const p = L.plan(ui.state.plan);
    const today = D.todayIso();
    if (mode === 'signup') {
      if (p.id === 'free') {
        tr.plan = 'free';
        tr.planStatus = 'ativa';
        tr.subHistory.unshift({ date: today, desc: 'Plano Free ativado', amount: 0 });
        save();
        ui.toast('Plano Free ativado.');
        L.router.go('/onboarding/1');
      } else L.router.go('/card?plan=' + p.id + '&flow=signup');
      return;
    }
    if (p.limit && activeCount(tr) > p.limit) {
      ui.toast('Você tem ' + activeCount(tr) + ' alunos ativos. O plano ' + p.name + ' permite até ' + p.limit + '.', 'warning');
      return;
    }
    if (p.id !== 'free' && !tr.cardLast4) { L.router.go('/card?plan=' + p.id + '&mode=change'); return; }
    const cur = L.plan(tr.plan);
    const ok = await ui.confirm({
      title: 'Confirmar alteração',
      text: 'Seu plano passará de ' + (cur ? cur.name : 'nenhum') + ' para ' + p.name + ' (' + (p.price ? L.money(p.price) + '/mês' : 'gratuito') + '). ' +
        (p.price ? 'A cobrança será feita no cartão final ' + tr.cardLast4 + ' a partir da próxima fatura.' : 'Os recursos pagos ficam disponíveis até o fim do ciclo atual.'),
      ok: 'Confirmar alteração',
    });
    if (!ok) return;
    await ui.busy('Confirmando com o Stripe…', 950);
    tr.plan = p.id;
    if (p.id === 'free' || tr.planStatus !== 'trial') tr.planStatus = 'ativa';
    if (!tr.nextCharge || tr.nextCharge < today) tr.nextCharge = D.addIso(today, 30);
    tr.subHistory.unshift({ date: today, desc: 'Alteração para o plano ' + p.name, amount: 0 });
    save();
    ui.state.plan = null;
    ui.toast('Assinatura atualizada para o plano ' + p.name + '.');
    L.router.go('/p/finance?tab=assinatura');
  };

  /* ---------- Tela 11 · Cadastro do cartão ---------- */
  L.cardFields = function () {
    return ui.field({ name: 'number', label: 'Número do cartão', placeholder: '0000 0000 0000 0000', mask: 'card', icon: 'card', attrs: 'inputmode="numeric" autocomplete="cc-number"' }) +
      ui.field({ name: 'holder', label: 'Nome impresso no cartão', placeholder: 'Como aparece no cartão', attrs: 'autocomplete="cc-name" autocapitalize="characters"' }) +
      '<div class="field-row">' +
      ui.field({ name: 'exp', label: 'Validade', placeholder: 'MM/AA', mask: 'exp', attrs: 'inputmode="numeric" autocomplete="cc-exp"' }) +
      ui.field({ name: 'cvv', label: 'CVV', placeholder: '000', mask: 'cvv', attrs: 'inputmode="numeric" autocomplete="cc-csc"' }) + '</div>' +
      '<p class="secure-note">' + icon('lock', 16) + ' Pagamento processado com segurança pelo Stripe. O LIFT não armazena os dados do cartão.</p>';
  };
  L.cardValidate = function (f) {
    const now = D.today();
    return L.form.validate(f, [
      ['number', (x) => L.valid.luhn(x), 'Número de cartão inválido.'],
      ['holder', (x) => x && x.length >= 3, 'Informe o nome impresso no cartão.'],
      ['exp', (x) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(x || ''), 'Use o formato MM/AA.'],
      ['exp', (x) => { const [mm, yy] = String(x).split('/').map(Number); const end = new Date(2000 + yy, mm, 0); return end >= now; }, 'Este cartão está vencido.'],
      ['cvv', (x) => /^\d{3,4}$/.test(x || ''), 'CVV inválido.'],
    ]);
  };
  L.route('/card', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const mode = ctx.query.mode === 'update' ? 'update' : ctx.query.mode === 'change' ? 'change' : 'signup';
      const p = L.plan(ctx.query.plan) || L.plan(tr.plan) || L.plan('profissional');
      const trial = !tr.trialUsed;
      const trialEnd = D.addIso(D.todayIso(), 30);
      const back = mode === 'update' ? '/p/finance?tab=assinatura' : mode === 'change' ? '/plans?mode=change' : '/plans?flow=signup';
      let summary;
      if (mode === 'update') summary = '<div class="summary-box">' + icon('card', 20) + '<div><strong>' + (tr.cardLast4 ? 'Cartão atual: ' + esc(tr.cardBrand || '') + ' •••• ' + tr.cardLast4 : 'Nenhum cartão cadastrado') + '</strong><small>O novo cartão será usado nas próximas cobranças do LIFT.</small></div></div>';
      else if (trial) summary = '<div class="summary-box">' + icon('star', 20) + '<div><strong>Plano ' + p.name + ' · trial 30 dias</strong><small>Nenhuma cobrança antes de ' + D.fmt(trialEnd) + '. Depois, ' + L.money(p.price) + '/mês.</small></div></div>';
      else summary = '<div class="summary-box">' + icon('layers', 20) + '<div><strong>Plano ' + p.name + ' · ' + L.money(p.price) + '/mês</strong><small>A primeira cobrança é feita hoje.</small></div></div>';
      const btn = mode === 'update' ? 'Salvar cartão' : trial ? 'Ativar trial grátis' : 'Assinar por ' + L.money(p.price) + '/mês';
      return {
        title: 'Cadastro do cartão',
        html: ui.appBar({ title: 'Cadastro do cartão', back }) + '<main class="content">' + (mode === 'signup' ? ui.steps(3, 3, 'Pagamento') : '') + summary +
          '<form class="form" data-form="card" data-mode="' + mode + '" data-plan="' + p.id + '" novalidate><div class="form-alert" hidden></div>' + L.cardFields() +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">' + esc(btn) + '</button>' +
          (mode !== 'update' ? '<p class="help center">Você pode cancelar a qualquer momento em Financeiro › Meus pagamentos.</p>' : '') +
          '</form></main>',
      };
    },
  });
  L.forms.card = async (f) => {
    const v = L.cardValidate(f);
    if (!v) return;
    await ui.busy('Validando cartão com o Stripe…', 1100);
    const digits = v.number.replace(/\D/g, '');
    if (L.DECLINED_CARDS.indexOf(digits) >= 0) {
      L.form.alert(f, 'Cartão recusado pela operadora. Verifique os dados ou use outro cartão.');
      L.form.error(f, 'number', '');
      f.querySelector('[name=number]').focus();
      return;
    }
    const tr = L.auth.trainer();
    const mode = f.dataset.mode;
    const p = L.plan(f.dataset.plan);
    const today = D.todayIso();
    tr.cardLast4 = digits.slice(-4);
    tr.cardBrand = L.cardBrand(digits);
    if (mode === 'update') {
      tr.subHistory.unshift({ date: today, desc: 'Cartão atualizado (' + tr.cardBrand + ' final ' + tr.cardLast4 + ')', amount: 0 });
      save();
      ui.toast('Cartão atualizado.');
      L.router.go('/p/finance?tab=assinatura');
      return;
    }
    const trial = !tr.trialUsed;
    tr.plan = p.id;
    tr.trialUsed = true;
    if (trial) {
      tr.planStatus = 'trial';
      tr.trialEnds = D.addIso(today, 30);
      tr.nextCharge = tr.trialEnds;
      tr.subHistory.unshift({ date: today, desc: 'Trial de 30 dias – Plano ' + p.name, amount: 0 });
    } else {
      tr.planStatus = 'ativa';
      tr.nextCharge = D.addIso(today, 30);
      tr.subHistory.unshift({ date: today, desc: 'Assinatura do plano ' + p.name, amount: p.price });
    }
    save();
    ui.state.plan = null;
    ui.toast(trial ? 'Trial de 30 dias ativado!' : 'Assinatura ativada!');
    L.router.go(mode === 'signup' ? '/onboarding/1' : '/p/finance?tab=assinatura');
  };

  /* ---------- Telas 13 a 17 · Onboarding em 5 etapas ---------- */
  function draft(tr) {
    if (!tr.obDraft) {
      const o = tr.onboarding && tr.onboarding.done ? tr.onboarding : {};
      tr.obDraft = {
        billing: o.billing || '', base: o.base ? L.fmtMoneyInput(o.base) : '', payments: (o.payments || []).slice(), pixKey: o.pixKey || tr.pixKey || '',
        atStudentGym: o.atStudentGym || '', notes: o.notes || '', network: o.network || 'nao', networkName: o.networkName || '',
        discount: !!o.discount, discountPct: o.discountPct ? String(o.discountPct) : '',
      };
    }
    return tr.obDraft;
  }
  const radioCard = (name, value, title, sub, cur) =>
    '<label class="option-card"><input type="radio" name="' + name + '" value="' + value + '"' + (cur === value ? ' checked' : '') + ' data-change="ob">' +
    '<span class="option-radio" aria-hidden="true"></span><span class="option-text"><strong>' + title + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>';
  const checkCard = (name, value, title, sub, list) =>
    '<label class="option-card"><input type="checkbox" name="' + name + '" value="' + value + '"' + (list.indexOf(value) >= 0 ? ' checked' : '') + ' data-change="ob">' +
    '<span class="option-check" aria-hidden="true">' + icon('check', 14) + '</span><span class="option-text"><strong>' + title + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>';
  const PER = { aula: 'aula', mensal: 'mês', pacote: 'pacote' };

  const STEPS = {
    1: (d) => '<h2 class="q-title">Como você cobra seus alunos?</h2><p class="q-sub">Escolha o modelo principal de cobrança.</p>' +
      '<div class="option-list" role="radiogroup" aria-label="Modelo de cobrança">' +
      radioCard('billing', 'aula', 'Por aula', 'Valor cobrado a cada sessão', d.billing) +
      radioCard('billing', 'mensal', 'Mensalidade', 'Valor fixo por mês', d.billing) +
      radioCard('billing', 'pacote', 'Pacote de aulas', 'Quantidade fechada de sessões', d.billing) + '</div>' + ui.errSlot('billing'),
    2: (d) => '<h2 class="q-title">Qual o valor base cobrado?</h2><p class="q-sub">Referência para as cobranças dos alunos.</p>' +
      '<label class="label" for="obBase">Valor base</label><div class="money-input"><span aria-hidden="true">R$</span><input id="obBase" name="base" inputmode="numeric" placeholder="0,00" value="' + esc(d.base) + '" data-mask="money" data-input="ob" aria-describedby="obBaseHelp"></div>' +
      ui.errSlot('base') + '<p class="help" id="obBaseHelp">Por ' + (PER[d.billing] || 'mês') + ' (modelo escolhido na etapa 1).</p>' +
      '<div class="alert alert-info">' + icon('info', 18) + '<span>O valor pode ser ajustado depois para cada aluno, em Cobranças.</span></div>',
    3: (d) => '<h2 class="q-title">Formas de pagamento aceitas</h2><p class="q-sub">Selecione uma ou mais opções.</p>' +
      '<div class="option-list" role="group" aria-label="Formas de pagamento">' +
      checkCard('payments', 'pix', 'PIX', 'Recebimento na hora pela sua chave', d.payments) +
      checkCard('payments', 'cartao', 'Cartão de crédito', 'Pagamento online pelo app', d.payments) +
      checkCard('payments', 'dinheiro', 'Dinheiro', 'Pagamento em mãos', d.payments) +
      checkCard('payments', 'transferencia', 'Transferência', 'TED ou DOC', d.payments) + '</div>' + ui.errSlot('payments') +
      '<div class="reveal" data-show-if="pix"' + (d.payments.indexOf('pix') >= 0 ? '' : ' hidden') + '>' +
      ui.field({ name: 'pixKey', label: 'Chave PIX', placeholder: 'E-mail, CPF, telefone ou chave aleatória', value: d.pixKey, attrs: 'data-input="ob"' }) + '</div>',
    4: (d) => '<h2 class="q-title">Atende na academia do aluno?</h2><p class="q-sub">Indica se você vai até o local de treino do aluno.</p>' +
      '<div class="option-list" role="radiogroup" aria-label="Atendimento">' +
      radioCard('atStudentGym', 'sim', 'Sim', 'Atendo na academia ou condomínio do aluno', d.atStudentGym) +
      radioCard('atStudentGym', 'nao', 'Não', 'Atendo apenas em local próprio', d.atStudentGym) + '</div>' + ui.errSlot('atStudentGym') +
      ui.field({ name: 'notes', label: 'Observações', type: 'textarea', optional: true, placeholder: 'Ex.: regiões atendidas', value: d.notes, attrs: 'rows="3" data-input="ob"' }),
    5: (d) => '<h2 class="q-title">Academia de rede e descontos</h2><p class="q-sub">Vínculo com redes de academia e sua política de desconto.</p>' +
      '<p class="label" id="netLabel">Atende em academia de rede?</p><div class="seg-choice" role="radiogroup" aria-labelledby="netLabel">' +
      '<label><input type="radio" name="network" value="sim"' + (d.network === 'sim' ? ' checked' : '') + ' data-change="ob"><span>Sim</span></label>' +
      '<label><input type="radio" name="network" value="nao"' + (d.network !== 'sim' ? ' checked' : '') + ' data-change="ob"><span>Não</span></label></div>' +
      '<div class="reveal" data-show-if="network"' + (d.network === 'sim' ? '' : ' hidden') + '>' +
      ui.field({ name: 'networkName', label: 'Nome da academia / rede', placeholder: 'Ex.: Smart Fit, Bodytech', value: d.networkName, attrs: 'data-input="ob"' }) + '</div>' +
      '<label class="switch-row"><span><strong>Oferece desconto?</strong><small>Para planos de 3 meses ou mais</small></span><input type="checkbox" role="switch" name="discount" value="1"' + (d.discount ? ' checked' : '') + ' data-change="ob"><span class="switch" aria-hidden="true"></span></label>' +
      '<div class="reveal" data-show-if="discount"' + (d.discount ? '' : ' hidden') + '>' +
      ui.field({ name: 'discountPct', label: 'Percentual de desconto', placeholder: '0', suffix: '%', mask: 'pct', value: d.discountPct, attrs: 'inputmode="numeric" data-input="ob"' }) + '</div>',
  };

  L.route('/onboarding/:step', {
    role: 'personal',
    render(ctx) {
      const step = Math.min(5, Math.max(1, parseInt(ctx.params.step, 10) || 1));
      const tr = L.auth.trainer();
      const d = draft(tr);
      const done = tr.onboarding && tr.onboarding.done;
      const back = step > 1 ? '/onboarding/' + (step - 1) : done ? '/p/profile' : null;
      return {
        title: 'Configurar perfil',
        html: ui.appBar({ title: 'Configurar perfil', back }) + '<main class="content">' +
          ui.steps(step, 5, '', step > 1 ? '<a class="link link-sm" href="#/onboarding/' + (step - 1) + '">Voltar</a>' : '') +
          '<form class="form ob-form" data-form="onboarding" data-step="' + step + '" novalidate><div class="form-alert" hidden></div>' + STEPS[step](d) +
          '<div class="sticky-actions"><button class="btn btn-primary btn-block btn-lg" type="submit">' + (step < 5 ? 'Continuar' : 'Concluir') + '</button></div></form></main>',
      };
    },
  });
  function syncDraft(f) {
    const tr = L.auth.trainer();
    const d = draft(tr);
    const step = Number(f.dataset.step);
    const v = L.form.values(f);
    if (step === 1) d.billing = v.billing || '';
    if (step === 2) d.base = v.base || '';
    if (step === 3) { d.payments = [].concat(v.payments || []); d.pixKey = v.pixKey || ''; }
    if (step === 4) { d.atStudentGym = v.atStudentGym || ''; d.notes = v.notes || ''; }
    if (step === 5) { d.network = v.network || 'nao'; d.networkName = v.networkName || ''; d.discount = !!v.discount; d.discountPct = v.discountPct || ''; }
    f.querySelectorAll('[data-show-if]').forEach((el) => {
      const k = el.dataset.showIf;
      el.hidden = !(k === 'pix' ? d.payments.indexOf('pix') >= 0 : k === 'network' ? d.network === 'sim' : k === 'discount' ? d.discount : false);
    });
    save();
    return d;
  }
  L.changes.ob = (el) => syncDraft(el.form);
  L.inputs.ob = (el) => syncDraft(el.form);
  L.forms.onboarding = async (f) => {
    const d = syncDraft(f);
    const step = Number(f.dataset.step);
    const tr = L.auth.trainer();
    L.form.clear(f);
    let err = null;
    if (step === 1 && !d.billing) err = ['billing', 'Selecione um modelo de cobrança.'];
    if (step === 2 && L.parseMoney(d.base) < 1) err = ['base', 'Informe um valor maior que zero.'];
    if (step === 3) {
      if (!d.payments.length) err = ['payments', 'Selecione ao menos uma forma de pagamento.'];
      else if (d.payments.indexOf('pix') >= 0 && d.pixKey.length < 5) err = ['pixKey', 'Informe sua chave PIX.'];
    }
    if (step === 4 && !d.atStudentGym) err = ['atStudentGym', 'Selecione uma opção.'];
    if (step === 5) {
      if (d.network === 'sim' && d.networkName.length < 2) err = ['networkName', 'Informe o nome da academia ou rede.'];
      else if (d.discount) { const pc = Number(d.discountPct); if (!(pc >= 1 && pc <= 50)) err = ['discountPct', 'Informe um percentual entre 1% e 50%.']; }
    }
    if (err) {
      L.form.error(f, err[0], err[1]);
      const el = f.querySelector('[name="' + err[0] + '"]');
      if (el) el.focus();
      return;
    }
    if (step < 5) { L.router.go('/onboarding/' + (step + 1)); return; }
    await ui.busy('Salvando configurações do seu negócio…', 900);
    const first = !(tr.onboarding && tr.onboarding.done);
    tr.onboarding = {
      done: true, billing: d.billing, base: L.parseMoney(d.base), payments: d.payments.slice(), pixKey: d.pixKey, atStudentGym: d.atStudentGym,
      notes: d.notes, network: d.network, networkName: d.networkName, discount: d.discount, discountPct: Number(d.discountPct) || 0,
    };
    tr.pixKey = d.pixKey;
    delete tr.obDraft;
    save();
    ui.toast(first ? 'Tudo pronto! Seu perfil foi configurado.' : 'Configurações do negócio atualizadas.');
    L.router.go(first ? '/p/home' : '/p/profile');
  };

  /* ---------- Tela 12 · Meus pagamentos / Assinatura do personal ---------- */
  L.views.subscription = function (tr) {
    const p = L.plan(tr.plan);
    const act = activeCount(tr);
    const key = tr.planStatus === 'trial' ? 'trial' : tr.planStatus === 'cancelada' ? 'cancelada_plano' : tr.planStatus === 'ativa' ? 'ativa' : 'sem_plano';
    const lim = p && p.limit ? p.limit : null;
    const hist = tr.subHistory.length
      ? '<ul class="list">' + tr.subHistory.map((h) => '<li class="list-item"><span class="li-icon">' + icon(h.amount ? 'card' : 'info', 18) + '</span><span class="li-main"><strong>' + esc(h.desc) + '</strong><small>' + D.fmt(h.date) + '</small></span><span class="li-end">' + (h.amount ? L.money(h.amount) : '—') + '</span></li>').join('') + '</ul>'
      : ui.empty({ icon: 'history', title: 'Sem movimentações ainda' });
    return '<section class="card card-plan"><div class="row-between"><p class="eyebrow">Plano atual</p>' + ui.badge(key) + '</div>' +
      '<h2 class="plan-current">' + (p ? p.name : 'Nenhum plano') + '</h2><p class="plan-current-price">' + (p && p.price ? L.money(p.price) + ' / mês' : 'Gratuito') + '</p>' +
      (lim ? '<div class="usage"><div class="row-between small"><span>Alunos ativos</span><span>' + act + ' de ' + lim + '</span></div>' + ui.bar((act / lim) * 100, act / lim > 0.85 ? 'bar-warning' : '') + '</div>'
        : '<p class="small muted">' + act + ' alunos ativos · sem limite</p>') +
      '<div class="kv-list">' +
      (tr.planStatus === 'trial' ? ui.kv('Fim do trial', D.fmt(tr.trialEnds)) : '') +
      (tr.planStatus !== 'cancelada' && p && p.price ? ui.kv('Próxima cobrança', D.fmt(tr.nextCharge)) : '') +
      (tr.planStatus === 'cancelada' && p && p.price ? ui.kv('Acesso até', D.fmt(tr.nextCharge)) : '') +
      ui.kv('Cartão', tr.cardLast4 ? esc(tr.cardBrand || 'Cartão') + ' •••• ' + tr.cardLast4 : 'Não cadastrado') + '</div></section>' +
      '<div class="btn-stack"><a class="btn btn-secondary btn-block" href="#/plans?mode=change">' + icon('layers', 18) + ' Alterar plano</a>' +
      '<a class="btn btn-secondary btn-block" href="#/card?mode=update&plan=' + (tr.plan || 'profissional') + '">' + icon('card', 18) + ' ' + (tr.cardLast4 ? 'Atualizar cartão' : 'Adicionar cartão') + '</a></div>' +
      '<h3 class="section-title">Histórico</h3>' + hist +
      (tr.planStatus === 'cancelada' ? '<button class="btn btn-primary btn-block" data-action="reactivateSub">Reativar assinatura</button>'
        : p && p.price ? '<button class="btn btn-ghost btn-danger-text btn-block" data-action="cancelSub">Cancelar assinatura</button>' : '');
  };
  L.actions.cancelSub = async () => {
    const tr = L.auth.trainer();
    const p = L.plan(tr.plan);
    const ok = await ui.confirm({
      title: 'Cancelar assinatura?', danger: true, ok: 'Cancelar assinatura', cancel: 'Manter plano',
      text: 'Você continua com os recursos do plano ' + p.name + ' até ' + D.fmt(tr.nextCharge) + '. Depois disso, sua conta passa para o plano Free (até 3 alunos ativos).',
    });
    if (!ok) return;
    await ui.busy('Cancelando no Stripe…', 800);
    tr.planStatus = 'cancelada';
    tr.subHistory.unshift({ date: D.todayIso(), desc: 'Assinatura cancelada – Plano ' + p.name, amount: 0 });
    save();
    ui.toast('Assinatura cancelada.', 'info');
    L.router.refresh();
  };
  L.actions.reactivateSub = async () => {
    const tr = L.auth.trainer();
    await ui.busy('Reativando assinatura…', 700);
    tr.planStatus = 'ativa';
    tr.subHistory.unshift({ date: D.todayIso(), desc: 'Assinatura reativada – Plano ' + L.plan(tr.plan).name, amount: 0 });
    save();
    ui.toast('Assinatura reativada!');
    L.router.refresh();
  };
})();
