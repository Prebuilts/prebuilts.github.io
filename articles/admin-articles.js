import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = { /* YOUR CONFIG */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentId = null;

onAuthStateChanged(auth, user => {
  if (!user || user.uid !== "zL2LJWPAiFWFpcdFFh3E7KfDrxi2") {
    alert("Unauthorized");
    location.href = "/";
  }
  loadArticles();
});

const sectionsDiv = document.getElementById("sections");

function sectionBox(data={}) {
  return `
    <div class="section-box">
      <input placeholder="Section heading" value="${data.heading||""}">
      <textarea placeholder="Section content">${data.content||""}</textarea>
    </div>
  `;
}

document.getElementById("addSection").onclick = () =>
  sectionsDiv.insertAdjacentHTML("beforeend", sectionBox());

async function loadArticles() {
  const snap = await getDocs(collection(db,"articles"));
  const list = document.getElementById("articleList");
  list.innerHTML = "";

  snap.forEach(d => {
    const div = document.createElement("div");
    div.textContent = d.data().title;
    div.onclick = () => editArticle(d.id, d.data());
    list.appendChild(div);
  });
}

function editArticle(id,data){
  currentId = id;
  articleEditor.style.display="block";
  title.value=data.title;
  meta.value=data.meta;
  takeaway.value=data.takeaway;
  sectionsDiv.innerHTML="";
  data.sections.forEach(s=>sectionsDiv.insertAdjacentHTML("beforeend",sectionBox(s)));
}

save.onclick = async ()=>{
  const sections=[...sectionsDiv.children].map(s=>({
    heading:s.children[0].value,
    content:s.children[1].value
  }));

  const payload={ title:title.value, meta:meta.value, takeaway:takeaway.value,
    sections, updatedAt:serverTimestamp() };

  currentId
    ? await updateDoc(doc(db,"articles",currentId),payload)
    : await addDoc(collection(db,"articles"),{...payload,createdAt:serverTimestamp(),published:true});

  alert("Saved");
  loadArticles();
};

delete.onclick = async ()=>{
  if(confirm("Delete article?")){
    await deleteDoc(doc(db,"articles",currentId));
    location.reload();
  }
};
