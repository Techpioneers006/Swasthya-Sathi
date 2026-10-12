async function searchNearbyCare({ latitude, longitude, type }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const includedTypes = type === "clinic" ? ["doctor"] : type === "phc" ? ["hospital","doctor"] : ["hospital"];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method:"POST", signal:controller.signal,
      headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri"},
      body:JSON.stringify({includedTypes, maxResultCount:8, locationRestriction:{circle:{center:{latitude,longitude},radius:5000}}})
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (data.places || []).map(place => ({
      name: place.displayName?.text || "Healthcare facility",
      address: place.formattedAddress || "",
      directionsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || "hospital")}`
    }));
  } finally { clearTimeout(timer); }
}
module.exports = { searchNearbyCare };
