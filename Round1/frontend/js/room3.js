// ===== ELEMENTS =====
const timerEl = document.getElementById("timer");
const clockEl = document.getElementById("clock");
const keyEl = document.getElementById("key");
const terminalEl = document.getElementById("terminal");
const submitBtn = document.getElementById("submitBtn");
const codeInput = document.getElementById("codeInput");
const outputEl = document.getElementById("output");

const questionBox = document.getElementById("question-box");
const questionTitle = document.getElementById("questionTitle");
const questionTask = document.getElementById("questionTask");
const toggleBtn = document.getElementById("toggleQuestionBtn");
const hintEl = document.getElementById("hint");

const dialogueEl = document.getElementById("dialogueOverlay");
const continueBtn = document.getElementById("continueBtn");

const languageSelect = document.getElementById("languageSelect");

languageSelect.addEventListener("change", () => {
  loadQuestion();
});

const rollno = localStorage.getItem("rollno");

const ROOM_NUMBER = 3; // change to 2, 3 in other rooms

async function enterRoom() {
  const res = await fetch("/players/enter-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rollNo: rollno,
      room: ROOM_NUMBER
    })
  });

  const data = await res.json();
  if (!data.success) {
    alert("Session error");
    window.location.href = "index.html";
  }
}

// ===== QUESTIONS (UI ONLY) =====
const questions = [
  {
    title: "Code 1: Matrix Multiplication",
    task: "Given two matrices A and B, perform matrix multiplication and print the resulting matrix.",
    input: 
      "First line: r1 c1 (rows and columns of matrix A)\n" +
      "Next r1 lines: c1 integers (matrix A)\n" +
      "Next line: r2 c2 (rows and columns of matrix B)\n" +
      "Next r2 lines: c2 integers (matrix B)\n" +
      "Note: c1 = r2",
    output: 
      "Print the resulting matrix of size r1 × c2."
  },
  {
    title: "Code 2: Reverse an Array",
    task: "Given an array of integers, reverse the array and print it.",
    input: 
      "First line: n (1 ≤ n ≤ 1000)\n" +
      "Second line: n integers",
    output: 
      "Print the reversed array."
  }
];

// ===== STATE =====
let currentQuestionIndex = 0;
let keyFound = false;
let codeSolved = false;

let timeLeft = 0;

async function syncTimer() {
  const res = await fetch(
    `/players/time-left/${rollno}/${ROOM_NUMBER}`
  );

  const data = await res.json();

  if (!data.success) {
    alert("Session error");
    window.location.href = "index.html";
    return;
  }

  timeLeft = data.timeLeft;
}

dialogueEl.classList.add("hidden");
terminalEl.style.display = "none";
keyEl.classList.add("hidden");
questionBox.classList.add("hidden");
hintEl.classList.add("hidden");

// ===== LOAD QUESTION =====
function loadQuestion() {
  const q = questions[currentQuestionIndex];
  if (!q) return;

  questionTitle.innerText = q.title;
  questionTask.innerText = q.task;
  document.getElementById("questionInput").innerText = q.input;
  document.getElementById("questionOutput").innerText = q.output;

  codeInput.value = "";
  outputEl.textContent = "";
}

// ===== TIMER =====
function startTimer() {
  const interval = setInterval(() => {
    if (codeSolved) return;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;

    timerEl.textContent = `⏳ ${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      alert("⏰ Time's up!");
      terminalEl.style.display = "none";
      disableTabTracking();
      window.location.href = `final.html?rollno=${rollno}`;
    }

    timeLeft--;
  }, 1000);
}

// ===== CLOCK CLICK (FIND KEY) =====
document.getElementById("hint").classList.remove("hidden");

// STEP 1: Click the clock to find the key and show dialogue
clockEl.addEventListener("click", () => {
  if (keyFound) return;

  keyFound = true;
  keyEl.classList.remove("hidden"); // Show the key icon
  dialogueEl.classList.remove("hidden"); // Show the dialogue box
});

// STEP 2: Click "Continue" to hide dialogue and show terminal
continueBtn.addEventListener("click", () => {
  dialogueEl.classList.add("hidden"); // Hide the dialogue

  // Show the terminal now
  terminalEl.style.display = "block"; 
  terminalEl.classList.remove("locked");

  // Show the question inside the terminal
  questionBox.classList.remove("hidden");
  loadQuestion();
});

// ===== TOGGLE QUESTION =====
toggleBtn.addEventListener("click", () => {
  questionBox.classList.toggle("hidden");
  toggleBtn.innerText = questionBox.classList.contains("hidden")
    ? "Show Question ⬇️"
    : "Hide Question ⬆️";
});

let tabSwitchCount = 0;
let warned = false;

function handleVisibilityChange() {
  if (document.hidden) {
    tabSwitchCount++;

    console.warn("Tab switched:", tabSwitchCount);

    if (tabSwitchCount === 1) {
      alert("⚠️ Warning: Tab switching is not allowed!");
    }

    if (tabSwitchCount >= 3) {
      alert("❌ Too many tab switches.");
      disableTabTracking();
      window.location.href = `final.html?rollno=${rollno}`;
    }
  }
}

function disableTabTracking() {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}

// ===== SUBMIT CODE =====
submitBtn.addEventListener("click", async () => {
  const rollno = localStorage.getItem("rollno");
  if (!rollno) {
    outputEl.textContent = "Roll number missing.";
    return;
  }

  outputEl.textContent = "Checking...";

  // ✅ Log payload
  const payload = {
    rollno,
    room: "room3",
    code: codeInput.value,
    questionIndex: currentQuestionIndex,
    language: languageSelect.value,
    timeLeft,
    tabSwitches: tabSwitchCount
  };
  console.log("Submitting payload:", payload);

  try {
    const res = await fetch("/api/submit-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Server response:", data);

    if (data.success) {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        outputEl.textContent = "✅ Correct! Next question...";
        setTimeout(loadQuestion, 800);
      } else {
        codeSolved = true;
        outputEl.textContent = "🎉 Final Room Escaped!";
        disableTabTracking();
        setTimeout(() => {
          window.location.href = `final.html?rollno=${rollno}`;
        }, 1500);


      }
    } else {
      outputEl.textContent = "❌ Wrong output. Try again.";
    }
  } catch (err) {
    console.error(err);
    outputEl.textContent = "Server error.";
  }
});
document.addEventListener("visibilitychange", handleVisibilityChange);

// ===== START =====
(async () => {
  await enterRoom();   // ⬅️ start room timer ONLY here
  await syncTimer();   // ⬅️ get correct room time
  startTimer();
})();
