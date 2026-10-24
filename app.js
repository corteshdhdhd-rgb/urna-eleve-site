(() => { 'use strict';
const ADM = '84';
const $ = s => document.querySelector(s);
const h = (t, p = {}, ...c) => { const e = document.createElement(t); for (const k in p) { if (k === 'class') e.className = p[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), p[k]); else if (k in e) e[k] = p[k]; else e.setAttribute(k, p[k]); } e.append(...c); return e; };
const api = window.UrnaCloud.request;
let S = { c: [], m: 'num', lock: false, ok: false }, A = null, buf = '', sel = null, busy = false, done = '', adm = false, ov = null, tm, msg = '', zq = false, view = '';
const BR = { 1: [1], 2: [1, 2], 3: [1, 4], 4: [1, 4, 5], 5: [1, 5], 6: [1, 2, 4], 7: [1, 2, 4, 5], 8: [1, 2, 5], 9: [2, 4], 0: [2, 4, 5] };
const br = d => h('span', { class: 'br', 'aria-hidden': 'true' }, ...[1, 4, 2, 5, 3, 6].map(i => h('i', { class: (BR[d].includes(i) ? 'on ' : '') + 'dot-' + i })));
const byId = i => S.c.find(c => c.id === i), byNum = n => S.c.find(c => c.num === n);

function label() { if (buf === ADM) return 'ACESSO ADMINISTRATIVO · CONFIRME'; if (S.lock) return S.phase === 'closed' ? 'VOTAÇÃO ENCERRADA' : 'VOTAÇÃO PAUSADA'; if (sel === 'b') return 'VOTO EM BRANCO';
  if (S.m === 'nome') { const c = byId(sel); return c ? c.n : ''; }
  if (buf.length < 2) return ''; const c = byNum(buf); return c ? c.n : 'VOTO NULO'; }
function pend() { if (S.lock || busy) return null; if (sel === 'b') return 'b'; if (S.m === 'nome') return byId(sel) ? sel : null;
  if (buf.length < 2) return null; const c = byNum(buf); return c ? c.id : 'n'; }
function press(d) { if (busy || S.m !== 'num') return; sel = null; if (buf.length < 2) buf += d; render(); }
function fix() { if (busy) return; buf = ''; sel = null; render(); FX.shake($('.scr')); }
async function conf() { if (busy) return; if (S.m === 'num' && buf === ADM && sel !== 'b') { buf = ''; openLogin(); return; } const k = pend(); if (!k) return; busy = true; await submitVote(k); }
function recoverVote(error) {
  busy = true;
  if (ov) ov.remove();
  const button = h('button', { type: 'button', onclick: async () => { button.disabled = true; await submitVote(); } }, 'Verificar o mesmo voto');
  ov = h('div', { class: 'ov' }, h('div', { class: 'box', role: 'alertdialog', 'aria-modal': 'true' },
    h('h3', {}, 'Voto aguardando confirmação'),
    h('p', {}, error || 'Há um voto pendente nesta aba. Verifique a confirmação antes do próximo eleitor.'),
    h('p', {}, 'Mantenha esta aba aberta. A verificação não duplica um voto já recebido.'), button));
  document.body.append(ov); button.focus();
}
async function submitVote(k) {
  const r = await window.UrnaVotes.send(k, S.round);
  if (r.uncertain) { recoverVote(r.e); return; }
  if (ov) ov.remove(); ov = null;
  done = r.s === 200 ? 'FIM' : (r.e || 'ERRO AO GRAVAR'); render();
  if (r.s === 200) { FX.snd.fim(); const q = $('.fim').getBoundingClientRect(); FX.burst(q.left + q.width / 2, q.top + q.height / 2, 'multi', 46); } else FX.snd.corrige();
  setTimeout(async () => {
    const fresh = await api('state'); if (fresh.c) { S = fresh; applyCfg(S.cfg); }
    busy = false; done = ''; buf = ''; sel = null; render();
  }, 2500);
}

let kpEl, hdEl, kpSig = '', pl = 0, pn = '';
const mk = (cls, snd, col, fn, ...kids) => { const b = h('button', { class: cls, type: 'button', 'data-snd': snd, 'data-col': col, onclick: fn }, ...kids); FX.juice(b); return b; };
function build() { // cabeçalho e teclado ficam guardados: mantêm os efeitos entre um clique e outro
  hdEl = h('header', { class: 'hd' }, h('img', { class: 'logo', src: '/logo.png', alt: 'Logo da escola' }), h('img', { src: '/brasao.png', alt: 'Brasão da República' }), h('span', {}, 'URNA', h('br'), 'ELETRÔNICA'));
  hdEl.append(h('div', {class:'machine-id'}, h('b',{},'ELEIÇÃO ESCOLAR'), h('small',{},'TERMINAL DO ELEITOR · ELEVE')));
  const keys = h('div', { class: 'keys' }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => mk('k' + (d === 0 ? ' z' : ''), 'key:' + d, '#fff', () => press(String(d)), h('span',{},String(d)), br(d))));
  const names = h('div', { class: 'names' }, ...S.c.map((c, i) => { const b = mk('k', 'name:' + i, '#fff', () => { if (busy) return; sel = c.id; render(); }, c.n); b.dataset.id = c.id; return b; }));
  const act = h('div', { class: 'act' }, mk('bw', 'branco', '#cfcfcf', () => { if (busy) return; buf = ''; sel = 'b'; render(); }, 'BRANCO'), mk('bc', 'corrige', '#ec7928', fix, 'CORRIGE'), mk('bk', 'confirmar', '#0f0', conf, 'CONFIRMA'));
  kpEl = h('section', { class: 'kp' }, h('div', { class: 'in' }, S.m === 'num' ? keys : names, act));
  kpEl.querySelectorAll('.names .k,.bw').forEach(b => b.disabled = S.lock);
  kpEl.querySelectorAll('.keys .k').forEach((b,i) => b.setAttribute('aria-label','Tecla '+[1,2,3,4,5,6,7,8,9,0][i]));
  if (S.m === 'nome') kpEl.firstChild.append(h('button', { class: 'k adm', type: 'button', onclick: openLogin }, 'Admin')); }
