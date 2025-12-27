import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc,
  updateDoc, doc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixzURYKixzURYKixzURY",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const statusDiv = document.getElementById("status");
const productList = document.getElementById("productList");
const ordersBox = document.getElementById("ordersBox");

/* ---------- AUTH ---------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    statusDiv.innerText = "Please log in";
    setTimeout(() => location.href = "login.html", 800);
    return;
  }

  if (user.uid !== ADMIN_UID) {
    statusDiv.innerText = "Access denied";
    setTimeout(() => location.href = "index.html", 800);
    return;
  }

  statusDiv.innerText = "Admin logged in ✔";
  loadProducts();
  loadOrders();
});

/* ---------- ADD PRODUCT ---------- */
document.getElementById("addProduct").onclick = async () => {
  await addDoc(collection(db,"products"), {
    name: name.value,
    price: Number(price.value),
    description: description.value,
    image: image.value,
    category: category.value,
    link: link.value,
    quantity: Number(quantity.value),
    paymentButton: paymentButton.value,
    createdAt: serverTimestamp()
  });
  alert("Product added ✔");
};

/* ---------- PRODUCTS ---------- */
function loadProducts() {
  onSnapshot(collection(db,"products"), snap => {
    productList.innerHTML = "";
    snap.forEach(d => renderProduct(d.id, d.data()));
  });
}

function renderProduct(id, p) {
  const div = document.createElement("div");
  div.className = "product-item";

  div.innerHTML = `
    <img src="${p.image || ""}">
    <input class="name" value="${p.name || ""}">
    <input class="price" type="number" value="${p.price || 0}">
    <input class="cat" value="${p.category || ""}">
    <input class="link" value="${p.link || ""}">
    <input class="qty" type="number" value="${p.quantity || 0}">
    <textarea class="desc">${p.description || ""}</textarea>
    <textarea class="pay">${p.paymentButton || ""}</textarea>

    <div class="actions">
      <button class="btn save">Save</button>
      <button class="btn danger delete">Delete</button>
    </div>

    <div class="preview-area">${p.paymentButton || ""}</div>
  `;

  div.querySelector(".save").onclick = async () => {
    await updateDoc(doc(db,"products",id), {
      name: div.querySelector(".name").value,
      price: Number(div.querySelector(".price").value),
      description: div.querySelector(".desc").value,
      category: div.querySelector(".cat").value,
      link: div.querySelector(".link").value,
      quantity: Number(div.querySelector(".qty").value),
      paymentButton: div.querySelector(".pay").value
    });
    alert("Saved ✔");
  };

  div.querySelector(".delete").onclick = async () => {
    if (confirm("Delete product?")) {
      await deleteDoc(doc(db,"products",id));
    }
  };

  productList.appendChild(div);
}

/* ---------- ORDERS ---------- */
function loadOrders() {
  onSnapshot(collection(db,"orders"), snap => {
    ordersBox.innerHTML = "";

    snap.forEach(d => {
      const o = d.data();
      const div = document.createElement("div");
      div.className = "product-item";

      div.innerHTML = `
        <strong>${o.productName}</strong>
        <div>${o.userEmail}</div>
        <div>${o.shipping}</div>
        <div>Order ID: ${o.nowpaymentsOrderId || "-"}</div>

        <select class="status">
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div class="actions">
          <button class="btn save">Update</button>
          <button class="btn danger cancel">Cancel</button>
        </div>
      `;

      div.querySelector(".status").value = o.status || "pending";

      div.querySelector(".save").onclick = () =>
        updateDoc(doc(db,"orders",d.id), {
          status: div.querySelector(".status").value
        });

      div.querySelector(".cancel").onclick = () =>
        updateDoc(doc(db,"orders",d.id), { status:"cancelled" });

      ordersBox.appendChild(div);
    });
  });
}
