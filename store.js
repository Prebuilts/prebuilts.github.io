// store.js (FULL) - Products, cart, orders, crypto popup (XMR + USDC on Polygon)
// Firebase v12.2.1 modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ---------------- FIREBASE CONFIG ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
  storageBucket: "prebuiltid-website.firebasestorage.app",
  messagingSenderId: "854871585546",
  appId: "1:854871585546:web:568400979292a0c31740f3",
  measurementId: "G-YS1Q1904H6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ---------------- DOM REFS ---------------- */
const productContainer = document.getElementById('shopgrid');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');

const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItemsEl = document.getElementById("basket-items");
const basketTotalEl = document.getElementById("basket-total");
const cartCountEl = document.getElementById("cart-count");

const clearCartBtn = document.getElementById("clear-cart-btn");
const buyAllBtn = document.getElementById("buy-all-btn");
const checkoutModal = document.getElementById("checkout-modal");
const cancelCheckoutBtn = document.getElementById("cancel-checkout");
const confirmCheckoutBtn = document.getElementById("confirm-checkout");
const payCryptoOpenBtn = document.getElementById("pay-crypto-open-btn");
const payLocalBtn = document.getElementById("pay-local-btn");

const myOrdersBtn = document.getElementById("my-orders-btn");
const myOrdersModal = document.getElementById("my-orders-modal");
const myOrdersList = document.getElementById("my-orders-list");
const closeMyOrdersBtn = document.getElementById("close-my-orders");

const accountLink = document.getElementById("accountLink");
const logoutEl = document.getElementById("logoutBtn");

/* crypto modal elements */
const cryptoModal = document.getElementById("crypto-modal");
const selectXmrBtn = document.getElementById("select-xmr");
const selectUsdcBtn = document.getElementById("select-usdc");
const cryptoDetails = document.getElementById("crypto-details");
const cryptoEurAmountEl = document.getElementById("crypto-eur-amount");
const cryptoAmountEl = document.getElementById("crypto-amount");
const cryptoAddressEl = document.getElementById("crypto-address");
const cryptoQrImg = document.getElementById("crypto-qr");
const cryptoPaidBtn = document.getElementById("crypto-paid-btn");
const closeCryptoBtn = document.getElementById("close-crypto-btn");

/* ---------------- STATE ---------------- */
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart(){ localStorage.setItem("cart", JSON.stringify(cart)); }
function updateCartCount(){ cartCountEl && (cartCountEl.innerText = cart.reduce((s,i)=> s + (i.qty||0),0)); }
function cartTotal(){ return cart.reduce((s,i)=> s + (Number(i.price||0) * (i.qty||0)),0); }

/* ---------------- WALLET PLACEHOLDERS - REPLACE before going live ----------------
   - Replace WALLET.xmr with your Monero address
   - Replace WALLET.usdc_polygon with your USDC (Polygon) address
*/
const WALLET = {
  xmr: "XMR_ADDRESS_PLACEHOLDER",
  usdc_polygon: "USDC_POLYGON_ADDRESS_PLACEHOLDER"
};

/* ---------------- RENDER CART ---------------- */
function renderCart(){
  if (!basketItemsEl) return;
  basketItemsEl.innerHTML = "";

  if (!cart.length) {
    basketItemsEl.innerHTML = "<p>Korb on tühi.</p>";
    basketTotalEl && (basketTotalEl.innerText = "0€");
    updateCartCount();
    return;
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'basket-item';

    const left = document.createElement('div'); left.className = 'left';
    const img = document.createElement('img'); img.src = safeUrl(item.image) || '';
    img.alt = item.name || '';
    const info = document.createElement('div');
    info.innerHTML = `<div style="font-weight:700">${escapeHtml(item.name)}</div><div style="font-size:13px;color:#666">${Number(item.price).toFixed(2)}€</div>`;
    left.append(img, info);

    const qtyWrap = document.createElement('div');
    const minus = document.createElement('button'); minus.className='qty-btn'; minus.innerText='-';
    minus.onclick = () => changeQty(item.id, -1);
    const qtySpan = document.createElement('span'); qtySpan.innerText = item.qty; qtySpan.style.margin = '0 8px';
    const plus = document.createElement('button'); plus.className='qty-btn'; plus.innerText='+';
    plus.onclick = () => changeQty(item.id, +1);
    qtyWrap.append(minus, qtySpan, plus);

    const remove = document.createElement('button'); remove.innerText = 'Eemalda';
    remove.onclick = () => removeItem(item.id);

    row.append(left, qtyWrap, remove);
    basketItemsEl.appendChild(row);
  });

  basketTotalEl && (basketTotalEl.innerText = cartTotal().toFixed(2) + "€");
  updateCartCount();
}

