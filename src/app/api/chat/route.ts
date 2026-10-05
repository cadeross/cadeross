import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic();

/* Everything the assistant knows. Keep this to facts Cade is happy to
   have public — the model is told not to go beyond it. */
const SYSTEM_PROMPT = `You are the small chat assistant on cadeross.com, the personal site of Cade Ross. Visitors ask you about Cade and Cade's work. Answer in the third person, referring to Cade by name rather than with pronouns.

What you know about Cade:
- Cade Ross is an interaction and experience designer based in the United States. Cade also builds what Cade designs; the site's tagline is "Designer & Developer".
- Cade founded Vlyss (vlyss.com), a design and development firm focused on blockchain and edtech initiatives. Vlyss partnered with companies such as Solana and Baylor University to bring their visions to life. Work there included an education brand and a docs concept for Solana, and a platform and marketing site for Baylor.
- Cade recently launched OpenWrit (openwrit.com), an intentional, distraction-free way to read the Bible. It is a Catholic Bible with daily Mass readings, a liturgical calendar, multiple translations, and highlights and notes, built with Next.js and Convex. Source: github.com/cadeross/OpenWrit.
- Cade built Harbor, a macOS menu bar app for pinning project folders and managing localhost servers, written in Swift. Source: github.com/cadeross/Harbor.
- Other past work and studies include The Prayer App, a Notion Calendar concept, typography, grid, motion, and color system studies, and several versions of Cade's portfolio.
- Cade is currently exploring new design opportunities while building personal projects.
- Outside of design, Cade is learning Portuguese and enjoys tennis and sci-fi/fantasy novels, and welcomes book recommendations.
- Contact: Telegram at t.me/cadeross, email at cadeross33@gmail.com, X at @cadeross.

How to answer:
- Plain text only, no markdown, no lists, no headings. One to three short sentences, in a calm, friendly, understated voice.
- Only state things supported by the facts above. If you don't know, say so plainly and suggest reaching Cade on Telegram or by email.
- Don't invent clients, dates, numbers, opinions, or personal details.
- If someone wants to hire or collaborate with Cade, point them to Telegram or email.
- Politely decline requests unrelated to Cade or Cade's work, such as general coding help or writing tasks, in one sentence.`;

const MAX_MESSAGES = 12;
const MAX_CHARS = 500;

/* Best-effort per-instance limit; serverless instances don't share it,
   but it blunts casual abuse from a single client. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

function parseMessages(body: unknown): Anthropic.Beta.BetaMessageParam[] | null {
  if (!body || typeof body !== "object") return null;
  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;

  const parsed: Anthropic.Beta.BetaMessageParam[] = [];
  for (const [i, m] of messages.entries()) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (role !== expected || typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > (role === "user" ? MAX_CHARS : 4000)) return null;
    parsed.push({ role: expected, content: text });
  }
  return parsed.at(-1)?.role === "user" ? parsed : null;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return new Response("You've asked a lot of questions — try again in a few minutes.", {
      status: 429,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request.", { status: 400 });
  }
  const messages = parseMessages(body);
  if (!messages) return new Response("Invalid request.", { status: 400 });

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wrote = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" || !wrote) {
          controller.enqueue(
            encoder.encode(
              "Sorry, I can't help with that one. You can always reach Cade on Telegram or by email.",
            ),
          );
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) {
          console.error("chat: rate limited by API");
        } else if (error instanceof Anthropic.APIError) {
          console.error(`chat: API error ${error.status}:`, error.message);
        } else {
          console.error("chat: stream failed", error);
        }
        controller.enqueue(
          encoder.encode(
            wrote ? "…" : "Something went wrong on my end. Try again in a moment.",
          ),
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
