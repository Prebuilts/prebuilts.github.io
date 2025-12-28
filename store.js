import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixzURY",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const grid = document.getElementById("productGrid");
const cartOverlay = document.getElementById("cartOverlay");
const cartProduct = document.getElementById("cartProduct");
const iframeBox = document.getElementById("paymentIframeBox");

const openCart = document.getElementById("openCart");
const closeCart = document.getElementById("closeCart");
const paidBtn = document.getElementById("paidBtn");
const orderIdInput = document.getElementById("orderIdInput");

let currentUser = null;
let selectedProduct = null;

/* AUTH */
onAuthStateChanged(auth, u => currentUser = u);

/* LOAD PRODUCTS */
const snap = await getDocs(collection(db, "products"));
snap.forEach(d => renderProduct(d.id, d.data()));

function renderProduct(id, p) {
  const div = document.createElement("div");
  div.className = "product";

  div.innerHTML = `
    <img src="${p.image}">
    <h3>${p.name}</h3>
    <div>${p.price} €</div>
    <div>Stock: ${p.quantity}</div>
    <button ${p.quantity <= 0 ? "disabled" : ""}>Add to cart</button>
  `;

  div.querySelector("button").onclick = () => {
    selectedProduct = { id, ...p };
    openCartView();
  };

  grid.appendChild(div);
}

/* CART OPEN */
openCart.onclick = openCartView;
closeCart.onclick = () => cartOverlay.classList.add("hidden");

function openCartView() {
  if (!selectedProduct) return;

  cartProduct.innerHTML = `
    <strong>${selectedProduct.name}</strong>
    <div>${selectedProduct.price} €</div>
  `;

  /* 🔑 IFRAME LOGIC */
  iframeBox.innerHTML = "";
  if (selectedProduct.paymentButton) {
    iframeBox.innerHTML = selectedProduct.paymentButton;
  }

  cartOverlay.classList.remove("hidden");
}

/* PAID */
paidBtn.onclick = async () => {
  if (!currentUser || !selectedProduct) return alert("Login required");
  if (!orderIdInput.value.trim()) return alert("Enter order ID");

  await addDoc(collection(db, "orders"), {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    price: selectedProduct.price,
    nowpaymentsOrderId: orderIdInput.value,
    status: "paid",
    createdAt: serverTimestamp()
  });

  alert("Order submitted ✔");
  cartOverlay.classList.add("hidden");
};
