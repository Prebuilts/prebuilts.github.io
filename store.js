import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");

const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart-btn");

/* State */
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* Cart */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  cartCount.textContent = cart.length;
}

function renderCart() {
  basketItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    basketItems.innerHTML = "<p>Korb on tühi</p>";
    basketTotal.textContent = "0 €";
    return;
  }

  cart.forEach(item => {
    total += item.price;

    const div = document.createElement("div");
    div.className = "basket-item";
    div.innerHTML = `
      <strong>${item.name}</strong><br>
      ${item.price.toFixed(2)} €
      <button>❌</button>
    `;

    div.querySelector("button").onclick = () => {
      cart = cart.filter(c => c.id !== item.id);
      saveCart();
      renderCart();
    };

    basketItems.appendChild(div);
  });

  basketTotal.textContent = total.toFixed(2) + " €";
}

cartIcon.onclick = () => {
  basket.classList.add("open");
  renderCart();
};

closeBasket.onclick = () => basket.classList.remove("open");

clearCartBtn.onclick = () => {
  cart = [];
  saveCart();
  renderCart();
};

/* Products */
function renderProducts(list) {
  grid.innerHTML = "";

  list.forEach(p => {
    const out = Number(p.quantity) <= 0;

    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <strong>${Number(p.price).toFixed(2)} €</strong>
      <div>Laos: ${p.quantity}</div>
      <button ${out ? "disabled" : ""}>
        ${out ? "Otsas" : "Lisa korvi"}
      </button>
    `;

    div.querySelector("button").onclick = () => {
      if (cart.find(c => c.id === p.id)) {
        alert("See toode on juba korvis");
        return;
      }
      cart.push({ id: p.id, name: p.name, price: Number(p.price) });
      saveCart();
    };

    grid.appendChild(div);
  });
}

/* Filtering */
function applyFilters() {
  let filtered = [...products];

  const q = searchInput.value.toLowerCase();
  if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q));

  if (categorySelect.value !== "all") {
    filtered = filtered.filter(p => p.category === categorySelect.value);
  }

  if (sortSelect.value === "price-asc") {
    filtered.sort((a,b) => a.price - b.price);
  }
  if (sortSelect.value === "price-desc") {
    filtered.sort((a,b) => b.price - a.price);
  }

  renderProducts(filtered);
}

searchInput.oninput = applyFilters;
categorySelect.onchange = applyFilters;
sortSelect.onchange = applyFilters;

/* Firestore */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const cats = new Set(products.map(p => p.category).filter(Boolean));
  categorySelect.innerHTML = `<option value="all">Kõik kategooriad</option>`;
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    categorySelect.appendChild(o);
  });

  applyFilters();
});

/* Init */
saveCart();
renderCart();
