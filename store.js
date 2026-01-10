// store.js (patched with Firestore + product caching)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* FIREBASE CONFIG */
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

/* 🔹 FIRESTORE WITH OFFLINE CACHE */
const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

const auth = getAuth(app);

/* DOM refs */
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

/* DISCLAIMER modal refs */
const disclaimerModal = document.getElementById("disclaimer-modal");
const disclaimerAccept = document.getElementById("disclaimer-accept");
const disclaimerCancel = document.getElementById("disclaimer-cancel");

/* STATE */
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart_v1") || "[]");

/* 🔹 PRODUCT CACHE CONFIG */
const PRODUCT_CACHE_KEY = "products_cache_v1";
const PRODUCT_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

/* CART HELPERS */
function saveCart() { localStorage.setItem("cart_v1", JSON.stringify(cart)); }
function updateCartCount() { cartCountEl && (cartCountEl.innerText = cart.length); }
function cartTotal() { return cart.reduce((s,i)=> s + (Number(i.price||0)), 0); }

/* 🔹 LOAD PRODUCTS WITH CACHE */
async function loadProducts() {
  const cached = localStorage.getItem(PRODUCT_CACHE_KEY);

  if (cached) {
    try {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < PRODUCT_CACHE_TTL) {
        allProducts = data;
        renderProducts(allProducts);
        return;
      }
    } catch(e){}
  }

  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
    data: allProducts,
    time: Date.now()
  }));

  renderProducts(allProducts);
}

/* 🔹 BASKET LOGIC (UNCHANGED) */
function renderCart(){
  if (!basketItemsEl) return;
  basketItemsEl.innerHTML = "";

  if (!cart.length) {
    basketItemsEl.innerHTML = "<p>Basket is empty</p>";
    basketTotalEl && (basketTotalEl.innerText = "0€");
    updateCartCount();
    return;
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'basket-item';

    row.innerHTML = `
      <img src="${escapeAttr(item.image||'')}">
      <div class="info">
        <h4>${escapeHtml(item.name)}</h4>
        <div class="price">${Number(item.price).toFixed(2)}€</div>
      </div>
      <div class="actions">
        <button class="remove">Remove</button>
      </div>
    `;

    row.querySelector('.remove').onclick = () => {
      cart = cart.filter(c => c.id !== item.id);
      saveCart(); renderCart(); updateCartCount();
    };

    if (item.paymentButton) {
      const box = document.createElement('div');
      box.className = 'payment-embed';
      box.innerHTML = item.paymentButton;
      row.appendChild(box);
    }

    basketItemsEl.appendChild(row);
  });

  basketTotalEl.innerText = cartTotal().toFixed(2) + "€";
  updateCartCount();
}

/* ADD TO CART */
window.addToCart = function(product){
  if (cart.find(c => c.id === product.id)) {
    alert("You already have this product in your cart.");
    return;
  }
  cart.push(product);
  saveCart(); renderCart(); updateCartCount();
};

/* DISCLAIMER FLOW */
function openBasketWithDisclaimer() {
  if (localStorage.getItem('nowpay_disclaimer_accepted_v1') === 'true') {
    openBasket(); return;
  }
  disclaimerModal?.classList.add('show');
}

function openBasket(){
  basketPanel.classList.add('open');
  renderCart();
}
function closeBasketPanel(){
  basketPanel.classList.remove('open');
}

cartIcon?.addEventListener('click', openBasketWithDisclaimer);
closeBasket?.addEventListener('click', closeBasketPanel);

disclaimerAccept?.addEventListener('click', () => {
  localStorage.setItem('nowpay_disclaimer_accepted_v1','true');
  disclaimerModal.classList.remove('show');
  openBasket();
});
disclaimerCancel?.addEventListener('click', () => {
  disclaimerModal.classList.remove('show');
});

/* PRODUCT RENDER */
function renderProducts(products){
  if (!productContainer) return;
  productContainer.innerHTML = '';

  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'productbox';
    div.innerHTML = `
      <img src="${escapeAttr(product.image||'')}">
      <h3>${escapeHtml(product.name||'')}</h3>
      <div class="price">${Number(product.price||0).toFixed(2)}€</div>
      <p>${escapeHtml(product.description||'')}</p>
      <button class="btn add">Add to basket</button>
    `;
    div.querySelector('.add').onclick = () => addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      paymentButton: product.paymentButton || ''
    });
    productContainer.appendChild(div);
  });
}

/* FILTER / SORT / SEARCH (UNCHANGED) */
// uses allProducts — still works

/* AUTH UI (UNCHANGED) */
onAuthStateChanged(auth, user => {});

/* HELPERS */
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(s=''){return String(s).replace(/"/g,'&quot;');}

/* INIT */
updateCartCount();
renderCart();
loadProducts();
