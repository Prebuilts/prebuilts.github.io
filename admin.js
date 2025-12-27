import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ---------- FIREBASE ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ---------- DOM ---------- */
const statusDiv = document.getElementById("status");
const productList = document.getElementById("productList");
const ordersBox = document.getElementById("ordersBox");

const name = document.getElementById("name");
const price = document.getElementById("price");
const description = document.getElementById("description");
const image = document.getElementById("image");
const category = document.getElementById("category");
const link = document.getElementById("link");
const quantity = document.getElementById("quantity");
const paymentButton = document.getElementById("paymentButton");

/* ---------- AUTH CHECK ---------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    statusDiv.innerText = "Please log in.";
    setTimeout(() => location.href = "login.html", 800);
    return;
  }

  if (user.uid !== ADMIN_UID) {
    statusDiv.innerText = "Access denied.";
    setTimeout(() => location.href = "index.html", 800);
    return;
  }

  statusDiv.innerText = "Admin logged in ✔";
  loadProducts();
  loadOrders();
});

/* ---------- ADD PRODUCT ---------- */
document.getElementById("addProduct").onclick = async () => {
  try {
    await addDoc(collection(db, "products"), {
      name: name.value.trim(),
      price: Number(price.value) || 0,
      description: description.value.trim(),
      image: image.value.trim(),
      category: category.value.trim(),
      link: link.value.trim(),
      quantity: Number(quantity.value) || 0,
      paymentButton: paymentButton.value.trim(),
      createdAt: serverTimestamp()
    });

    alert("Product added ✔");

    name.value = "";
    price.value = "";
    description.value = "";
    image.value = "";
    category.value = "";
    link.value = "";
    quantity.value = "";
    paymentButton.value = "";

  } catch (err) {
    console.error("Add product failed:", err);
    alert("Failed to add product");
  }
};

/* ---------- PRODUCTS ---------- */
function loadProducts() {
  onSnapshot(collection(db, "products"), snap => {
    productList.innerHTML = "";
    snap.forEach(d => renderProduct(d.id, d.data()));
  });
}

function renderProduct(id, p) {
  const div = document.createElement("div");
  div.className = "product-item";

  div.innerHTML = `
    <img src="${escapeAttr(p.image || "")}">
    <div class="fields">
      <label>Name</label>
      <input class="name" value="${escapeAttr(p.name || "")}">
      <label>Price</label>
      <input class="price" type="number" value="${p.price || 0}">
      <label>Description</label>
      <textarea class="desc">${escapeHtml(p.description || "")}</textarea>
      <label>Category</label>
      <input class="cat" value="${escapeAttr(p.category || "")}">
      <label>Link</label>
      <input class="link" value="${escapeAttr(p.link || "")}">
      <label>Quantity</label>
      <input class="qty" type="number" value="${p.quantity || 0}">
      <label>NOWPayments embed</label>
      <textarea class="pay">${escapeHtml(p.paymentButton || "")}</textarea>

      <div class="actions">
        <button class="save">Save</button>
        <button class="btn danger delete">Delete</button>
      </div>

      <div class="preview-area">${p.paymentButton || ""}</div>
    </div>
  `;

  div.querySelector(".save").onclick = async () => {
    try {
      await updateDoc(doc(db, "products", id), {
        name: div.querySelector(".name").value.trim(),
        price: Number(div.querySelector(".price").value) || 0,
        description: div.querySelector(".desc").value.trim(),
        category: div.querySelector(".cat").value.trim(),
        link: div.querySelector(".link").value.trim(),
        quantity: Number(div.querySelector(".qty").value) || 0,
        paymentButton: div.querySelector(".pay").value.trim()
      });
      alert("Saved ✔");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed");
    }
  };

  div.querySelector(".delete").onclick = async () => {
    if (!confirm("Delete product?")) return;
    await deleteDoc(doc(db, "products", id));
  };

  productList.appendChild(div);
}

/* ---------- ORDERS ---------- */
function loadOrders() {
  if (!ordersBox) return;

  onSnapshot(collection(db, "orders"), snap => {
    ordersBox.innerHTML = "";

    snap.forEach(d => {
      const o = d.data();

      const div = document.createElement("div");
      div.className = "product-item";

      div.innerHTML = `
        <div class="fields">
          <strong>${escapeHtml(o.productName || "")}</strong>
          <div>${escapeHtml(o.userEmail || "")}</div>
          <div>${escapeHtml(o.shipping || "")}</div>
          <div>Status: <strong>${o.status}</strong></div>
          <button class="btn complete">Completed</button>
          <button class="btn danger cancel">Cancel</button>
        </div>
      `;

      div.querySelector(".complete").onclick = () =>
        updateDoc(doc(db, "orders", d.id), { status: "completed" });

      div.querySelector(".cancel").onclick = () =>
        updateDoc(doc(db, "orders", d.id), { status: "cancelled" });

      ordersBox.appendChild(div);
    });
  });
}

/* ---------- HELPERS ---------- */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function escapeAttr(s = "") {
  return String(s).replace(/"/g, "&quot;");
}
