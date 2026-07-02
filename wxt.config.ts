import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Alveus Companion",
    short_name: "Alveus",
    description:
      "Live stream status, ambassador animals, schedule and announcements for Alveus Sanctuary.",
    version: "0.1.0",
    permissions: ["storage", "notifications", "alarms", "sidePanel"],
    host_permissions: [
      "https://gql.twitch.tv/*",
      "https://www.alveussanctuary.org/*",
      "https://raw.githubusercontent.com/*",
      "https://static-cdn.jtvnw.net/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; img-src 'self' https://raw.githubusercontent.com https://static-cdn.jtvnw.net data:;",
    },
    action: {
      default_title: "Alveus Companion",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
});
