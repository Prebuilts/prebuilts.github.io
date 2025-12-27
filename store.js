import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

const grid = document.getElementById("shopgrid");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settings-modal");
const closeSettings = document.getElementById("close-settings");

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")||"[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderProducts(list) {
  grid.innerHTML="";
  list.forEach(p=>{
    const div=document.createElement("div");
    div.className="productbox";
    div.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <strong>${p.price}€</strong>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity<=0?"disabled":""}>Lisa korvi</button>
    `;
    div.querySelector("button").onclick=()=>{
      if(cart.length) return alert("Ainult 1 toode korraga");
      cart=[p];
      saveCart();
      renderCart();
    };
    grid.appendChild(div);
  });
}

function renderCart() {
  basketItems.innerHTML="";
  if(!cart.length) return;
  const p=cart[0];
  basketItems.innerHTML=`
    <div class="basket-item">
      <h4>${p.name}</h4>
      <div class="payment-embed">${p.paymentButton}</div>
      <button onclick="localStorage.removeItem('cart');location.reload()">Eemalda</button>
    </div>
  `;
  basketTotal.innerText=p.price+"€";
  cartCount.innerText=1;
}

onSnapshot(collection(db,"products"),snap=>{
  products=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderProducts(products);
});

cartIcon.onclick=()=>basket.classList.add("open");
document.getElementById("close-basket").onclick=()=>basket.classList.remove("open");

settingsBtn.onclick=()=>settingsModal.classList.add("show");
closeSettings.onclick=()=>settingsModal.classList.remove("show");

onAuthStateChanged(auth,async user=>{
  if(!user) return;
  document.getElementById("settings-email").innerText=user.email;
  const ref=doc(db,"users",user.uid);
  const snap=await getDoc(ref);
  if(snap.exists()){
    settingsAddress.value=snap.data().address||"";
    settingsDpd.value=snap.data().dpd||"";
  }
});

document.getElementById("save-settings").onclick=async()=>{
  const user=auth.currentUser;
  await setDoc(doc(db,"users",user.uid),{
    address:settingsAddress.value,
    dpd:settingsDpd.value
  },{merge:true});
  alert("Salvestatud");
};

renderCart();
