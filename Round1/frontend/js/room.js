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

const languageSelect = document.getElementById("languageSelect");

languageSelect.addEventListener("change", () => {
  loadQuestion();
});

const rollno = localStorage.getItem("rollno");

const ROOM_NUMBER = 1; // change to 2, 3 in other rooms

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
const debugQuestions = [
  {
    title: "Debug-1",
    task: "Read an integer and print its square.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int n;
    printf("%d", n*n);
  }`,
      python: `n = int(input())
  print(n * n`
    }
  },

  {
    title: "Debug-2",
    task: "Check even or odd.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int n;
    scanf("%d",&n);
    if(n = 0)
      printf("Even");
    else
      printf("Odd");
  }`,
      python: `n = int(input())
  if n = 0:
      print("Even")
  else:
      print("Odd")`
    }
  },

  {
    title: "Debug-3",
    task: "Read an integer and print it.",
    buggyCode: {
      c: `#include<stdio.h>
int main() {
  int n;
  scanf("%f",&n);
  printf("%d", n);
}`,
      python: `n = input()
print(n)`
    }
  },

  {
    title: "Debug-4",
    task: "Print numbers till n.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int i=1,n;
    scanf("%d",&n);
    while(i<=n) {
      printf("%d ",i);
    }
  }`,
      python: `n = int(input())
  i = 1
  while i <= n:
      print(i)`
    }
  },

  {
    title: "Debug-5",
    task: "Print first n numbers.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int n;
    scanf("%d",&n);
    for(int i=1;i<n;i++)
      printf("%d ",i);
  }`,
      python: `n = int(input())
  for i in range(1,n):
      print(i)`
    }
  },

  {
    title: "Debug-6",
    task: "Sum of n numbers.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int n,sum;
    scanf("%d",&n);
    for(int i=1;i<=n;i++)
      sum+=i;
    printf("%d",sum);
  }`,
      python: `n = int(input())
  sum += n
  print(sum)`
    }
  },
  
  {
    title: "Debug-7",
    task: "Print numbers from 1 to n.",
    buggyCode: {
      c: `#include<stdio.h>
  int main() {
    int n;
    scanf("%d",&n);
    for(int i=1;i<=n;i++);
      printf("%d ",i);
  }`,
      python: `n = int(input())
  for i in range(1, n+1):
  print(i)`
    }
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

// ===== INIT UI STATE =====
terminalEl.style.display = "none";
keyEl.classList.add("hidden");
questionBox.classList.add("hidden");
hintEl.classList.add("hidden");

// ===== LOAD QUESTION =====
function loadQuestion() {
  const q = debugQuestions[currentQuestionIndex];
  if (!q) return;

  const lang = languageSelect.value;

  questionTitle.innerText = q.title;
  questionTask.innerText = q.task;
  codeInput.value = q.buggyCode[lang];
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

clockEl.addEventListener("click", () => {
  if (keyFound) return;

  keyFound = true;

  keyEl.classList.remove("hidden");
  terminalEl.style.display = "block";
  terminalEl.classList.remove("locked");

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
    room: "room1",
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
      if (currentQuestionIndex < debugQuestions.length) {
        outputEl.textContent = "✅ Correct! Next question...";
        setTimeout(loadQuestion, 800);
      } else {
        codeSolved = true;
        outputEl.textContent = "🎉 Room 1 Escaped!";
        disableTabTracking();
        setTimeout(() => window.location.href = "story2.html", 1500);
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

