import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc,
  updateDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ================= CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
  storageBucket: "prebuiltid-website.firebasestorage.app",
  messagingSenderId: "854871585546",
  appId: "1:854871585546:web:568400979292a0c31740f3"
};

// ✅ SINGLE SOURCE OF TRUTH
const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

/* ================= INIT ================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ================= DOM ================= */

const statusDiv = document.getElementById("status");
const productList = document.getElementById("productList");
const ordersList = document.getElementById("ordersList");

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const descInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const categoryInput = document.getElementById("category");
const linkInput = document.getElementById("link");
const quantityInput = document.getElementById("quantity");
const paymentButtonInput = document.getElementById("paymentButton");
const addProductBtn = document.getElementById("addProduct");

/* ================= AUTH GUARD ================= */

onAuthStateChanged(auth, user => {
  if (!user) {
    statusDiv.innerText = "You must log in.";
    setTimeout(() => location.href = "login.html", 800);
    return;
  }

  if (user.uid !== ADMIN_UID) {
    statusDiv.innerText = "Access denied (not admin)";
    setTimeout(() => location.href = "index.html", 800);
    return;
  }

  statusDiv.innerText = "Admin UID verified";
  loadProducts();
  loadOrders();
});

/* ================= PRODUCTS ================= */

addProductBtn.onclick = async () => {
  const product = {
    name: nameInput.value.trim(),
    price: Number(priceInput.value) || 0,
    description: descInput.value.trim(),
    image: imageInput.value.trim(),
    category: categoryInput.value.trim(),
    link: linkInput.value.trim(),
    quantity: Number(quantityInput.value) || 0,
    paymentButton: paymentButtonInput.value.trim(),
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "products"), product);
    alert("Product added");
    nameInput.value = priceInput.value = descInput.value =
    imageInput.value = categoryInput.value =
    linkInput.value = quantityInput.value =
    paymentButtonInput.value = "";
  } catch (e) {
    alert("Add failed");
    console.error(e);
  }
};

function loadProducts() {
  onSnapshot(collection(db, "products"), snap => {
    productList.innerHTML = "";
    snap.forEach(d => {
      const p = d.data();
      const div = document.createElement("div");
      div.className = "product-item";
      div.innerHTML = `
        <img src="${p.image || ""}">
        <div>
          <b>${p.name}</b><br>
          €${p.price}<br>
          Qty: ${p.quantity}
          <br>
          <button>Delete</button>
        </div>
      `;
      div.querySelector("button").onclick = () =>
        deleteDoc(doc(db, "products", d.id));
      productList.appendChild(div);
    });
  });
}

/* ================= ORDERS ================= */

function loadOrders() {
  onSnapshot(collection(db, "orders"), snap => {
    ordersList.innerHTML = "";
    snap.forEach(d => {
      const o = d.data();
      const div = document.createElement("div");
      div.className = "order-item";
      div.innerHTML = `
        <b>${o.productName || "Product"}</b><br>
        ${o.email || "no email"}<br>
        Status:
        <select>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="sent">sent</option>
          <option value="cancelled">cancelled</option>
        </select>
      `;
      const sel = div.querySelector("select");
      sel.value = o.status || "pending";
      sel.onchange = () =>
        updateDoc(doc(db, "orders", d.id), { status: sel.value });
      ordersList.appendChild(div);
    });
  });
}
