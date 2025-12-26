import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

const grid = document.getElementById("shopgrid");
const basket = document.getElementById("basket");
const basketItems = document.getElementById("basket-items");
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");

let cart = [];

cartIcon.onclick = () => basket.classList.toggle("open");

onAuthStateChanged(auth, async user => {
  if (!user) return;

  document.getElementById("user-email").innerText = user.email;
  loadProducts();
  loadOrders(user.uid);
});

async function loadProducts() {
  const snap = await getDocs(collection(db,"products"));
  grid.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const div = document.createElement("div");
    div.className="product";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price}€</p>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity<=0?'disabled':''}>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () => addToCart(d.id,p);
    grid.appendChild(div);
  });
}

function addToCart(id,p) {
  if(cart.length>=1) return alert("Ainult 1 toode korraga");
  cart.push({id,...p});
  renderCart();
}

function renderCart() {
  basketItems.innerHTML="";
  cart.forEach((i,idx)=>{
    const div=document.createElement("div");
    div.className="basket-item";
    div.innerHTML=`
      <span>${i.name}</span>
      <button>Eemalda</button>
    `;
    div.querySelector("button").onclick=()=>{
      cart.splice(idx,1);
      renderCart();
    };
    basketItems.appendChild(div);
  });
  cartCount.innerText=cart.length;
}

async function loadOrders(uid){
  const q=query(collection(db,"orders"),where("userId","==",uid));
  const snap=await getDocs(q);
  const list=document.getElementById("orders-list");
  list.innerHTML="";
  snap.forEach(d=>{
    const o=d.data();
    list.innerHTML+=`
      <div>
        ${o.productName} – ${o.status}
      </div>
    `;
  });
}
