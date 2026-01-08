import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* ===== CONFIG ===== */
const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ===== DOM ===== */
const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const takeawayEl = document.getElementById("takeaway");
const sectionsEl = document.getElementById("sections");

const addSectionBtn = document.getElementById("addSection");
const saveBtn = document.getElementById("save");
const publishBtn = document.getElementById("publish");
const deleteBtn = document.getElementById("delete");

/* ===== ARTICLE ID ===== */
const params = new URLSearchParams(location.search);
const articleId = params.get("id") || Date.now().toString();

/* ===== HELPERS ===== */
function createSection(heading = "", content = "") {
  const div = document.createElement("div");
  div.className = "section";
  div.innerHTML = `
    <input placeholder="Section heading" value="${heading}">
    <textarea placeholder="Section content">${content}</textarea>
    <button class="remove">Remove section</button>
  `;
  div.querySelector(".remove").onclick = () => div.remove();
  sectionsEl.appendChild(div);
}

/* ===== AUTH & LOAD ===== */
onAuthStateChanged(auth, async user => {
  if (!user || user.uid !== ADMIN_UID) {
    document.body.innerHTML = "<h2 style='padding:40px'>Access denied</h2>";
    return;
  }

  const ref = doc(db, "articles", articleId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    titleEl.value = d.title || "";
    metaEl.value = d.meta || "";
    takeawayEl.value = d.takeaway || "";
    (d.sections || []).forEach(s => createSection(s.heading, s.content));
  } else {
    createSection();
    createSection();
    createSection();
  }
});

/* ===== EVENTS ===== */
addSectionBtn.onclick = () => createSection();

saveBtn.onclick = async () => {
  const sections = [...sectionsEl.children].map(sec => ({
    heading: sec.children[0].value,
    content: sec.children[1].value
  }));

  await setDoc(doc(db,"articles",articleId),{
    title: titleEl.value,
    meta: metaEl.value,
    takeaway: takeawayEl.value,
    sections,
    published: false,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  },{ merge:true });

  alert("Saved");
};

publishBtn.onclick = async () => {
  await setDoc(doc(db,"articles",articleId),
    { published:true, updatedAt: serverTimestamp() },
    { merge:true }
  );
  alert("Published");
};

deleteBtn.onclick = async () => {
  if (!confirm("Delete article?")) return;
  await deleteDoc(doc(db,"articles",articleId));
  location.href = "blog.html";
};
