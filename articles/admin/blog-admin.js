import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.0.6/+esm";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth,user=>{
  if(!user) location.href="https://prebuilts.eu/login.html";
});

content.oninput=()=>{
  preview.innerHTML = DOMPurify.sanitize(marked.parse(content.value));
};

publish.onclick=async()=>{
  await addDoc(collection(db,"blog_posts"),{
    title:title.value,
    content:content.value,
    createdAt:serverTimestamp()
  });
  alert("Published");
  content.value="";
};
