import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
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
const paidBtn = document.getElementById("paidBtn");
const orderIdInput = document.getElementById("orderIdInput");

const settingsOverlay = document.getElementById("settingsOverlay");
const ordersOverlay = document.getElementById("ordersOverlay");

let currentUser = null;
let selectedProduct = null;

/* AUTH */
onAuthStateChanged(auth, user => {
  currentUser = user;
  loadOrders();
});

/* PRODUCTS */
const snap = await getDocs(collection(db, "products"));
snap.forEach(d => renderProduct(d.id, d.data()));

function renderProduct(id, p) {
  const el = document.createElement("div");
  el.className = "product";

  el.innerHTML = `
    <img src="${p.image}">
    <h3>${p.name}</h3>
    <div>${p.price} €</div>
    <div>Stock: ${p.quantity}</div>
    <button ${p.quantity <= 0 ? "disabled" : ""}>Add to cart</button>
  `;

  el.querySelector("button").onclick = () => {
    selectedProduct = { id, ...p };
    openCart();
  };

  grid.appendChild(el);
}

/* CART */
function openCart() {
  if (!selectedProduct) return;

  cartProduct.innerHTML = `
    <strong>${selectedProduct.name}</strong>
    <div>${selectedProduct.price} €</div>
  `;

  iframeBox.innerHTML = "";
  if (selectedProduct.paymentButton) {
    iframeBox.innerHTML = selectedProduct.paymentButton;
  }

  cartOverlay.classList.remove("hidden");
}

document.getElementById("cartClose").onclick =
  () => cartOverlay.classList.add("hidden");

/* MAKSIN ÄRA */
paidBtn.onclick = async () => {
  if (!currentUser) return alert("Login required");
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

  alert("Order submitted");
  cartOverlay.classList.add("hidden");
};

/* ORDERS */
function loadOrders() {
  if (!currentUser) return;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", currentUser.uid)
  );

  onSnapshot(q, snap => {
    const box = document.getElementById("ordersContent");
    box.innerHTML = "";
    snap.forEach(d => {
      const o = d.data();
      box.innerHTML += `
        <div>
          <strong>${o.productName}</strong>
          <div>Status: ${o.status}</div>
        </div>
      `;
    });
  });
}

/* SETTINGS / ORDERS OPEN CLOSE */
document.getElementById("settingsClose").onclick =
  () => settingsOverlay.classList.add("hidden");

document.getElementById("ordersClose").onclick =
  () => ordersOverlay.classList.add("hidden");
