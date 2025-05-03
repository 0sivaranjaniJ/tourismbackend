const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ message: "Booking saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving booking" });
  }
});

module.exports = router;
