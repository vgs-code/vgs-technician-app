import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 const base = "https://vgs-technician-app.vercel.app";
 const routes = ["", "/book", "/contact", "/terms-and-conditions", "/privacy-policy", "/cancellation-refund"];
 return routes.map((route) => ({ url: base + route, lastModified: new Date(), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : route === "/book" ? 0.9 : 0.6 }));
}
