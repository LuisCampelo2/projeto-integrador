/* LIFT – base de dados demonstrativa (dados fictícios, gerados relativos à data de hoje) */
(function () {
  'use strict';
  const L = window.LIFT;

  L.PASSWORD_DEMO = 'Lift2026';
  /* Contas de demonstração: o login aceita qualquer senha para elas */
  L.DEMO_EMAILS = ['personal@lift.com.br', 'aluno@lift.com.br', 'admin@lift.com.br'];

  L.EXERCISES_BASE = [
    ['ex_supino', 'Supino reto', 'Peito', '2-0-2', 'Barra'],
    ['ex_supino_inc', 'Supino inclinado com halteres', 'Peito', '2-0-2', 'Halteres'],
    ['ex_crucifixo', 'Crucifixo na máquina', 'Peito', '2-1-2', 'Máquina'],
    ['ex_puxada', 'Puxada frontal', 'Costas', '2-0-2', 'Polia'],
    ['ex_remada', 'Remada curvada', 'Costas', '2-0-2', 'Barra'],
    ['ex_remada_baixa', 'Remada baixa', 'Costas', '2-1-2', 'Polia'],
    ['ex_agachamento', 'Agachamento livre', 'Pernas', '3-0-1', 'Barra'],
    ['ex_legpress', 'Leg press 45°', 'Pernas', '2-0-2', 'Máquina'],
    ['ex_extensora', 'Cadeira extensora', 'Pernas', '2-1-2', 'Máquina'],
    ['ex_stiff', 'Stiff', 'Pernas', '3-0-1', 'Barra'],
    ['ex_afundo', 'Afundo com halteres', 'Pernas', '2-0-2', 'Halteres'],
    ['ex_desenvolvimento', 'Desenvolvimento com halteres', 'Ombros', '2-0-2', 'Halteres'],
    ['ex_elevacao', 'Elevação lateral', 'Ombros', '2-1-2', 'Halteres'],
    ['ex_rosca', 'Rosca direta', 'Braços', '2-0-2', 'Barra'],
    ['ex_triceps', 'Tríceps corda', 'Braços', '2-0-2', 'Polia'],
    ['ex_prancha', 'Prancha isométrica', 'Core', '0-30-0', 'Peso corporal'],
    ['ex_abdominal', 'Abdominal infra', 'Core', '2-0-2', 'Peso corporal'],
    ['ex_burpee', 'Burpee', 'Core', '1-0-1', 'Peso corporal'],
    ['ex_corda', 'Pular corda', 'Core', '1-0-1', 'Corda'],
  ];

  L.seed = function () {
    const D = L.d;
    const t = D.today();
    const ti = D.iso(t);
    const add = (n) => D.iso(D.add(t, n));
    const y = t.getFullYear();
    const m = t.getMonth();
    const monthDay = (mo, day) => D.iso(new Date(y, m + mo, day));
    const cycle = (mo) => monthDay(mo, 1).slice(0, 7);
    const monthName = (mo) => D.cap(D.MONTHS[new Date(y, m + mo, 1).getMonth()]);
    const PW = L.PASSWORD_DEMO;

    const db = {
      version: 1, session: null, seededAt: ti,
      users: [], trainers: [], students: [], exercises: [], workouts: [], logs: [],
      classes: [], charges: [], notifications: [], messages: [], drafts: {},
    };

    db.exercises = L.EXERCISES_BASE.map((e) => ({ id: e[0], name: e[1], group: e[2], cadence: e[3], equipment: e[4], video: '', trainerId: null }));

    /* ---------- Personal principal ---------- */
    db.trainers.push({
      id: 't1', name: 'Daniel Mendes', email: 'personal@lift.com.br', phone: '(61) 99812-4470', cref: '014527-G/DF',
      inviteCode: 'DM4821', plan: 'profissional', planStatus: 'ativa', trialUsed: true, trialEnds: add(-115), nextCharge: add(5),
      cardLast4: '4242', cardBrand: 'Visa', createdAt: add(-145), pixKey: 'daniel.mendes@lift.com.br',
      subHistory: [
        { date: add(-25), desc: 'Mensalidade – Plano Profissional', amount: 32.9 },
        { date: add(-55), desc: 'Mensalidade – Plano Profissional', amount: 32.9 },
        { date: add(-85), desc: 'Mensalidade – Plano Profissional', amount: 32.9 },
        { date: add(-115), desc: 'Fim do trial – Plano Profissional', amount: 32.9 },
        { date: add(-145), desc: 'Trial de 30 dias – Plano Profissional', amount: 0 },
      ],
      onboarding: {
        done: true, billing: 'mensal', base: 280, payments: ['pix', 'cartao', 'dinheiro'], pixKey: 'daniel.mendes@lift.com.br',
        atStudentGym: 'sim', notes: 'Asa Norte, Lago Norte e Sudoeste', network: 'sim', networkName: 'Smart Fit', discount: true, discountPct: 10,
      },
    });
    db.users.push({ id: 'u_t1', role: 'personal', refId: 't1', name: 'Daniel Mendes', email: 'personal@lift.com.br', password: PW, active: true, createdAt: add(-145) });

    /* ---------- Alunos ---------- */
    const progress = (start, weights, fats, step) => weights.map((w, i) => ({ date: add(start + i * step), weight: w, bodyFat: fats[i] }));
    db.students = [
      {
        id: 's1', trainerId: 't1', name: 'Mariana Oliveira', email: 'aluno@lift.com.br', phone: '(61) 99654-2210', age: 28, sex: 'F',
        goal: 'Hipertrofia', status: 'ativo', monthly: 280, weight: 62.4, height: 1.66, bodyFat: 24.1, gym: 'Smart Fit – Asa Norte',
        joined: add(-140), isNew: false,
        anamnese: {
          answers: {
            lesao: { v: 'sim', note: 'Tendinite no ombro direito em 2024, já tratada.' },
            dor: { v: 'sim', note: 'Leve desconforto no joelho direito em agachamentos profundos.' },
            cronica: { v: 'nao' }, medicamento: { v: 'nao' }, cirurgia: { v: 'nao' }, liberacao: { v: 'sim' },
            atividade: { v: 'sim', note: 'Pilates aos sábados.' }, restricao: { v: 'nao' },
          },
          consent: true, consentAt: add(-138), filledAt: add(-138),
        },
        habits: { sleep: 7, stress: 3, food: 4, water: 2.5, notes: 'Trabalho sentada cerca de 8 horas por dia.', updatedAt: add(-20) },
        photos: [
          { id: 'ph1', angle: 'frente', date: add(-130), src: '' }, { id: 'ph2', angle: 'frente', date: add(-15), src: '' },
          { id: 'ph3', angle: 'lado', date: add(-130), src: '' }, { id: 'ph4', angle: 'lado', date: add(-15), src: '' },
          { id: 'ph5', angle: 'costas', date: add(-70), src: '' },
        ],
        progress: progress(-150, [65.2, 64.6, 64.1, 63.5, 62.9, 62.4], [27.0, 26.3, 25.6, 25.0, 24.6, 24.1], 30),
      },
      {
        id: 's2', trainerId: 't1', name: 'Pedro Henrique Lima', email: 'pedro.henrique@email.com', phone: '(61) 99321-7788', age: 34, sex: 'M',
        goal: 'Ganho de força', status: 'ativo', monthly: 320, weight: 82.0, height: 1.80, bodyFat: 18.5, gym: 'Condomínio Mirante – Sudoeste',
        joined: add(-100), isNew: false,
        anamnese: {
          answers: { lesao: { v: 'nao' }, dor: { v: 'nao' }, cronica: { v: 'nao' }, medicamento: { v: 'nao' }, cirurgia: { v: 'nao' }, liberacao: { v: 'sim' }, atividade: { v: 'sim', note: 'Futebol às quintas.' }, restricao: { v: 'nao' } },
          consent: true, consentAt: add(-98), filledAt: add(-98),
        },
        habits: { sleep: 6.5, stress: 4, food: 3, water: 2, notes: '', updatedAt: add(-40) },
        photos: [],
        progress: progress(-90, [84.1, 83.0, 82.0], [20.2, 19.3, 18.5], 45),
      },
      {
        id: 's3', trainerId: 't1', name: 'Ana Clara Souza', email: 'ana.clara@email.com', phone: '(61) 98877-1023', age: 25, sex: 'F',
        goal: 'Condicionamento', status: 'ativo', monthly: 260, weight: 58.3, height: 1.62, bodyFat: 22.0, gym: 'Parque da Cidade',
        joined: add(-75), isNew: false, anamnese: null,
        habits: null, photos: [],
        progress: progress(-70, [59.5, 58.9, 58.3], [23.4, 22.6, 22.0], 35),
      },
      {
        id: 's4', trainerId: 't1', name: 'Rafael Costa', email: 'rafael.costa@email.com', phone: '(61) 99140-5566', age: 41, sex: 'M',
        goal: 'Emagrecimento', status: 'ativo', monthly: 280, weight: 91.5, height: 1.76, bodyFat: 27.8, gym: 'Bodytech – Lago Norte',
        joined: add(-60), isNew: false,
        anamnese: {
          answers: { lesao: { v: 'nao' }, dor: { v: 'sim', note: 'Lombar após longos períodos sentado.' }, cronica: { v: 'sim', note: 'Hipertensão controlada.' }, medicamento: { v: 'sim', note: 'Losartana 50 mg.' }, cirurgia: { v: 'nao' }, liberacao: { v: 'sim' }, atividade: { v: 'nao' }, restricao: { v: 'nao' } },
          consent: true, consentAt: add(-58), filledAt: add(-58),
        },
        habits: { sleep: 6, stress: 4, food: 2, water: 1.5, notes: 'Rotina de trabalho com viagens.', updatedAt: add(-30) },
        photos: [],
        progress: progress(-60, [95.0, 93.2, 91.5], [30.1, 28.9, 27.8], 30),
      },
      {
        id: 's5', trainerId: 't1', name: 'Juliana Prado', email: 'juliana.prado@email.com', phone: '(61) 98222-3409', age: 30, sex: 'F',
        goal: 'Mobilidade', status: 'inativo', monthly: 240, weight: 60.1, height: 1.68, bodyFat: 23.5, gym: 'Smart Fit – Sudoeste',
        joined: add(-200), isNew: false, anamnese: null, habits: null, photos: [],
        progress: progress(-200, [61.0, 60.1], [24.0, 23.5], 40),
      },
    ];
    db.students.forEach((s) => db.users.push({ id: 'u_' + s.id, role: 'student', refId: s.id, name: s.name, email: s.email, password: PW, active: true, createdAt: s.joined }));

    /* ---------- Treinos ---------- */
    const W = (id, sid, name, goal, days, items) => ({
      id, trainerId: 't1', studentId: sid, name, goal, days, active: true, createdAt: add(-40), updatedAt: add(-10),
      items: items.map(([ex, s, r, l]) => ({ exerciseId: ex, sets: s, reps: r, load: l })),
    });
    db.workouts = [
      W('w1', 's1', 'Hipertrofia A – Superiores', 'Hipertrofia', [1, 4], [['ex_supino', 4, '10', 25], ['ex_puxada', 4, '12', 35], ['ex_desenvolvimento', 3, '12', 8], ['ex_rosca', 3, '12', 10], ['ex_triceps', 3, '15', 15]]),
      W('w2', 's1', 'Hipertrofia B – Inferiores', 'Hipertrofia', [2, 5], [['ex_agachamento', 4, '10', 40], ['ex_legpress', 4, '12', 120], ['ex_extensora', 3, '15', 35], ['ex_stiff', 3, '12', 30], ['ex_prancha', 3, '45s', 0]]),
      W('w3', 's1', 'Condicionamento C', 'Resistência', [3, 6], [['ex_burpee', 4, '12', 0], ['ex_afundo', 3, '12', 8], ['ex_remada_baixa', 3, '12', 30], ['ex_abdominal', 3, '20', 0]]),
      W('w4', 's2', 'Treino de força', 'Ganho de força', [2, 4], [['ex_agachamento', 5, '5', 100], ['ex_supino', 5, '5', 80], ['ex_remada', 4, '6', 70], ['ex_desenvolvimento', 3, '8', 20]]),
      W('w5', 's3', 'Condicionamento', 'Condicionamento', [1, 3], [['ex_corda', 4, '2min', 0], ['ex_burpee', 4, '10', 0], ['ex_afundo', 3, '12', 6], ['ex_prancha', 3, '40s', 0]]),
      W('w6', 's4', 'Emagrecimento A', 'Emagrecimento', [2, 4, 6], [['ex_legpress', 4, '12', 140], ['ex_puxada', 4, '12', 50], ['ex_supino_inc', 3, '12', 16], ['ex_abdominal', 3, '15', 0]]),
    ];
    const workoutFor = (sid, wd) => {
      const list = db.workouts.filter((w) => w.studentId === sid);
      return (list.find((w) => w.days.indexOf(wd) >= 0) || list[0] || {}).id || null;
    };

    /* ---------- Aulas ---------- */
    const plan = [
      { sid: 's1', days: [1, 3, 5], start: '07:00', end: '08:00', loc: 'Smart Fit – Asa Norte' },
      { sid: 's2', days: [2, 4], start: '18:30', end: '19:30', loc: 'Condomínio Mirante – Sudoeste' },
      { sid: 's3', days: [1, 3], start: '19:00', end: '20:00', loc: 'Parque da Cidade – Estacionamento 10' },
      { sid: 's4', days: [2, 4, 6], start: '06:30', end: '07:30', loc: 'Bodytech – Lago Norte' },
    ];
    let cn = 0;
    for (let off = -21; off <= 21; off++) {
      const d = D.add(t, off);
      const wd = d.getDay();
      plan.forEach((p) => {
        if (p.days.indexOf(wd) < 0) return;
        cn++;
        db.classes.push({
          id: 'c' + cn, trainerId: 't1', studentId: p.sid, date: D.iso(d), start: p.start, end: p.end, location: p.loc,
          workoutId: workoutFor(p.sid, wd), notes: '', status: off < 0 ? 'concluida' : 'agendada',
          completedAt: off < 0 ? D.iso(d) + 'T' + p.end : null, cancelReason: '', cancelNote: '', createdAt: add(Math.min(off, 0) - 7),
        });
      });
    }
    const pastS4 = db.classes.filter((c) => c.studentId === 's4' && c.date < ti).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (pastS4) { pastS4.status = 'cancelada'; pastS4.completedAt = null; pastS4.cancelReason = 'Pedido do aluno'; }
    const futS1 = db.classes.filter((c) => c.studentId === 's1' && D.diff(c.date, ti) >= 2).sort((a, b) => (a.date > b.date ? 1 : -1));
    const cancelled = futS1[1] || futS1[0];
    if (cancelled) {
      cancelled.status = 'cancelada';
      cancelled.cancelReason = 'Imprevisto do personal';
      cancelled.cancelNote = 'Consulta médica no horário. Vamos repor na semana que vem.';
    }
    const nextS1 = futS1.find((c) => c.status === 'agendada');
    if (nextS1) { nextS1.notes = 'Foco em técnica no supino.'; }

    /* ---------- Treinos registrados (aluna principal) ---------- */
    db.classes.filter((c) => c.studentId === 's1' && c.status === 'concluida').forEach((c, i) => {
      const w = db.workouts.find((x) => x.id === c.workoutId);
      if (!w) return;
      const done = w.items.map((it) => it.exerciseId);
      db.logs.push({ id: 'lg' + i, trainerId: 't1', studentId: 's1', workoutId: w.id, date: c.date, time: c.end, done, loads: {}, total: done.length });
    });

    /* ---------- Cobranças ---------- */
    let chn = 0;
    const C = (sid, amount, mo, paid, method, extra) => {
      chn++;
      const due = monthDay(mo, 10);
      db.charges.push(Object.assign({
        id: 'ch' + chn, trainerId: 't1', studentId: sid, desc: 'Mensalidade · ' + monthName(mo), amount, due, cycle: cycle(mo),
        status: paid ? 'pago' : 'pendente', paidAt: paid ? D.addIso(due, -1) : null, method: paid ? method : null,
        awaiting: false, informedAt: null, lastReminder: null, createdAt: monthDay(mo, 1),
      }, extra || {}));
    };
    [['s1', 280, 'pix'], ['s2', 320, 'cartao'], ['s3', 260, 'pix'], ['s4', 280, 'dinheiro']].forEach(([sid, v, mt]) => C(sid, v, -2, true, mt));
    C('s5', 240, -2, true, 'pix');
    C('s1', 280, -1, true, 'pix');
    C('s2', 320, -1, true, 'cartao');
    C('s3', 260, -1, true, 'pix');
    C('s4', 280, -1, false);
    C('s1', 280, 0, false);
    C('s2', 320, 0, false, null, { awaiting: true, informedAt: add(-1) + 'T21:14', informedMethod: 'pix' });
    C('s3', 260, 0, true, 'pix', { paidAt: add(-2) });
    C('s4', 280, 0, false);

    /* ---------- Notificações da aluna ---------- */
    const N = (to, type, text, date, read, link) => db.notifications.push({ id: L.uid('n'), to, type, text, date, read, link });
    if (nextS1) N('s1', 'class', 'Nova aula agendada para ' + D.wd(nextS1.date) + ', ' + D.short(nextS1.date) + ' às ' + nextS1.start + '.', add(-1), false, '/a/classes/' + nextS1.id);
    if (cancelled) N('s1', 'cancel', 'Aula de ' + D.wd(cancelled.date) + ', ' + D.short(cancelled.date) + ' cancelada pelo personal. Motivo: ' + cancelled.cancelReason + '.', add(0), false, '/a/classes/' + cancelled.id);
    N('s1', 'workout', 'Novo treino disponível: Condicionamento C.', add(-6), true, '/a/workouts/w3');
    N('s1', 'charge', 'Cobrança disponível: Mensalidade · ' + monthName(0) + '.', monthDay(0, 1) > ti ? ti : monthDay(0, 1), true, '/a/billing');

    /* ---------- Conversas ---------- */
    const M = (sid, from, text, daysAgo, time, readT, readS) => db.messages.push({ id: L.uid('m'), trainerId: 't1', studentId: sid, from, text, at: add(-daysAgo) + 'T' + time, readT, readS });
    M('s1', 'trainer', 'Bom dia, Mariana! Montei o treino C de condicionamento para quarta.', 3, '08:12', true, true);
    M('s1', 'student', 'Perfeito! Posso trocar o burpee se o joelho incomodar?', 3, '08:40', true, true);
    M('s1', 'trainer', 'Pode sim. Troca por polichinelo e me conta como foi.', 3, '09:02', true, true);
    M('s1', 'student', 'Combinado, obrigada!', 2, '19:15', true, true);
    M('s2', 'student', 'Daniel, fiz o PIX da mensalidade ontem à noite.', 1, '08:05', false, true);
    M('s4', 'trainer', 'Rafael, tudo certo para amanhã às 6h30?', 2, '20:10', true, true);
    M('s4', 'student', 'Tudo certo!', 2, '20:31', true, true);

    /* ---------- Outros personais da plataforma (visão do administrador) ---------- */
    const others = [
      ['t2', 'Fernanda Rocha', 'fernanda.rocha@email.com', 'elite', 'ativa', 52, -320],
      ['t3', 'Lucas Martins', 'lucas.martins@email.com', 'starter', 'ativa', 11, -210],
      ['t4', 'Beatriz Almeida', 'beatriz.almeida@email.com', 'free', 'ativa', 3, -95],
      ['t5', 'Gustavo Pereira', 'gustavo.pereira@email.com', 'profissional', 'ativa', 27, -180],
      ['t6', 'Camila Duarte', 'camila.duarte@email.com', 'starter', 'trial', 6, -9],
      ['t7', 'Rodrigo Nunes', 'rodrigo.nunes@email.com', 'free', 'ativa', 1, -4],
      ['t8', 'Patrícia Lopes', 'patricia.lopes@email.com', 'profissional', 'trial', 14, -2],
      ['t9', 'Diego Fernandes', 'diego.fernandes@email.com', 'starter', 'cancelada', 0, -260],
    ];
    others.forEach(([id, name, email, planId, status, ext, created], i) => {
      db.trainers.push({
        id, name, email, phone: '', cref: '', inviteCode: name.slice(0, 2).toUpperCase() + String(3107 + i * 641),
        plan: planId, planStatus: status, trialUsed: true, trialEnds: status === 'trial' ? add(30 + created) : null, nextCharge: add(10),
        cardLast4: planId === 'free' ? null : '1881', cardBrand: 'Mastercard', createdAt: add(created), pixKey: '', subHistory: [],
        onboarding: { done: true }, extStudents: ext,
      });
      db.users.push({ id: 'u_' + id, role: 'personal', refId: id, name, email, password: PW, active: status !== 'cancelada', createdAt: add(created) });
    });

    db.users.push({ id: 'u_admin', role: 'admin', refId: null, name: 'Equipe LIFT', email: 'admin@lift.com.br', password: PW, active: true, createdAt: add(-400) });

    return db;
  };
})();
