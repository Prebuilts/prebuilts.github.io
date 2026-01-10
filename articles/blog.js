import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const grid = document.getElementById("blogGrid");
const sortSelect = document.getElementById("sortSelect");

const CACHE_KEY = "blog_cache_v1";
const CACHE_TIME = 10 * 60 * 1000; // 10 min

let posts = [];

/* ===============================
   LOAD BLOG POSTS (CACHED)
   =============================== */
async function loadPosts() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.time < CACHE_TIME) {
      posts = data.posts;
      render();
      return;
    }
  }

  const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ time: Date.now(), posts })
  );

  render();
}

/* ===============================
   RENDER
   =============================== */
function render() {
  grid.innerHTML = "";

  posts.forEach(p => {
    const card = document.createElement("div");
    card.className = "tool-card";

    card.innerHTML = `
      <img src="${p.image || ""}" style="width:100%;border-radius:12px">
      <h3>${p.title}</h3>
      <a class="tool-btn" href="${p.url}">Read article</a>
    `;

    grid.appendChild(card);
  });
}

/* ===============================
   SORTING
   =============================== */
sortSelect.onchange = () => {
  if (sortSelect.value === "oldest") {
    posts.sort((a, b) => a.createdAt - b.createdAt);
  } else {
    posts.sort((a, b) => b.createdAt - a.createdAt);
  }
  render();
};

loadPosts();
