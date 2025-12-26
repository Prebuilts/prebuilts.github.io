import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, doc, getDoc,
  setDoc, addDoc, query, where
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

/* ===== CART ===== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
cartIcon.onclick = () => basket.classList.add("open");
document.getElementById("close-basket").onclick =
  () => basket.classList.remove("open");

/* ===== PRODUCTS ===== */
const grid = document.getElementById("shopgrid");
let allProducts = [];

onSnapshot(collection(db, "products"), snap => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(allProducts);
});

function render(list) {
  grid.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <strong>${p.price} €</strong>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity<=0?"disabled":""}>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () => addToCart(p);
    grid.appendChild(div);
  });
}

function addToCart(p) {
  if (cart.length) return alert("Ainult üks toode korraga");
  cart = [p];
  saveCart();
  renderCart();
}

/* ===== BASKET ===== */
function renderCart() {
  const items = document.getElementById("basket-items");
  items.innerHTML = "";
  if (!cart.length) return;

  const p = cart[0];
  items.innerHTML = `
    <div class="basket-item">
      <img src="${p.image}">
      <div>
        <strong>${p.name}</strong><br>
        ${p.price} €
      </div>
      <button id="remove">Eemalda</button>
    </div>
  `;
  document.getElementById("remove").onclick = () => {
    cart = [];
    saveCart();
    renderCart();
  };

  document.getElementById("payment-iframe").innerHTML =
    p.paymentButton || "";
}
renderCart();

/* ===== SETTINGS ===== */
const settings = document.getElementById("settings-modal");
document.getElementById("settingsBtn").onclick =
  () => settings.classList.add("show");
document.getElementById("close-settings").onclick =
  () => settings.classList.remove("show");

onAuthStateChanged(auth, async user => {
  if (!user) return;
  document.getElementById("settings-email").textContent = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    document.getElementById("settings-address").value = snap.data().address || "";
    document.getElementById("settings-dpd").value = snap.data().dpd || "";
  }

  loadOrders(user.uid);
});

document.getElementById("save-settings").onclick = async () => {
  const user = auth.currentUser;
  await setDoc(doc(db,"users",user.uid),{
    address: settingsAddress.value,
    dpd: settingsDpd.value
  },{merge:true});
};

/* ===== ORDERS ===== */
async function loadOrders(uid) {
  const q = query(collection(db,"orders"), where("userId","==",uid));
  onSnapshot(q,snap=>{
    const el=document.getElementById("my-orders");
    el.innerHTML="";
    snap.forEach(d=>{
      const o=d.data();
      el.innerHTML+=`
        <div>${o.productName} – ${o.status}
        ${o.status==="pending"
          ? `<button onclick="cancel('${d.id}')">Tühista</button>`:""}
        </div>`;
    });
  });
}

window.cancel = async id =>
  setDoc(doc(db,"orders",id),{status:"cancelled"},{merge:true});

/* ===== PAYMENT CONFIRM ===== */
document.getElementById("paidBtn").onclick = async () => {
  if (!confirm("Oled sa kindel?")) return;
  const user = auth.currentUser;
  if (!user) return alert("Logi sisse");

  const q = query(collection(db,"orders"),
    where("userId","==",user.uid),
    where("status","==","pending"));

  if ((await getDocs(q)).size >= 3)
    return alert("Max 3 aktiivset tellimust");

  await addDoc(collection(db,"orders"),{
    userId:user.uid,
    productName:cart[0].name,
    price:cart[0].price,
    status:"pending",
    createdAt:new Date()
  });

  cart=[];
  saveCart();
  renderCart();
};
