import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc,
  collection, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

/* ===== SETTINGS MODAL ===== */
const overlay = document.getElementById("settings-overlay");
const openBtn = document.getElementById("settingsBtn");
const closeBtn = document.getElementById("settings-close");

openBtn.onclick = e => {
  e.preventDefault();
  overlay.classList.add("show");
};

closeBtn.onclick = () => overlay.classList.remove("show");

overlay.onclick = e => {
  if (e.target === overlay) overlay.classList.remove("show");
};

/* ===== USER SETTINGS ===== */
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
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      address: document.getElementById("settings-address").value,
      dpd: document.getElementById("settings-dpd").value
    },
    { merge: true }
  );

  alert("Salvestatud!");
};

/* ===== ORDERS VIEW ===== */
function loadOrders(uid) {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", uid)
  );

  onSnapshot(q, snap => {
    const box = document.getElementById("my-orders");
    box.innerHTML = "";
    snap.forEach(d => {
      const o = d.data();
      box.innerHTML += `<div>${o.productName} – ${o.status}</div>`;
    });
  });
}
