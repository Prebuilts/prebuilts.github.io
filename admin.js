import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";


async function addProduct() {
const data = {
name: qs("name").value.trim(),
price: parseFloat(qs("price").value),
description: qs("description").value.trim(),
image: qs("image").value.trim(),
category: qs("category").value.trim(),
link: qs("link").value.trim(),
quantity: parseInt(qs("quantity").value),
paymentButton: qs("paymentButton").value.trim() || null,
timestamp: Date.now()
};


await addDoc(collection(db, "products"), data);
loadProducts();
}


async function loadProducts() {
const list = qs("productList");
list.innerHTML = "Loading...";


const snap = await getDocs(collection(db, "products"));
list.innerHTML = "";


snap.forEach(docu => {
const p = docu.data();


const div = document.createElement("div");
div.className = "product-item";


div.innerHTML = `
<img src="${p.image}">
<div style="flex:1;">
<strong>${p.name}</strong><br>
€${p.price}<br>
Qty: ${p.quantity}<br>
</div>
<div class="actions">
<button class="btn danger">Delete</button>
</div>
`;


div.querySelector(".danger").onclick = async () => {
await deleteDoc(doc(db, "products", docu.id));
loadProducts();
};


list.append(div);
});
}
