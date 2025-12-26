import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const app = initializeApp({
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  projectId: "prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, user => {
  if (!user || user.uid !== ADMIN_UID) {
    alert("Not admin");
    location.href = "/";
    return;
  }
  loadProducts();
});

function loadProducts() {
  onSnapshot(collection(db, "products"), snap => {
    const list = document.getElementById("productList");
    list.innerHTML = "";
    snap.forEach(d => {
      const p = d.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <b>${p.name}</b>
        <button>Delete</button>
      `;
      div.querySelector("button").onclick = () =>
        deleteDoc(doc(db, "products", d.id));
      list.appendChild(div);
    });
  });
}

document.getElementById("addProduct").onclick = async () => {
  await addDoc(collection(db, "products"), {
    name: name.value,
    price: Number(price.value),
    description: description.value,
    image: image.value,
    category: category.value,
    quantity: Number(quantity.value),
    paymentButton: paymentButton.value
  });
};
