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
    title: "GCD-Euclid",
    task: "Find the GCD of two numbers using Euclid's algorithm.",
    code: {
      c: `#include<stdio.h>
int main() {
  int a, b;
  scanf("%d %d", &a, &b);
  while(b != ___) {
    int temp = ___;
    b = a % b;
    a = temp;
  }
  printf("%d", a);
}`,
      python: `a, b = map(int, input().split())
while b != ___:
    temp = ___
    b = a % b
    a = temp
print(a)`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int a = sc.nextInt();
    int b = sc.nextInt();
    while(b != ___) {
      int temp = ___;
      b = a % b;
      a = temp;
    }
    System.out.print(a);
  }
}`
    }
  },

  {
    title: "Second Largest",
    task: "Find the second largest element in an array.",
    code: {
      c: `#include<stdio.h>
int main() {
  int n;
  scanf("%d", &n);
  int arr[n];
  for(int i=0;i<n;i++)
    scanf("%d",&arr[i]);
  int max = arr[0], second = ___;
  for(int i=0;i<n;i++){
    if(arr[i] > max){
      second = max;
      max = arr[i];
    } else if(arr[i] > second && arr[i] != max){
      second = arr[i];
    }
  }
  printf("%d", second);
}`,
      python: `arr = list(map(int,input().split()))
maxi = arr[0]
second = ___
for x in arr:
    if x > maxi:
        second = maxi
        maxi = x
    elif x > second and x != maxi:
        second = x
print(second)`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    int[] arr = new int[n];
    for(int i=0;i<n;i++) arr[i]=sc.nextInt();
    int max = arr[0], second = ___;
    for(int i=0;i<n;i++){
      if(arr[i] > max){
        second = max;
        max = arr[i];
      } else if(arr[i] > second && arr[i] != max){
        second = arr[i];
      }
    }
    System.out.print(second);
  }
}`
    }
  },

  {
    title: "Count Vowels",
    task: "Count vowels in a string.",
    code: {
      c: `#include<stdio.h>
#include<string.h>
int main() {
  char s[100];
  fgets(s, sizeof(s), stdin);
  int count = 0;
  for(int i=0; s[i] != ___; i++){
    if(s[i]=='a'||s[i]=='e'||s[i]=='i'||s[i]=='o'||s[i]=='u')
      count++;
  }
  printf("%d", count);
}`,
      python: `s = input()
count = 0
for ch in s:
    if ch in ___:
        count += 1
print(count)`,
      java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.nextLine();
    int count = 0;
    for(int i=0;i<s.length();i++){
      char ch = s.charAt(i);
      if("aeiou".indexOf(ch) != ___) count++;
    }
    System.out.print(count);
  }
}`
    }
  },

  {
    title: "Check Sorted Array",
    task: "Check whether an array is sorted in ascending order.",
    code: {
      c: `#include<stdio.h>
int main(){
  int n, flag=1;
  scanf("%d",&n);
  int arr[n];
  for(int i=0;i<n;i++) scanf("%d",&arr[i]);
  for(int i=0;i<n-1;i++){
    if(arr[i] > ___){
      flag=0; break;
    }
  }
  printf(flag ? "Sorted":"Not Sorted");
}`,
      python: `n = int(input())
arr = list(map(int,input().split()))
flag=True
for i in range(n-1):
    if arr[i] > ___:
        flag=False
        break
print("Sorted" if flag else "Not Sorted")`,
      java: `import java.util.*;
class Main{
  public static void main(String[] args){
    Scanner sc=new Scanner(System.in);
    int n=sc.nextInt();
    int[] arr = new int[n];
    for(int i=0;i<n;i++) arr[i]=sc.nextInt();
    boolean flag=true;
    for(int i=0;i<n-1;i++){
      if(arr[i] > ___){ flag=false; break;}
    }
    System.out.print(flag?"Sorted":"Not Sorted");
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
