import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type PostResult = {
  headline: string;
  subline: string;
  captions: { tone: "Fun" | "Premium" | "Urgent"; text: string }[];
  hashtags: string[];
  bestTime: { day: string; time: string; reason: string };
};

export async function generatePost(
  input: { image: string; offer: string; businessName: string; businessType: string; city: string },
  apiKey: string,
  signal: AbortSignal,
): Promise<PostResult> {
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const prompt = `You are a social media expert for small local businesses.
Business: ${input.businessName} (${input.businessType})${input.city ? `, located in ${input.city}` : ""}.
Offer: "${input.offer}".
Look at the attached product photo and return ONLY a JSON object (no markdown) with:
{
 "headline": short punchy overlay text for the image, max 5 words, based on the offer,
 "subline": max 7 words supporting line (e.g. the discount or "This week only"),
 "captions": [{"tone":"Fun","text":...},{"tone":"Premium","text":...},{"tone":"Urgent","text":...}] — each 2-4 sentences, with emojis where fitting, ending in a clear call to action (visit, DM, book, call),
 "hashtags": exactly 10 hashtags starting with #, mix of niche, product and local ones${input.city ? ` (use ${input.city})` : " (e.g. #shoplocal, #supportsmallbusiness)"},
 "bestTime": {"day": weekday, "time": e.g. "7:00 PM", "reason": one line why, specific to this business type}
}`;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    abortSignal: signal,
    maxRetries: 0,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image", image: input.image }] }],
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  const data = JSON.parse(match[0]) as PostResult;
  if (!data.captions?.length || !data.hashtags?.length || !data.bestTime) throw new Error("Incomplete AI response");
  data.hashtags = data.hashtags.slice(0, 10).map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, ""));
  return data;
}
