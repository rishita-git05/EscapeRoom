import express from "express";
import Player from "../models/Player.js";

const router = express.Router();

router.get("/final/:rollNo", async (req, res) => {
  try {
    const player = await Player.findOne({ rollNo: req.params.rollNo });
    if (!player) {
      return res.json({ success: false });
    }

    const { room1 = 0, room2 = 0, room3 = 0 } = player.roomTimes;

    const totalScore = room1 + room2 + room3;
    const roomsCleared = [room1, room2, room3].filter(t => t > 0).length;

    // 🔥 Save it NOW
    player.totalScore = totalScore;
    player.finishedAt = new Date();
    await player.save();

    res.json({
      success: true,
      rollNo: player.rollNo,
      score: totalScore,
      roomsCleared
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
