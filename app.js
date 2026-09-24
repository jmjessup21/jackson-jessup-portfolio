const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
const closeMenu=()=>{navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false')};
menuButton.addEventListener('click',()=>{const opened=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened))});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;let count=0;
 document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
 document.querySelectorAll('[data-category]').forEach(project=>{project.hidden=filter!=='all'&&!project.dataset.category.split(' ').includes(filter);if(!project.hidden)count++});
 document.querySelector('#filter-status').textContent=`Showing ${count} ${count===1?'project':'projects'}.`;
}));