/* ---------------- CART OPS ---------------- */
function changeQty(id, delta){
  const it = cart.find(c=>c.id===id); if(!it) return;
  const product = allProducts.find(p=>p.id===id);
  const stock = product ? Number(product.quantity || 0) : Infinity;
  const newQty = it.qty + delta;
  if (newQty <= 0) {
    cart = cart.filter(c=>c.id!==id);
  } else if (newQty > stock) {
    alert(`Laos ainult ${stock} ühikut.`);
    return;
  } else {
    it.qty = newQty;
  }
  saveCart(); renderCart();
}

function removeItem(id){ cart = cart.filter(c=>c.id!==id); saveCart(); renderCart(); }

/* expose addToCart */
window.addToCart = function(product){
  const stock = Number(product.quantity || 0);
  const existing = cart.find(c=>c.id===product.id);
  const currentQty = existing ? existing.qty : 0;
  if (stock > 0 && currentQty + 1 > stock) { alert(`Laos ainult ${stock} ühikut.`); return; }
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: Number(product.price||0), qty:1, image: product.image||'' });
  saveCart(); renderCart();
};

/* ---------------- UI: basket open/close, clear ---------------- */
clearCartBtn && clearCartBtn.addEventListener('click', ()=> {
  if (!confirm("Tühjendada ostukorv?")) return;
  cart = []; saveCart(); renderCart();
});

cartIcon && cartIcon.addEventListener('click', ()=> {
  if (!basketPanel) return;
  basketPanel.classList.add('open');
  basketPanel.setAttribute('aria-hidden','false');
});

closeBasket && closeBasket.addEventListener('click', ()=> {
  basketPanel && basketPanel.classList.remove('open');
  basketPanel && basketPanel.setAttribute('aria-hidden','true');
});

/* ---------------- CHECKOUT FLOW ---------------- */
buyAllBtn && buyAllBtn.addEventListener('click', ()=> {
  if (!auth.currentUser) { alert("Palun logi sisse, et teha tellimus."); window.location.href = 'login.html'; return; }
  if (!cart.length) { alert("Ostukorv on tühi."); return; }
  checkoutModal && checkoutModal.classList.add('show');
});

cancelCheckoutBtn && cancelCheckoutBtn.addEventListener('click', ()=> {
  checkoutModal && checkoutModal.classList.remove('show');
});

/* Local (offline) payment from checkout modal */
payLocalBtn && payLocalBtn.addEventListener('click', async ()=> {
  checkoutModal && checkoutModal.classList.remove('show');

  const user = auth.currentUser;
  if (!user) { alert("Palun logi sisse."); return; }
  if (!cart.length) { alert("Ostukorv on tühi."); return; }

  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("uid","==",user.uid), where("status","in",["pending","processing"]));
    const snaps = await getDocs(q);
    if (snaps.size >= 3) { alert("Sul on juba 3 aktiivset tellimust."); return; }
  } catch(err){ console.error(err); }

  const payload = {
    uid: user.uid,
    email: user.email || null,
    products: cart.map(c=>({ id:c.id, name:c.name, price:c.price, qty:c.qty })),
    status: "pending",
    paymentMethod: "offline",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db,"orders"), payload);
    cart = []; saveCart(); renderCart();
    alert("Tellimus salvestatud! Me võtame teiega ühendust 1-5 tööpäeva jooksul.");
  } catch(err){
    console.error("Order save error:", err);
    alert("Tellimuse salvestamisel tekkis viga. Palun proovi hiljem.");
  }
});

