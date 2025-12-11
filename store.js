// store.js (old-style, stable) - loads products and renders paymentButton under product card
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ---------- FIREBASE CONFIG (always use this) ---------- */
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

/* DOM */
const productContainer = document.getElementById('store-product-list') || document.getElementById('shopgrid') || document.querySelector('.recommended-grid') || document.getElementById('store-product-list');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');

let allProducts = [];

/* ==========================
   LOAD PRODUCTS FROM FIRESTORE
   ========================== */
async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayProducts(allProducts);
    } catch (error) {
        console.error("Firestore load error:", error);
    }
}

/* prefer realtime update so admin changes show immediately */
onSnapshot(collection(db, "products"), snap => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  displayProducts(allProducts);
});

/* initial load */
loadProducts();

/* ==========================
   DISPLAY PRODUCTS
   ========================== */
function displayProducts(products) {
    if (!productContainer) return;
    productContainer.innerHTML = "";

    if (products.length === 0) {
        productContainer.innerHTML = "<p>Tooteid ei leitud.</p>";
        return;
    }

    products.forEach(product => {
        // create product card (do not break existing classes/structure)
        const wrapper = document.createElement('div');
        wrapper.className = 'product-box';

        // build inner HTML
        const priceText = Number(product.price || 0).toFixed(2) + "€";
        const imgHtml = product.image ? `<img src="${escapeHtmlAttr(product.image)}" alt="${escapeHtml(product.name || '')}">` : '';
        const nameHtml = `<h3>${escapeHtml(product.name || '')}</h3>`;
        const priceHtml = `<h3>${priceText}</h3>`;
        const descHtml = `<p>${escapeHtml(product.description || '')}</p>`;

        wrapper.innerHTML = `
            ${imgHtml}
            ${nameHtml}
            ${priceHtml}
            ${descHtml}
            <div style="margin-top:10px; display:flex; gap:8px;">
              <button class="view-btn">Vaata lisaks</button>
              <button class="add-btn">Lisa korvi</button>
            </div>
        `;

        // add event listeners for buttons
        const viewBtn = wrapper.querySelector('.view-btn');
        viewBtn.onclick = () => {
            if (product.link) window.open(product.link, '_blank');
            else alert('Link puudub');
        };

        const addBtn = wrapper.querySelector('.add-btn');
        addBtn.onclick = () => {
            // Simple client-side cart in localStorage (very small implementation)
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(i => i.id === product.id);
            if (existing) existing.qty++;
            else cart.push({ id: product.id, name: product.name, price: Number(product.price||0), qty: 1, image: product.image || '' });
            localStorage.setItem('cart', JSON.stringify(cart));
            // update cart count UI if present
            const countEl = document.getElementById('cart-count');
            if (countEl) {
              const total = cart.reduce((s,i)=> s + (i.qty||0),0);
              countEl.innerText = total;
            }
            alert('Lisatud ostukorvi');
        };

        // If product has a paymentButton field, render it _after_ the buttons
        if (product.paymentButton) {
          const payWrap = document.createElement('div');
          payWrap.className = 'payment-button-wrap';
          // Admin-provided HTML could be a full <a>... or just a URL. Insert as-is.
          // If it's just a URL, keep it simple and create a default anchor:
          const val = product.paymentButton.trim();
          if (val.startsWith('<') && (val.toLowerCase().includes('<a') || val.toLowerCase().includes('<img'))) {
            payWrap.innerHTML = val;
          } else if (val.startsWith('http')) {
            const safeHref = escapeHtmlAttr(val);
            payWrap.innerHTML = `<a href="${safeHref}" target="_blank" rel="noreferrer noopener"><img src="https://nowpayments.io/images/embeds/payment-button-white.svg" alt="Pay with NOWPayments" style="max-width:180px;"></a>`;
          } else {
            // if not a URL nor HTML, just show the raw string
            payWrap.textContent = val;
          }
          wrapper.appendChild(payWrap);
        }

        productContainer.appendChild(wrapper);
    });
}

/* ==========================
   CATEGORY FILTER
   ========================== */
if (categorySelect) {
  categorySelect.addEventListener("change", () => {
      const category = categorySelect.value;
      if (category === "all") displayProducts(allProducts);
      else {
        const filtered = allProducts.filter(p => p.category === category);
        displayProducts(filtered);
      }
  });
}

/* ==========================
   SEARCH + SORT (simple)
   ========================== */
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = allProducts.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
    displayProducts(filtered);
  });
}
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    const s = sortSelect.value;
    let copy = allProducts.slice();
    if (s === 'price-asc') copy.sort((a,b)=> (Number(a.price||0) - Number(b.price||0)));
    else if (s === 'price-desc') copy.sort((a,b)=> (Number(b.price||0) - Number(a.price||0)));
    else if (s === 'name-asc') copy.sort((a,b)=> (String(a.name||'').localeCompare(String(b.name||''))));
    else if (s === 'name-desc') copy.sort((a,b)=> (String(b.name||'').localeCompare(String(a.name||''))));
    displayProducts(copy);
  });
}

/* small helpers */
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeHtmlAttr(s=''){ return String(s).replace(/"/g,'&quot;'); }
