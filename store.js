// ===============================
// store.js – STABLE & FIXED
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// -------------------------------
// Firebase config
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
  storageBucket: "prebuiltid-website.firebasestorage.app",
  messagingSenderId: "854871585546",
  appId: "1:854871585546:web:568400979292a0c31740f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// -------------------------------
// DOM elements (MUST EXIST IN HTML)
// -------------------------------
const shopgrid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const closeBasketBtn = document.getElementById("close-basket");
const basketItemsEl = document.getElementById("basket-items");
const basketTotalEl = document.getElementById("basket-total");
const cartCountEl = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart-btn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const settingsEmail = document.getElementById("settings-email");
const settingsAddress = document.getElementById("settings-address");
const settingsDpd = document.getElementById("settings-dpd");
const saveSettingsBtn = document.getElementById("save-settings");

const logoutBtn = document.getElementById("logoutBtn");
const accountLink = document.getElementById("accountLink");

// -------------------------------
// State
// -------------------------------
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart_v1") || "[]");

// -------------------------------
// Helpers
// -------------------------------
function saveCart() {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function updateCartCount() {
  cartCountEl.textContent = cart.length;
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + Number(i.price || 0), 0);
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// -------------------------------
// Basket logic
// -------------------------------
function renderBasket() {
  basketItemsEl.innerHTML = "";

  if (cart.length === 0) {
    basketItemsEl.innerHTML = "<p>Korb on tühi</p>";
    basketTotalEl.textContent = "0 €";
    updateCartCount();
    return;
  }

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "basket-item";

    div.innerHTML = `
      <img src="${item.image}" alt="">
      <div class="info">
        <h4>${escapeHtml(item.name)}</h4>
        <div class="price">${item.price.toFixed(2)} €</div>
      </div>
      <div class="actions">
        <button class="remove-btn">Eemalda</button>
      </div>
    `;

    div.querySelector(".remove-btn").onclick = () => {
      cart = cart.filter(c => c.id !== item.id);
      saveCart();
      renderBasket();
    };

    basketItemsEl.appendChild(div);
  });

  basketTotalEl.textContent = cartTotal().toFixed(2) + " €";
  updateCartCount();
}

// -------------------------------
// Add to cart (quantity safe)
// -------------------------------
window.addToCart = function (product) {
  if (product.quantity <= 0) {
    alert("Toode on otsas");
    return;
  }

  if (cart.find(i => i.id === product.id)) {
    alert("Toode on juba korvis");
    return;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image: product.image
  });

  saveCart();
  renderBasket();
};

// -------------------------------
// Basket open / close (FIXED)
// -------------------------------
cartIcon.onclick = () => {
  basketPanel.classList.add("open");
  renderBasket();
};

closeBasketBtn.onclick = () => {
  basketPanel.classList.remove("open");
};

clearCartBtn.onclick = () => {
  if (!confirm("Tühjendada ostukorv?")) return;
  cart = [];
  saveCart();
  renderBasket();
};

// -------------------------------
// Products rendering
// -------------------------------
function renderProducts(list) {
  shopgrid.innerHTML = "";

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "productbox";

    const outOfStock = Number(p.quantity || 0) <= 0;

    div.innerHTML = `
      <img src="${p.image}" alt="">
      <h3>${escapeHtml(p.name)}</h3>
      <div><strong>${Number(p.price).toFixed(2)} €</strong></div>
      <p>${escapeHtml(p.description || "")}</p>
      <div class="stock">Laos: ${p.quantity}</div>
      <button ${outOfStock ? "disabled" : ""}>Lisa korvi</button>
    `;

    div.querySelector("button").onclick = () => addToCart(p);
    shopgrid.appendChild(div);
  });
}

// -------------------------------
// Firestore products (REALTIME)
// -------------------------------
onSnapshot(collection(db, "products"), snap => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  applyFilters();
});

// -------------------------------
// Filters / sorting / search
// -------------------------------
function applyFilters() {
  let list = [...allProducts];

  if (categorySelect.value !== "all") {
    list = list.filter(p => p.category === categorySelect.value);
  }

  const q = searchInput.value.toLowerCase();
  if (q) {
    list = list.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }

  if (sortSelect.value === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  }

  renderProducts(list);
}

categorySelect.onchange = applyFilters;
sortSelect.onchange = applyFilters;
searchInput.oninput = applyFilters;

// -------------------------------
// Auth UI + Settings
// -------------------------------
onAuthStateChanged(auth, async user => {
  if (!user) {
    accountLink.style.display = "inline-block";
    logoutBtn.style.display = "none";
    return;
  }

  accountLink.style.display = "none";
  logoutBtn.style.display = "inline-block";
  logoutBtn.onclick = () => signOut(auth);

  settingsEmail.textContent = user.email || user.uid;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    settingsAddress.value = snap.data().address || "";
    settingsDpd.value = snap.data().dpd || "";
  }
});

// Settings modal
settingsBtn.onclick = () => settingsModal.classList.add("show");
closeSettingsBtn.onclick = () => settingsModal.classList.remove("show");

saveSettingsBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    address: settingsAddress.value,
    dpd: settingsDpd.value
  }, { merge: true });

  alert("Seaded salvestatud");
  settingsModal.classList.remove("show");
};

// -------------------------------
// Init
// -------------------------------
updateCartCount();
renderBasket();

