document.getElementById("calculateBtn").onclick = () => {
  const views = Number(document.getElementById("views").value);
  const cpm = Number(document.getElementById("cpm").value);
  const ads = Number(document.getElementById("ads").value) || 1;

  if (!views || !cpm) {
    alert("Please enter page views and CPM");
    return;
  }

  const daily = (views / 1000) * cpm * ads;
  const monthly = daily * 30;
  const yearly = daily * 365;

  document.getElementById("daily").textContent = `$${daily.toFixed(2)}`;
  document.getElementById("monthly").textContent = `$${monthly.toFixed(2)}`;
  document.getElementById("yearly").textContent = `$${yearly.toFixed(2)}`;

  document.getElementById("results").classList.remove("hidden");
};
