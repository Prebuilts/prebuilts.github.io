import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* FIREBASE CONFIG (SAME AS STORE) */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM */
const blogGrid = document.getElementById("blog-grid");

if (!blogGrid) {
  console.error("❌ #blog-grid missing from blog.html");
  throw new Error("Missing blog-grid element");
}

/* LOAD POSTS */
async function loadBlogPosts() {
  blogGrid.innerHTML = "<p>Loading posts...</p>";

  try {
    const q = query(
      collection(db, "blogIndex"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      blogGrid.innerHTML = "<p>No blog posts yet.</p>";
      return;
    }

    const posts = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderPosts(posts);
  } catch (err) {
    console.error("❌ Blog load error:", err);
    blogGrid.innerHTML = "<p>Error loading blog posts.</p>";
  }
}

/* RENDER */
function renderPosts(posts) {
  blogGrid.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("article");
    card.className = "blog-card";

    card.innerHTML = `
      <img src="${escapeAttr(post.image || "")}" alt="">
      <h3>${escapeHtml(post.title || "Untitled")}</h3>
      <p>${escapeHtml(post.excerpt || "")}</p>
      <a href="${escapeAttr(post.link || "#")}" class="read-more">
        Read →
      </a>
    `;

    blogGrid.appendChild(card);
  });
}

/* HELPERS */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])
  );
}
function escapeAttr(s = "") {
  return String(s).replace(/"/g, "&quot;");
}

/* INIT */
loadBlogPosts();
