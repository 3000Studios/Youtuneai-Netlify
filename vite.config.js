import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        gallery: resolve(__dirname, "gallery.html"),
        livestream: resolve(__dirname, "livestream.html"),
        blog: resolve(__dirname, "blog.html"),
        store: resolve(__dirname, "store.html"),
        appstore: resolve(__dirname, "appstore.html"),
        referrals: resolve(__dirname, "referrals.html"),
        projects: resolve(__dirname, "projects.html"),
      },
    },
  },
});
