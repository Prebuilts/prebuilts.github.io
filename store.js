import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc,
  serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const grid = document.getElementById("shopgrid");
const basket = document.getElementById("basket-panel");

document.getElementById("cart-icon").onclick = () =>
  basket.classList.add("open");

document.getElementById("closeBasket").onclick = () =>
  basket.classList.remove("open");

onSnapshot(collection(db,"products"), snap => {
  products = [];
  snap.forEach(d => products.push({id:d.id,...d.data()}));
  renderProducts();
});

function renderProducts(){
  grid.innerHTML="";
  products.forEach(p=>{
    const div=document.createElement("div");
    div.className="productbox";
    div.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price}€</p>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity<=0?"disabled":""}>Lisa ostukorvi</button>
    `;
    div.querySelector("button").onclick=()=>addToCart(p);
    grid.appendChild(div);
  });
}

function addToCart(p){
  cart=[p];
  localStorage.setItem("cart",JSON.stringify(cart));
  document.getElementById("cart-count").innerText=1;
  updateBasket();
}

function updateBasket(){
  if(!cart.length)return;
  document.getElementById("basket-items").innerHTML =
    `<b>${cart[0].name}</b> – ${cart[0].price}€`;
  document.getElementById("nowpayments-container").innerHTML =
    cart[0].paymentButton || "";
  document.getElementById("payment-section").style.display="block";
}

document.getElementById("paidBtn").onclick = async () => {
  const orderId = document.getElementById("orderIdInput").value;
  const shipping = document.querySelector("input[name=shipping]:checked").value;
  const address = document.getElementById("shippingAddress").value;

  if(!orderId || !auth.currentUser) return;
  if(!confirm("Oled sa kindel?")) return;

  await addDoc(collection(db,"orders"),{
    userId:auth.currentUser.uid,
    productName:cart[0].name,
    price:cart[0].price,
    orderId,
    shipping,
    address,
    status:"pending",
    createdAt:serverTimestamp()
  });

  cart=[];
  localStorage.removeItem("cart");
  basket.classList.remove("open");
};

onAuthStateChanged(auth,user=>{
  if(!user)return;
  const q=query(collection(db,"orders"),where("userId","==",user.uid));
  onSnapshot(q,snap=>{
    const list=document.getElementById("ordersList");
    list.innerHTML="";
    snap.forEach(d=>{
      const o=d.data();
      list.innerHTML+=`<div>${o.productName} – ${o.shipping} – ${o.status}</div>`;
    });
  });
});
  if(!cart.length)return;

  items.innerHTML=`<b>${cart[0].name}</b> – ${cart[0].price}€`;
  document.getElementById("payment-section").style.display="block";
  document.getElementById("nowpayments-container").innerHTML=cart[0].paymentButton;
}

document.getElementById("paidBtn").onclick=async()=>{
  const id=document.getElementById("orderIdInput").value;
  if(!id||!auth.currentUser)return;
  if(!confirm("Oled sa kindel?"))return;

  await addDoc(collection(db,"orders"),{
    userId:auth.currentUser.uid,
    productName:cart[0].name,
    price:cart[0].price,
    orderId:id,
    status:"pending",
    createdAt:serverTimestamp()
  });

  cart=[];
  saveCart();
  basket.classList.remove("open");
};

onAuthStateChanged(auth,user=>{
  if(!user)return;
  const q=query(collection(db,"orders"),where("userId","==",user.uid));
  onSnapshot(q,snap=>{
    const list=document.getElementById("ordersList");
    list.innerHTML="";
    snap.forEach(d=>{
      const o=d.data();
      list.innerHTML+=`<div>${o.productName} – ${o.status}</div>`;
    });
  });
});
