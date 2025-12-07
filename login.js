import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
      apiKey: "AIzaSyCXufE4ch7mmOdxxIZ641lTrzDgaDyfGgg",
      authDomain: "komisjonikaubamaja-website.firebaseapp.com",
      projectId: "komisjonikaubamaja-website",
      storageBucket: "komisjonikaubamaja-website.firebasestorage.app",
      messagingSenderId: "422777959258",
      appId: "1:422777959258:web:b3b4d1f1a858fd74caf963",
      measurementId: "G-L2BLBFLT9C"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI elements
const googleLoginBtn = document.getElementById("googleLogin");
const emailLoginBtn = document.getElementById("emailLogin");
const emailRegisterBtn = document.getElementById("emailRegister");

// Google Login
googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "index.html"; // Redirect after login
  } catch (error) {
    alert(error.message);
  }
});

// Email Login
emailLoginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "https://prebuiltid.github.io/Prebuiltid/"; // Redirect after login
  } catch (error) {
    alert(error.message);
  }
});

// Email Register
emailRegisterBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Konto loodud! Nüüd saad sisse logida!");
  } catch (error) {
    alert(error.message);
  }
});

