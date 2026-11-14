// Renderiza el reel 18 cuadro a cuadro (30 fps) en frames/
const {chromium} = require('playwright');
const fs = require('fs');
const S = __dirname, OUT = S + '/frames';
fs.rmSync(OUT, {recursive:true, force:true}); fs.mkdirSync(OUT);
const FPS = 30, PH = {x:134, y:494, k:2.0199};
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
let n = 0;

(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:1080,height:1920}, deviceScaleFactor:1});
  const page = await ctx.newPage();
  await page.goto('http://localhost:8766/stage.html', {waitUntil:'networkidle'});
  await page.waitForTimeout(800);
  const app = page.frames().find(f=>f.url().includes('8765'));
  await app.evaluate(()=>{ document.documentElement.style.scrollBehavior='auto'; const st=document.createElement('style'); st.textContent='*{scroll-behavior:auto!important;caret-color:transparent}'; document.head.appendChild(st); });

  const shot = async () => { await page.screenshot({path:`${OUT}/${String(n++).padStart(5,'0')}.jpg`, type:'jpeg', quality:92}); };
  const hold = async k => { for(let i=0;i<k;i++) await shot(); };
  const cap = (html, op=1) => page.evaluate(([h,o])=>{ const c=document.getElementById('capt'); c.innerHTML=h; c.style.opacity=o; c.style.transform=`translateY(${(1-o)*24}px)`; }, [html, op]);
  const show = id => page.evaluate(id=>{ ['s1','s5','s7'].forEach(x=>document.getElementById(x).style.display = x===id?'block':'none'); document.getElementById('phone').style.display = id?'none':'block'; }, id);
  const her = src => page.evaluate(s=>{ const h=document.getElementById('her'); if(s){h.src=s;h.style.display='block';} else h.style.display='none'; }, src);
  const tapAt = (x,y,on) => page.evaluate(([x,y,on])=>{ const t=document.getElementById('tap'); t.style.display=on?'block':'none'; t.style.left=x+'px'; t.style.top=y+'px'; }, [x,y,on]);
  const scrollY = () => app.evaluate(()=>window.scrollY);
  const scrollTo = y => app.evaluate(y=>window.scrollTo(0,y), y);
  const topOf = sel => app.evaluate(s=>{ const e=document.querySelector(s); return e.getBoundingClientRect().top + window.scrollY; }, sel);
  const centerOf = async sel => { const r = await app.evaluate(s=>{ const e=document.querySelector(s).getBoundingClientRect(); return {x:e.left+e.width/2, y:e.top+e.height/2}; }, sel); return {x: PH.x + r.x*PH.k, y: PH.y + r.y*PH.k}; };
  const tap = async (sel, frames=8) => { const c = await centerOf(sel); await tapAt(c.x, c.y, true); await hold(frames); await tapAt(0,0,false); };
  const pan = async (to, frames, everyFrame) => { const from = await scrollY(); for(let i=1;i<=frames;i++){ await scrollTo(from + (to-from)*ease(i/frames)); if(everyFrame) await everyFrame(i); await shot(); } };
  const capIn = async (html, frames) => { for(let i=1;i<=8;i++){ await cap(html, i/8); await shot(); } return frames-8; };

  // ---------- Escena 1 (4 s): tres tarjetas ----------
  const T1 = '¿Tienes <em>tres</em> nombres para tu marca?';
  await show('s1');
  for(let i=0;i<120;i++){
    await page.evaluate(i=>{ document.querySelectorAll('.card').forEach((c,j)=>{ const t=Math.min(Math.max((i-10-j*14)/14,0),1); c.style.opacity=t; c.style.transform=`translateX(${(1-t)*-120}px) rotate(${(1-t)*-4}deg)`; }); }, i);
    await cap(T1, Math.min(i/8,1)); await shot();
  }

  // ---------- Escena 2 (5 s): escribir los nombres ----------
  const T2 = '<em>Escribes</em> qué vendes y tus opciones.';
  await show(null); await cap(T2, 0);
  for(let i=1;i<=30;i++){ await her(`her_${String(i).padStart(3,'0')}.jpg`); await cap(T2, Math.min(i/8,1)); await shot(); }
  await her(null);
  await app.click('[data-go="scrA"]'); await app.waitForTimeout(300);
  await scrollTo(await topOf('label[for="n1"]') - 40);
  const names = ['Natural Skin','Rosa Clara','Velmira'];
  for(let k=0;k<3;k++){ for(let c=1;c<=names[k].length;c++){ await app.fill('#n'+(k+1), names[k].slice(0,c)); await shot(); if(c%3==0) await shot(); } await hold(3); }
  await tap('#a-next', 6); await app.click('#a-next'); await app.waitForTimeout(150);
  await app.selectOption('#sector','cosmeticos');
  await scrollTo(await topOf('label[for="sector"]') - 30);
  const d = 'Cremas y jabones naturales hechos a mano';
  for(let c=2;c<=d.length;c+=2){ await app.fill('#desc', d.slice(0,c)); await shot(); }
  console.log("n", n, "budget", 270); while(n < 270) await shot();

  // ---------- Escena 3 (6 s): resultado ordenado ----------
  const T3 = 'Lexa muestra cuál tiene más <em>probabilidad</em> de registrarse.';
  await scrollTo(await topOf('#go') - 300);
  await tap('#go', 6);
  await app.click('#go');
  // pantalla de espera real: unos cuadros
  for(let i=0;i<24;i++){ await cap(T3, Math.min((i+1)/8,1)); await shot(); await app.waitForTimeout(90); }
  await app.waitForFunction(()=>document.getElementById('results').style.display==='block' && !document.getElementById('ovl').classList.contains('on'), null, {timeout:15000});
  await app.waitForTimeout(1200); await cap(T3,1);
  const c1 = await topOf('#cards .result:nth-child(1)');
  await scrollTo(c1 - 12); await hold(45);
  const c2 = await topOf('#cards .result:nth-child(2)');
  await pan(c2 - 12, 30); await hold(20);
  const c3 = await topOf('#cards .result:nth-child(3)');
  await pan(c3 - 12, 30);
  console.log("n", n, "budget", 450); while(n < 450) await shot();

  // ---------- Escena 4 (5 s): el porqué ----------
  const T4 = 'Y te explica el <em>porqué</em>, en palabras sencillas.';
  await pan(c2 + 150, 20, async i => cap(T4, Math.min(i/8,1)));
  await hold(50);
  const tip = await topOf('#cards .result:nth-child(2) .tip');
  await pan(tip - 330, 30);
