import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

const iframeBox = document.getElementById("paymentBox");
const iframe = document.getElementById("nowIframe");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const saveSettings = document.getElementById("saveSettings");

/* STATE */
let products = [];
let cart = [];

/* LOAD PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = [];
  snap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  buildCategoryFilter();
  renderProducts();
});

/* FILTER */
categoryFilter.onchange = renderProducts;
searchInput.oninput = renderProducts;

function buildCategoryFilter() {
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  categoryFilter.innerHTML = `<option value="all">Kõik</option>`;
  cats.forEach(c => categoryFilter.innerHTML += `<option value="${c}">${c}</option>`);
}

/* RENDER */
function renderProducts() {
  grid.innerHTML = "";
  const cat = categoryFilter.value;
  const q = searchInput.value.toLowerCase();

  products
    .filter(p => cat === "all" || p.category === cat)
    .filter(p => p.name.toLowerCase().includes(q))
    .forEach(p => {
      const out = p.quantity <= 0;
      const div = document.createElement("div");
      div.className = "productbox";

      div.innerHTML = `
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.price} €</p>
        <div class="stock">${out ? "Otsas" : "Laos: " + p.quantity}</div>
        <button ${out ? "disabled" : ""}>Lisa korvi</button>
      `;

      div.querySelector("button").onclick = () => addToCart(p);
      grid.appendChild(div);
    });
}

/* CART */
function addToCart(p) {
  cart = [p];
  cartCount.innerText = "1";
  basketItems.innerHTML = `<p><strong>${p.name}</strong><br>${p.price} €</p>`;

  if (p.paymentButton?.includes("iframe")) {
    iframe.src = extractIframeSrc(p.paymentButton);
    iframeBox.style.display = "block";
  }

  openBasket();
}

function extractIframeSrc(html) {
  const m = html.match(/src="([^"]+)"/);
  return m ? m[1] : "";
}

function openBasket() {
  basket.classList.add("open");
}
function closeBasket() {
  basket.classList.remove("open");
}

cartIcon.onclick = openBasket;
document.getElementById("closeBasket").onclick = closeBasket;

/* SETTINGS */
settingsBtn.onclick = () => settingsModal.classList.add("show");
closeSettings.onclick = () => settingsModal.classList.remove("show");

saveSettings.onclick = () => {
  localStorage.setItem("userEmail", document.getElementById("userEmail").value);
  localStorage.setItem("userShipping", document.getElementById("userShipping").value);
  alert("Salvestatud");
};

/* LOAD SAVED SETTINGS */
document.getElementById("userEmail").value =
  localStorage.getItem("userEmail") || "";
document.getElementById("userShipping").value =
  localStorage.getItem("userShipping") || "";
