import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const grid = document.getElementById("grid");

const q = query(
  collection(db,"blogIndex"),
  orderBy("createdAt","desc")
);

onSnapshot(q, snap => {
  grid.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image}">
      <h3>${p.title}</h3>
    `;
    card.onclick = () => window.location.href = p.link;
    grid.appendChild(card);
  });
});
