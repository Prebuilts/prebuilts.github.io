import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs
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

let lastDoc = null;
let loading = false;
let sortOrder = "desc";

async function loadPosts(reset=false) {
  if (loading) return;
  loading = true;

  if (reset) {
    grid.innerHTML = "";
    lastDoc = null;
  }

  let q = query(
    collection(db,"blog_posts"),
    where("published","==",true),
    orderBy("createdAt",sortOrder),
    limit(6)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snap = await getDocs(q);
  snap.forEach(doc => {
    const d = doc.data();
    const card = document.createElement("article");
    card.className = "blog-card";
    card.innerHTML = `
      <h3>${d.title}</h3>
      <span>${d.createdAt.toDate().toDateString()}</span>
      <p>${d.excerpt}</p>
      <a class="read-btn" href="post.html?id=${doc.id}">Read</a>
    `;
    grid.appendChild(card);
  });

  lastDoc = snap.docs[snap.docs.length - 1];
  loading = false;
}

sortSelect.onchange = () => {
  sortOrder = sortSelect.value;
  loadPosts(true);
};

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY > document.body.offsetHeight - 300) {
    loadPosts();
  }
});

loadPosts();
