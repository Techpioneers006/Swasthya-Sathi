const { detectEmergency } = require("../utils/safetyRules");
const { isValidTriageResponse } = require("../utils/validation");

const demoMode = () => String(process.env.DEMO_MODE || "true").toLowerCase() === "true";
const demoText = {
  en: {
    HOME_CARE: { summary:"The symptoms described do not indicate an obvious emergency from the information provided.", reason:"You described symptoms that may be mild, but this tool cannot determine the cause.", recommendedAction:"Rest if appropriate, drink fluids if you can, and monitor symptoms. Seek professional care if symptoms worsen.", warningSigns:["Symptoms get worse","Difficulty breathing","Severe pain, fainting or confusion"] },
    PHC_CLINIC: { summary:"It would be sensible to get advice from a healthcare professional.", reason:"Some symptoms need an in-person assessment, and this tool cannot reliably determine the cause.", recommendedAction:"Consider visiting your nearest PHC, clinic or doctor.", warningSigns:["Persistent or worsening symptoms","Repeated vomiting or inability to keep fluids down","New severe symptoms"] },
    EMERGENCY: { summary:"Your symptoms may need immediate medical attention.", reason:"The symptoms described may be serious and should be assessed urgently.", recommendedAction:"Please seek emergency medical care immediately. Do not delay professional help.", warningSigns:["Severe breathing difficulty","Severe chest pain","Unconsciousness or rapid deterioration"] }
  },
  hi: {
    HOME_CARE:{summary:"दी गई जानकारी से कोई स्पष्ट आपातकाल नहीं दिखता, लेकिन कारण तय नहीं किया जा सकता।",reason:"आपके बताए लक्षण हल्के हो सकते हैं, फिर भी यह टूल बीमारी का कारण नहीं बता सकता।",recommendedAction:"यदि उचित हो तो आराम करें और पानी पीते रहें। लक्षण बढ़ें तो डॉक्टर से मिलें।",warningSigns:["लक्षण बढ़ना","सांस लेने में परेशानी","तेज़ दर्द, बेहोशी या भ्रम"]},
    PHC_CLINIC:{summary:"स्वास्थ्यकर्मी से सलाह लेना बेहतर रहेगा।",reason:"कुछ लक्षणों की जांच आमने-सामने करना ज़रूरी होता है।",recommendedAction:"नज़दीकी PHC, क्लिनिक या डॉक्टर से मिलें।",warningSigns:["लक्षण बने रहना या बढ़ना","बार-बार उल्टी","नए या गंभीर लक्षण"]},
    EMERGENCY:{summary:"आपके लक्षणों में तुरंत चिकित्सा सहायता की ज़रूरत हो सकती है।",reason:"बताए गए लक्षण गंभीर हो सकते हैं और तुरंत जांच ज़रूरी हो सकती है।",recommendedAction:"कृपया तुरंत आपातकालीन चिकित्सा सहायता लें। मदद लेने में देर न करें।",warningSigns:["सांस लेने में गंभीर परेशानी","तेज़ सीने का दर्द","बेहोशी या हालत तेज़ी से बिगड़ना"]}
  }
};
function keywordDemo(input) {
  const text = input.symptoms.toLowerCase();
  const severe = /(mild|हल्का|slight|minor)/i.test(text);
  const moderateWords = /(fever|bukhar|बुखार|vomit|उल्टी|headache|सिर दर्द|head pain|stomach pain|पेट दर्द|pain|दर्द|weakness|कमजोरी|two days|2 days|दो दिन)/i;
  const urgency = moderateWords.test(text) && !severe ? "PHC_CLINIC" : "HOME_CARE";
  const dict = demoText[input.language] || demoText.en;
  return { urgency, ...dict[urgency], disclaimer:"Demo mode is for software demonstration only and is not a medical decision system.", demoMode:true };
}
async function getTriageGuidance(input) {
  if (detectEmergency(input.symptoms).detected) {
    const dict = demoText[input.language] || demoText.en;
    return { urgency:"EMERGENCY", ...dict.EMERGENCY, disclaimer:"This is general triage guidance, not a diagnosis.", demoMode:demoMode(), safetyOverride:true };
  }
  if (demoMode() || !process.env.LLM_API_KEY) return keywordDemo(input);
  const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const languageNames = {en:"English",hi:"simple conversational Hindi",mr:"Marathi",bn:"Bengali",gu:"Gujarati",pa:"Punjabi",ta:"Tamil",te:"Telugu"};
  const systemPrompt = `You are a health symptom triage assistant, not a doctor. Do not diagnose diseases, prescribe medicines or doses, or encourage delay in emergency care. Estimate only urgency. Return one urgency: HOME_CARE, PHC_CLINIC, EMERGENCY. If uncertain, choose the safer higher urgency. Use simple ${languageNames[input.language] || "English"}. Return valid JSON only with keys urgency, summary, reason, recommendedAction, warningSigns (array), disclaimer. Never claim a diagnosis.`;
  const userPayload = { symptoms: input.symptoms, age: input.age || null, gender: input.gender || null, pregnancyStatus: input.pregnancyStatus || null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method:"POST", signal:controller.signal,
      headers:{"Authorization":`Bearer ${process.env.LLM_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model,temperature:0.1,response_format:{type:"json_object"},messages:[{role:"system",content:systemPrompt},{role:"user",content:JSON.stringify(userPayload)}]})
    });
    if (!response.ok) throw new Error("Provider unavailable");
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    if (!isValidTriageResponse(parsed)) throw new Error("Invalid provider response");
    return {...parsed, disclaimer:"This is general triage guidance, not a diagnosis.", demoMode:false};
  } finally { clearTimeout(timeout); }
}
module.exports = { getTriageGuidance };
