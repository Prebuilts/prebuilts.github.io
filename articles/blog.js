// blog.js (cached Firestore blog loader)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* FIREBASE CONFIG (same project) */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);

/* 🔹 Firestore with offline cache */
const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

/* DOM */
const blogGrid = document.getElementById("blogGrid");

/* CACHE SETTINGS */
const BLOG_CACHE_KEY = "blog_cache_v1";
const BLOG_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

let allPosts = [];

/* 🔹 LOAD BLOG POSTS WITH CACHE */
async function loadBlogPosts() {
  const cached = localStorage.getItem(BLOG_CACHE_KEY);

  if (cached) {
    try {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < BLOG_CACHE_TTL) {
        allPosts = data;
        renderPosts(allPosts);
        return;
      }
    } catch(e){}
  }

  const snap = await getDocs(collection(db, "blog"));
  allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  localStorage.setItem(BLOG_CACHE_KEY, JSON.stringify({
    data: allPosts,
    time: Date.now()
  }));

  renderPosts(allPosts);
}

/* 🔹 RENDER BLOG LIST */
function renderPosts(posts) {
  if (!blogGrid) return;
  blogGrid.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("article");
    card.className = "blog-card";
    card.innerHTML = `
      <img src="${escapeAttr(post.image || '')}" alt="">
      <h3>${escapeHtml(post.title || '')}</h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <a href="${escapeAttr(post.link)}" class="read-more">
        Read more →
      </a>
    `;
    blogGrid.appendChild(card);
  });
}

/* 🔹 HELPERS */
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}
function escapeAttr(s='') {
  return String(s).replace(/"/g,'&quot;');
}

/* INIT */
loadBlogPosts();
