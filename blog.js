import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ENABLE OFFLINE CACHE (SAFE) */
enableIndexedDbPersistence(db).catch(() => {
  console.warn("Firestore persistence not available");
});

/* DOM */
const grid = document.getElementById("postsGrid");

if (!grid) {
  console.error("postsGrid element not found");
}

/* LOAD POSTS */
async function loadBlogPosts() {
  try {
    const q = query(
      collection(db, "blogIndex"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = "<p>No blog posts yet.</p>";
      return;
    }

    renderPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    console.error("Blog load error:", err);
    grid.innerHTML = "<p>Failed to load posts.</p>";
  }
}

/* RENDER */
function renderPosts(posts) {
  grid.innerHTML = "";

  posts.forEach(post => {
    if (!post.title || !post.link) {
      console.warn("Skipping invalid post:", post);
      return;
    }

    const card = document.createElement("div");
    card.className = "post";

    card.innerHTML = `
      <h2>${escapeHtml(post.title)}</h2>
      ${post.createdAt ? `<span>${formatDate(post.createdAt)}</span>` : ""}
      ${post.image ? `<img src="${escapeAttr(post.image)}" style="width:100%;border-radius:12px;margin:10px 0;">` : ""}
      <div style="margin-top:10px;">
        <button class="open-post">Read article →</button>
      </div>
    `;

    card.querySelector(".open-post").onclick = () => {
      window.location.href = post.link;
    };

    grid.appendChild(card);
  });
}

/* HELPERS */
function formatDate(ts) {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleDateString();
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])
  );
}

function escapeAttr(str = "") {
  return str.replace(/"/g, "&quot;");
}

/* INIT */
loadBlogPosts();
