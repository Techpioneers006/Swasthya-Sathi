const express = require("express");
const router = express.Router();
const { validateTriageInput } = require("../utils/validation");
const { detectEmergency } = require("../utils/safetyRules");
const { getTriageGuidance } = require("../services/aiService");

router.post("/", async (req, res) => {
  const validation = validateTriageInput(req.body);
  if (!validation.ok) return res.status(400).json({ message: validation.message });
  const input = validation.value;
  // Do not log symptoms or optional personal/health information.
  const emergency = detectEmergency(input.symptoms);
  if (emergency.detected) {
    return res.json({
      urgency: "EMERGENCY",
      summary: input.language === "hi" ? "आपके बताए गए लक्षणों में तुरंत मदद की ज़रूरत हो सकती है।" : "Your symptoms may need immediate medical attention.",
      reason: input.language === "hi" ? "आपने ऐसे संकेत बताए हैं जिनका तुरंत स्वास्थ्यकर्मी द्वारा मूल्यांकन ज़रूरी हो सकता है।" : "You described warning signs that may require immediate professional assessment.",
      recommendedAction: input.language === "hi" ? "कृपया तुरंत आपातकालीन चिकित्सा सहायता लें। मदद लेने में देर न करें।" : "Please seek emergency medical care immediately. Do not delay professional help.",
      warningSigns: input.language === "hi" ? ["सांस लेने में गंभीर परेशानी", "बेहोशी", "तेज़ सीने का दर्द", "तेज़ी से हालत बिगड़ना"] : ["Severe breathing difficulty", "Unconsciousness", "Severe chest pain", "Rapid deterioration"],
      disclaimer: "This is general triage guidance, not a diagnosis.",
      demoMode: String(process.env.DEMO_MODE || "true").toLowerCase() === "true",
      safetyOverride: true
    });
  }
  try {
    const result = await getTriageGuidance(input);
    return res.json(result);
  } catch (_error) {
    // Safe fallback if provider is unavailable or response validation fails.
    return res.json({
      urgency: "PHC_CLINIC",
      summary: input.language === "hi" ? "आपकी परेशानी को स्वास्थ्यकर्मी से जांचवाना बेहतर होगा।" : "A healthcare professional should review your symptoms.",
      reason: input.language === "hi" ? "सिर्फ इस जानकारी से गंभीरता का भरोसेमंद आकलन नहीं किया जा सकता।" : "The information provided is not enough for a reliable assessment.",
      recommendedAction: input.language === "hi" ? "नज़दीकी PHC, क्लिनिक या डॉक्टर से मिलें।" : "Consider visiting your nearest PHC, clinic or doctor.",
      warningSigns: ["Symptoms worsening", "New or severe warning signs"],
      disclaimer: "This is general triage guidance, not a diagnosis.",
      demoMode: true
    });
  }
});
module.exports = router;