/* ---------------- MY ORDERS ---------------- */
myOrdersBtn && myOrdersBtn.addEventListener('click', ()=> {
  if (!auth.currentUser) { alert("Palun logi sisse."); window.location.href = 'login.html'; return; }
  loadMyOrders();
  myOrdersModal && myOrdersModal.classList.add('show');
});
closeMyOrdersBtn && closeMyOrdersBtn.addEventListener('click', ()=> {
  myOrdersModal && myOrdersModal.classList.remove('show');
});

async function loadMyOrders(){
  if (!myOrdersList) return;
  myOrdersList.innerHTML = "<p>Laadin...</p>";
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("uid", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) { myOrdersList.innerHTML = "<p>Tellimusi ei ole.</p>"; return; }
    myOrdersList.innerHTML = "";
    snap.forEach(docSnap => {
      const od = docSnap.data();
      const id = docSnap.id;
      const div = document.createElement('div');
      div.style.borderBottom = "1px solid #eee"; div.style.padding = "8px 0";
      const when = od.createdAt && od.createdAt.toDate ? od.createdAt.toDate().toLocaleString() : "—";
      div.innerHTML = `<p><strong>${escapeHtml(when)}</strong> — ${escapeHtml(od.status || '—')}</p>`;
      const ul = document.createElement('div');
      (od.products || []).forEach(p => {
        const pEl = document.createElement('div');
        pEl.innerText = `${p.name} — ${Number(p.price).toFixed(2)}€ x ${p.qty}`;
        ul.appendChild(pEl);
      });
      div.appendChild(ul);

      if (od.paymentMethod === 'crypto' && od.paymentDetails) {
        const pd = od.paymentDetails;
        const pdEl = document.createElement('div');
        pdEl.innerHTML = `<small>Paid: ${escapeHtml(pd.currency||'')} · Amount: ${escapeHtml(pd.amountCrypto||'')} · Address: ${escapeHtml(pd.address||'')}</small>`;
        div.appendChild(pdEl);
      }

      if (od.status === "pending" || od.status === "processing") {
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = "Tühista tellimus";
        cancelBtn.onclick = async () => {
          if (!confirm("Kas oled kindel?")) return;
          try {
            await deleteDoc(doc(db, "orders", id));
            alert("Tellimus tühistatud.");
            loadMyOrders();
          } catch (err) {
            console.error("Cancel order error:", err);
            alert("Tühistamisel tekkis viga.");
          }
        };
        div.appendChild(cancelBtn);
      } else {
        const note = document.createElement('div');
        note.className = 'muted';
        note.innerText = 'Seda tellimust ei saa enam tühistada.';
        div.appendChild(note);
      }

      myOrdersList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    myOrdersList.innerHTML = "<p>Tellimuste laadimisel tekkis viga.</p>";
  }
}

/* ---------------- PRODUCTS: real-time load ---------------- */
const productsRef = collection(db, "products");
onSnapshot(productsRef, snap => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  applyFiltersAndRender();
});

/* ---------------- FILTER / SORT / SEARCH ---------------- */
function applyFiltersAndRender(){
  const cat = categorySelect ? categorySelect.value : 'all';
  let list = allProducts.slice();

  if (cat && cat !== 'all') list = list.filter(p => p.category === cat);

  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (q) list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));

  const s = sortSelect ? sortSelect.value : 'none';
  if (s === 'price-asc') list.sort((a,b)=> (Number(a.price||0) - Number(b.price||0)));
  else if (s === 'price-desc') list.sort((a,b)=> (Number(b.price||0) - Number(a.price||0)));
  else if (s === 'name-asc') list.sort((a,b)=> (String(a.name||'').localeCompare(String(b.name||''))));
  else if (s === 'name-desc') list.sort((a,b)=> (String(b.name||'').localeCompare(String(a.name||''))));
  else if (s === 'newest') list.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  else if (s === 'stock-desc') list.sort((a,b)=> (Number(b.quantity||0) - Number(a.quantity||0)));
  else if (s === 'stock-asc') list.sort((a,b)=> (Number(a.quantity||0) - Number(b.quantity||0)));

  filteredProducts = list;
  renderProducts(list);
}

