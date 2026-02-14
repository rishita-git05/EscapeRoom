const startBtn = document.getElementById("startBtn");
const rollInput = document.getElementById("rollNo");
const errorMsg = document.getElementById("errorMsg");

startBtn.addEventListener("click", async () => {
  const rollNo = rollInput.value.trim();

  if (!rollNo) {
    errorMsg.textContent = "Enter roll number.";
    return;
  }

  localStorage.setItem("rollno", rollNo); // 🔥 THIS IS CRUCIAL
  window.location.href = "/pages/rules.html";

  try {
    const res = await fetch("/players/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNo }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.message || "Error starting game";
      return;
    }

    sessionStorage.setItem("playerId", data.playerId);
    window.location.href = "/pages/rules.html";

  } catch (err) {
    errorMsg.textContent = "Server not responding";
  }
});
