import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ===============================
   FIREBASE CONFIG
   =============================== */
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

/* ===============================
   DOM REFERENCES
   =============================== */
const productContainer = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItemsEl = document.getElementById("basket-items");
const basketTotalEl = document.getElementById("basket-total");
const cartCountEl = document.getElementById("cart-count");

const clearCartBtn = document.getElementById("clear-cart-btn");
const buyAllBtn = document.getElementById("buy-all-btn");

/* DISCLAIMER */
const disclaimerModal = document.getElementById("disclaimer-modal");
const disclaimerAccept = document.getElementById("disclaimer-accept");
const disclaimerCancel = document.getElementById("disclaimer-cancel");

/* ===============================
   STATE
   =============================== */
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart_v1") || "[]");

/* ===============================
   CART HELPERS
   =============================== */
function saveCart() {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function updateCartCount() {
  if (cartCountEl) cartCountEl.innerText = cart.length;
}

function cartTotal() {
  return cart.reduce((sum, p) => sum + Number(p.price || 0), 0);
}

/* ===============================
   BASKET RENDER
   =============================== */
function renderCart() {
  if (!basketItemsEl) return;

  basketItemsEl.innerHTML = "";

  if (!cart.length) {
    basketItemsEl.innerHTML = "<p>Basket is empty</p>";
    basketTotalEl.innerText = "0€";
    updateCartCount();
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "basket-item";

    row.innerHTML = `
      <img src="${escapeAttr(item.image)}">
      <div class="info">
        <h4>${escapeHtml(item.name)}</h4>
        <div class="price">${Number(item.price).toFixed(2)}€</div>
      </div>
      <button class="remove">Remove</button>
    `;

    row.querySelector(".remove").onclick = () => {
      cart = cart.filter(c => c.id !== item.id);
      saveCart();
      renderCart();
    };

    basketItemsEl.appendChild(row);
  });

  basketTotalEl.innerText = cartTotal().toFixed(2) + "€";
  updateCartCount();
}

/* ===============================
   ADD TO CART (1 PER PRODUCT)
   =============================== */
window.addToCart = function (product) {
  if (cart.find(c => c.id === product.id)) {
    alert("You already added this product.");
    return;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    paymentButton: product.paymentButton || ""
  });

  saveCart();
  renderCart();
};

/* ===============================
   BASKET OPEN / DISCLAIMER
   =============================== */
function openBasket() {
  basketPanel.classList.add("open");
  renderCart();
}

cartIcon?.addEventListener("click", () => {
  const accepted = localStorage.getItem("nowpay_disclaimer_accepted_v1");
  if (accepted === "true") return openBasket();
  disclaimerModal?.classList.add("show");
});

disclaimerAccept?.addEventListener("click", () => {
  localStorage.setItem("nowpay_disclaimer_accepted_v1", "true");
  disclaimerModal.classList.remove("show");
  openBasket();
});

disclaimerCancel?.addEventListener("click", () => {
  disclaimerModal.classList.remove("show");
});

closeBasket?.addEventListener("click", () => {
  basketPanel.classList.remove("open");
});

/* ===============================
   PRODUCTS – CACHED LOADER
   =============================== */
const CACHE_KEY = "products_cache_v1";
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

async function loadProducts() {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    try {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < CACHE_TTL) {
        allProducts = data;
        renderProducts(allProducts);
        return;
      }
    } catch {}
  }

  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: allProducts,
    time: Date.now()
  }));

  renderProducts(allProducts);
}

/* ===============================
   RENDER PRODUCTS
   =============================== */
function renderProducts(products) {
  if (!productContainer) return;

  productContainer.innerHTML = "";

  products.forEach(product => {
    const qty = Number(product.quantity || 0);

    const div = document.createElement("div");
    div.className = "productbox";

    div.innerHTML = `
      <img src="${escapeAttr(product.image || "")}">
      <h3>${escapeHtml(product.name)}</h3>
      <div>${Number(product.price).toFixed(2)}€</div>
      <p>${escapeHtml(product.description || "")}</p>
      <div class="stock">In stock: ${qty}</div>
      <div class="actions">
        <button class="view" ${product.link ? "" : "disabled"}>Buy</button>
        <button class="add" ${qty <= 0 ? "disabled" : ""}>Add to basket</button>
      </div>
    `;

    div.querySelector(".view")?.addEventListener("click", () => {
      if (product.link) window.open(product.link, "_blank", "noopener");
    });

    div.querySelector(".add")?.addEventListener("click", () => {
      window.addToCart(product);
    });

    productContainer.appendChild(div);
  });
}

/* ===============================
   FILTER / SORT / SEARCH
   =============================== */
categorySelect?.addEventListener("change", () => {
  const v = categorySelect.value;
  renderProducts(v === "all" ? allProducts : allProducts.filter(p => p.category === v));
});

sortSelect?.addEventListener("change", () => {
  const v = sortSelect.value;
  const copy = [...allProducts];

  if (v === "price-asc") copy.sort((a, b) => a.price - b.price);
  if (v === "price-desc") copy.sort((a, b) => b.price - a.price);
  if (v === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
  if (v === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name));

  renderProducts(copy);
});

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  renderProducts(allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  ));
});

/* ===============================
   AUTH UI
   =============================== */
onAuthStateChanged(auth, user => {
  if (!user) return;
});

/* ===============================
   HELPERS
   =============================== */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}

function escapeAttr(s = "") {
  return String(s).replace(/"/g, "&quot;");
}

/* ===============================
   INIT
   =============================== */
updateCartCount();
renderCart();
loadProducts();
