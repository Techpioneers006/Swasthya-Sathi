const express = require("express");
const router = express.Router();
const { validateCareInput } = require("../utils/validation");
const { searchNearbyCare } = require("../services/mapsService");

router.post("/search", async (req, res) => {
  const validation = validateCareInput(req.body);
  if (!validation.ok) return res.status(400).json({ message: validation.message });
  try {
    const results = await searchNearbyCare(validation.value);
    if (!results) return res.json({ results: [], available: false, message: "Nearby care search is currently unavailable. Use the manual Google Maps search." });
    return res.json({ results, available: true });
  } catch (_error) {
    return res.json({ results: [], available: false, message: "Nearby care search is currently unavailable. Use the manual Google Maps search." });
  }
});
module.exports = router;
