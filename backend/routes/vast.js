import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Domaines autorisés pour le proxy VAST (whitelist)
const ALLOWED_DOMAINS = [
  "selfishzone.com",
  "hilltopads.com",
  "hilltopads.net"
];

// Fonction pour valider l'URL
function isValidVastUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
}

// Route proxy VAST
// /api/proxy-vast?tag=<encodedTagUrl>
router.get("/proxy-vast", async (req, res) => {
  const tag = req.query.tag;
  
  if (!tag) {
    return res.status(400).send("Missing tag parameter");
  }
  
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(tag);
  } catch (e) {
    return res.status(400).send("Invalid tag URL encoding");
  }
  
  // Valider l'URL par rapport à la whitelist
  if (!isValidVastUrl(targetUrl)) {
    return res.status(403).send("URL not allowed");
  }
  
  try {
    // Récupérer le tag VAST
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch VAST tag: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Définir le bon type de contenu pour le XML VAST
    res.set("Content-Type", "application/xml");
    res.send(text);
  } catch (error) {
    console.error("Error proxying VAST tag:", error);
    res.status(500).send("Internal server error");
  }
});

export default router;