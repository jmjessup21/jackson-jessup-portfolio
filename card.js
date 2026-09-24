const cardUrl='https://jmjessup21.github.io/jackson-jessup-portfolio/card.html';
const status=document.querySelector('#share-status');
document.querySelector('#share-card').addEventListener('click',async()=>{
  status.textContent='';
  if(navigator.share){
    try{await navigator.share({title:'Jackson Jessup — Digital business card',text:'My portfolio and contact details.',url:cardUrl});return;}
    catch(error){if(error.name==='AbortError')return;}
  }
  try{await navigator.clipboard.writeText(cardUrl);status.textContent='Card link copied. Paste it into a message to stay in touch.';}
  catch{status.textContent='Copy this link to share: '+cardUrl;}
});
const dialog=document.querySelector('#qr-dialog');
document.querySelectorAll('[data-open-qr]').forEach(button=>button.addEventListener('click',()=>dialog.showModal()));
document.querySelector('#close-qr').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
