import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const catSelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");

let products = [];
let cart = [];

/* LOAD PRODUCTS */
onSnapshot(collection(db,"products"), snap => {
  products = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  buildCategories();
  renderProducts(products);
});

/* RENDER PRODUCTS */
function renderProducts(list){
  grid.innerHTML="";
  list.forEach(p=>{
    const box=document.createElement("div");
    box.className="productbox";
    box.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <strong>${p.price.toFixed(2)}€</strong>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity<=0?"disabled":""}>Lisa korvi</button>
    `;
    box.querySelector("button").onclick=()=>{
      cart=[p]; // single product only
      renderCart();
    };
    grid.appendChild(box);
  });
}

/* CATEGORIES */
function buildCategories(){
  const cats=[...new Set(products.map(p=>p.category).filter(Boolean))];
  catSelect.innerHTML='<option value="all">Kõik</option>';
  cats.forEach(c=>{
    const o=document.createElement("option");
    o.value=c;o.textContent=c;
    catSelect.appendChild(o);
  });
}

/* FILTERS */
catSelect.onchange=()=>applyFilters();
sortSelect.onchange=()=>applyFilters();
searchInput.oninput=()=>applyFilters();

function applyFilters(){
  let list=[...products];
  if(catSelect.value!=="all")
    list=list.filter(p=>p.category===catSelect.value);
  if(searchInput.value)
    list=list.filter(p=>p.name.toLowerCase().includes(searchInput.value.toLowerCase()));
  if(sortSelect.value==="price-asc")
    list.sort((a,b)=>a.price-b.price);
  if(sortSelect.value==="price-desc")
    list.sort((a,b)=>b.price-a.price);
  renderProducts(list);
}

/* CART */
cartIcon.onclick=()=>{
  basket.classList.add("open");
  renderCart();
};
closeBasket.onclick=()=>basket.classList.remove("open");

function renderCart(){
  basketItems.innerHTML="";
  if(!cart.length){
    basketItems.innerHTML="<p>Korb tühi</p>";
    basketTotal.textContent="0€";
    cartCount.textContent="0";
    return;
  }
  const p=cart[0];
  basketItems.innerHTML=`
    <div class="basket-item">
      <img src="${p.image}">
      <div>
        <strong>${p.name}</strong><br>
        ${p.price.toFixed(2)}€
      </div>
    </div>
    ${p.paymentButton || ""}
  `;
  basketTotal.textContent=p.price.toFixed(2)+"€";
  cartCount.textContent="1";
}