function render() { const a = $('#app'); a.className = S.m === 'nome' ? 'wide' : ''; a.setAttribute('aria-label','Urna eletrônica escolar');
  const sig = S.m + S.lock + S.c.map(c => c.id + c.num + c.n).join('|'); if (sig !== kpSig) { kpSig = sig; build(); sideUp(true); } sideUp(false);
  kpEl.querySelectorAll('.names .k').forEach(b => b.classList.toggle('on', b.dataset.id === sel));
  if (done) { const f = h('div', { class: 'fim' + (done === 'FIM' ? '' : ' error') }, done);
    a.replaceChildren(hdEl, h('section', { class: 'scr' }, f, h('p', { class: 'hint' }, done === 'FIM' ? 'Obrigado por votar.' : ''))); FX.pop(f, 2.2); return; }
  const lab = label();
  const scr = h('section', { class: 'scr' }, h('div',{class:'screen-top'},h('span',{},'SEU VOTO PARA'),h('span',{class:'status-led'},S.lock ? 'EM ESPERA' : 'URNA ONLINE')), h('h2', {}, 'PARANINFO'),h('p',{class:'round-label'}, (S.stage || 1)+'º TURNO · ELEIÇÃO ESCOLAR'),
    S.m === 'num' ? h('div', { class: 'num' }, 'NÚMERO', h('div', { class: 'digs' }, h('span', { class: 'd' }, buf[0] || ''), h('span', { class: 'd' }, buf[1] || ''))) : '',
    h('div', { class: 'nm', role: 'status' }, lab),
    S.ok ? '' : pairBox(),
    h('p', { class: 'hint' }, 'Aperte a tecla ', h('span', { class: 'g' }, 'verde'), ' para confirmar seu voto', h('br'), 'Aperte a tecla ', h('span', { class: 'r' }, 'laranja'), ' para corrigir seu voto'));
  a.replaceChildren(hdEl, scr, kpEl, h('footer',{class:'machine-footer'},h('span',{},'ELEVE · CADA VOTO FAZ A DIFERENÇA'),h('span',{},'01  ▪  TERMINAL DE VOTAÇÃO')));
  if (buf.length > pl) FX.pop(scr.querySelectorAll('.d')[buf.length - 1], 1.7); pl = buf.length;
  if (lab && lab !== pn) FX.pop(scr.querySelector('.nm'), 1.25); pn = lab; }

