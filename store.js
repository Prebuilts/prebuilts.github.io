import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");

/* STATE */
let products = [];
let cart = [];

/* AUTH */
onAuthStateChanged(auth, user => {
  document.getElementById("loginBtn").style.display = user ? "none" : "block";
  document.getElementById("logoutBtn").style.display = user ? "block" : "none";
  document.getElementById("user-email").textContent = user?.email || "—";
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

/* PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = [];
  const categories = new Set();

  snap.forEach(d => {
    const p = { id:d.id, ...d.data() };
    products.push(p);
    if (p.category) categories.add(p.category);
  });

  categorySelect.innerHTML = `<option value="all">Kõik</option>`;
  categories.forEach(c =>
    categorySelect.innerHTML += `<option value="${c}">${c}</option>`
  );

  render();
});

/* RENDER */
function render() {
  let list = [...products];

  if (categorySelect.value !== "all")
    list = list.filter(p => p.category === categorySelect.value);

  if (searchInput.value)
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchInput.value.toLowerCase())
    );

  if (sortSelect.value === "price-asc")
    list.sort((a,b)=>a.price-b.price);
  if (sortSelect.value === "price-desc")
    list.sort((a,b)=>b.price-a.price);

  grid.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price} €</p>
      <button>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () => addToCart(p);
    grid.appendChild(div);
  });
}

/* FILTER EVENTS */
categorySelect.onchange = render;
sortSelect.onchange = render;
searchInput.oninput = render;

/* CART */
cartIcon.onclick = () => basket.classList.add("open");
document.getElementById("close-basket").onclick = () =>
  basket.classList.remove("open");

function addToCart(p) {
  cart = [p];
  basketItems.innerHTML = `<p>${p.name} – ${p.price} €</p>`;
  document.getElementById("cart-count").textContent = "1";
}

/* SETTINGS */
const overlay = document.getElementById("settings-overlay");
document.getElementById("settingsBtn").onclick = e => {
  e.preventDefault();
  overlay.classList.add("show");
};
document.getElementById("settings-close").onclick =
  () => overlay.classList.remove("show");
overlay.onclick = e => {
  if (e.target === overlay) overlay.classList.remove("show");
};
