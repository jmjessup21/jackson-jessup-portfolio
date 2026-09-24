const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
const closeMenu=()=>{navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false')};
menuButton.addEventListener('click',()=>{const opened=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened))});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus()}});
