import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfiguredMetalRates } from "@/lib/metal-rates";

const MAX_IMAGE_CHARS = 4_000_000;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_CANDIDATES = 150;

type ChatMessage = { role: "user" | "assistant"; content: string };
type ProductCandidate = {
  reference: string;
  name: string | null;
  category: string;
  imagePath: string;
  price: number | null;
  description: string | null;
  images: { imagePath: string }[];
};

function parseAssistantOutput(value: string): { reply?: string; matches?: string[] } {
  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1));
      } catch {
        // Fall through to plain text if the model output is not valid JSON.
      }
    }
    return { reply: value };
  }
}

async function toGeminiImagePart(source: string, baseUrl: string) {
  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!match) return null;
    return { inlineData: { mimeType: match[1], data: match[2] } };
  }

  try {
    const imageUrl = new URL(source, baseUrl);
    if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") return null;
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    const mimeType = imageResponse.headers.get("content-type")?.split(";")[0];
    if (!imageResponse.ok || !["image/jpeg", "image/png", "image/webp"].includes(mimeType || "")) return null;
    const bytes = await imageResponse.arrayBuffer();
    if (bytes.byteLength > 4_000_000) return null;
    return { inlineData: { mimeType: mimeType!, data: Buffer.from(bytes).toString("base64") } };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The jewellery assistant is not configured yet." }, { status: 503 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 5_000_000) {
      return NextResponse.json({ error: "The upload is too large. Please use an image under 3 MB." }, { status: 413 });
    }

    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const image = typeof body.image === "string" ? body.image : "";
    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((item: unknown): item is ChatMessage =>
            Boolean(item) && typeof item === "object" &&
            ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
            typeof (item as ChatMessage).content === "string" &&
            (item as ChatMessage).content.length <= MAX_MESSAGE_LENGTH
          )
          .slice(-8)
      : [];

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Please keep your message under 1,000 characters." }, { status: 400 });
    }
    if (image && (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > MAX_IMAGE_CHARS)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP image under 3 MB." }, { status: 400 });
    }
    if (!message && !image) {
      return NextResponse.json({ error: "Type a question or upload a jewellery photo." }, { status: 400 });
    }

    const candidates = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_CANDIDATES,
      select: {
        reference: true,
        name: true,
        category: true,
        imagePath: true,
        price: true,
        description: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { imagePath: true },
        },
      },
    }) as ProductCandidate[];

    const candidateText = candidates.map((product) =>
      `${product.reference}: ${product.name || "Jewellery"}; category ${product.category}; price ${product.price ?? "not listed"}; ${product.description || ""}`
    ).join("\n");

    let rateContext = "The owner has not entered metal rates. If asked about gold or silver rates, say the shop has not set a rate yet and do not guess.";
    try {
      const configuredRates = await getConfiguredMetalRates();
      const rates = configuredRates.rates.map((rate) => `${rate.purity} gold ₹${rate.ratePerGram.toFixed(2)}/g`);
      if (configuredRates.silverPerGram !== null) rates.push(`silver ₹${configuredRates.silverPerGram.toFixed(2)}/g`);
      if (rates.length > 0) rateContext = `Owner-set reference rates, INR per gram${configuredRates.updatedAt ? `, updated ${configuredRates.updatedAt}` : ""}: ${rates.join("; ")}. These are shop-set reference rates, not a final jewellery quote; category labour and other charges may differ.`;
    } catch {
      rateContext = "The shop's saved metal rates could not be loaded. If asked for a rate, say it is unavailable and do not guess.";
    }

    const prompt = [
      message || "Find similar designs in the active catalogue.",
      "\nActive catalogue information (only use these exact product references):\n",
      candidateText || "No active products are available.",
      "\n",
      rateContext,
      "\nReturn one JSON object with fields reply (short, friendly text) and matches (array of exact product references, up to 5). When asked for gold or silver rates, answer only from the owner-set rates above, include INR per gram, and identify them as shop-set reference rates. If no rate is set, do not guess. Return matches only when the customer uploaded an image or explicitly asks to find/recommend/search for a product; for greetings and general questions return matches as []. Use [] when no close matches are available. Never invent product facts, stock, or prices. Describe matches as similar designs, not guaranteed identical items.",
    ].join("");
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];

    if (image) {
      const uploadedImage = await toGeminiImagePart(image, request.url);
      if (uploadedImage) parts.push(uploadedImage);
      const visualCandidates = await Promise.all(candidates.slice(0, 24).map(async (product) => ({
        product,
        imagePart: await toGeminiImagePart(product.images[0]?.imagePath || product.imagePath, request.url),
      })));
      for (const { product, imagePart } of visualCandidates) {
        if (imagePart) parts.push({ text: `Catalogue reference ${product.reference}, image follows:` }, imagePart);
      }
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: "You are a jewellery shop customer assistant. Be concise and friendly. Use only facts from the active catalogue and owner-set metal rates supplied in the latest user message. When asked for gold or silver rates, answer with the supplied INR-per-gram shop-set reference rate and do not invent rates. Do not treat a reference rate as a final jewellery quote. Do not recommend products unless the customer explicitly asks to find, browse, or get recommendations, or uploads an image." }] },
      contents: [
        ...history.map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })),
        { role: "user", parts },
      ],
      generationConfig: { maxOutputTokens: 500, responseMimeType: "application/json" },
    });
    const requestModel = (modelName: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: requestBody,
    });

    let response = await requestModel(model);
    if ((response.status === 429 || response.status === 503) && model !== "gemini-3.5-flash-lite") {
      response = await requestModel("gemini-3.5-flash-lite");
    }

    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini assistant request failed:", response.status);
      return NextResponse.json({ error: "The assistant could not answer just now. Please try again." }, { status: 502 });
    }

    const outputText = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    const parsed = parseAssistantOutput(outputText);
    const requestedReferences = Array.isArray(parsed.matches)
      ? [...new Set(parsed.matches.filter((value): value is string => typeof value === "string"))].slice(0, 5)
      : [];
    const allowedReferences = candidates.map((product) => product.reference);
    const safeReferences = requestedReferences.filter((reference) => allowedReferences.includes(reference));
    const matches = safeReferences.length
      ? await prisma.product.findMany({
          where: { reference: { in: safeReferences }, isActive: true },
          select: { reference: true, name: true, category: true, imagePath: true, price: true },
        })
      : [];

    return NextResponse.json({
      reply: parsed.reply || "I can help with jewellery in our collection. What are you looking for?",
      matches,
    });
  } catch (error) {
    console.error("Jewellery assistant error:", error);
    return NextResponse.json({ error: "The assistant could not answer just now. Please try again." }, { status: 500 });
  }
}
