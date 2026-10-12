// This is a basic safety net, not a medically validated detector.
// Strong matches always override the AI response and recommend urgent assessment.
const EMERGENCY_PATTERNS = [
  /\b(severe|can't|cannot|unable to|difficulty|trouble|struggling)\b.{0,35}\b(breathe|breathing)\b/i,
  /\b(saans nahi|saans lene mein dikkat|saans nahi aa|सांस लेने में (कठिनाई|दिक्कत)|सांस नहीं आ)\b/i,
  /\b(severe|crushing|intense|sudden)\b.{0,25}\b(chest pain|chest pressure|chest tightness)\b/i,
  /\b(very bad|severe|sudden)\b.{0,20}\b(chest pain)\b/i,
  /\b(unconscious|not responding|passed out|unresponsive)\b/i,
  /\b(बेहोश|होश नहीं|जवाब नहीं दे रहा)\b/i,
  /\b(seizure|convulsion|fits)\b/i,
  /\b(uncontrolled bleeding|bleeding heavily|heavy bleeding|bleeding won't stop)\b/i,
  /\b(sudden paralysis|sudden weakness|one side weakness|face drooping|slurred speech)\b/i,
  /\b(blue lips|grey lips|blue skin)\b/i,
  /\b(severe allergic reaction|throat closing|tongue swelling).{0,35}\b(breathe|breathing|swelling)\b/i,
  /\b(major burn|severe burn|serious burn)\b/i,
  /\b(poisoning|overdose).{0,35}\b(severe|unconscious|breathing|convulsion)\b/i
];
function detectEmergency(symptoms) {
  const text = String(symptoms || "");
  const matched = EMERGENCY_PATTERNS.some(pattern => pattern.test(text));
  return { detected: matched, reason: matched ? "Potential emergency warning sign matched" : null };
}
module.exports = { detectEmergency };
