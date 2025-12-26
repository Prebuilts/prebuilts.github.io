import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

let cart = JSON.parse(localStorage.getItem("cart_v1") || "[]");
let products = [];

function saveCart() {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
  cartCount.innerText = cart.length;
}

cartIcon.onclick = () => basket.classList.add("open");
document.getElementById("close-basket").onclick = () => basket.classList.remove("open");

onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

function renderProducts(list) {
  grid.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <b>${p.price.toFixed(2)}€</b>
      <p>${p.description}</p>
      <div class="stock">Laos: ${p.quantity}</div>
      <button ${p.quantity <= 0 ? "disabled" : ""}>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () => {
      if (cart.length) return alert("Ainult 1 toode korraga");
      cart = [p];
      saveCart();
      renderBasket();
    };
    grid.appendChild(div);
  });
}

function renderBasket() {
  basketItems.innerHTML = "";
  if (!cart.length) return;
  const p = cart[0];
  basketItems.innerHTML = `
    <h4>${p.name}</h4>
    ${p.paymentButton || ""}
  `;
}

document.getElementById("paidBtn").onclick = async () => {
  const orderId = document.getElementById("order-id-input").value.trim();
  if (!orderId) return alert("Sisesta Order ID");

  const user = auth.currentUser;
  if (!user) return alert("Logi sisse");

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    email: user.email,
    productId: cart[0].id,
    productName: cart[0].name,
    orderId,
    status: "paid",
    createdAt: new Date()
  });

  cart = [];
  saveCart();
  renderBasket();
  alert("Tellimus salvestatud");
};

onAuthStateChanged(auth, user => {
  document.getElementById("accountLink").style.display = user ? "none" : "inline";
  document.getElementById("logoutBtn").style.display = user ? "inline" : "none";
  document.getElementById("logoutBtn").onclick = () => signOut(auth);
});
