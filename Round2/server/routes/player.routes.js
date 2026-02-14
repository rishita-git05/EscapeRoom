import express from "express";
import Player from "../models/Round2.js";
import { ROOM_TIME_LIMITS } from "../config/roomConfig.js";

const router = express.Router();

router.post("/start", async (req, res) => {
  try {
    const { rollNo } = req.body;
    if (!rollNo) return res.status(400).json({ message: "Roll number required" });

    let player = await Player.findOne({ rollNo });

    if (!player) {
      player = await Player.create({ rollNo });
    }

    res.json({
      success: true,
      currentRoom: player.currentRoom
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/enter-room", async (req, res) => {
  const { rollNo, room } = req.body;
  if (!rollNo || !room) return res.json({ success: false });

  const roomKey = `room${room}`;
  const player = await Player.findOne({ rollNo });
  if (!player) return res.json({ success: false });

  // If room already completed → block re-entry
  if (player.roomTimes?.[roomKey] > 0) {
    return res.json({ success: true });
  }

  // Start timer ONLY if not started
  if (!player.roomStartTimes?.[roomKey]) {
    player.roomStartTimes = {
      ...player.roomStartTimes,
      [roomKey]: new Date()
    };
    await player.save();
  }

  res.json({ success: true });
});

router.get("/time-left/:rollNo/:room", async (req, res) => {
  try {
    const { rollNo, room } = req.params;
    const player = await Player.findOne({ rollNo });

    if (!player) return res.json({ success: false });

    const roomKey = `room${room}`;
    const maxTime = ROOM_TIME_LIMITS[roomKey];

    if (!maxTime) {
      return res.json({ success: false, message: "Invalid room" });
    }

    // If room already completed → return saved time
    if (player.roomTimes?.[roomKey] > 0) {
      return res.json({
        success: true,
        timeLeft: player.roomTimes[roomKey]
      });
    }

    const roomStart = player.roomStartTimes?.[roomKey];
    if (!roomStart) {
      return res.json({ success: false, message: "Room not entered yet" });
    }

    const elapsed = Math.floor(
      (Date.now() - new Date(roomStart).getTime()) / 1000
    );

    const timeLeft = Math.max(maxTime - elapsed, 0);

    res.json({ success: true, timeLeft });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.get("/final/:rollNo", async (req, res) => {
  try {
    const { rollNo } = req.params;

    const player = await Player.findOne({ rollNo });
    if (!player) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      totalScore: player.totalScore,
      roomTimes: player.roomTimes,
      tabSwitches: player.tabSwitches,
      roomsCleared: Object.values(player.roomTimes).filter(t => t > 0).length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
