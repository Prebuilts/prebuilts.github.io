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

const grid = document.getElementById("shopgrid");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

let products = [];
let cart = [];

/* LOAD PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = [];
  snap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  buildCategoryFilter();
  renderProducts();
});

/* FILTERS */
categoryFilter.onchange = renderProducts;
searchInput.oninput = renderProducts;

function buildCategoryFilter() {
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  categoryFilter.innerHTML = `<option value="all">Kõik</option>`;
  cats.forEach(c => {
    categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

/* RENDER */
function renderProducts() {
  const cat = categoryFilter.value;
  const q = searchInput.value.toLowerCase();

  grid.innerHTML = "";

  products
    .filter(p => (cat === "all" || p.category === cat))
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
  openBasket();
}

function openBasket() {
  basket.classList.add("open");
}

function closeBasket() {
  basket.classList.remove("open");
}

cartIcon.onclick = openBasket;
document.getElementById("closeBasket").onclick = closeBasket;
