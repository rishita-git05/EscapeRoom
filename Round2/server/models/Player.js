import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },

  currentRoom: { type: Number, default: 1 },

  roomTimes: {
    room1: { type: Number, default: 0 },
    room2: { type: Number, default: 0 },
    room3: { type: Number, default: 0 }
  },

  roomStartTimes: {
    room1: { type: Date },
    room2: { type: Date },
    room3: { type: Date }
  },

  totalScore: { type: Number, default: 0 },
  finishedAt: { type: Date },

  tabSwitches: { type: Number, default: 0 }
});

export default mongoose.model("Player", playerSchema);