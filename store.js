import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

/* State */
let allProducts = [];
let cart = [];

/* Auth */
onAuthStateChanged(auth, user => {
  document.getElementById("user-email").textContent =
    user ? user.email : "Not logged in";
});

/* Load products */
onSnapshot(collection(db, "products"), snap => {
  allProducts = [];
  snap.forEach(d => allProducts.push({ id:d.id, ...d.data() }));
  rebuildCategories();
  applyFilters();
});

/* Filters */
categorySelect.onchange = applyFilters;
searchInput.oninput = applyFilters;

function rebuildCategories() {
  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  categorySelect.innerHTML = `<option value="all">Kõik</option>`;
  cats.forEach(c => {
    categorySelect.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function applyFilters() {
  const cat = categorySelect.value;
  const q = searchInput.value.toLowerCase();

  const filtered = allProducts.filter(p => {
    const okCat = cat === "all" || p.category === cat;
    const okSearch =
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return okCat && okSearch;
  });

  renderProducts(filtered);
}

/* Render store */
function renderProducts(products) {
  grid.innerHTML = "";

  products.forEach(p => {
    const inStock = p.quantity > 0;

    const div = document.createElement("div");
    div.className = "productbox";

    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="stock ${inStock ? "in" : "out"}">
        ${inStock ? `Laos: ${p.quantity}` : "Välja müüdud"}
      </div>
      <strong>€${p.price}</strong>
      <button ${!inStock ? "disabled" : ""}>Lisa ostukorvi</button>
    `;

    div.querySelector("button").onclick = () => {
      if (!inStock) return;
      cart = [p];
      renderCart();
    };

    grid.appendChild(div);
  });
}

/* Cart */
function renderCart() {
  cartCount.textContent = cart.length;
  basketItems.innerHTML = "";

  if (!cart.length) {
    basketItems.innerHTML = "<p>Ostukorv tühi</p>";
    return;
  }

  const p = cart[0];

  basketItems.innerHTML = `
    <div class="basket-item">
      <img src="${p.image}">
      <h4>${p.name}</h4>
      <div>€${p.price}</div>
      ${p.paymentButton || ""}
    </div>
  `;
}

/* Basket toggle */
cartIcon.onclick = () => basketPanel.classList.add("open");
document.getElementById("close-basket").onclick =
  () => basketPanel.classList.remove("open");
