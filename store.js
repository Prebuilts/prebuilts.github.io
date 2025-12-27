import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

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
const cartIcon = document.getElementById("cart-icon");
const basket = document.getElementById("basket-panel");
const closeBasket = document.getElementById("close-basket");
const basketItems = document.getElementById("basket-items");
const basketTotal = document.getElementById("basket-total");
const cartCount = document.getElementById("cart-count");

/* STATE */
let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

/* CART */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  basketItems.innerHTML = "";
  cartCount.innerText = cart.length;

  if (!cart.length) {
    basketTotal.innerText = "0€";
    return;
  }

  const p = cart[0];
  basketItems.innerHTML = `
    <div class="basket-item">
      <h4>${p.name}</h4>
      <div class="payment-embed">${p.paymentButton}</div>
      <button id="removeItem">Eemalda</button>
    </div>
  `;

  document.getElementById("removeItem").onclick = () => {
    cart = [];
    saveCart();
    renderCart();
  };

  basketTotal.innerText = p.price + "€";
}

/* PRODUCTS */
function renderProducts(list) {
  grid.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "productbox";
    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <strong>${p.price}€</strong>
      <p>Laos: ${p.quantity}</p>
      <button ${p.quantity <= 0 ? "disabled" : ""}>Lisa korvi</button>
    `;

    div.querySelector("button").onclick = () => {
      if (cart.length) return alert("Ainult üks toode korraga");
      cart = [p];
      saveCart();
      renderCart();
      basket.classList.add("open");
    };

    grid.appendChild(div);
  });
}

/* FIRESTORE */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

/* UI */
cartIcon.onclick = () => basket.classList.add("open");
closeBasket.onclick = () => basket.classList.remove("open");

/* SETTINGS */
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settings-modal");
const closeSettings = document.getElementById("close-settings");
const saveSettings = document.getElementById("save-settings");

settingsBtn.onclick = () => settingsModal.classList.add("show");
closeSettings.onclick = () => settingsModal.classList.remove("show");

onAuthStateChanged(auth, async user => {
  if (!user) return;
  document.getElementById("settings-email").innerText = user.email;
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    settingsAddress.value = snap.data().address || "";
    settingsDpd.value = snap.data().dpd || "";
  }
});

saveSettings.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, "users", user.uid), {
    address: settingsAddress.value,
    dpd: settingsDpd.value
  }, { merge: true });
  alert("Salvestatud");
};

renderCart();
