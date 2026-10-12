const ALLOWED_LANGUAGES = new Set(["en","hi","mr","bn","gu","pa","ta","te"]);
const ALLOWED_URGENCIES = new Set(["HOME_CARE","PHC_CLINIC","EMERGENCY"]);
function validateTriageInput(body) {
  if (!body || typeof body !== "object") return {ok:false,message:"Please describe your symptoms."};
  if (typeof body.symptoms !== "string" || !body.symptoms.trim()) return {ok:false,message:"Please describe your symptoms."};
  const symptoms = body.symptoms.trim();
  if (symptoms.length > 1500) return {ok:false,message:"Please keep your symptom description under 1500 characters."};
  const age = body.age === undefined || body.age === "" ? undefined : Number(body.age);
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) return {ok:false,message:"Please enter a valid age from 0 to 120."};
  const language = ALLOWED_LANGUAGES.has(body.language) ? body.language : "en";
  return {ok:true,value:{symptoms,age,gender:typeof body.gender==="string"?body.gender.slice(0,30):undefined,pregnancyStatus:typeof body.pregnancyStatus==="string"?body.pregnancyStatus.slice(0,20):undefined,language}};
}
function validateCareInput(body) {
  if (!body || !Number.isFinite(Number(body.latitude)) || !Number.isFinite(Number(body.longitude))) return {ok:false,message:"Valid location coordinates are required."};
  const latitude=Number(body.latitude),longitude=Number(body.longitude);
  if(latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return {ok:false,message:"Location coordinates are invalid."};
  const type=["hospital","clinic","phc"].includes(body.type)?body.type:"hospital";
  return {ok:true,value:{latitude,longitude,type}};
}
function isValidTriageResponse(value) {
  return !!value && ALLOWED_URGENCIES.has(value.urgency) &&
    typeof value.summary==="string" && value.summary.length<700 &&
    typeof value.reason==="string" && value.reason.length<1200 &&
    typeof value.recommendedAction==="string" && value.recommendedAction.length<1200 &&
    Array.isArray(value.warningSigns) && value.warningSigns.length<=8 &&
    value.warningSigns.every(x=>typeof x==="string" && x.length<250);
}
module.exports={validateTriageInput,validateCareInput,isValidTriageResponse};
