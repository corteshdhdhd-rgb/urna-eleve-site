(() => { 'use strict';
const media=matchMedia('(prefers-reduced-motion: reduce)');let on=false,lv=.4;
const mul=()=>on&&!media.matches&&!document.hidden?lv/.6:0;
const pop=(el,scale=1.1)=>{if(!el||!mul())return;el.animate([{transform:'scale('+Math.min(1.12,1+(scale-1)*mul())+')'},{transform:'none'}],{duration:160,easing:'ease-out'});};
const punch=el=>pop(el,1.04);
const juice=el=>{el.addEventListener('pointerdown',()=>punch(el));};
const shake=el=>{if(el&&mul())el.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150});};
function burst(x,y,col='#fff',n=10){if(!mul())return; n=Math.min(12,Math.max(0,Math.round(n*mul())));const colors={'#fff':'white','#cfcfcf':'neutral','#ec7928':'orange','#0f0':'green'};for(let i=0;i<n;i++){const p=document.createElement('i');p.className='pt pt-'+(col==='multi'?'multi-'+Math.floor(Math.random()*12):(colors[col]||'white'));document.body.append(p);const a=Math.random()*Math.PI*2,d=20+Math.random()*45;
const anim=p.animate([{transform:'translate('+x+'px,'+y+'px)',opacity:1},{transform:'translate('+(x+Math.cos(a)*d)+'px,'+(y+Math.sin(a)*d+20)+'px)',opacity:0}],{duration:300});anim.onfinish=anim.oncancel=()=>p.remove();}}
const count=(el,to)=>{el.textContent=String(to);};
const spring=cb=>{let t=0;return {get t(){return t;},set t(v){t=v;cb(v,0);}};};
const parallax=()=>{};
/* ---- sons (WebAudio, nenhum arquivo externo) ---- */
let ac, mute = false; try { mute = localStorage.getItem('urna.mute') === '1'; } catch (e) { }
const ctx = () => { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); } if (ac.state === 'suspended') ac.resume(); return ac; };
function tone(f, d = .1, type = 'sine', v = .15, to = 0, at = 0, hold = 0) { const c = mute ? null : ctx(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); if (hold) g.gain.setValueAtTime(v, t + d * hold); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02); }
function noise(d = .15, f0 = 2000, f1 = 500, v = .12, at = 0) { const c = mute ? null : ctx(); if (!c) return;
  const n = c.sampleRate * d | 0, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + at; s.buffer = b; fl.type = 'bandpass'; fl.Q.value = 1.2;
  fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl).connect(g).connect(c.destination); s.start(t); }
const PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const snd = {
  key: d => { const f = 330 * 2 ** (PENT[d] / 12); tone(f, .1, 'triangle', .2); tone(f * 2, .05, 'sine', .05); },        // teclas: nota por dígito
  name: i => { tone(300 + (i % 12) * 28, .11, 'square', .07); tone(600 + (i % 12) * 56, .06, 'sine', .05); },           // nomes: "pop"
  branco: () => { noise(.24, 3200, 800, .16); tone(660, .14, 'sine', .06); },                                          // branco: sopro suave
  corrige: () => { tone(340, .2, 'sawtooth', .1, 110); tone(220, .22, 'square', .05, 80, .05); },                      // corrige: descida grave
  confirmar: () => { tone(660, .09, 'square', .08); tone(990, .16, 'square', .08, 0, .08); },                          // confirma: dois "bips" subindo
  fim: () => tone(880, 1.2, 'sine', .22, 0, 0, .8),                                                                    // fim: bipe longo da urna
  drum: () => { const n = 30, T = 2.9; for (let i = 0; i < n; i++) { const u = i / n, t = T * (1 - (1 - u) ** 2), v = .05 + .14 * u; tone(120, .1, 'sine', v, 55, t); noise(.07, 1400, 300, v * .8, t); } }, // rufar de tambor acelerando
  boom: () => { tone(80, .9, 'sine', .4, 28); noise(.9, 700, 70, .3); },
  fanfare: () => { [[261.6, 329.6, 392, 523.3], [392, 493.9, 587.3, 784]].forEach((ch, k) => ch.forEach(f => { tone(f, k ? 2 : .4, 'square', .045, 0, k * .4, .5); tone(f / 2, k ? 2 : .4, 'triangle', .09, 0, k * .4, .5); })); },
  click: () => tone(440, .05, 'triangle', .1) };
window.FX={cfg:o=>{on=o.fx===true;lv=Math.max(0,Math.min(1,(+o.lv||0)/100));},mul,pop,punch,juice,shake,burst,count,spring,parallax,snd,muted:()=>mute,setMute:m=>{mute=m;try{localStorage.setItem('urna.mute',m?'1':'0');}catch{}}};
})();
