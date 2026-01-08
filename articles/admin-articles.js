import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const params = new URLSearchParams(location.search);
const articleId = params.get("id") || crypto.randomUUID();

const sectionsEl = document.getElementById("sections");

function addSection(data = {}) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <input placeholder="Section heading" value="${data.heading||""}">
    <textarea placeholder="Section content">${data.content||""}</textarea>
  `;
  sectionsEl.appendChild(wrap);
}

document.getElementById("addSection").onclick = () => addSection();

onAuthStateChanged(auth, async user => {
  if (!user || user.uid !== ADMIN_UID) {
    document.body.innerHTML = "<h2>Access denied</h2>";
    return;
  }

  const ref = doc(db, "articles", articleId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    title.value = d.title;
    meta.value = d.meta;
    takeaway.value = d.takeaway;
    d.sections.forEach(addSection);
  } else {
    addSection(); addSection(); addSection();
  }
});

document.getElementById("save").onclick = async () => {
  const sections = [...sectionsEl.children].map(s => ({
    heading: s.children[0].value,
    content: s.children[1].value
  }));

  await setDoc(doc(db,"articles",articleId),{
    title: title.value,
    meta: meta.value,
    takeaway: takeaway.value,
    sections,
    published: false,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  },{merge:true});

  alert("Saved");
};

document.getElementById("publish").onclick = async () => {
  await setDoc(doc(db,"articles",articleId),
    { published:true, updatedAt: serverTimestamp() },
    { merge:true }
  );
  alert("Published");
};

document.getElementById("delete").onclick = async () => {
  if (!confirm("Delete article?")) return;
  await deleteDoc(doc(db,"articles",articleId));
  location.href = "blog.html";
};