/* ---------------- RENDER PRODUCTS ---------------- */
function renderProducts(products){
  if (!productContainer) return;
  productContainer.innerHTML = '';
  products.forEach(product => {
    const qty = Number(product.quantity || 0);
    const disabled = qty <= 0;

    const card = document.createElement('div');
    card.className = 'productbox';

    const content = document.createElement('div');
    content.innerHTML = `
      <img src="${escapeHtmlAttr(product.image || '')}" alt="${escapeHtml(product.name || '')}">
      <h3>${escapeHtml(product.name || '')}</h3>
      <div style="font-weight:700">${Number(product.price || 0).toFixed(2)}€</div>
      <p>${escapeHtml(product.description || '')}</p>
      <div class="stock">Laos: ${qty}</div>
    `;

    const actions = document.createElement('div');
    actions.style.marginTop = '10px';
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    const viewBtn = document.createElement('button'); viewBtn.className='btn'; viewBtn.innerText = 'Vaata lisaks';
    viewBtn.onclick = () => openProductLink(product.link || '#');

    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.innerText = qty <= 0 ? 'Lõppenud' : 'Lisa korvi';
    addBtn.disabled = disabled;
    addBtn.onclick = () => {
      const p = allProducts.find(x => x.id === product.id) || product;
      window.addToCart({ id: p.id, name: p.name, price: p.price, image: p.image || '', quantity: p.quantity });
    };

    actions.append(viewBtn, addBtn);

    card.appendChild(content);
    card.appendChild(actions);
    productContainer.appendChild(card);
  });
}

/* ---------------- OPEN PRODUCT LINK ---------------- */
window.openProductLink = (url) => {
  window.open(url, "_blank");
};

/* ---------------- UI EVENTS ---------------- */
if (categorySelect) categorySelect.addEventListener('change', applyFiltersAndRender);
if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);
if (searchInput) searchInput.addEventListener('input', debounce(()=> applyFiltersAndRender(), 180));

/* ---------------- HELPERS ---------------- */
function debounce(fn, ms = 200){ let t; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), ms); }; }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeHtmlAttr(s=''){ return String(s).replace(/"/g, '&quot;'); }
function safeUrl(u){ try { return u ? String(u) : ''; } catch { return ''; } }

/* ---------------- INIT ---------------- */
renderCart(); updateCartCount();

/* ---------------- AUTH UI ---------------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    if (accountLink) accountLink.style.display = 'inline-block';
    if (logoutEl) logoutEl.style.display = 'none';
  } else {
    if (accountLink) accountLink.style.display = 'none';
    if (logoutEl) {
      logoutEl.style.display = 'inline-block';
      logoutEl.onclick = () => signOut(auth);
    }
  }
});

/* ===================== CRYPTO FLOW ===================== */

/*
 Flow summary:
 1) User clicks "Osta kõik" -> checkout modal
 2) Click "Krüpto" -> crypto modal
 3) Choose XMR or USDC(Polygon)
 4) Script fetches CoinGecko prices (monero, usd-coin in EUR)
 5) amountCrypto = (cartTotal EUR * 1.03) / coinPriceEUR
 6) Show amountCrypto (already includes +3%) and QR/address
 7) When user clicks "I've paid" -> create order with paymentMethod:'crypto' and paymentDetails
*/

// open crypto modal from checkout
payCryptoOpenBtn && payCryptoOpenBtn.addEventListener('click', async ()=> {
  checkoutModal && checkoutModal.classList.remove('show');
  openCryptoModal();
});

closeCryptoBtn && closeCryptoBtn.addEventListener('click', ()=> {
  cryptoModal && cryptoModal.classList.remove('show');
});

selectXmrBtn && selectXmrBtn.addEventListener('click', ()=> {
  showCryptoDetails('xmr');
});

selectUsdcBtn && selectUsdcBtn.addEventListener('click', ()=> {
  showCryptoDetails('usdc_polygon');
});

cryptoPaidBtn && cryptoPaidBtn.addEventListener('click', async ()=> {
  // Save order as pending with crypto payment details
  const currency = cryptoModal.dataset.selectedCurrency;
  if (!currency) { alert('Vali valuuta'); return; }
  const user = auth.currentUser;
  if (!user) { alert("Palun logi sisse."); return; }
  if (!cart.length) { alert("Ostukorv on tühi."); return; }

  // fetch price to compute final amounts (again, to avoid stale display)
  const prices = await fetchCoinPrices();
  const coinPrice = currency === 'xmr' ? (prices.monero?.eur || null) : (prices['usd-coin']?.eur || null);
  if (!coinPrice) { alert("Hindade laadimisel tekkis viga."); return; }

  const eurTotal = cartTotal();
  const amountCrypto = ( (eurTotal * 1.03) / coinPrice );

  const paymentDetails = {
    currency: currency === 'xmr' ? 'XMR' : 'USDC',
    address: currency === 'xmr' ? WALLET.xmr : WALLET.usdc_polygon,
    amountCrypto: amountCrypto.toString(),
    amountEur: Number((eurTotal * 1.03).toFixed(2)),
    feeMarkup: 0.03
  };

  // check 3 active orders
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("uid","==",user.uid), where("status","in",["pending","processing"]));
    const snaps = await getDocs(q);
    if (snaps.size >= 3) { alert("Sul on juba 3 aktiivset tellimust."); return; }
  } catch(err){ console.error(err); }

  const payload = {
    uid: user.uid,
    email: user.email || null,
    products: cart.map(c=>({ id:c.id, name:c.name, price:c.price, qty:c.qty })),
    status: "pending",
    paymentMethod: "crypto",
    paymentDetails,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db,"orders"), payload);
    cart = []; saveCart(); renderCart();
    cryptoModal && cryptoModal.classList.remove('show');
    alert("Tellimus salvestatud. Me kontrollime makset ja võtame teiega ühendust.");
  } catch(err){
    console.error("Order save error:", err);
    alert("Tellimuse salvestamisel tekkis viga. Palun proovi hiljem.");
  }
});

