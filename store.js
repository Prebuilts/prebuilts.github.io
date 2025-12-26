import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, getDocs, doc, getDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* DOM */
const shopgrid = document.getElementById("shopgrid");
const cartIcon = document.getElementById("cart-icon");
const basketPanel = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const cartCount = document.getElementById("cart-count");

const paymentSection = document.getElementById("payment-section");
const nowFrame = document.getElementById("nowpayments-frame");
const shippingSelect = document.getElementById("shipping-select");
const orderIdInput = document.getElementById("payment-order-id");
const paidBtn = document.getElementById("paid-btn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settings-modal");
const saveSettings = document.getElementById("save-settings");
const closeSettings = document.getElementById("close-settings");
const ordersList = document.getElementById("orders-list");
const settingsEmail = document.getElementById("settings-email");
const settingsAddress = document.getElementById("settings-address");
const settingsDpd = document.getElementById("settings-dpd");

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

/* CART */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  cartCount.innerText = cart.length;
}

function renderCart() {
  basketItems.innerHTML = "";
  if (!cart.length) {
    paymentSection.style.display = "none";
    return;
  }

  const item = cart[0];

  basketItems.innerHTML = `
    <div class="basket-item">
      <img src="${item.image}" width="70">
      <div>
        <b>${item.name}</b><br>${item.price}€
      </div>
    </div>
  `;

  paymentSection.style.display = "block";
  nowFrame.innerHTML = item.paymentButton;

  loadShipping();
}

window.addToCart = (p) => {
  if (cart.length) return alert("Ainult üks toode korraga");
  cart = [p];
  saveCart();
  renderCart();
};

/* UI */
cartIcon.onclick = () => {
  basketPanel.classList.add("open");
  renderCart();
};
closeBasket.onclick = () => basketPanel.classList.remove("open");

/* SHIPPING */
async function loadShipping() {
  const user = auth.currentUser;
  if (!user) return;
  const snap = await getDoc(doc(db, "users", user.uid));
  shippingSelect.innerHTML = `<option>${snap.data()?.dpd || ""}</option>`;
}

/* PAYMENT CONFIRM */
paidBtn.onclick = async () => {
  if (!orderIdInput.value) return alert("Sisesta Order ID");
  if (!confirm("Oled sa kindel?")) return;

  const user = auth.currentUser;
  const snap = await getDocs(collection(db, "orders"));
  if (snap.docs.filter(d => d.data().uid === user.uid).length >= 3)
    return alert("Max 3 tellimust");

  await addDoc(collection(db, "orders"), {
    uid: user.uid,
    product: cart[0],
    shipping: shippingSelect.value,
    orderId: orderIdInput.value,
    status: "pending",
    created: Date.now()
  });

  cart = [];
  saveCart();
  renderCart();
  alert("Tellimus esitatud!");
};

/* PRODUCTS */
onSnapshot(collection(db,"products"), snap => {
  shopgrid.innerHTML = "";
  snap.docs.forEach(d => {
    const p = d.data();
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <b>${p.price}€</b>
      <button>Lisa korvi</button>
    `;
    div.querySelector("button").onclick = () =>
      addToCart({ ...p, id:d.id });
    shopgrid.appendChild(div);
  });
});

/* SETTINGS */
settingsBtn.onclick = () => {
  settingsModal.classList.add("show");
  loadOrders();
};

closeSettings.onclick = () => settingsModal.classList.remove("show");

saveSettings.onclick = async () => {
  const u = auth.currentUser;
  await setDoc(doc(db,"users",u.uid), {
    address: settingsAddress.value,
    dpd: settingsDpd.value
  }, { merge:true });
  alert("Salvestatud");
};

async function loadOrders() {
  ordersList.innerHTML = "";
  const user = auth.currentUser;
  const snap = await getDocs(collection(db,"orders"));
  snap.docs
    .filter(d=>d.data().uid===user.uid)
    .forEach(d=>{
      const o=d.data();
      const div=document.createElement("div");
      div.innerHTML=`${o.product.name} (${o.status})
        <button>Tühista</button>`;
      div.querySelector("button").onclick=async()=>{
        await deleteDoc(doc(db,"orders",d.id));
        loadOrders();
      };
      ordersList.appendChild(div);
    });
}

/* AUTH */
onAuthStateChanged(auth,u=>{
  if(u) settingsEmail.innerText=u.email;
});
