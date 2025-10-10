// Minimal cart logic (localStorage)
const $ = (s,r=document)=>r.querySelector(s);
const CART_KEY='aqeelah_cart_v1'; const fmt=n=>`$${n.toFixed(2)}`;
let cart = JSON.parse(localStorage.getItem(CART_KEY)||'[]');
function save(){localStorage.setItem(CART_KEY,JSON.stringify(cart));}
function count(){return cart.reduce((s,i)=>s+i.qty,0);}
function subtotal(){return cart.reduce((s,i)=>s+i.price*i.qty,0);}
function bumpHeader(){const link=$('.cart'); if(link) link.textContent=`CART (${count()})`;}
bumpHeader();
document.addEventListener('click',e=>{
  const b=e.target.closest('.add-to-cart'); if(!b) return;
  const id=b.dataset.id, name=b.dataset.name, price=parseFloat(b.dataset.price), img=b.dataset.img||'';
  let it=cart.find(i=>i.id===id); if(it) it.qty++; else cart.push({id,name,price,img,qty:1});
  save(); bumpHeader(); b.textContent='Added ✓'; setTimeout(()=>b.textContent='Add to Cart',800);
});
function renderCart(){ const body=$('#cart-page-items'); if(!body) return;
  const empty=$('#cart-empty'), sum=$('#sum-subtotal'), ck=$('#sum-checkout');
  body.innerHTML=''; if(cart.length===0){ empty.style.display='block'; sum.textContent=fmt(0); ck.disabled=true; return; }
  empty.style.display='none'; ck.disabled=false;
  cart.forEach(it=>{ const tr=document.createElement('tr'); tr.dataset.id=it.id;
    tr.innerHTML=`<td><div class="cart-item"><img src="${it.img}" alt="${it.name}"><div><strong>${it.name}</strong><br><button class="remove-link">Remove</button></div></div></td>
                  <td>${fmt(it.price)}</td>
                  <td><div class="qty-controls"><button class="dec">−</button><span class="q">${it.qty}</span><button class="inc">+</button></div></td>
                  <td class="line-total">${fmt(it.price*it.qty)}</td>
                  <td><span class="sr">actions</span></td>`;
    body.appendChild(tr);
  }); sum.textContent=fmt(subtotal());
}
renderCart();
document.addEventListener('click',e=>{
  const tr=e.target.closest('tr'); const id=tr && tr.dataset.id; if(!id) return;
  const it=cart.find(i=>i.id===id); if(!it) return;
  if(e.target.classList.contains('inc')) it.qty++;
  else if(e.target.classList.contains('dec')) it.qty=Math.max(1,it.qty-1);
  else if(e.target.classList.contains('remove-link')) cart=cart.filter(i=>i.id!==id);
  else return;
  save(); bumpHeader(); renderCart();
});
const btn = $('#sum-checkout');
if (btn) {
  btn.addEventListener('click', () => {
    const SHOPIFY_DOMAIN = 'v8nzdf-vs.myshopify.com';
    const VARIANT_MAP = { 'bk-abbas': '52714239656302' };
    const items = Array.isArray(cart) ? cart : [];
    if (!items.length) { alert('Cart is empty.'); return; }
    const lines = items.map(i => {
      const vid = VARIANT_MAP[i.id];
      if (!vid) throw new Error(`No Shopify variant mapping for "${i.id}"`);
      const q = Math.max(1, parseInt(i.qty || 1, 10));
      return `${vid}:${q}`;
    });
    const url = `https://v8nzdf-vs.myshopify.com/cart/${lines.join(',')}?channel=buy_button`;
    location.href = url;
  });
}

/* === Newsletter subscribe (minimal + spinner + stricter validation) === */
(function(){
  const form = document.querySelector('.invite-form');
  if (!form) return;

  const SUBSCRIBE_ENDPOINT = 'https://formspree.io/f/xnnbkwwv';

  // Simple, stricter email validation (beyond HTML5)
  function isValidEmail(email){
    if(!email) return false;
    // basic pattern: local@domain.tld (no spaces)
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if(!basic.test(email)) return false;
    // extra guards
    if(email.includes('..')) return false;                // no consecutive dots
    if(email.startsWith('.') || email.endsWith('.')) return false;
    const [local, domain] = email.split('@');
    if(!local || !domain) return false;
    if(local.length > 64) return false;                   // common practical limit
    if(domain.length > 255) return false;
    return true;
  }

  // Tiny inline SVG spinner (no external CSS)
  function createSpinner(){
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 50 50');
    svg.setAttribute('width','16');
    svg.setAttribute('height','16');
    svg.setAttribute('aria-hidden','true');
    svg.style.verticalAlign = 'middle';
    svg.style.marginRight = '8px';
    const circle = document.createElementNS(svgNS,'circle');
    circle.setAttribute('cx','25'); circle.setAttribute('cy','25'); circle.setAttribute('r','20');
    circle.setAttribute('fill','none'); circle.setAttribute('stroke','currentColor'); circle.setAttribute('stroke-width','4');
    circle.setAttribute('stroke-linecap','round'); circle.setAttribute('stroke-dasharray','31.4 188.4');
    const anim = document.createElementNS(svgNS,'animateTransform');
    anim.setAttribute('attributeName','transform');
    anim.setAttribute('type','rotate');
    anim.setAttribute('from','0 25 25');
    anim.setAttribute('to','360 25 25');
    anim.setAttribute('dur','0.9s');
    anim.setAttribute('repeatCount','indefinite');
    circle.appendChild(anim);
    svg.appendChild(circle);
    return svg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('invite-email');
    const statusEl = document.getElementById('invite-status');
    const submitBtn = form.querySelector('.invite-btn');
    if (!emailInput || !submitBtn) return;

    const email = emailInput.value.trim();

    // Reset state
    emailInput.removeAttribute('aria-invalid');
    if (statusEl) statusEl.textContent = '';

    // Validate
    if(!isValidEmail(email)){
      if (statusEl) statusEl.textContent = 'Please enter a valid email address.';
      emailInput.setAttribute('aria-invalid','true');
      emailInput.focus();
      return;
    }

    // Loading state with spinner
    const spinner = createSpinner();
    const oldLabel = submitBtn.textContent;
    submitBtn.textContent = '';
    submitBtn.appendChild(spinner);
    submitBtn.appendChild(document.createTextNode('Subscribing…'));
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy','true');

    try {
      const body = new FormData(form); // includes name="email"
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        if (statusEl) statusEl.textContent = 'Thanks! Please check your inbox.';
      } else {
        if (statusEl) statusEl.textContent = 'Something went wrong. Please try again.';
      }
    } catch {
      if (statusEl) statusEl.textContent = 'Network error — try again.';
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = oldLabel || 'SUBSCRIBE';
    }
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const thisHost = location.hostname.replace(/^www\./, '');

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';

    // Skip anchors, phone/email, and JS links
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) return;

    try {
      const url = new URL(href, location.origin);
      const thatHost = url.hostname.replace(/^www\./, '');
      const isExternal = thatHost !== thisHost;

      if (isExternal) {
        a.target = '_blank';
        // keep any existing rel values; add safe defaults
        a.rel = (a.rel ? a.rel + ' ' : '') + 'noopener noreferrer external';
      }
    } catch { /* ignore malformed URLs */ }
  });
});
