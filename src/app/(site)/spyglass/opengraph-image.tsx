import { appOgImage, ogSize } from "@/lib/appOgImage";
import { getApp } from "@/lib/portfolio";

const app = getApp("spyglass");

export const alt = app.tagline;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return appOgImage(app);
}
