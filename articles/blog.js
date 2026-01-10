import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ==========================
   FIREBASE INIT
========================== */

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================
   ELEMENT
========================== */

const blogGrid = document.getElementById("blog-grid");
const CACHE_KEY = "blogIndexCache";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/* ==========================
   LOAD BLOG POSTS
========================== */

async function loadBlogPosts() {
  // 🔹 Try cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.time < CACHE_TIME) {
      renderPosts(parsed.data);
      return;
    }
  }

  // 🔹 Fetch from Firestore
  const q = query(
    collection(db, "blogIndex"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  const posts = [];
  snap.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() });
  });

  // 🔹 Save cache
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ time: Date.now(), data: posts })
  );

  renderPosts(posts);
}

/* ==========================
   RENDER
========================== */

function renderPosts(posts) {
  blogGrid.innerHTML = "";

  if (!posts.length) {
    blogGrid.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "blog-card";

    card.innerHTML = `
      <img src="${post.image || '/Images/placeholder.jpg'}" alt="">
      <h3>${post.title}</h3>
      <a href="${post.url}" class="read-btn">Read →</a>
    `;

    blogGrid.appendChild(card);
  });
}

loadBlogPosts();
