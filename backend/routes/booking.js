const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/b", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    const saved = await booking.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