console.log("n", n, "budget", 600); while(n < 600) await shot();

  // ---------- Escena 5 (5 s): caminos ----------
  const T5 = 'No es un sí o un no: es cuál tiene más <em>camino</em>.';
  await show('s5');
  for(let i=0;i<150;i++){
    await page.evaluate(i=>{ [['p1','l1',0],['p2','l2',12],['p3','l3',24]].forEach(([p,l,dl])=>{ const e=document.getElementById(p), L=e.getTotalLength(); const t=Math.min(Math.max((i-8-dl)/40,0),1); const tt = 1-Math.pow(1-t,3); e.style.strokeDasharray=L; e.style.strokeDashoffset=L*(1-tt); document.getElementById(l).style.opacity = tt; }); }, i);
    await cap(T5, Math.min((i+1)/8,1)); await shot();
  }

  // ---------- Escena 6 (5 s): favoritos y nuevas propuestas ----------
  const T6 = 'Si ninguno convence, <em>propone</em> nombres que suenan a ti.';
  await show(null);
  await scrollTo(await topOf('#props .prop:nth-child(1)') - 40);
  for(let i=1;i<=8;i++){ await cap(T6, i/8); await shot(); }
  await hold(14);
  await tap('#props .prop:nth-child(1) .heart', 5); await app.click('#props .prop:nth-child(1) .heart'); await hold(12);
  await tap('#props .prop:nth-child(2) .heart', 5); await app.click('#props .prop:nth-child(2) .heart'); await hold(14);
  await pan(await topOf('#more-fav') - 330, 18);
  await tap('#more-fav', 6); await app.click('#more-fav');
  await app.waitForTimeout(1200);
  await scrollTo(await topOf('#props-intro') - 30);
  console.log("n", n, "budget", 900); while(n < 900) await shot();

  // ---------- Escena 7 (4 s): cierre ----------
  const T7 = 'Es una <em>orientación</em>, no una garantía de registro.';
  await show('s7');
  for(let i=0;i<180;i++){ await page.evaluate(i=>{ const bx=document.querySelector('#s7 .box'); const t=Math.min(i/14,1); bx.style.opacity=t; bx.style.transform=`scale(${.96+.04*t})`; }, i); await cap(T7, Math.min((i+1)/8,1)); await shot(); }

  console.log('frames', n);
  await b.close();
})().catch(e=>{ console.error(e); process.exit(1); });