/* Fetch CoinGecko prices for monero and usd-coin (EUR) */
async function fetchCoinPrices(){
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=monero,usd-coin&vs_currencies=eur';
    const res = await fetch(url);
    if (!res.ok) throw new Error('price fetch failed');
    const data = await res.json();
    return data;
  } catch(e){
    console.error('CoinGecko error', e);
    return {};
  }
}

/* Open crypto modal initial */
async function openCryptoModal(){
  if (!cryptoModal) return;
  cryptoModal.classList.add('show');
  cryptoDetails.style.display = 'none';
  cryptoModal.dataset.selectedCurrency = '';
  // show EUR total
  const eurTotal = cartTotal();
  cryptoEurAmountEl.innerText = eurTotal.toFixed(2);
}

/* Show crypto details after selecting currency */
async function showCryptoDetails(currencyKey){
  if (!cryptoModal) return;
  cryptoModal.dataset.selectedCurrency = currencyKey;
  cryptoDetails.style.display = 'block';

  const eurTotal = cartTotal();
  cryptoEurAmountEl.innerText = eurTotal.toFixed(2);

  const prices = await fetchCoinPrices();
  const coinPrice = currencyKey === 'xmr' ? (prices.monero?.eur || null) : (prices['usd-coin']?.eur || null);
  if (!coinPrice) {
    cryptoAmountEl.innerText = 'Hind pole saadaval';
    cryptoAddressEl.innerText = currencyKey === 'xmr' ? WALLET.xmr : WALLET.usdc_polygon;
    cryptoQrImg.src = '';
    return;
  }

  const amountCrypto = ( (eurTotal * 1.03) / coinPrice );
  // choose decimals: XMR more decimals
  const decimals = currencyKey === 'xmr' ? 12 : 8;
  cryptoAmountEl.innerText = amountCrypto.toFixed(decimals);
  cryptoAddressEl.innerText = currencyKey === 'xmr' ? WALLET.xmr : WALLET.usdc_polygon;

  // QR generation:
  let qrData = '';
  if (currencyKey === 'usdc_polygon') {
    // Use ethereum URI scheme (works for many polygon wallets)
    // Note: many wallets expect value in ether units or hex; this simple approach usually opens wallet and pre-fills address.
    qrData = `ethereum:${WALLET.usdc_polygon}?value=${amountCrypto.toFixed(decimals)}`;
  } else {
    // XMR - not a standard universal URI; show address + amount as plain text in QR.
    qrData = `${WALLET.xmr}?amount=${amountCrypto.toFixed(decimals)}`;
  }
  const encoded = encodeURIComponent(qrData);
  cryptoQrImg.src = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encoded}&choe=UTF-8`;
}

/* =================== End Crypto Flow =================== */
