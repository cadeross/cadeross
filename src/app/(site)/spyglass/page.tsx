import AppPage, { appMetadata } from "@/components/AppPage";
import { getApp } from "@/lib/portfolio";

const app = getApp("spyglass");

export const metadata = appMetadata(app);

export default function Page() {
  return <AppPage app={app} />;
}
