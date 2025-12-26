import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const shopgrid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart-btn");

/* DATA */
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* CART */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function updateCartUI() {
  cartCount.textContent = cart.length;
  basketItems.innerHTML = "";
  let total = 0;

  cart.forEach(p => {
    total += p.price;
    const div = document.createElement("div");
    div.className = "basket-item";
    div.innerHTML = `
      <img src="${p.image}">
      <div>
        <strong>${p.name}</strong><br>${p.price}€
        <button data-id="${p.id}">Eemalda</button>
      </div>`;
    div.querySelector("button").onclick = () => {
      cart = cart.filter(i => i.id !== p.id);
      saveCart(); updateCartUI();
    };
    basketItems.appendChild(div);
  });

  basketTotal.textContent = total.toFixed(2) + "€";
}
updateCartUI();

/* BASKET UI */
cartIcon.onclick = () => basket.classList.add("open");
closeBasket.onclick = () => basket.classList.remove("open");
clearCartBtn.onclick = () => {
  cart = []; saveCart(); updateCartUI();
};

/* PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  populateCategories();
  applyFilters();
});

/* FILTERS */
function populateCategories() {
  const cats = ["all", ...new Set(products.map(p => p.category))];
  categorySelect.innerHTML = cats.map(c =>
    `<option value="${c}">${c === "all" ? "Kõik" : c}</option>`
  ).join("");
}

function applyFilters() {
  let list = [...products];
  const cat = categorySelect.value;
  const q = searchInput.value.toLowerCase();

  if (cat && cat !== "all") list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q));

  if (sortSelect.value === "price-asc") list.sort((a,b)=>a.price-b.price);
  if (sortSelect.value === "price-desc") list.sort((a,b)=>b.price-a.price);

  render(list);
}

categorySelect.onchange = applyFilters;
sortSelect.onchange = applyFilters;
searchInput.oninput = applyFilters;

/* RENDER */
function render(list) {
  shopgrid.innerHTML = "";
  list.forEach(p => {
    const out = p.quantity <= 0;
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price}€</p>
      <div>Laos: ${p.quantity}</div>
      <button ${out ? "disabled" : ""}>
        ${out ? "Otsas" : "Lisa korvi"}
      </button>
    `;
    if (!out) {
      div.querySelector("button").onclick = () => {
        cart = [p]; // SINGLE PRODUCT ONLY
        saveCart();
        updateCartUI();
        basket.classList.add("open");
      };
    }
    shopgrid.appendChild(div);
  });
}

/* AUTH UI */
onAuthStateChanged(auth, user => {
  document.getElementById("accountLink").style.display = user ? "none" : "inline";
  document.getElementById("logoutBtn").style.display = user ? "inline" : "none";
  if (user) document.getElementById("logoutBtn").onclick = () => signOut(auth);
});
