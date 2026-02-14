import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import playerRoutes from "./routes/player.routes.js";
import { spawn } from "child_process";

import { exec } from "child_process";
import fs from "fs";
import Player from "./models/Round2.js"; // MongoDB model
import scoreRoutes from "./routes/score.js";
import { ROOM_TIME_LIMITS } from "./config/roomConfig.js";

const testCases = {
  room1: [
    // Debug Q1: square
    [
      { input: "100000 200000", expected: "200000 100000" }
    ],

    [
      { input: "", expected: "Found" }
    ],

    [
      { input: "hello\n", expected: "5" }
    ],

    [
      { input: "0\n", expected: "1" },
      { input: "1234\n", expected: "4" }
    ]
  ],

  room2: [
    [
      { input: "12 18\n", expected: "6" },
      { input: "100 25\n", expected: "25" },
      { input: "17 31\n", expected: "1" }
    ],
    [
      { input: "5\n1 3 5 2 4\n", expected: "4" },
      { input: "4\n10 20 30 40\n", expected: "30" },
      { input: "3\n7 7 5\n", expected: "7" }
    ],
    [
      { input: "hello world\n", expected: "3" },
      { input: "aeiou\n", expected: "5" },
      { input: "programming\n", expected: "3" }
    ],
    [
      { input: "5\n1 2 3 4 5\n", expected: "Sorted" },
      { input: "4\n10 20 15 30\n", expected: "Not Sorted" },
      { input: "3\n5 5 7\n", expected: "Sorted" }
    ]
  ],

  room3: [
    [
      { input: "5\n1 2 3 2 1\n", expected: "6" },
      { input: "4\n10 20 15 30\n", expected: "75" },
      { input: "3\n5 5 7\n", expected: "12" }
    ],

    [
      { input: "123\n", expected: "6" },
      { input: "405\n", expected: "0" },
      { input: "56\n", expected: "30" }
    ]
  ]
};

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.use("/scores", scoreRoutes);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp folder exists
const tempDir = path.join(__dirname, "./temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/players", playerRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.get("/ping", (req, res) => res.send("pong"));

// ===== Submit C code =====
app.post("/api/submit-code", async (req, res) => {
  const { rollno, room, code, questionIndex, language, timeLeft, tabSwitches } = req.body;

  if (!rollno || !code || questionIndex === undefined || !language) {
    return res.status(400).json({ error: "Missing data" });
  }

  const selectedTestCases = testCases[room]?.[questionIndex];
  if (!selectedTestCases) {
    return res.status(400).json({ error: "Invalid question index" });
  }

  const basePath = path.join(tempDir, `temp_${rollno}`);
  const cFile = `${basePath}.c`;
  const exeFile = `${basePath}.out`;
  const pyFile = `${basePath}.py`;

  const javaFile = path.join(tempDir, "Main.java");
  const javaClassFile = path.join(tempDir, "Main.class");

  try {
    // ================== C ==================
    if (language === "c") {
      fs.writeFileSync(cFile, code);

      await new Promise((resolve, reject) => {
        exec(`gcc "${cFile}" -o "${exeFile}"`, { timeout: 5000 }, (err, _, stderr) => {
          if (err) reject(stderr);
          else resolve();
        });
      });

      for (const tc of selectedTestCases) {
        const output = await runProgram(exeFile, tc.input);
        if (!compare(output, tc.expected)) {
          return res.json({ success: false });
        }
      }
    }

    // ================== PYTHON ==================
    else if (language === "python") {
      fs.writeFileSync(pyFile, code);

      for (const tc of selectedTestCases) {
        const output = await runProgram("python", tc.input, pyFile);
        if (!compare(output, tc.expected)) {
          return res.json({ success: false });
        }
      }
    }

    // ================== JAVA ==================
    else if (language === "java") {
      fs.writeFileSync(javaFile, code);

      // Compile
      await new Promise((resolve, reject) => {
        exec(`javac Main.java`, { cwd: tempDir, timeout: 5000 }, (err, _, stderr) => {
          if (err) reject(stderr);
          else resolve();
        });
      });

      // Run test cases
      for (const tc of selectedTestCases) {
        const output = await new Promise((resolve, reject) => {
          const child = spawn(
            "java",
            ["-cp", ".", "Main"], // 🔥 THIS FIXES EVERYTHING
            { cwd: tempDir }
          );

          let stdout = "", stderr = "";
          const timer = setTimeout(() => {
            child.kill("SIGKILL");
            reject("Time limit exceeded");
          }, 3000);

          child.stdout.on("data", d => stdout += d.toString());
          child.stderr.on("data", d => stderr += d.toString());

          child.on("close", code => {
            clearTimeout(timer);
            if (code !== 0) reject(stderr || `Exit code ${code}`);
            else resolve(stdout.trim());
          });

          child.stdin.write(tc.input);
          child.stdin.end();
          child.on("error", err => {
            clearTimeout(timer);
            reject(err);
          });
        });

        if (!compare(output, tc.expected)) {
          return res.json({ success: false });
        }
      }
    }

    else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // ================== UPDATE DB ==================
    const roomKey = room;
    const score = (timeLeft || 0) * 10;

    await Player.updateOne(
      { rollNo: rollno },
      {
        $set: {
          [`roomTimes.${roomKey}`]: timeLeft,
          currentRoom: Number(room.slice(-1)) + 1
        },
        $inc: {
          totalScore: score,
          tabSwitches: tabSwitches || 0
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Execution error:", err);
    res.json({ success: false, error: String(err) });
  } finally {
    [cFile, exeFile, pyFile, javaFile, javaClassFile].forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });
  }
});

// ================= Helper Functions =================
function compare(output, expected) {
  return output.replace(/\s/g, "") === expected.replace(/\s/g, "");
}

function runProgram(command, input, scriptPath = null, className = null) {
  return new Promise((resolve, reject) => {
    let args = [];
    if (scriptPath) args = [scriptPath];
    else if (className) args = [className];

    const child = spawn(command, args, { cwd: tempDir });
    let stdout = "", stderr = "";

    const timer = setTimeout(() => { child.kill("SIGKILL"); reject("Time limit exceeded"); }, 5000);

    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.stdin.write(input); child.stdin.end();

    child.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) reject(stderr || `Exit code ${code}`);
      else resolve(stdout.trim());
    });
    child.on("error", err => { clearTimeout(timer); reject(err); });
  });
}

// ===== START SERVER =====
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// app.listen(3000, "0.0.0.0", () => {
//   console.log("Server running on port 3000");
// });


  // room4: [
  //   [
  //     { input: "5\n1 2 2 3 1\n", expected: "1 2 3" },
  //     { input: "6\n4 4 4 4 4 4\n", expected: "4" },
  //     { input: "7\n1 2 3 4 5 6 7\n", expected: "1 2 3 4 5 6 7" }
  //   ],

  //   [
  //     { input: "1 10\n", expected: "2 3 5 7" },
  //     { input: "10 20\n", expected: "11 13 17 19" },
  //     { input: "22 29\n", expected: "23 29" }
  //   ]
  // ],