/* Controle de áudio independente da interface da urna. */
function soundControl() {
  const snd = h('button', {class:'snd',type:'button',onclick:()=>{FX.setMute(!FX.muted()); paint();}},'');
  function paint(){snd.textContent='SOM: '+(FX.muted()?'DESLIGADO':'LIGADO');snd.setAttribute('aria-pressed',String(!FX.muted()));}
  paint(); document.body.append(snd);
}
addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('[data-snd]'); if (!b || b.disabled) return; const [t, v] = b.dataset.snd.split(':');
  if (FX.snd[t]) FX.snd[t](+v); FX.punch(b); FX.burst(e.clientX, e.clientY, b.dataset.col, t === 'key' || t === 'name' ? 6 : 16); });
addEventListener('click', e => { if (e.target.closest && e.target.closest('.box button')) FX.snd.click(); });
addEventListener('keydown', e => { if (ov || view || e.target.closest('input,textarea,select,a,summary') || (e.key==='Enter' && e.target.closest('button'))) return;
  if (/^\d$/.test(e.key)) { FX.snd.key(+e.key); press(e.key); } else if (e.key === 'Enter') { FX.snd.confirmar(); conf(); } else if (e.key === 'Backspace' || e.key === 'Escape') { FX.snd.corrige(); fix(); } });

/* ---- administração (tudo é validado de novo no servidor) ---- */
const arm = () => { clearTimeout(tm); tm = setTimeout(closeAll, 120000); };
async function closeAll() { const was = adm; adm = false; view = ''; document.body.classList.remove('res'); zq = false; msg = ''; clearTimeout(tm); if (ov) ov.remove(); ov = null; buf = ''; sel = null;
  if (was) await api('logout', {}); resTok++; document.querySelectorAll('.stage').forEach(e => e.remove()); const r = await api('state'); if (r.c) { S = r; applyCfg(S.cfg); } render(); }
