import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PALETTES } from "@/components/site/palettes";
import type { AppShowcase } from "@/lib/portfolio";

export const ogSize = { width: 1200, height: 630 };

/* Link preview for an app page: name and tagline on the left on the site's
   paper, the top of the app's panel rising out of its palette on the right. */
export async function appOgImage(app: AppShowcase) {
  const png = await readFile(join(process.cwd(), "public", app.screenshot.src));
  const shot = `data:image/png;base64,${png.toString("base64")}`;
  const shotWidth = 400;
  const [c0, c1, c2, c3] = PALETTES[app.palette];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f3f0",
          color: "#1a1b18",
          padding: "0 0 0 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 56 }}>
          <div style={{ fontSize: 30, color: "#8a8983" }}>Free for Mac</div>
          <div style={{ fontSize: 96, fontWeight: 500, letterSpacing: -4, marginTop: 8 }}>{app.title}</div>
          <div style={{ fontSize: 32, lineHeight: 1.4, color: "#5f5e59", marginTop: 20 }}>
            {app.tagline}
          </div>
          <div style={{ fontSize: 26, color: "#8a8983", marginTop: 40 }}>
            {`cadeross.com/${app.slug}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: shotWidth + 120,
            margin: "16px 16px 16px 0",
            paddingTop: 56,
            overflow: "hidden",
            borderRadius: 28,
            background: `linear-gradient(170deg, ${c0} 0%, ${c1} 38%, ${c2} 72%, ${c3} 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot}
            alt=""
            width={shotWidth}
            height={Math.round((shotWidth * app.screenshot.height) / app.screenshot.width)}
            style={{ borderRadius: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}
          />
        </div>
      </div>
    ),
    ogSize,
  );
}
