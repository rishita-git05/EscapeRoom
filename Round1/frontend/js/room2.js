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

const ROOM_NUMBER = 2; // change to 2, 3 in other rooms

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
    title: "Corrupted Loop",
    task: "Print sum of first n numbers.",
    code: {
      c: `#include<stdio.h>
int main() {
  int n, sum = 0;
  scanf("%d", &n);
  for(int i = 1; i <= ___; i++) {
    sum += ___;
  }
  printf("%d", sum);
}`,
      python: `n = int(input())
sum = 0
for i in range(1, ___):
    sum += ___
print(sum)`
    }
  },

  {
    title: "Reverse number",
    task: "Reverse a given number.",
    code: {
      c: `#include<stdio.h>
  int main() {
    int n, rev = 0;
    scanf("%d",&n);
    while(n > 0) {
      rev = rev * 10 + ___;
      n = ___;
    }
    printf("%d", rev);
  }`,
      python: `n = int(input())
  rev = 0
  while n > 0:
      rev = rev * 10 + ___
      n = ___
  print(rev)`
    }
  },

  {
    title: "Factorial",
    task: "Find factorial of a number.",
    code: {
      c: `#include<stdio.h>
  int main() {
    int n, fact = 1;
    scanf("%d",&n);
    for(int i = 1; i <= ___; i++) {
      fact *= ___;
    }
    printf("%d", fact);
  }`,
      python: `n = int(input())
  fact = 1
  for i in range(1, ___):
      fact *= ___
  print(fact)`
    }
  },

  {
    title: "Print pattern",
    task: "Print star pattern.\n*\n**\n***",
    code: {
      c: `#include<stdio.h>
  int main() {
    int n;
    scanf("%d",&n);
    for(int i=1;i<=n;i++) {
      for(int j=1;j<=___;j++)
        printf("*");
      printf("\\n");
    }
  }`,
      python: `n = int(input())
  for i in range(1,n+1):
      for j in range(___):
          print("*",end="")
      print()`
    }
  },
  
  {
    title: "Binary to decimal",
    task: "Convert binary to decimal.",
    code: {
      c: `#include<stdio.h>
  int main() {
    int n, dec=0, base=1;
    scanf("%d",&n);
    while(n>0) {
      dec += (n%10) * ___;
      base = ___;
      n /= 10;
    }
    printf("%d",dec);
  }`,
      python: `n = int(input())
  dec = 0
  base = 1
  while n > 0:
      dec += (n%10) * ___
      base = ___
      n //= 10
  print(dec)`
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
  codeInput.value = q.code[lang];
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
    room: "room2",
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
        outputEl.textContent = "🎉 Room 2 Escaped!";
        disableTabTracking();
        setTimeout(() => window.location.href = "story3.html", 1500);
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