function modal(...c) { if (ov) ov.remove(); ov = h('div', { class: 'ov', onpointerdown: arm, onkeydown: e=>{arm();if(e.key==='Tab'){const els=[...ov.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')];if(!els.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}} }, h('div', { class: 'box',role:'dialog','aria-modal':'true','aria-label':'Painel da urna' }, ...c)); document.body.append(ov); ov.querySelector('input:not(:disabled),button:not(:disabled)')?.focus(); arm(); }
function sync(r) { A = r.A; S.c = A.c; S.m = A.m; S.lock = A.lock; S.ok = A.here; S.cfg = A.cfg; S.round = A.round; S.phase=A.phase; S.stage=A.stage; applyCfg(A.cfg); }
function openLogin() { const pw = h('input', { type: 'password', autocomplete: 'off', maxLength: 128, placeholder: 'Senha do administrador' }), m = h('p', { class: 'err', role: 'alert' });
  let logging=false; const go = async () => { if(logging)return; logging=true; const v = pw.value; pw.value = ''; const r = await api('login', { pw: v }); logging=false; if (r.s === 200 && r.auth) { m.className = 'ok'; m.textContent = 'Aparelho autorizado a votar.'; FX.snd.confirmar(); setTimeout(closeAll, 1200); } else if (r.s === 200) { adm = true; sync(r); panel(); } else { m.textContent = r.e || 'Erro'; pw.focus(); } };
  pw.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  modal(h('h3', {}, 'Acesso do administrador'), pw, m, h('div', { class: 'row' }, h('button', { onclick: go }, 'Entrar'), h('button', { class: 'sec', onclick: closeAll }, 'Cancelar'))); pw.focus(); }
let acting=false;
async function act(a, d = {}) { if (!adm || acting) return; acting=true;const r = await api('a', { a, ...d });acting=false;if(!adm)return; if (r.s === 401) { closeAll(); return; } if (r.e) msg = r.e; else { msg = ''; sync(r); } panel(); }
function panel() { if (!adm) return; const lock = A.total > 0 || A.phase === 'closed' || A.stage === 2;
  const rows = A.c.map(c => { const ni = h('input', { value: c.num, maxLength: 2, inputMode: 'numeric', size: 3, disabled: lock });
    return h('div', { class: 'row' }, h('b', {}, c.n + ' (' + c.num + ')'), ni, h('button', { disabled: lock, onclick: () => act('num', { id: c.id, num: ni.value }) }, 'Salvar nº'), h('button', { class: 'dg', disabled: lock, onclick: () => act('remove', { id: c.id }) }, 'Remover')); });
  const an = h('input', { class: 'w', maxLength: 24, placeholder: 'Nome', disabled: lock }), nn = h('input', { maxLength: 2, size: 3, inputMode: 'numeric', placeholder: 'Nº', disabled: lock });
  const cf = cfgBlock();
  modal(h('div', { class: 'row' }, h('h3', { class: 'panel-title' }, 'Administração'), h('button', { class: 'sec', onclick: closeAll }, 'Sair')),
    h('p', {}, 'Votos registrados: ' + A.total + ' · '+(A.stage || 1)+'º turno · '+({open:'Aberta',paused:'Pausada',closed:'Encerrada'}[A.phase] || 'Aberta')),
    electionBlock(), devBlock(),
    h('p', { class: 'err', role: 'alert' }, msg), h('details',{class:'cfg'},h('summary',{},'Gerenciar candidatos ('+A.c.length+')'),h('p', {}, lock ? 'Candidatos só podem ser alterados com a urna zerada.' : 'Candidatos:'), ...rows,
    h('div', { class: 'row' }, an, nn, h('button', { disabled: lock, onclick: () => act('add', { n: an.value.trim(), num: nn.value }) }, 'Adicionar'))),
    cf, h('div', { class: 'row' }, h('button', { onclick: () => act('mode') }, 'Modo atual: ' + (A.m === 'num' ? 'NÚMERO' : 'NOME') + ' (trocar)'), h('button', { onclick: showRes }, 'Mostrar votos'),
      h('button', { class: 'dg', onclick: () => { if (!zq) { zq = true; panel(); return; } zq = false; act('reset'); } }, zq ? 'Clique de novo para APAGAR os votos' : 'Zerar votos')), auditBlock()); }

let sideUp = () => {};
function side() {
  const list=h('div',{class:'candidate-list'}), count=h('span',{class:'candidate-count'});
  const search=h('input',{type:'search',placeholder:'Nome ou número','aria-label':'Pesquisar candidato',maxLength:24});
  const fill=()=>{const q=search.value.trim().toLocaleLowerCase('pt-BR'); const candidates=[...S.c].sort((a,b)=>a.num.localeCompare(b.num)).filter(c=>!q||c.n.toLocaleLowerCase('pt-BR').includes(q)||c.num.includes(q));
    count.textContent=String(S.c.length).padStart(2,'0');
    list.replaceChildren(...candidates.map(c=>h('div',{class:'candidate-card'},h('b',{},c.num),h('span',{},c.n))),...(candidates.length?[]:[h('p',{},'Nenhum candidato encontrado.')]));};
  search.addEventListener('input',fill);
  const panel=h('details',{class:'candidate-book'},h('summary',{},h('span',{},'CADERNO DE CANDIDATURAS'),count),h('div',{class:'book-content'},h('p',{},'Consulte o número. Digite no teclado da urna.'),search,list));
  document.body.append(panel); sideUp=full=>{if(full)fill();}; fill();
}
let pair = null, pairTm, devicePoll;
async function pairPoll() { clearTimeout(pairTm); const r = await api('pair/status');
  if (r.p === 'ok') { pair = null; const st = await api('state'); if (st.c) { S = st; applyCfg(S.cfg); } FX.snd.confirmar(); render(); return; }
  if (r.p === 'wait') { const first = !pair || pair.code !== r.code; pair = { code: r.code }; if (first) render(); pairTm = setTimeout(pairPoll, 3000); return; }
  const was = !!pair; pair = r.p === 'no' ? { denied: true } : null; if (was || pair) render(); }
async function pairAsk() { const r = await api('pair/request', { tp: navigator.maxTouchPoints || 0 }); if (r.code) { pair = { code: r.code }; render(); pairTm = setTimeout(pairPoll, 3000); } else { pair = { err: r.e || 'Erro' }; render(); } }
const pairBox = () => pair && pair.code
  ? h('div', { class: 'pair' }, h('p', {}, 'Aguardando o administrador autorizar este aparelho. Código:'), h('b', { class: 'pc' }, pair.code))
  : h('div', { class: 'pair' }, h('p', { class: 'err' }, pair && pair.denied ? 'Pedido recusado pelo administrador.' : pair && pair.err ? pair.err : 'Aparelho não autorizado a votar.'),
    h('button', { class: 'pbtn', type: 'button', onclick: pairAsk }, 'Pedir autorização ao administrador'));
function devBlock() { clearInterval(devicePoll); const box = h('div', { class: 'cfg' });
  const key = a => a.pend.map(p => p.id).join() + '|' + a.dv.map(d => d.id).join() + '|' + a.here + a.st;
  const draw = () => box.replaceChildren(h('h3', {}, 'Dispositivos'),
    h('p', {}, 'Este aparelho: ' + (A.here ? 'AUTORIZADO a votar' : 'NÃO autorizado') + ' · autorizados: ' + A.st),
    A.pend.length ? h('p', { class: 'err' }, 'Antes de aprovar, confira se o código é o mesmo que aparece na tela do aparelho.') : h('p', {}, 'Nenhum pedido pendente. (A lista atualiza sozinha.)'),
    ...A.pend.map(p => h('div', { class: 'row' }, h('b', { class: 'pc2' }, p.code), h('span', {}, p.n), h('button', { onclick: () => act('approve', { id: p.id }) }, 'Aprovar'), h('button', { class: 'dg', onclick: () => act('deny', { id: p.id }) }, 'Recusar'))),
    ...A.dv.map(d => h('div', { class: 'row' }, h('b', {}, d.n), h('button', { class: 'dg', onclick: () => act('revoke1', { id: d.id }) }, 'Remover'))),
    h('div', { class: 'row' }, h('button', { onclick: () => act('station') }, 'Autorizar este aparelho'), h('button', { class: 'dg', onclick: () => act('revoke') }, 'Revogar todos')));
  draw();
  let polling=false; const iv = devicePoll = setInterval(async () => { if (!ov || !box.isConnected) { clearInterval(iv); return; } if(polling||document.hidden||acting)return;polling=true; const r = await api('a', { a: 'state' });polling=false;
    if (r.s === 401) { clearInterval(iv); closeAll(); return; } if (r.A && key(r.A) !== key(A)) { A = r.A; S.ok = A.here; draw(); } }, 7000);
  return box; }
let resTok = 0;
function applyCfg(c) { c = c || {}; document.documentElement.dataset.profile = c.profile === 'original' ? 'original' : 'chatgpt'; document.documentElement.dataset.theme = c.profile === 'original' && c.theme === 'minimal' ? 'minimal' : 'classic';
  document.documentElement.dataset.fx = c.fx === true ? 'on' : 'off'; document.documentElement.dataset.braille = c.showBraille === false ? 'off' : 'on'; FX.cfg({ fx: c.fx === true, lv: Number.isFinite(+c.lv) ? +c.lv : 40 }); }
function electionBlock() {
  const rules=A.rules || {}, frozen=A.total>0 || A.stage===2 || A.phase==='closed';
  return h('section',{class:'cfg'},h('h3',{},'Controle da eleição'),
    h('p',{},'Defina as regras antes do primeiro voto. Brancos e nulos não entram na maioria.'),
    h('div',{class:'row'},h('button',{disabled:frozen,onclick:()=>act('rules',{secondRound:!rules.secondRound})},'Segundo turno: '+(rules.secondRound?'ATIVADO':'DESATIVADO')),
    h('button',{disabled:frozen,onclick:()=>act('rules',{randomTie:!rules.randomTie})},'Desempate aleatório: '+(rules.randomTie?'ATIVADO':'DESATIVADO'))),
    h('p',{class:'explain'},'Segundo turno: se ninguém superar 50% dos votos válidos, avançam os dois mais votados e os empatados na última vaga. O administrador abre a nova rodada após encerrar a primeira.'),
    h('p',{class:'explain'},'Desempate: no encerramento final, sorteia um vencedor entre os dois líderes empatados. Se houver mais de dois líderes empatados, sorteia primeiro a dupla entre eles. O resultado é salvo e não muda ao reabrir a apuração.'),
    h('div',{class:'row'},h('button',{disabled:A.phase==='closed',onclick:()=>act('pause')},A.phase==='paused'?'Retomar votação':'Pausar votação'),
    h('button',{class:'sec',disabled:A.phase==='closed',onclick:()=>confirmAction('Encerrar votação?','Novos votos serão bloqueados. Confira os aparelhos antes de continuar. O encerramento não pode ser desfeito.',()=>act('close'))},'Encerrar votação'),
    h('button',{class:'sec',onclick:exportResults},'Exportar boletim (JSON)')),
    A.outcome?.kind==='runoff'?h('button',{onclick:()=>confirmAction('Abrir segundo turno?','A contagem começa em zero para os finalistas. O boletim do primeiro turno será preservado.',()=>act('runoff'))},'Abrir segundo turno'):h('span',{}));
}
function confirmAction(title,description,fn){modal(h('h3',{},title),h('p',{},description),h('div',{class:'row'},h('button',{onclick:fn},'Confirmar'),h('button',{class:'sec',onclick:panel},'Cancelar')));}
async function exportResults(){const r=await api('a',{a:'export'});if(r.s!==200){msg=r.e || 'Não foi possível exportar.';panel();return;}
  const {A:adminState,s:status,...report}=r;const url=URL.createObjectURL(new Blob([JSON.stringify({school:'Eleve',exportedAt:new Date().toISOString(),...report},null,2)],{type:'application/json'}));
  const link=h('a',{href:url,download:'boletim-urna-'+new Date().toISOString().slice(0,10)+'.json'});link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function auditBlock(){const labels={cfg:'Personalização atualizada',rules:'Regras atualizadas',pause:'Pausa/retomada',close:'Votação encerrada',runoff:'Segundo turno aberto',reset:'Votos zerados',add:'Candidato adicionado',remove:'Candidato removido',num:'Número alterado',station:'Aparelho autorizado',approve:'Aparelho aprovado',deny:'Pedido recusado',revoke:'Aparelhos revogados',revoke1:'Aparelho removido',mode:'Modo alterado'};
  return h('details',{class:'cfg'},h('summary',{},'Histórico administrativo'),...(A.audit||[]).slice(0,20).map(e=>h('p',{class:'explain'},new Date(e.at).toLocaleString('pt-BR')+' · '+(labels[e.action]||e.action))));}
function cfgBlock() { const c = A.cfg, lbl = h('p', {});
  const rng = h('input', { type: 'range', min: 0, max: 100, step: 5, value: c.lv, class: 'rng', 'aria-label': 'Intensidade das animações' });
  const paint = v => { lbl.textContent = 'Intensidade das animações: ' + v + '% (partículas por clique: ' + Math.round(12 * v / 60) + ')'; }; paint(c.lv);
  rng.addEventListener('input', () => { paint(+rng.value); FX.cfg({ fx: c.fx, lv: +rng.value }); });
  rng.addEventListener('change', () => act('cfg', { lv: +rng.value }));
  return h('div', { class: 'cfg' }, h('h3', {}, 'Perfis de personalização'), h('p',{},'O símbolo da escola é preservado em todos os perfis.'), h('div',{class:'profile-options'}, h('button',{class:c.profile==='chatgpt'?'':'sec',onclick:()=>act('cfg',{profile:'chatgpt'})},'versão do chatgpt'), h('button',{class:c.profile==='original'?'':'sec',onclick:()=>act('cfg',{profile:'original'})},'Front-end original')), lbl, rng,
    h('div',{class:'row'},h('button',{onclick:()=>act('cfg',{showBraille:c.showBraille===false})},'Dígitos em Braille: '+(c.showBraille===false?'OCULTOS (mostrar)':'VISÍVEIS (ocultar)'))),
    h('div', { class: 'row' }, h('button', { onclick: () => act('cfg', { fx: !c.fx }) }, 'Animações estilo Balatro: ' + (c.fx ? 'LIGADAS (desativar)' : 'DESLIGADAS (ativar)')),
      h('button', { onclick: () => act('cfg', { theme: c.theme === 'minimal' ? 'classic' : 'minimal' }) }, 'Visual: ' + (c.theme === 'minimal' ? 'MINIMALISTA' : 'CLÁSSICO') + ' (trocar)'))); }
async function showRes() {
  const q=await api('a',{a:'results'});if(q.s!==200){msg=q.e||'Não foi possível consultar.';panel();return;}
  const total=q.r.reduce((n,c)=>n+c.v,0), maximum=Math.max(...q.r.map(c=>c.v)), leaders=q.r.filter(c=>c.v===maximum && maximum>0);
  const o=q.outcome||{}, closed=q.phase==='closed';
  const title=!closed?'APURAÇÃO PARCIAL':o.kind==='runoff'?'SEGUNDO TURNO':o.kind==='tie'?'EMPATE':o.kind==='empty'?'SEM VOTOS VÁLIDOS':'RESULTADO FINAL';
  const name=!closed?'Votação '+(q.phase==='paused'?'pausada':'em andamento'):o.winner?.n || (o.kind==='tie'?leaders.map(c=>c.n).join(' · '):o.kind==='runoff'?'Aguardando abertura do próximo turno':'Nenhum vencedor');
  const rows=[...q.r].sort((a,b)=>b.v-a.v).map(c=>h('div',{class:'result-row'},h('b',{},c.num),h('span',{},c.n),h('strong',{},String(c.v)),h('small',{},total?(c.v/total*100).toFixed(1)+'%':'0%'),h('progress',{class:'result-meter',max:100,value:total?c.v/total*100:0,'aria-label':c.n+': '+c.v+' votos'})));
  modal(h('div',{class:'row'},h('h3',{},title),h('button',{class:'sec',onclick:panel},'Voltar ao painel')),h('h2',{class:'result-name'},name),
    h('p',{},q.stage+'º turno · '+(closed?'Encerrado':'Resultado provisório')),
    o.kind==='draw'?h('p',{class:'draw-note'},'Vencedor por sorteio registrado em '+new Date(o.at).toLocaleString('pt-BR')+'. Dupla sorteada: '+o.pool.map(c=>c.n).join(' e ')+'. Total de líderes empatados: '+o.tied+'.'):h('span',{}),
    ...rows,h('div',{class:'result-totals'},h('span',{},'Válidos: '+total),h('span',{},'Brancos: '+q.b),h('span',{},'Nulos: '+q.n),h('strong',{},'Total: '+(total+q.b+q.n))),h('button',{onclick:exportResults},'Exportar boletim'));
}
let refreshing=false,started=false;
async function refreshState(){if(!started||refreshing||document.hidden||adm||ov||busy||buf||sel)return;refreshing=true;try{const r=await api('state');if(r.c){const changed=JSON.stringify([S.c,S.cfg,S.round,S.lock,S.ok])!==JSON.stringify([r.c,r.cfg,r.round,r.lock,r.ok]);S=r;applyCfg(S.cfg);if(changed)render();}}finally{refreshing=false;}}
setInterval(refreshState,15000);addEventListener('online',refreshState);document.addEventListener('visibilitychange',refreshState);
async function start(){const r=await api('state');if(!r.c){$('#app').replaceChildren(h('img',{src:'/logo.png',alt:'Logo da escola',width:48}),h('p',{role:'alert'},r.e||'Não foi possível conectar à urna.'),h('button',{type:'button',onclick:start},'Tentar novamente'));return;}S=r;applyCfg(S.cfg);if(!started){soundControl();side();}started=true;render();if(!S.ok)pairPoll();if(window.UrnaVotes.hasPending())recoverVote();}
start();
})();
