import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.0.6/+esm";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const grid = document.getElementById("blogGrid");
const sort = document.getElementById("sort");

function load(order="desc"){
  grid.innerHTML="";
  const q = query(collection(db,"blog_posts"), orderBy("createdAt",order));
  onSnapshot(q,snap=>{
    grid.innerHTML="";
    snap.forEach(doc=>{
      const d = doc.data();
      const html = DOMPurify.sanitize(marked.parse(d.content||""));
      const el = document.createElement("div");
      el.className="post";
      el.innerHTML=`
        <h2>${d.title}</h2>
        <span>${d.createdAt?.toDate().toDateString()}</span>
        <div class="markdown">${html}</div>
      `;
      grid.appendChild(el);
    });
  });
}

load();

sort.onchange = ()=> load(sort.value==="new"?"desc":"asc");

/* menu */
hamburger.onclick=()=>nav.classList.add("active");
navClose.onclick=()=>nav.classList.remove("active");
