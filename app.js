const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
const closeMenu=()=>{navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false')};
menuButton.addEventListener('click',()=>{const opened=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened))});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus()}});

const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const press=(group,active)=>group.forEach(b=>{const on=b===active;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});

// Filters: industry and skill chips over the work path.
const filterButtons=[...document.querySelectorAll('[data-filter]')];
const chapters=[...document.querySelectorAll('.chapter')];
filterButtons.forEach(button=>button.addEventListener('click',()=>{
  const f=button.dataset.filter;
  press(filterButtons,button);
  let shown=0;
  chapters.forEach(c=>{c.hidden=f!=='all'&&!c.dataset.tags.split(' ').includes(f);if(!c.hidden){shown++;c.classList.add('in')}});
  document.querySelector('#filter-status').textContent=f==='all'?`Showing all ${chapters.length}.`:`Showing ${shown} of ${chapters.length}: ${button.textContent.trim()}.`;
}));

// Rise before/after.
const baButtons=[...document.querySelectorAll('[data-ba]')];
baButtons.forEach(b=>b.addEventListener('click',()=>{press(baButtons,b);document.querySelectorAll('.ba-panel').forEach(p=>p.hidden=p.dataset.panel!==b.dataset.ba)}));

// "Explore the data" toggles swap the static chart for the explorer.
document.querySelectorAll('.explore-toggle').forEach(t=>t.addEventListener('click',()=>{
  const open=t.getAttribute('aria-expanded')!=='true';
  t.setAttribute('aria-expanded',String(open));
  t.firstChild.textContent=open?'Back to the chart ':'Explore the data ';
  document.getElementById(t.getAttribute('aria-controls')).hidden=!open;
  t.parentElement.querySelector('.evidence-image').hidden=open;
}));

// NFL: average guaranteed amount by signing team ($M, read from the original Tableau chart).
const nfl=[["Rams",5.18],["Chargers",4.96],["Browns",4.71],["Eagles",4.61],["Chiefs",3.91],["Buccaneers",3.85],["Vikings",3.78],["Saints",3.72],["Cowboys",3.64],["Cardinals",3.55],["Falcons",3.54],["Bills",3.50],["Jets",3.38],["Lions",3.37],["Panthers",3.33],["Ravens",3.18],["Jaguars",3.18],["Commanders",3.17],["Dolphins",3.16],["Raiders",3.14],["Giants",3.11],["Broncos",3.01],["Packers",3.01],["Bears",2.92],["Titans",2.91],["Texans",2.89],["49ers",2.87],["Bengals",2.78],["Seahawks",2.75],["Patriots",2.67],["Colts",2.57],["Steelers",2.57]];
const nflBox=document.querySelector('[data-chart="nfl"]');
if(nflBox){
  const W=640,H=270,left=46,bottom=26,max=6,bw=(W-left)/nfl.length;
  const y=v=>H-bottom-(v/max)*(H-bottom-10);
  let svg=`<svg viewBox="0 0 ${W} ${H}">`;
  [0,1,2,3,4,5].forEach(t=>svg+=`<text x="${left-6}" y="${y(t)+3}" text-anchor="end">$${t}M</text><line x1="${left}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#4b433a" stroke-width=".5"/>`);
  nfl.forEach(([team,v],i)=>{svg+=`<rect class="${i<5?'top':''}" tabindex="0" x="${left+i*bw+2}" y="${y(v)}" width="${bw-4}" height="${y(0)-y(v)}" data-i="${i}" aria-label="${team}: about $${v.toFixed(1)} million"></rect>`;if(i===0||i===nfl.length-1)svg+=`<text x="${left+i*bw+bw/2}" y="${H-6}" text-anchor="${i?'end':'start'}">${team}</text>`});
  nflBox.innerHTML=svg+'</svg>';
  const out=nflBox.parentElement.querySelector('.explorer-readout');
  const show=r=>{nflBox.querySelectorAll('rect').forEach(x=>x.classList.toggle('on',x===r));const[t,v]=nfl[r.dataset.i];out.innerHTML=`<b>${t}</b> · ≈ $${v.toFixed(2)}M average guaranteed · rank ${+r.dataset.i+1} of 32${+r.dataset.i<5?' · top 5':''}`};
  nflBox.querySelectorAll('rect').forEach(r=>['mouseenter','focus','click'].forEach(ev=>r.addEventListener(ev,()=>show(r))));
}

