import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import playerRoutes from "./routes/player.routes.js";
import { spawn } from "child_process";

import { exec } from "child_process";
import fs from "fs";
import Player from "./models/Player.js"; // MongoDB model
import scoreRoutes from "./routes/score.js";
import { ROOM_TIME_LIMITS } from "./config/roomConfig.js";

const testCases = {
  room1: [
    // Debug Q1: square
    [
      { input: "2\n", expected: "4" },
      { input: "5\n", expected: "25" }
    ],
    [
      { input: "4\n", expected: "Even" },
      { input: "5\n", expected: "Odd" }
    ],
    // Q3: Format specifier
    [
      { input: "7\n", expected: "7" }
    ],
    [
      { input: "3\n", expected: "1 2 3" },
      { input: "1\n", expected: "1" }
    ],

    [
      { input: "5\n", expected: "1 2 3 4 5" }
    ],
    [
      { input: "3\n", expected: "6" }
    ],
    [
      { input: "3\n", expected: "1 2 3" },
      { input: "1\n", expected: "1" }
    ]
  ],

  room2: [
    // Half-filled Q1: sum of n
    [
      { input: "3\n", expected: "6" },
      { input: "5\n", expected: "15" }
    ],
    [
      { input: "123\n", expected: "321" },
      { input: "40\n", expected: "4" }
    ],
    [
      { input: "5\n", expected: "120" },
      { input: "3\n", expected: "6" }
    ],
    [
      { input: "4\n", expected: "*\n**\n***\n****" }
    ],
    [
      { input: "101\n", expected: "5" },
      { input: "111\n", expected: "7" }
    ]
  ],
  
  room3: [
    [
      {
        input:
`2 2
1 2
3 4
2 2
5 6
7 8
`,
        expected:
`19 22
43 50`
      },
      {
        input:
`1 3
1 2 3
3 1
4
5
6
`,
        expected:
`32`
      }
    ],

    [
      { input: "5\n1 2 3 4 5\n", expected: "5 4 3 2 1" },
      { input: "3\n10 20 30\n", expected: "30 20 10" },
      { input: "1\n99\n", expected: "99" }
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
  const { rollno, room, code, questionIndex, language } = req.body;

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

  try {
    // ================== C LANGUAGE ==================
    if (language === "c") {
      fs.writeFileSync(cFile, code);

      // Compile
      await new Promise((resolve, reject) => {
        exec(`gcc "${cFile}" -o "${exeFile}"`, { timeout: 5000 }, (err, _, stderr) => {
          if (err) reject(`Compilation error:\n${stderr}`);
          else resolve();
        });
      });

      // Run test cases
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
          return res.json({ 
            success: false 
          }); 
        } 
      } 
    }

    else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // ✅ Passed all test cases
    const roomKey = room; // "room1" | "room2" | "room3"
    const timeLeft = req.body.timeLeft || 0;
    const roomScore = timeLeft * 10;

    await Player.updateOne(
    { rollNo: rollno },
    {
      $set: {
        [`roomTimes.${roomKey}`]: timeLeft,
        currentRoom: Number(room.slice(-1)) + 1
      },
      $inc: {
        totalScore: roomScore,
        tabSwitches: req.body.tabSwitches || 0
      }
    }
  );

    res.json({ success: true });

  } catch (err) {
    console.error("Execution error:", err);
    res.json({ success: false });
  } finally {
    try { fs.unlinkSync(cFile); } catch {}
    try { fs.unlinkSync(exeFile); } catch {}
    try { fs.unlinkSync(pyFile); } catch {}
  }
});

function compare(output, expected) {
  return output.replace(/\s/g, "") === expected.replace(/\s/g, "");
}

function runProgram(command, input, scriptPath = null) {
  return new Promise((resolve, reject) => {
    const args = scriptPath ? [scriptPath] : [];
    const child = spawn(command, args);

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject("Time limit exceeded");
    }, 3000);

    child.stdout.on("data", data => stdout += data.toString());
    child.stderr.on("data", data => stderr += data.toString());

    child.on("error", err => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) reject(stderr);
      else resolve(stdout.trim());
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

// ===== START SERVER =====
//app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});