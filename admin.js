// admin.js (FULL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, getDocs, orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkbXzURYKixz4R28OYMUOueA9ysG3Q1Lo",
  authDomain: "prebuiltid-website.firebaseapp.com",
  projectId: "prebuiltid-website",
  storageBucket: "prebuiltid-website.firebasestorage.app",
  messagingSenderId: "854871585546",
  appId: "1:854871585546:web:568400979292a0c31740f3",
  measurementId: "G-YS1Q1904H6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------- ADMIN UID (REPLACE with actual admin uid) ---------------- */
const ADMIN_UID = "zL2LJWPAiFWFpcdFFh3E7KfDrxi2"; // <-- REPLACE with your admin user's UID

/* ---------------- AUTH CHECK ---------------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  if (user.uid !== ADMIN_UID) {
    // Not allowed
    location.href = "index.html";
    return;
  }
});

/* ---------------- DOM ---------------- */
const pName = document.getElementById("pName");
const pPrice = document.getElementById("pPrice");
const pImage = document.getElementById("pImage");
const pCategory = document.getElementById("pCategory");
const pDescription = document.getElementById("pDescription");
const pQuantity = document.getElementById("pQuantity");
const addProductBtn = document.getElementById("addProduct");

const productList = document.getElementById("productList");
const orderList = document.getElementById("orderList");

const adminFilterCategory = document.getElementById("adminFilterCategory");
const adminSort = document.getElementById("adminSort");
const adminSearch = document.getElementById("adminSearch");

const orderSort = document.getElementById("orderSort");
const orderSearch = document.getElementById("orderSearch");

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn && (logoutBtn.onclick = () => signOut(auth));

const productsRef = collection(db, "products");
const ordersRef = collection(db, "orders");

/* ---------------- ADD PRODUCT ---------------- */
addProductBtn.addEventListener('click', async () => {
  const name = pName.value.trim();
  const price = parseFloat(pPrice.value);
  const image = pImage.value.trim();
  const category = pCategory.value.trim();
  const description = pDescription.value.trim();
  const quantity = parseInt(pQuantity.value);

  if (!name || isNaN(price) || !image || !category || !description || isNaN(quantity)) {
    alert("Täida kõik väljad!");
    return;
  }

  await addDoc(productsRef, { name, price, image, category, description, quantity, createdAt: serverTimestamp() });

  pName.value=''; pPrice.value=''; pImage.value=''; pCategory.value=''; pDescription.value=''; pQuantity.value='';
});

/* ---------------- REAL-TIME PRODUCTS ---------------- */
let productsCache = [];
onSnapshot(productsRef, snap => {
  productsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  populateCategoryFilter();
  renderProducts();
});

function populateCategoryFilter(){
  const cats = Array.from(new Set(productsCache.map(p => p.category).filter(Boolean)));
  adminFilterCategory.innerHTML = '<option value="all">Kõik kategooriad</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderProducts(){
  const cat = adminFilterCategory.value || 'all';
  let list = productsCache.slice();

  const q = adminSearch.value && adminSearch.value.trim().toLowerCase();
  if (cat !== 'all') list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));

  const s = adminSort.value;
  if (s === 'name-asc') list.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
  else if (s === 'name-desc') list.sort((a,b)=> (b.name||'').localeCompare(a.name||''));
  else if (s === 'price-asc') list.sort((a,b)=> (Number(a.price||0)-Number(b.price||0)));
  else if (s === 'price-desc') list.sort((a,b)=> (Number(b.price||0)-Number(a.price||0)));
  else if (s === 'qty-asc') list.sort((a,b)=> (Number(a.quantity||0)-Number(b.quantity||0)));
  else if (s === 'qty-desc') list.sort((a,b)=> (Number(b.quantity||0)-Number(a.quantity||0)));
  else if (s === 'category') list.sort((a,b)=> (a.category||'').localeCompare(b.category||''));
  else if (s === 'newest') list.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  else if (s === 'oldest') list.sort((a,b)=> (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));

  productList.innerHTML = '';
  list.forEach(p => {
    const node = document.createElement('div');
    node.className = 'product-item';
    node.innerHTML = `
      <img src="${escapeHtmlAttr(p.image||'')}" alt="${escapeHtml(p.name||'')}">
      <div class="fields">
        <input id="name-${p.id}" value="${escapeHtml(p.name||'')}">
        <div style="display:flex;gap:8px;">
          <input id="price-${p.id}" type="number" step="0.01" value="${p.price||0}">
          <input id="quantity-${p.id}" type="number" value="${p.quantity||0}">
        </div>
        <input id="image-${p.id}" value="${escapeHtml(p.image||'')}">
        <input id="category-${p.id}" value="${escapeHtml(p.category||'')}">
        <textarea id="description-${p.id}">${escapeHtml(p.description||'')}</textarea>
      </div>
      <div class="actions">
        <button onclick="updateProduct('${p.id}')">Uuenda</button>
        <button onclick="deleteProduct('${p.id}')" class="btn danger">Kustuta</button>
      </div>
    `;
    productList.appendChild(node);
  });
}

