import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

interface SerperPlaceResult {
  title?: string;
  address?: string;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
  hours?: Record<string, string>;
  attributes?: Record<string, string>;
  reviews?: Array<{ snippet?: string }>;
  thumbnailUrl?: string;
  cid?: string;
}

async function resolveGmbUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

function extractSearchQuery(resolvedUrl: string, rawUrl: string): string {
  try {
    const u = new URL(resolvedUrl);

    // Format: /maps/place/Business+Name/@lat,lng,...
    const placeMatch = u.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    // Format: ?q=Business+Name
    const qParam = u.searchParams.get("q");
    if (qParam) return qParam;

    // Format: /search?query=...
    const queryParam = u.searchParams.get("query");
    if (queryParam) return queryParam;
  } catch {
    // Ignore URL parsing errors
  }

  // Fallback: use raw URL as-is and let Serper handle it
  return rawUrl;
}

async function fetchSerperMaps(query: string): Promise<SerperPlaceResult | null> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY non configurée");

  const res = await fetch("https://google.serper.dev/maps", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, gl: "fr", hl: "fr" }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Serper Maps API error ${res.status}: ${txt}`);
  }

  const data = await res.json() as { places?: SerperPlaceResult[] };
  return data.places?.[0] ?? null;
}

async function mapToBrandBrief(place: SerperPlaceResult): Promise<Record<string, string>> {
  const reviewSnippets = place.reviews
    ?.slice(0, 3)
    .map((r) => r.snippet)
    .filter(Boolean)
    .join(" | ") ?? "";

  const context = `
Établissement: ${place.title ?? ""}
Catégorie: ${place.category ?? ""}
Adresse: ${place.address ?? ""}
Note: ${place.rating ?? ""}/5 (${place.ratingCount ?? 0} avis)
Téléphone: ${place.phoneNumber ?? ""}
Site web: ${place.website ?? ""}
Description: ${place.description ?? ""}
Attributs: ${JSON.stringify(place.attributes ?? {})}
Extraits d'avis clients: ${reviewSnippets}
  `.trim();

  const systemPrompt = `Tu es un expert en branding et marketing. 
À partir des informations d'un établissement Google My Business, tu dois extraire et déduire les champs d'un brief de marque.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication.
Pour les champs que tu ne peux pas déduire, retourne une chaîne vide "".
Les secteurs disponibles sont : bijou, luxe, cosmétique, mode, tech, fitness, décoration, maroquinerie.
Les tons disponibles sont : luxe, premium, moderne, minimaliste, chaleureux, professionnel, streetwear, écologique.`;

  const userPrompt = `Informations GMB :
${context}

Génère un objet JSON avec ces champs :
- brand_name: nom exact de l'établissement
- sector: le secteur le plus proche parmi les options disponibles
- tone: le ton de communication déduit
- values: 3-5 valeurs de marque séparées par des virgules (ex: "qualité, service, excellence")
- product_name: produit ou service phare si identifiable
- product_description: description courte du produit/service principal
- benefits: bénéfices client déduits des avis et de la description
- target_audience: audience cible déduite (format libre, ex: "Femmes 30-50 ans passionnées de bijoux")
- product_features: caractéristiques clés du produit/service
- support_email: email de contact si disponible
- shipping_info: infos de livraison si disponibles`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanJson);
}

router.post("/scrape-gmb", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string" || url.trim() === "") {
    return res.status(400).json({ error: "Un lien GMB est requis." });
  }

  const rawUrl = url.trim();

  // Validate that it looks like a Google Maps / GMB URL
  const isGmb =
    rawUrl.includes("google.com/maps") ||
    rawUrl.includes("maps.app.goo.gl") ||
    rawUrl.includes("goo.gl/maps") ||
    rawUrl.includes("maps.google.com");

  if (!isGmb) {
    return res.status(400).json({
      error: "Veuillez fournir un lien Google My Business valide (google.com/maps, maps.app.goo.gl…)",
    });
  }

  try {
    // 1. Resolve short URL if needed
    const resolvedUrl = await resolveGmbUrl(rawUrl);

    // 2. Extract the business name / search query
    const searchQuery = extractSearchQuery(resolvedUrl, rawUrl);

    // 3. Fetch business data from Serper Maps
    const place = await fetchSerperMaps(searchQuery);

    if (!place) {
      return res.status(404).json({
        error: "Aucun établissement trouvé pour ce lien GMB. Vérifiez que le lien est correct.",
      });
    }

    // 4. Map to BrandBrief via AI
    const briefData = await mapToBrandBrief(place);

    return res.json({
      success: true,
      place: {
        name: place.title,
        address: place.address,
        rating: place.rating,
        ratingCount: place.ratingCount,
        category: place.category,
        website: place.website,
        phoneNumber: place.phoneNumber,
      },
      brief: briefData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[scrape-gmb] Error:", message);
    return res.status(500).json({ error: `Erreur lors du scraping : ${message}` });
  }
});

export default router;
