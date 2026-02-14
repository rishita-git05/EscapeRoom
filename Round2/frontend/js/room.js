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
    task: "Swap two integers without causing overflow.",
    buggyCode: {
      c: `#include<stdio.h>
int main() {
  int a,b;
  scanf("%d", &a);
  scanf("%d", &b);
  a = a - b;
  b = a + b;
  a = a - b;
  printf("%d %d", a, b);
}`,
      python: `a, b = map(int, input().split())
a = a - b
b = a + b
a = a - b
print(a, b)`,
      java: `import java.util.*;
class Main {
  public static void main(Strin g[] args) {
    int a,b;
    Scanner sc = new Scanner(System.in);
    int a = sc.nextInt();
    int b = sc.nextInt();
    a = a - b;
    b = a + b;
    a = a - b;
    System.out.print(a + " " + b);
  }
}`
    }
  },
  {
    title: "Debug-2",
    task: "Find an element using binary search.",
    buggyCode: {
      c: `#include<stdio.h>
int main() {
  int a[] = {1,2,3,4,5};
  int l = 0, r = 4, key = 3;
  int found = 0;

  while(l <= r) {
    int mid = (l + r) / 2;
    if(a[mid] == key) {
      found = 0;
      break;
    }
    else if(a[l] < key)
      r = l;
    else
      l = mid - 1;
  }

  if(found)
    printf("Found");
  else
    printf("Not Found");
}`,
      python: `arr = [1,2,3,4,5]
l, r = 0, len(arr)-1
key = 3
found = False

while l <= r:
    mid = (l+r)//2
    if arr[mid] == key:
        found = False
        break
    elif arr[l] < key:
        r = l
    else:
        l = mid - 1

print("Found" if found else "Not Found")`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    int[] a = {1,2,3,4,5};
    int l = 0, r = 4, key = 3;
    boolean found = false;

    while(l <= r) {
      int mid = (l + r) / 2;
      if(a[mid] == key) {
        found = false;
        break;
      }
      else if(a[l] < key)
        r = l;
      else
        l = mid - 1;
    }

    System.out.print(found ? "Found" : "Not Found");
  }
}`
  }
  },
  {
    title: "Debug-3",
    task: "Find the length of a string.",
    buggyCode: {
      c: `#include<stdio.h>
int main() {
  char str[20];
  int i;
  gets(str);
  for(i=1;str[i]!='\0';i--);
  printf("%d", i);
}`,
      python: `s = input()
for i in count:
print(count)`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String str = sc.nextLine();
    for(int i=1; i<str.length; i++)
      count++;
    System.out.print(count);
  }
}`
    }
  },
  {
    title: "Debug-4",
    task: "Count the number of digits in an integer.",
    buggyCode: {
      c: `#include<stdio.h>
int main() {
  int n, count = 0;
  scanf("%d", &n);
  while(n > 0) {
    count++;
    n /= 10;
  }
  printf("%d", count);
}`,
      python: `n = int(input())
count = 0
while n > 0:
    count += 1
    n //= 10
print(count)`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    int count = 0;
    while(n > 0) {
      count++;
      n /= 10;
    }
    System.out.print(count);
  }
}`
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

