import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const title = document.getElementById("title");
const image = document.getElementById("image");
const link = document.getElementById("link");
const save = document.getElementById("save");
const posts = document.getElementById("posts");

onAuthStateChanged(auth, user => {
  if (!user || user.uid !== ADMIN_UID) {
    document.body.innerHTML = "<h2 style='padding:40px'>Access denied</h2>";
    return;
  }

  const ref = collection(db, "blogIndex");

  onSnapshot(ref, snap => {
    posts.innerHTML = "";
    snap.forEach(d => {
      const p = d.data();
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <img src="${p.image || ''}">
        <div style="flex:1">${p.title}</div>
        <button>Delete</button>
      `;
      row.querySelector("button").onclick = () =>
        deleteDoc(doc(db, "blogIndex", d.id));
      posts.appendChild(row);
    });
  });

  save.onclick = async () => {
    if (!title.value || !link.value) {
      alert("Title & link required");
      return;
    }

    await addDoc(ref, {
      title: title.value,
      image: image.value,
      link: link.value,
      createdAt: serverTimestamp()
    });

    title.value = image.value = link.value = "";
  };
});
