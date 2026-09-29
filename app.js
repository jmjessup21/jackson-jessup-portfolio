const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
const closeMenu=()=>{navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false')};
menuButton.addEventListener('click',()=>{const opened=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened))});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus()}});
document.addEventListener('pointerdown',e=>{if(navigation.classList.contains('open')&&!navigation.contains(e.target)&&!menuButton.contains(e.target))closeMenu()});
matchMedia('(min-width: 761px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
navigation.addEventListener('focusout',e=>{if(navigation.classList.contains('open')&&e.relatedTarget&&!navigation.contains(e.relatedTarget)&&e.relatedTarget!==menuButton)closeMenu()});

// Keep the page navigation in sync with the section in view.
const sectionLinks=[...navigation.querySelectorAll('a[href^="#"]')];
let navFrame=0;
const updateCurrentSection=()=>{
  navFrame=0;
  let current='';
  sectionLinks.forEach(link=>{
    const section=document.querySelector(link.getAttribute('href'));
    if(section&&section.getBoundingClientRect().top<=160)current=link.getAttribute('href');
  });
  sectionLinks.forEach(link=>{
    const active=link.getAttribute('href')===current;
    link.classList.toggle('is-current',active);
    if(active)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
};
window.addEventListener('scroll',()=>{if(!navFrame)navFrame=requestAnimationFrame(updateCurrentSection)},{passive:true});
window.addEventListener('resize',updateCurrentSection);
updateCurrentSection();

const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const press=(group,active)=>group.forEach(b=>{const on=b===active;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});

// Filters: industry and skill chips over the work path.
const filterButtons=[...document.querySelectorAll('[data-filter]')];
const chapters=[...document.querySelectorAll('.chapter')];

// Work at a glance: one jump link per chapter, built from the chapter's own text
// (number, field, finding, title) so the index can never drift from the case study.
const workIndex=document.querySelector('#work-index');
const indexItems=new Map();
if(workIndex){
  const list=workIndex.querySelector('ol');
  chapters.forEach(c=>{
    const meta=c.querySelector('.project-meta').textContent.split('·').map(t=>t.trim());
    const title=c.querySelector('h3').textContent.trim();
    const finding=c.querySelector('.finding strong').textContent.trim();
    const li=document.createElement('li');
    const a=document.createElement('a');
    a.href='#'+c.id;
    a.innerHTML='<span class="wi-top"><span class="wi-num"></span><span class="wi-kind"></span></span><strong class="wi-finding"></strong><span class="wi-title"></span>';
    a.querySelector('.wi-num').textContent=meta[0];
    a.querySelector('.wi-kind').textContent=meta[1];
    a.querySelector('.wi-finding').textContent=finding;
    a.querySelector('.wi-title').textContent=title;
    a.addEventListener('click',e=>{
      e.preventDefault();
      c.classList.add('in');
      c.setAttribute('tabindex','-1');
      c.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
      c.focus({preventScroll:true});
      if(location.hash!=='#'+c.id)history.pushState(null,'','#'+c.id);
    });
    li.append(a);list.append(li);indexItems.set(c,li);
  });
  workIndex.hidden=false;
}

// One active filter per group (Industry AND Skill); "All work" clears both.
const filterStatus=document.querySelector('#filter-status');
const filterEmpty=document.querySelector('#filter-empty');
const groupOf=b=>b.closest('[aria-label="Skill filters"]')?'skill':b.closest('[aria-label="Industry filters"]')?'industry':null;
const selected={industry:null,skill:null};
const filterLabel=f=>{const b=filterButtons.find(x=>x.dataset.filter===f);return b?b.textContent.trim():f};
const applyFilters=({scroll=false}={})=>{
  filterButtons.forEach(b=>{const g=groupOf(b);const on=g?selected[g]===b.dataset.filter:!selected.industry&&!selected.skill;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  const active=[selected.industry,selected.skill].filter(Boolean);
  let shown=0;
  chapters.forEach(c=>{const tags=c.dataset.tags.split(' ');c.hidden=!active.every(t=>tags.includes(t));if(indexItems.has(c))indexItems.get(c).hidden=c.hidden;if(!c.hidden){shown++;c.classList.add('in')}});
  if(workIndex&&indexItems.size)workIndex.hidden=shown===0;
  if(filterEmpty)filterEmpty.hidden=shown>0;
  const names=active.map(filterLabel).join(' + ');
  filterStatus.textContent=!active.length?`Showing all ${chapters.length}.`:`Showing ${shown} of ${chapters.length}: ${names}.`;
  // The empty-state box explains a 0 result visually; screen readers hear it through the live status.
  if(active.length&&!shown){const sr=document.createElement('span');sr.className='sr-only';sr.textContent=' No work matches both filters.';filterStatus.append(sr)}
  // Keep the filtered view in the URL so it can be shared or reloaded.
  const q=new URLSearchParams(location.search);
  ['industry','skill'].forEach(g=>{if(selected[g])q.set(g,selected[g]);else q.delete(g)});
  const qs=q.toString();
  history.replaceState(history.state,'',location.pathname+(qs?'?'+qs:'')+location.hash);
  // On phones, bring the updated results into view when they sit below the fold.
  if(scroll&&matchMedia('(max-width: 760px)').matches){
    const target=shown?(workIndex&&!workIndex.hidden?workIndex:chapters.find(c=>!c.hidden)):filterEmpty;
    if(target&&target.getBoundingClientRect().top>innerHeight-140)filterStatus.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
  }
};
filterButtons.forEach(button=>button.addEventListener('click',()=>{
  const g=groupOf(button),f=button.dataset.filter;
  if(!g){selected.industry=null;selected.skill=null}
  else selected[g]=selected[g]===f?null:f;
  applyFilters({scroll:true});
}));
if(filterEmpty)filterEmpty.querySelector('.filter-reset').addEventListener('click',()=>{selected.industry=null;selected.skill=null;applyFilters();document.querySelector('.filter-all').focus()});
{
  const q=new URLSearchParams(location.search);let restored=false;
  ['industry','skill'].forEach(g=>{const v=q.get(g);if(v&&filterButtons.some(b=>groupOf(b)===g&&b.dataset.filter===v)){selected[g]=v;restored=true}});
  if(restored)applyFilters();
}
// Mobile filter rails: fade the edge that has more chips behind it.
document.querySelectorAll('.filter-rail').forEach(rail=>{
  const update=()=>{rail.classList.toggle('scrolled',rail.scrollLeft>2);rail.classList.toggle('at-end',rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2)};
  rail.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
});

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
  let svg=`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  [0,1,2,3,4,5].forEach(t=>svg+=`<text x="${left-6}" y="${y(t)+3}" text-anchor="end">$${t}M</text><line x1="${left}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#4b433a" stroke-width=".5"/>`);
  nfl.forEach(([team,v],i)=>{svg+=`<rect class="${i<5?'top':''}" x="${left+i*bw+2}" y="${y(v)}" width="${bw-4}" height="${y(0)-y(v)}" data-i="${i}"></rect>`;if(i===0||i===nfl.length-1)svg+=`<text x="${left+i*bw+bw/2}" y="${H-6}" text-anchor="${i?'end':'start'}">${team}</text>`});
  nflBox.innerHTML=svg+'</svg>';
  const out=nflBox.parentElement.querySelector('.explorer-readout');
  const picker=nflBox.parentElement.querySelector('#nfl-team');
  nfl.forEach(([team],i)=>picker.add(new Option(team,String(i))));
  const bars=[...nflBox.querySelectorAll('rect')];
  const show=i=>{bars.forEach((bar,j)=>bar.classList.toggle('on',j===i));picker.value=String(i);const[t,v]=nfl[i];out.innerHTML=`<b>${t}</b> · ≈ $${v.toFixed(2)}M average guaranteed · rank ${i+1} of 32${i<5?' · top 5':''}`};
  bars.forEach(bar=>['mouseenter','click'].forEach(ev=>bar.addEventListener(ev,()=>show(+bar.dataset.i))));
  picker.addEventListener('change',()=>show(+picker.value));
}

// Housing: annotated county hotspots.
document.querySelectorAll('.hotspot-chart').forEach(chart=>{
  const out=chart.parentElement.querySelector('.explorer-readout');
  const dots=[...chart.querySelectorAll('.hotspot')];
  dots.forEach(d=>{
    const label=document.createElement('span');label.innerHTML=d.dataset.note;
    d.setAttribute('aria-label',label.textContent);
    d.setAttribute('aria-pressed','false');
    const show=()=>{dots.forEach(x=>{const on=x===d;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on))});out.innerHTML=d.dataset.note};
    d.addEventListener('click',show);
  });
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
  const replayButton=chat.querySelector('.replay-button');
  replayButton.addEventListener('click',play);
  if(reduceMotion)replayButton.hidden=true;
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

// Evidence viewer: open charts, models, and previews in place instead of a bare image tab.
// Links keep their href, so modifier-clicks, middle-clicks, and no-JS visits still open the original file.
const evidenceLinks=[...document.querySelectorAll('a.evidence-image,.supporting-artifact a')];
if(evidenceLinks.length&&typeof HTMLDialogElement==='function'){
  const viewer=document.createElement('dialog');
  viewer.className='lightbox';
  viewer.setAttribute('aria-labelledby','lightbox-caption');
  viewer.innerHTML='<div class="lightbox-bar"><button type="button" class="lightbox-zoom" aria-pressed="false">Actual size</button><a class="lightbox-original" target="_blank" rel="noopener">Open original <span aria-hidden="true">↗</span></a><button type="button" class="lightbox-close">Close <span aria-hidden="true">×</span></button></div><div class="lightbox-stage" tabindex="0" role="group" aria-label="Image viewer. Scroll to pan when shown at actual size."><img alt=""></div><div class="lightbox-foot"><button type="button" class="lightbox-prev"><span aria-hidden="true">‹</span> Previous</button><p class="lightbox-caption" aria-live="polite"><span class="lightbox-count"></span><span id="lightbox-caption"></span><small class="lightbox-note"></small></p><button type="button" class="lightbox-next">Next <span aria-hidden="true">›</span></button></div>';
  document.body.append(viewer);
  const q=sel=>viewer.querySelector(sel);
  const img=q('img'),stage=q('.lightbox-stage'),zoom=q('.lightbox-zoom'),original=q('.lightbox-original'),closeButton=q('.lightbox-close');
  const captionText=q('#lightbox-caption'),count=q('.lightbox-count'),note=q('.lightbox-note'),prev=q('.lightbox-prev'),next=q('.lightbox-next');
  let trigger=null,current=null;
  // Items the visitor can currently reach: skips chapters hidden by filters and charts swapped for an explorer.
  const available=()=>evidenceLinks.filter(l=>!l.closest('[hidden]'));
  const isSvg=u=>/\.svg(?:$|[?#])/i.test(u||'');
  // SVG previews have no intrinsic size, so "Actual size" shows them at their 1200px design width.
  const setZoom=on=>{viewer.classList.toggle('actual',on);zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?'Fit to screen':'Actual size';img.style.width=on&&isSvg(img.getAttribute('src'))?'1200px':'';stage.scrollTo(0,0)};
  const show=link=>{
    current=link;
    const source=link.querySelector('img');
    const href=link.getAttribute('href');
    img.src=link.dataset.viewerSrc||href;
    img.alt='';// the caption (and the dialog name) already describe the image
    captionText.textContent=source?source.alt:'';
    const fc=link.closest('figure')&&link.closest('figure').querySelector('figcaption');
    note.textContent=fc?fc.textContent.trim():'';
    note.hidden=!fc;
    const list=available();
    count.textContent=`${list.indexOf(link)+1} of ${list.length}`;
    prev.hidden=next.hidden=list.length<2;
    original.href=href;
    setZoom(false);
  };
  const go=d=>{const list=available();if(list.length<2)return;const i=Math.max(0,list.indexOf(current));show(list[(i+d+list.length)%list.length])};
  evidenceLinks.forEach(link=>link.addEventListener('click',e=>{
    if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();
    trigger=link;
    show(link);
    viewer.showModal();
    closeButton.focus();
  }));
  zoom.addEventListener('click',()=>setZoom(!viewer.classList.contains('actual')));
  prev.addEventListener('click',()=>go(-1));
  next.addEventListener('click',()=>go(1));
  viewer.addEventListener('keydown',e=>{
    if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
    if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
    if(e.target===stage&&viewer.classList.contains('actual'))return;// arrows pan the zoomed image
    e.preventDefault();
    go(e.key==='ArrowRight'?1:-1);
  });
  closeButton.addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});
  viewer.addEventListener('close',()=>{img.removeAttribute('src');img.style.width='';current=null;if(trigger){trigger.focus();trigger=null}});
}
