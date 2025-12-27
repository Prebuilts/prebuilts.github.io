import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot,
  addDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let products = [];
let cart = [];

const grid = document.getElementById("shopgrid");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

/* PRODUCTS */
onSnapshot(collection(db,"products"), snap => {
  products = [];
  snap.forEach(d => products.push({id:d.id,...d.data()}));
  renderProducts();
});

function renderProducts() {
  grid.innerHTML = "";
  products.forEach(p => {
    const out = p.quantity <= 0;
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price} €</p>
      <div class="stock">${out ? "Otsas" : "Laos: "+p.quantity}</div>
      <button ${out ? "disabled":""}>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () => addToCart(p);
    grid.appendChild(div);
  });
}

/* CART */
function addToCart(p) {
  cart = [p];
  cartCount.innerText = "1";
  basketItems.innerHTML = `<b>${p.name}</b><br>${p.price}€`;
  document.getElementById("paymentIframe").src = p.paymentButton;
  document.getElementById("paymentBox").style.display = "block";
  openBasket();
}

function openBasket(){ basket.classList.add("open"); }
function closeBasket(){ basket.classList.remove("open"); }

document.getElementById("cart-icon").onclick = openBasket;
document.getElementById("closeBasket").onclick = closeBasket;

/* PAYMENT CONFIRM */
document.getElementById("paidBtn").onclick = async () => {
  const orderId = document.getElementById("orderIdInput").value;
  if(!orderId) return alert("Sisesta Order ID");

  await addDoc(collection(db,"orders"),{
    userId: auth.currentUser.uid,
    product: cart[0].name,
    orderId,
    status:"paid",
    createdAt: serverTimestamp()
  });

  alert("Tellimus saadetud!");
  cart = [];
  closeBasket();
};

/* SETTINGS & ORDERS */
document.getElementById("openSettings").onclick=()=>document.getElementById("settingsModal").classList.add("show");
document.getElementById("closeSettings").onclick=()=>document.getElementById("settingsModal").classList.remove("show");

document.getElementById("openOrders").onclick=()=>document.getElementById("ordersModal").classList.add("show");
document.getElementById("closeOrders").onclick=()=>document.getElementById("ordersModal").classList.remove("show");

onAuthStateChanged(auth,user=>{
  if(!user) return;
  const q = query(collection(db,"orders"), where("userId","==",user.uid));
  onSnapshot(q,snap=>{
    const list=document.getElementById("ordersList");
    list.innerHTML="";
    snap.forEach(d=>{
      const o=d.data();
      list.innerHTML+=`<div>${o.product} – ${o.status}</div>`;
    });
  });
});
