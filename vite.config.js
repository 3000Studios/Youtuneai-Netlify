import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        store: resolve(__dirname, "store.html"),
        appstore: resolve(__dirname, "appstore.html"),
        blog: resolve(__dirname, "blog.html"),
        livestream: resolve(__dirname, "livestream.html"),
        gamezone: resolve(__dirname, "gamezone.html"),
        referrals: resolve(__dirname, "referrals.html"),
        projects: resolve(__dirname, "projects.html"),
        studio3000: resolve(__dirname, "studio3000.html"),
      },
    },
  },
});
