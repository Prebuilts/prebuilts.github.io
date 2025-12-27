import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* FIREBASE */
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

/* DOM */
const shopgrid = document.getElementById("shopgrid");
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
const basketPanel = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

const settingsBtn = document.getElementById("settingsBtn");
const ordersBtn = document.getElementById("ordersBtn");

/* MODALS */
const settingsModal = document.getElementById("settings-modal");
const ordersModal = document.getElementById("orders-modal");
const closeSettings = document.getElementById("close-settings");
const closeOrders = document.getElementById("close-orders");

const settingsEmail = document.getElementById("settings-email");

/* STATE */
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* AUTH */
onAuthStateChanged(auth, user => {
  if (user) settingsEmail.innerText = user.email;
});

/* PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts();
});

function renderProducts() {
  shopgrid.innerHTML = "";
  const cat = categoryFilter.value;
  const q = searchInput.value.toLowerCase();

  allProducts
    .filter(p =>
      (cat === "all" || p.category === cat) &&
      p.name.toLowerCase().includes(q)
    )
    .forEach(p => {
      const out = p.quantity <= 0;

      const div = document.createElement("div");
      div.className = "productbox";
      div.innerHTML = `
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.price} €</p>
        <p>Laos: ${p.quantity}</p>
        <button ${out ? "disabled" : ""}>
          ${out ? "Otsas" : "Lisa korvi"}
        </button>
      `;

      if (!out) div.querySelector("button").onclick = () => addToCart(p);
      shopgrid.appendChild(div);
    });
}

categoryFilter.onchange = renderProducts;
searchInput.oninput = renderProducts;

/* CART */
function addToCart(p) {
  cart = [p]; // ONLY ONE PRODUCT
  saveCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  basketItems.innerHTML = "";
  cartCount.innerText = cart.length;

  if (!cart.length) return;

  const p = cart[0];

  basketItems.innerHTML = `
    <h4>${p.name}</h4>

    <iframe
      src="${p.paymentButton}"
      width="410"
      height="696"
      frameborder="0"
      scrolling="no">
    </iframe>

    <p style="margin-top:10px;font-size:13px;">
      Palun saatke õige summa vastavalt hetke hinnale.
    </p>

    <input id="order-id" placeholder="NOWPayments Order ID">

    <button id="paid-btn">Maksin ära</button>
  `;

  document.getElementById("paid-btn").onclick = () => {
    if (!confirm("Oled sa kindel?")) return;
    alert("Tellimus edastatud (admin näeb seda)");
    cart = [];
    saveCart();
  };
}

/* BASKET TOGGLE */
cartIcon.onclick = () => basketPanel.classList.add("open");

/* SETTINGS / ORDERS */
settingsBtn.onclick = () => settingsModal.classList.add("show");
ordersBtn.onclick = () => ordersModal.classList.add("show");
closeSettings.onclick = () => settingsModal.classList.remove("show");
closeOrders.onclick = () => ordersModal.classList.remove("show");

/* INIT */
renderCart();
