import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where
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
const paidBtn = document.getElementById("paidBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const saveSettings = document.getElementById("saveSettings");

const userEmailInput = document.getElementById("userEmail");
const userShippingInput = document.getElementById("userShipping");

/* STATE */
let products = [];
let cartProduct = null;

/* LOAD SETTINGS */
userEmailInput.value = localStorage.getItem("userEmail") || "";
userShippingInput.value = localStorage.getItem("userShipping") || "";

/* SAVE SETTINGS */
saveSettings.onclick = () => {
  localStorage.setItem("userEmail", userEmailInput.value);
  localStorage.setItem("userShipping", userShippingInput.value);
  alert("Seaded salvestatud");
};

/* SETTINGS UI */
settingsBtn.onclick = () => settingsModal.classList.add("show");
closeSettings.onclick = () => settingsModal.classList.remove("show");

/* PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = [];
  snap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  buildCategories();
  renderProducts();
});

function buildCategories() {
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  categoryFilter.innerHTML = `<option value="all">Kõik</option>`;
  cats.forEach(c => categoryFilter.innerHTML += `<option value="${c}">${c}</option>`);
}

categoryFilter.onchange = renderProducts;
searchInput.oninput = renderProducts;

/* RENDER PRODUCTS */
function renderProducts() {
  grid.innerHTML = "";
  const cat = categoryFilter.value;
  const q = searchInput.value.toLowerCase();

  products
    .filter(p => cat === "all" || p.category === cat)
    .filter(p => p.name.toLowerCase().includes(q))
    .forEach(p => {
      const out = p.quantity <= 0;

      const box = document.createElement("div");
      box.className = "productbox";

      box.innerHTML = `
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.price} €</p>
        <div class="stock">${out ? "Otsas" : "Laos: " + p.quantity}</div>
        <button ${out ? "disabled" : ""}>Lisa korvi</button>
      `;

      box.querySelector("button").onclick = () => addToCart(p);
      grid.appendChild(box);
    });
}

/* CART */
function addToCart(product) {
  cartProduct = product;
  cartCount.innerText = "1";

  basketItems.innerHTML = `
    <p><strong>${product.name}</strong></p>
    <p>${product.price} €</p>
  `;

  if (product.paymentButton?.includes("iframe")) {
    iframe.src = extractIframeSrc(product.paymentButton);
    iframeBox.style.display = "block";
  }

  openBasket();
}

function extractIframeSrc(html) {
  const m = html.match(/src="([^"]+)"/);
  return m ? m[1] : "";
}

cartIcon.onclick = openBasket;
document.getElementById("closeBasket").onclick = closeBasket;

function openBasket() {
  basket.classList.add("open");
}
function closeBasket() {
  basket.classList.remove("open");
}

/* MAKSiN ÄRA → CREATE ORDER */
paidBtn.onclick = async () => {
  if (!cartProduct) return;

  if (!userEmailInput.value || !userShippingInput.value) {
    alert("Palun täida email ja tarneaadress seadetest.");
    return;
  }

  if (!confirm("Oled sa kindel, et makse on tehtud?")) return;

  await addDoc(collection(db, "orders"), {
    userEmail: userEmailInput.value,
    shipping: userShippingInput.value,
    productId: cartProduct.id,
    productName: cartProduct.name,
    price: cartProduct.price,
    nowpaymentsIframe: cartProduct.paymentButton,
    status: "paid",
    createdAt: serverTimestamp()
  });

  alert("Tellimus esitatud!");
  cartProduct = null;
  cartCount.innerText = "0";
  basketItems.innerHTML = "";
  iframeBox.style.display = "none";
  closeBasket();
};
