import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});
const db = getFirestore(app);
const auth = getAuth(app);

const shopgrid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

let allProducts = [];
let cart = [];

onSnapshot(collection(db,"products"), snap=>{
  allProducts = snap.docs.map(d=>({id:d.id,...d.data()}));
  fillCategories();
  render(allProducts);
});

function fillCategories(){
  categorySelect.innerHTML = `<option value="all">Kõik</option>`;
  [...new Set(allProducts.map(p=>p.category))].forEach(c=>{
    if(c){
      const o=document.createElement("option");
      o.value=c;o.textContent=c;
      categorySelect.appendChild(o);
    }
  });
}

function render(list){
  shopgrid.innerHTML="";
  list.forEach(p=>{
    const d=document.createElement("div");
    d.className="productbox";
    d.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <b>${p.price.toFixed(2)}€</b>
      <p>${p.description}</p>
      <div class="stock">Laos: ${p.quantity}</div>
      <button ${p.quantity<=0?"disabled":""}>Lisa korvi</button>
    `;
    d.querySelector("button").onclick=()=>{
      if(p.quantity<=0) return;
      cart=[p];
      updateCart();
    };
    shopgrid.appendChild(d);
  });
}

function updateCart(){
  basketItems.innerHTML="";
  if(cart.length){
    const p=cart[0];
    basketItems.innerHTML=`
      <div class="basket-item">
        <img src="${p.image}" width="60">
        <div>
          <b>${p.name}</b><br>${p.price.toFixed(2)}€
        </div>
      </div>
      ${p.paymentButton||""}
    `;
  }
  cartCount.innerText=cart.length;
}

cartIcon.onclick=()=>basket.classList.add("open");
document.getElementById("close-basket").onclick=()=>basket.classList.remove("open");

categorySelect.onchange=apply;
sortSelect.onchange=apply;
searchInput.oninput=apply;

function apply(){
  let l=[...allProducts];
  if(categorySelect.value!=="all") l=l.filter(p=>p.category===categorySelect.value);
  if(searchInput.value) l=l.filter(p=>p.name.toLowerCase().includes(searchInput.value.toLowerCase()));
  if(sortSelect.value==="price-asc") l.sort((a,b)=>a.price-b.price);
  if(sortSelect.value==="price-desc") l.sort((a,b)=>b.price-a.price);
  render(l);
}

onAuthStateChanged(auth,u=>{
  document.getElementById("accountLink").style.display=u?"none":"inline";
  document.getElementById("logoutBtn").style.display=u?"inline":"none";
  if(u) document.getElementById("logoutBtn").onclick=()=>signOut(auth);
});
