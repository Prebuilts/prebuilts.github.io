const nav = document.getElementById("nav");
const hamburger = document.getElementById("hamburger");
const closeBtn = document.getElementById("navClose");

hamburger?.addEventListener("click", () => {
  nav.classList.add("active");
});

closeBtn?.addEventListener("click", () => {
  nav.classList.remove("active");
});
