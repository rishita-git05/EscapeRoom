const continueBtn = document.getElementById("continueBtn");

continueBtn.addEventListener("click", () => {
  // Just go straight to story or room
  window.location.href = "/pages/story.html";
});

// Optional: auto-redirect after X seconds (e.g., 5 sec)
setTimeout(() => {
  window.location.href = "/pages/story.html";
}, 5000);