// Housing: annotated county hotspots.
document.querySelectorAll('.hotspot-chart').forEach(chart=>{
  const out=chart.parentElement.querySelector('.explorer-readout');
  const dots=[...chart.querySelectorAll('.hotspot')];
  dots.forEach(d=>d.addEventListener('click',()=>{dots.forEach(x=>x.classList.toggle('on',x===d));out.innerHTML=d.dataset.note}));
});

// Hog Heaven: model error rates by metric (misclassification, false positive, false negative).
const models=[["Baseline (call everyone)",[54.2,100,0]],["Gradient boosting",[21.86,23.72,20.31],true],["Sequential tree → neural net",[22.16,23.59,21.01]],["Decision tree (2-branch, depth 6)",[22.27,23.40,21.37]],["Ensemble decision tree",[30.18,30.70,29.82]]];
const modelBox=document.querySelector('[data-chart="models"]');
if(modelBox){
  modelBox.innerHTML=models.map(([n,,best])=>`<div class="model-row${best?' best':''}"><span class="name">${n}</span><span class="track"><span class="fill"></span></span><span class="val"></span></div>`).join('');
  const rows=[...modelBox.children];
  const notes=['The baseline calls <b>everyone</b>, so it never misses a buyer but wastes a $7 call on every non-buyer.','<b>False positives</b> are wasted $7 calls. Gradient boosting cuts them from 100% to 23.7%.','<b>False negatives</b> are missed buyers. Gradient boosting has the lowest rate of the real models, at 20.3%.'];
  const draw=m=>rows.forEach((row,i)=>{const v=models[i][1][m];row.querySelector('.fill').style.width=`${v}%`;row.querySelector('.val').textContent=`${v}%`});
  const metricButtons=[...modelBox.parentElement.querySelectorAll('[data-metric]')];
  metricButtons.forEach(b=>b.addEventListener('click',()=>{press(metricButtons,b);draw(+b.dataset.metric);modelBox.parentElement.querySelector('.explorer-readout').innerHTML=notes[b.dataset.metric]}));
  draw(0);
}

// MedAI: replay the logged test exchange.
const chat=document.querySelector('.chat-replay');
if(chat){
  const msgs=[...chat.querySelectorAll('.msg')];
  let timers=[];
  const play=()=>{
    timers.forEach(clearTimeout);timers=[];
    if(reduceMotion){msgs.forEach(m=>m.classList.remove('pending'));return}
    msgs.forEach(m=>m.classList.add('pending'));
    msgs.forEach((m,i)=>timers.push(setTimeout(()=>m.classList.remove('pending'),300+i*900)));
  };
  chat.querySelector('.replay-button').addEventListener('click',play);
  chat.dataset.play='1';
  window.__playChat=play;
}

// Count-up for headline numbers, and gentle reveal of each chapter.
const fmt=(n,el)=>(el.dataset.prefix||'')+Math.round(n).toLocaleString('en-US')+(el.dataset.suffix||'');
const countUp=el=>{const end=+el.dataset.count,t0=performance.now(),dur=1100;const step=t=>{const p=Math.min((t-t0)/dur,1);el.textContent=fmt(end*(1-Math.pow(1-p,3)),el);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)};
if(!reduceMotion&&'IntersectionObserver' in window){
  chapters.forEach(c=>c.classList.add('reveal'));
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(!e.isIntersecting)return;
    const el=e.target;io.unobserve(el);
    if(el.classList.contains('chapter')){el.classList.add('in');el.querySelectorAll('[data-count]').forEach(countUp);if(el.querySelector('.chat-replay'))window.__playChat&&window.__playChat()}
  }),{threshold:.18});
  chapters.forEach(c=>io.observe(c));
}
