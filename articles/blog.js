import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* 🔥 YOUR EXISTING FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
  storageBucket: "prebuiltid-website.firebasestorage.app",
  messagingSenderId: "854871585546",
  appId: "1:854871585546:web:568400979292a0c31740f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const grid = document.getElementById("blogGrid");
const sortSelect = document.getElementById("sort");

async function loadArticles(order = "desc") {
  grid.innerHTML = "";

  const q = query(
    collection(db, "articles"),
    orderBy("createdAt", order)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const a = docSnap.data();

    if (a.published === false) return; // hide drafts

    const card = document.createElement("article");
    card.className = "article-container reveal";
    card.style.margin = "0";
    card.style.padding = "24px";

    card.innerHTML = `
      <h2 style="font-size:1.4rem">${a.title}</h2>
      <div class="article-meta">${a.meta}</div>
      <p>${a.takeaway}</p>
      <a href="article.html?id=${docSnap.id}"
         style="margin-top:10px;display:inline-block;
         color:#2563eb;font-weight:600;text-decoration:none;">
         Read article →
      </a>
    `;

    grid.appendChild(card);
    requestAnimationFrame(() => card.classList.add("active"));
  });
}

sortSelect.addEventListener("change", e =>
  loadArticles(e.target.value)
);

loadArticles();
