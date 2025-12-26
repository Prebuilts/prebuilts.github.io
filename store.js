import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc, query, where, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const app = initializeApp({
  apiKey:"AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain:"prebuiltid-website.firebaseapp.com",
  projectId:"prebuiltid-website"
});

const db = getFirestore(app);
const auth = getAuth(app);

let products=[], cartItem=null, currentUser=null, userSettings={};

/* DOM */
const grid=shopgrid;
const basket=document.getElementById("basket-panel");
const items=document.getElementById("basket-items");
const count=document.getElementById("cart-count");

/* AUTH */
onAuthStateChanged(auth,async u=>{
  currentUser=u;
  loginBtn.style.display=u?"none":"block";
  logoutBtn.style.display=u?"block":"none";

  if(u){
    const snap=await getDoc(doc(db,"users",u.uid));
    if(snap.exists()) userSettings=snap.data();
    settingsEmail.value=u.email;
    settingsAddress.value=userSettings.address||"";
    settingsShipping.value=userSettings.shipping||"DPD";
  }
});
logoutBtn.onclick=()=>signOut(auth);

/* SETTINGS */
settingsBtn.onclick=()=>settingsModal.classList.add("show");
closeSettings.onclick=()=>settingsModal.classList.remove("show");

saveSettings.onclick=async()=>{
  if(!currentUser)return;
  userSettings={
    address:settingsAddress.value,
    shipping:settingsShipping.value
  };
  await setDoc(doc(db,"users",currentUser.uid),userSettings,{merge:true});
  alert("Salvestatud");
  settingsModal.classList.remove("show");
};

/* PRODUCTS */
onSnapshot(collection(db,"products"),snap=>{
  products=[];
  snap.forEach(d=>products.push({id:d.id,...d.data()}));
  render();
});

function render(){
  grid.innerHTML="";
  products.forEach(p=>{
    const out=p.quantity<=0;
    const div=document.createElement("div");
    div.className="productbox";
    div.innerHTML=`
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.price} €</p>
      <div class="stock">Jäänud: ${p.quantity}</div>
      <button ${out?"disabled":""}>Lisa korvi</button>`;
    div.querySelector("button").onclick=()=>addToCart(p);
    grid.appendChild(div);
  });
}

/* CART */
cartIcon.onclick=()=>basket.classList.add("open");
closeBasket.onclick=()=>basket.classList.remove("open");

function addToCart(p){
  cartItem=p;
  count.textContent="1";
  items.innerHTML=`
    <h4>${p.name}</h4>
    <p>${p.price} €</p>
    ${p.paymentButton||""}`;
  basketShipping.innerText="Tarne: "+(userSettings.shipping||"DPD");
}

removeBtn.onclick=()=>{
  cartItem=null;
  items.innerHTML="<p>Ostukorv tühi</p>";
  basketShipping.innerText="";
  count.textContent="0";
};

/* PAID */
paidBtn.onclick=async()=>{
  if(!currentUser||!cartItem)return alert("Logi sisse");
  if(!paymentRef.value)return alert("Sisesta makse ID");

  await addDoc(collection(db,"orders"),{
    userId:currentUser.uid,
    email:currentUser.email,
    productId:cartItem.id,
    productName:cartItem.name,
    price:cartItem.price,
    paymentReference:paymentRef.value,
    shipping:userSettings.shipping||"",
    address:userSettings.address||"",
    status:"pending",
    createdAt:new Date()
  });

  alert("Tellimus esitatud");
  removeBtn.click();
};

/* ORDERS */
ordersBtn.onclick=()=>{
  if(!currentUser)return alert("Logi sisse");
  ordersModal.classList.add("show");

  const q=query(collection(db,"orders"),where("userId","==",currentUser.uid));
  onSnapshot(q,s=>{
    ordersList.innerHTML=s.docs.map(d=>{
      const o=d.data();
      return `<p>${o.productName} – ${o.status}</p>`;
    }).join("");
  });
};
closeOrders.onclick=()=>ordersModal.classList.remove("show");
