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
const categorySelect = document.getElementById("categorySelect");

document.getElementById("cart-icon").onclick = () =>
  document.getElementById("basket-panel").classList.add("open");

document.getElementById("closeBasket").onclick = () =>
  document.getElementById("basket-panel").classList.remove("open");

onSnapshot(collection(db,"products"), snap => {
  products = [];
  const cats = new Set(["all"]);

  snap.forEach(d=>{
    const p={id:d.id,...d.data()};
    products.push(p);
    if(p.category) cats.add(p.category);
  });

  categorySelect.innerHTML = [...cats]
    .map(c=>`<option value="${c}">${c}</option>`).join("");

  renderProducts(products);
});

categorySelect.onchange = () => {
  const val = categorySelect.value;
  renderProducts(val==="all" ? products : products.filter(p=>p.category===val));
};

function renderProducts(list){
  grid.innerHTML="";
  list.forEach(p=>{
    const div=document.createElement("div");
    div.className="productbox";
    div.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <b>${p.price}€</b>
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
  document.getElementById("basket-items").innerHTML =
    `<b>${p.name}</b> – ${p.price}€`;
  document.getElementById("nowpayments-container").innerHTML =
    p.paymentButton || "";
  document.getElementById("payment-section").style.display="block";
}

document.getElementById("paidBtn").onclick = async () => {
  const orderId=document.getElementById("orderIdInput").value;
  const ship=document.querySelector("input[name=shipping]:checked").value;
  const addr=document.getElementById("shippingAddress").value;

  if(!orderId||!auth.currentUser||!confirm("Oled sa kindel?"))return;

  await addDoc(collection(db,"orders"),{
    userId:auth.currentUser.uid,
    product:cart[0].name,
    orderId,
    shipping:ship,
    address:addr,
    status:"pending",
    createdAt:serverTimestamp()
  });

  localStorage.removeItem("cart");
  document.getElementById("basket-panel").classList.remove("open");
};

onAuthStateChanged(auth,user=>{
  if(!user)return;
  const q=query(collection(db,"orders"),where("userId","==",user.uid));
  onSnapshot(q,snap=>{
    document.getElementById("ordersList").innerHTML =
      snap.docs.map(d=>`<div>${d.data().product} – ${d.data().status}</div>`).join("");
  });
});
