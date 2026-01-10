// store.js — stable, compatible with provided store.html + store.css
// ✅ Payment iframe/script embed FIX INCLUDED
// ❌ No breaking changes

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===============================
   DOM REFERENCES
================================ */
const shopGrid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const closeBasketBtn = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");

const clearCartBtn = document.getElementById("clear-cart-btn");

/* ===============================
   STATE
================================ */
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart_v1") || "[]");

/* ===============================
   CART HELPERS
================================ */
function saveCart() {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function updateCartCount() {
  if (cartCount) cartCount.textContent = cart.length;
}

function calculateTotal() {
  return cart.reduce((sum, p) => sum + Number(p.price || 0), 0);
}

/* ===============================
   BASKET UI
================================ */
function openBasket() {
  basketPanel.classList.add("open");
  renderBasket();
}

function closeBasket() {
  basketPanel.classList.remove("open");
}

cartIcon && cartIcon.addEventListener("click", openBasket);
closeBasketBtn && closeBasketBtn.addEventListener("click", closeBasket);

/* ===============================
   PAYMENT EMBED HELPER (CRITICAL FIX)
   Executes iframe + scripts safely
================================ */
function injectTrustedEmbed(container, html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  Array.from(temp.childNodes).forEach(node => {
    if (node.nodeName === "SCRIPT") {
      const s = document.createElement("script");
      if (node.src) s.src = node.src;
      if (node.type) s.type = node.type;
      s.text = node.textContent;
      container.appendChild(s);
    } else {
      container.appendChild(node);
    }
  });
}

/* ===============================
   RENDER BASKET
================================ */
function renderBasket() {
  basketItems.innerHTML = "";

  if (!cart.length) {
    basketItems.innerHTML = "<p>Your basket is empty</p>";
    basketTotal.textContent = "0€";
    updateCartCount();
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "basket-item";

    row.innerHTML = `
      <img src="${escapeAttr(item.image || "")}">
      <div class="info">
        <h4>${escapeHtml(item.name)}</h4>
        <div class="price">${Number(item.price).toFixed(2)}€</div>
      </div>
      <div class="actions">
        <button>Remove</button>
      </div>
    `;

    // Remove
    row.querySelector("button").onclick = () => {
      cart = cart.filter(p => p.id !== item.id);
      saveCart();
      renderBasket();
      updateCartCount();
    };

    // ✅ PAYMENT EMBED (FIXED & EXECUTABLE)
    if (item.paymentButton) {
      const payBox = document.createElement("div");
      payBox.className = "payment-embed";
      injectTrustedEmbed(payBox, item.paymentButton);
      row.appendChild(payBox);
    }

    basketItems.appendChild(row);
  });

  basketTotal.textContent = calculateTotal().toFixed(2) + "€";
  updateCartCount();
}

/* ===============================
   ADD TO CART
================================ */
function addToCart(product) {
  if (cart.find(p => p.id === product.id)) {
    alert("This product is already in your basket.");
    return;
  }

  cart.push(product);
  saveCart();
  updateCartCount();
  renderBasket();
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(list) {
  shopGrid.innerHTML = "";

  list.forEach(product => {
    const box = document.createElement("div");
    box.className = "productbox";

    box.innerHTML = `
      <img src="${escapeAttr(product.image || "")}">
      <h3>${escapeHtml(product.name)}</h3>
      <div>${Number(product.price).toFixed(2)}€</div>
      <p>${escapeHtml(product.description || "")}</p>
      <div class="stock">In stock: ${product.quantity || 0}</div>
      <div>
        <button class="btn view">Buy from Amazon <i class="fa-brands fa-amazon"></i></button>
        <button class="btn add">Add to basket</button>
      </div>
    `;

    box.querySelector(".view").onclick = () => {
      if (product.link) window.open(product.link, "_blank");
    };

    box.querySelector(".add").onclick = () => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        paymentButton: product.paymentButton || ""
      });
    };

    shopGrid.appendChild(box);
  });
}

/* ===============================
   FILTERS / SORT / SEARCH
================================ */
categorySelect && categorySelect.addEventListener("change", applyFilters);
sortSelect && sortSelect.addEventListener("change", applyFilters);
searchInput && searchInput.addEventListener("input", applyFilters);

function applyFilters() {
  let list = [...allProducts];

  const category = categorySelect.value;
  const sort = sortSelect.value;
  const search = searchInput.value.toLowerCase();

  if (category !== "all") {
    list = list.filter(p => p.category === category);
  }

  if (search) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.description || "").toLowerCase().includes(search)
    );
  }

  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));

  renderProducts(list);
}

/* ===============================
   FIREBASE PRODUCTS (REALTIME)
================================ */
const productsRef = collection(db, "products");

onSnapshot(productsRef, snap => {
  allProducts = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  applyFilters();
});

/* ===============================
   HELPERS
================================ */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function escapeAttr(str = "") {
  return str.replace(/"/g, "&quot;");
}

/* ===============================
   INIT
================================ */
updateCartCount();
renderBasket();
