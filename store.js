import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ================= FIREBASE ================= */
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

/* ================= DOM ================= */
const shopgrid = document.getElementById("shopgrid");
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
const basketPanel = document.getElementById("basket-panel");
const closeBasketBtn = document.getElementById("closeBasket");
const basketItemsDiv = document.getElementById("basket-items");

const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

const loginStatus = document.getElementById("loginStatus");
const settingsBtn = document.getElementById("settingsBtn");
const ordersBtn = document.getElementById("ordersBtn");

/* ================= STATE ================= */
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (user) {
    loginStatus.innerText = user.email;
  } else {
    loginStatus.innerText = "Logimata";
  }
});

/* ================= LOAD PRODUCTS ================= */
onSnapshot(collection(db, "products"), snap => {
  allProducts = [];
  snap.forEach(doc => {
    allProducts.push({ id: doc.id, ...doc.data() });
  });
  populateCategoryFilter();
  renderProducts();
});

/* ================= RENDER PRODUCTS ================= */
function renderProducts() {
  shopgrid.innerHTML = "";

  const category = categoryFilter.value;
  const search = searchInput.value.toLowerCase();

  allProducts
    .filter(p =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(search)
    )
    .forEach(p => {
      const box = document.createElement("div");
      box.className = "productbox";

      const outOfStock = p.quantity <= 0;

      box.innerHTML = `
        <img src="${p.image}" alt="">
        <h3>${p.name}</h3>
        <p>${p.description || ""}</p>
        <p><strong>${p.price} €</strong></p>
        <p>Laos: ${p.quantity}</p>
        <button ${outOfStock ? "disabled" : ""}>
          ${outOfStock ? "Otsas" : "Lisa korvi"}
        </button>
      `;

      if (!outOfStock) {
        box.querySelector("button").onclick = () => addToCart(p);
      }

      shopgrid.appendChild(box);
    });
}

/* ================= CATEGORY FILTER ================= */
function populateCategoryFilter() {
  const cats = ["all", ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  categoryFilter.innerHTML = "";
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c === "all" ? "Kõik" : c;
    categoryFilter.appendChild(opt);
  });
}

categoryFilter.onchange = renderProducts;
searchInput.oninput = renderProducts;

/* ================= CART ================= */
function addToCart(product) {
  if (cart.find(i => i.id === product.id)) return;

  cart.push(product);
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  basketItemsDiv.innerHTML = "";
  cartCount.innerText = cart.length;

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "basket-item";

    div.innerHTML = `
      <img src="${item.image}">
      <div style="flex:1">
        <strong>${item.name}</strong>
        <div>${item.price} €</div>
      </div>
      <button>X</button>
    `;

    div.querySelector("button").onclick = () => removeFromCart(item.id);
    basketItemsDiv.appendChild(div);
  });
}

/* ================= BASKET TOGGLE ================= */
cartIcon.onclick = () => basketPanel.classList.add("open");
closeBasketBtn.onclick = () => basketPanel.classList.remove("open");

/* ================= SETTINGS / ORDERS (PLACEHOLDERS) ================= */
settingsBtn.onclick = () => alert("Settings menu opens (JS works)");
ordersBtn.onclick = () => alert("Orders menu opens (JS works)");

/* ================= INIT ================= */
renderCart();
