import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const grid = document.getElementById("shopgrid");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");
const removeBtn = document.getElementById("remove-item");

/* STATE */
let products = [];
let cartItem = null;

/* AUTH UI */
onAuthStateChanged(auth, user => {
  document.getElementById("loginBtn").style.display = user ? "none" : "block";
  document.getElementById("logoutBtn").style.display = user ? "block" : "none";
});

/* PRODUCTS */
onSnapshot(collection(db, "products"), snap => {
  products = [];
  const cats = new Set(["Kõik"]);

  snap.forEach(d => {
    const p = { id:d.id, ...d.data() };
    products.push(p);
    if (p.category) cats.add(p.category);
  });

  categorySelect.innerHTML = [...cats]
    .map(c=>`<option value="${c}">${c}</option>`).join("");

  render();
});

/* RENDER */
function render() {
  let list = [...products];

  if (categorySelect.value !== "Kõik")
    list = list.filter(p=>p.category===categorySelect.value);

  if (searchInput.value)
    list = list.filter(p=>p.name.toLowerCase().includes(searchInput.value.toLowerCase()));

  if (sortSelect.value==="price-asc")
    list.sort((a,b)=>a.price-b.price);
  if (sortSelect.value==="price-desc")
    list.sort((a,b)=>b.price-a.price);

  grid.innerHTML = "";
  list.forEach(p=>{
    const out = p.quantity <= 0;

    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price} €</p>
      <div class="stock">Jäänud: ${p.quantity}</div>
      <button ${out?'disabled':''}>
        ${out?'Välja müüdud':'Lisa korvi'}
      </button>
    `;

    div.querySelector("button").onclick = ()=>{
      if (!out) addToCart(p);
    };

    grid.appendChild(div);
  });
}

/* FILTER EVENTS */
categorySelect.onchange = render;
sortSelect.onchange = render;
searchInput.oninput = render;

/* CART */
cartIcon.onclick = ()=>basket.classList.add("open");
document.getElementById("close-basket").onclick = ()=>basket.classList.remove("open");

function addToCart(p) {
  cartItem = p;
  cartCount.textContent = "1";

  basketItems.innerHTML = `
    <h4>${p.name}</h4>
    <p>${p.price} €</p>
    <div style="margin-top:10px">
      ${p.paymentButton || "<em>Makse puudub</em>"}
    </div>
  `;
}

removeBtn.onclick = ()=>{
  cartItem = null;
  basketItems.innerHTML = "<p>Ostukorv on tühi</p>";
  cartCount.textContent = "0";
};
