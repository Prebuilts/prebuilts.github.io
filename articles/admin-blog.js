import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const titleEl = document.getElementById("title");
const imageEl = document.getElementById("image");
const linkEl = document.getElementById("link");
const saveBtn = document.getElementById("save");
const listEl = document.getElementById("list");

onAuthStateChanged(auth, user => {
  if (!user || user.uid !== ADMIN_UID) {
    document.body.innerHTML = "<h2 style='padding:40px'>Access denied</h2>";
    return;
  }

  const ref = collection(db, "blogIndex");

  onSnapshot(ref, snap => {
    listEl.innerHTML = "";
    snap.forEach(d => {
      const p = d.data();
      const row = document.createElement("div");
      row.className = "post-row";
      row.innerHTML = `
        <img src="${p.image}">
        <div style="flex:1">${p.title}</div>
        <button>Delete</button>
      `;
      row.querySelector("button").onclick = () =>
        deleteDoc(doc(db,"blogIndex",d.id));
      listEl.appendChild(row);
    });
  });

  saveBtn.onclick = async () => {
    if (!titleEl.value || !linkEl.value) {
      alert("Title and link required");
      return;
    }

    await addDoc(ref,{
      title: titleEl.value,
      image: imageEl.value,
      link: linkEl.value,
      createdAt: serverTimestamp()
    });

    titleEl.value = imageEl.value = linkEl.value = "";
  };
});
