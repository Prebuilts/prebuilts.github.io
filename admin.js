import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc,
  updateDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const statusDiv = document.getElementById("status");
const productList = document.getElementById("productList");

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
});

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
    createdAt: new Date()
  });
  alert("Product added");
};

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
    <img src="${p.image || ''}">
    <div class="fields">
      <label>Name</label>
      <input class="name" value="${p.name || ''}">
      <label>Price</label>
      <input class="price" type="number" value="${p.price || 0}">
      <label>Description</label>
      <textarea class="desc">${p.description || ''}</textarea>
      <label>Category</label>
      <input class="cat" value="${p.category || ''}">
      <label>Link</label>
      <input class="link" value="${p.link || ''}">
      <label>Quantity</label>
      <input class="qty" type="number" value="${p.quantity || 0}">
      <label>Payment button</label>
      <textarea class="pay">${p.paymentButton || ''}</textarea>

      <div class="actions">
        <button class="save">Save</button>
        <button class="btn-danger delete">Delete</button>
      </div>

      <div class="preview-area">${p.paymentButton || ''}</div>
    </div>
  `;

  div.querySelector(".save").onclick = async () => {
    await updateDoc(doc(db,"products",id), {
      name: div.querySelector(".name").value,
      price: Number(div.querySelector(".price").value),
      description: div.querySelector(".desc").value,
      category: div.querySelector(".cat").value,
      link: div.querySelector(".link").value,
      quantity: Number(div.querySelector(".qty").value),
      paymentButton: div.querySelector(".pay").value,
      image: p.image
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
