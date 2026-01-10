console.log("✅ blog.js loaded");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

console.log("✅ Firebase imports OK");

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialized");

const db = getFirestore(app);
console.log("✅ Firestore connected");

const grid = document.getElementById("blogGrid");

if (!grid) {
  console.error("❌ blogGrid NOT FOUND in HTML");
} else {
  console.log("✅ blogGrid found");
}

async function load() {
  console.log("⏳ Fetching blogPosts…");

  const snap = await getDocs(collection(db, "blogPosts"));

  console.log("📦 Documents found:", snap.size);

  if (snap.empty) {
    grid.innerHTML = "<p>No blog posts found.</p>";
    return;
  }

  snap.forEach(doc => {
    const d = doc.data();
    console.log("➡ Post:", d);

    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${d.title}</h3>
      <a href="${d.url}">Read</a>
    `;
    grid.appendChild(div);
  });
}

load();
