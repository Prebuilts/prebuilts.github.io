import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, doc, getDoc } from
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = { /* YOUR CONFIG */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const id = new URLSearchParams(location.search).get("id");
const snap = await getDoc(doc(db,"articles",id));
const a = snap.data();

const el = document.getElementById("article");

el.innerHTML = `
  <h1 class="article-title">${a.title}</h1>
  <div class="article-meta">${a.meta}</div>
  <div class="article-divider"><strong>Key takeaway:</strong> ${a.takeaway}</div>
  ${a.sections.map(s=>`<h2>${s.heading}</h2><p>${s.content}</p>`).join("")}
`;