/* controls */
adminFilterCategory.addEventListener('change', renderProducts);
adminSort.addEventListener('change', renderProducts);
adminSearch.addEventListener('input', ()=> setTimeout(renderProducts,150));

/* update / delete product functions */
window.updateProduct = async (id) => {
  const name = document.getElementById(`name-${id}`).value.trim();
  const price = parseFloat(document.getElementById(`price-${id}`).value);
  const quantity = parseInt(document.getElementById(`quantity-${id}`).value);
  const image = document.getElementById(`image-${id}`).value.trim();
  const category = document.getElementById(`category-${id}`).value.trim();
  const description = document.getElementById(`description-${id}`).value.trim();

  if (!name || isNaN(price) || isNaN(quantity) || !image || !category || !description) { alert('Täida kõik väljad'); return; }
  await updateDoc(doc(db,"products",id), { name, price, quantity, image, category, description });
  alert("Toode uuendatud!");
};

window.deleteProduct = async (id) => {
  if (!confirm("Kustuta toode?")) return;
  await deleteDoc(doc(db,"products",id));
};

/* ---------------- ORDERS ---------------- */
let ordersCache = [];
onSnapshot(ordersRef, snap => {
  ordersCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderOrders();
});

function renderOrders(){
  const q = orderSearch.value && orderSearch.value.trim().toLowerCase();
  let list = ordersCache.slice();

  const s = orderSort.value;
  if (s === 'created-desc') list.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  else if (s === 'created-asc') list.sort((a,b)=> (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
  else if (s === 'status') list.sort((a,b)=> (a.status||'').localeCompare(b.status||''));

  if (q) list = list.filter(o => (o.email||'').toLowerCase().includes(q) || (o.id && o.id.includes(q)));

  orderList.innerHTML = '';
  list.forEach(o => {
    const node = document.createElement('div');
    node.className = 'order-item';
    const when = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString() : '';
    node.innerHTML = `
      <div class="order-header">
        <div><strong>${escapeHtml(o.email||'—')}</strong><div class="muted" style="font-size:12px;">${escapeHtml(when)}</div></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <select id="order-status-${o.id}" class="status-select">
            <option value="pending"${o.status==='pending'?' selected':''}>Pending</option>
            <option value="processing"${o.status==='processing'?' selected':''}>Processing</option>
            <option value="completed"${o.status==='completed'?' selected':''}>Completed</option>
            <option value="cancelled"${o.status==='cancelled'?' selected':''}>Cancelled</option>
          </select>
          <button class="confirm-btn" onclick="confirmStatus('${o.id}')">Kinnita</button>
        </div>
      </div>
      <div class="order-products"><strong>Products:</strong><br>${(o.products||[]).map(p=>`${escapeHtml(p.name)} x ${p.qty}`).join('<br>')}</div>
    `;
    orderList.appendChild(node);
  });
}

orderSort.addEventListener('change', renderOrders);
orderSearch.addEventListener('input', ()=> setTimeout(renderOrders,150));

window.confirmStatus = async (id) => {
  const sel = document.getElementById(`order-status-${id}`);
  const value = sel.value;
  await updateDoc(doc(db,"orders",id), { status: value });
  alert("Status updated.");
};

/* helpers */
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeHtmlAttr(s=''){ return String(s).replace(/"/g, '&quot;'); }
