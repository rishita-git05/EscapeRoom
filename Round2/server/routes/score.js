import express from "express";
import Player from "../models/Round2.js";

const router = express.Router();

router.get("/final/:rollNo", async (req, res) => {
  try {
    const player = await Player.findOne({ rollNo: req.params.rollNo });
    if (!player) {
      return res.json({ success: false });
    }

    const r1 = Number(player.roomTimes?.room1) || 0;
    const r2 = Number(player.roomTimes?.room2) || 0;
    const r3 = Number(player.roomTimes?.room3) || 0;

    const totalScore = r1 + r2 + r3;
    const roomsCleared = [r1, r2, r3].filter(t => t > 0).length;

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
