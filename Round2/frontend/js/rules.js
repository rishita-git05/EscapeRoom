const continueBtn = document.getElementById("continueBtn");

continueBtn.addEventListener("click", () => {
  // Just go straight to story or room
  window.location.href = "/pages/room3.html";
});

// Optional: auto-redirect after X seconds (e.g., 5 sec)
setTimeout(() => {
  window.location.href = "/pages/room3.html";
}, 5000);
