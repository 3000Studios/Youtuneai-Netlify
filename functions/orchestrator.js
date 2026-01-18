export async function onRequestPost(context) {
  const { request, env } = context;
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  const OPENAI_MODEL = env.OPENAI_MODEL || "gpt-4o-mini";
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const GITHUB_REPO = env.GITHUB_REPO;
  const GITHUB_BASE_BRANCH = env.GITHUB_BASE_BRANCH || "main";
  const ADMIN_ROLE = env.ADMIN_ROLE;

  const allowedFields = ["eyebrow", "headline", "subhead", "cta", "price", "metric1", "metric2", "metric3"];
  const positiveWords = ["apply now", "ship it", "go ahead", "do it", "yes", "confirm", "send it"];

  const toSafeJsString = (v) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const extractJson = (text) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match) return JSON.parse(match[1]);
    throw new Error("Failed to parse JSON response.");
  };

  const githubRequest = async (path, options = {}) => {
    if (!GITHUB_TOKEN || !GITHUB_REPO) throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO.");
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "YoutuneAI-Cloudflare",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub error: ${await res.text()}`);
    return res.json();
  };

  const getRepoParts = () => {
    const [owner, repo] = (GITHUB_REPO || "").split("/");
    if (!owner || !repo) throw new Error("GITHUB_REPO must be owner/repo.");
    return { owner, repo };
  };

  const getFileContent = async (path, ref) => {
    const { owner, repo } = getRepoParts();
    const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`);
    return atob(data.content);
  };

  const updateAppState = (content, field, value) => {
    if (!allowedFields.includes(field)) return content;
    const safeValue = toSafeJsString(value);
    const pattern = new RegExp(`${field}:\\s*'[^']*'`);
    return content.replace(pattern, `${field}: '${safeValue}'`);
  };

  const updateTheme = (content, theme) => {
    const safeValue = toSafeJsString(theme);
    return content.replace(/theme:\s*'[^']*'/, `theme: '${safeValue}'`);
  };

  const updateMeta = (content, title, description) => {
    let updated = content;
    if (title) {
      updated = updated.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
    }
    if (description) {
      updated = updated.replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${description}" />`
      );
    }
    return updated;
  };

  const addNavLink = (content, slug, title) => {
    const link = `<a href="${slug}.html">${title}</a>`;
    if (content.includes(link)) return content;
    return content.replace("</nav>", `  ${link}\n    </nav>`);
  };

  const addFooterLink = (content, slug, title) => {
    const link = `<a href="${slug}.html">${title}</a>`;
    if (content.includes(link)) return content;
    return content.replace("</div>\n  </footer>", `  ${link}\n    </div>\n  </footer>`);
  };

  const insertMonetization = (content, headline, description, cta) => {
    if (content.includes('id="monetization"')) return content;
    const block = `
    <section class="section monetization" id="monetization">
      <h2>${headline}</h2>
      <p>${description}</p>
      <button class="primary">${cta}</button>
    </section>
  `;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const ensureMonetizationStyles = (content) => {
    if (content.includes(".monetization")) return content;
    return `${content}\n\n.monetization {\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n`;
  };

  const updateBackgroundVideo = (content, src) => {
    if (!src) return content;
    return content.replace(/<video[^>]*src="[^"]*"[^>]*>/, (match) => match.replace(/src="[^"]*"/, `src="${src}"`));
  };

  const updateWallpaper = (stylesContent, src) => {
    if (!src) return stylesContent;
    if (stylesContent.includes("background-image: url(")) {
      return stylesContent.replace(/background-image:\s*url\([^)]*\)/, `background-image: url("${src}")`);
    }
    return `${stylesContent}\nbody { background-image: url("${src}"); background-size: cover; background-repeat: no-repeat; }\n`;
  };

  const updateAvatar = (content, src) => {
    if (!src) return content;
    return content.replace(/<div class="avatar"[^>]*>\s*<img[^>]*src="[^"]*"/, (match) =>
      match.replace(/src="[^"]*"/, `src="${src}"`)
    );
  };

  const insertSection = (content, section) => {
    const { id = "custom-block", title = "New Section", body = "Details here." } = section;
    const block = `
    <section class="section custom-block" id="${id}">
      <h2>${title}</h2>
      <p>${body}</p>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const ensureStoreSection = (content) => {
    if (content.includes('id="store"')) return content;
    const block = `
    <section class="section" id="store">
      <h2>Store</h2>
      <div class="store-grid"></div>
    </section>`;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const addProductCard = (content, product) => {
    const { name = "New Product", price = "", description = "", image = "" } = product;
    const card = `
        <div class="product-card">
          <div class="product-media" style="background-image:url('${image}')"></div>
          <h3>${name}</h3>
          <p>${description}</p>
          <strong>${price}</strong>
          <button class="primary">Buy</button>
        </div>`;
    if (!content.includes('class="store-grid"')) return content;
    return content.replace('</div>\n    </section>', `${card}\n      </div>\n    </section>`);
  };

  const insertVideoSection = (content, video) => {
    const { id = "video-block", title = "Featured Video", src = "", poster = "" } = video;
    const block = `
    <section class="section video-block" id="${id}">
      <h2>${title}</h2>
      <video controls playsinline ${poster ? `poster="${poster}"` : ""} style="width:100%;border-radius:16px;">
        <source src="${src}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const insertStreamSection = (content, stream) => {
    const { id = "livestream", title = "Live Stream", url = "" } = stream;
    const block = `
    <section class="section livestream" id="${id}">
      <h2>${title}</h2>
      <div class="embed">
        <iframe src="${url}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:360px;border:0;border-radius:16px;"></iframe>
      </div>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const appendCustomStyles = (stylesContent, css) => {
    if (!css) return stylesContent;
    return `${stylesContent}\n\n/* Voice-injected styles */\n${css}\n`;
  };

  const buildPageTemplate = ({ title, headline, body }) => {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${title}" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-noise" aria-hidden="true"></div>
  <header class="site-header">
    <div class="brand">
      <span class="brand-mark">YT</span>
      <div class="brand-text">
        <strong>YoutuneAI</strong>
        <span>Revenue Engine</span>
      </div>
    </div>
    <nav class="nav">
      <a href="index.html">Home</a>
    </nav>
    <button class="ghost-button">Book a Demo</button>
  </header>
  <main class="page">
    <section class="section">
      <h1>${headline}</h1>
      <p>${body}</p>
    </section>
  </main>
  <footer class="footer">
    <div>
      <strong>YoutuneAI</strong>
      <p>Revenue systems that never sleep.</p>
    </div>
    <div class="footer-links">
      <a href="index.html">Home</a>
    </div>
  </footer>
</body>
</html>`;
  };

  const createCommitOnMain = async (updates, message) => {
    const { owner, repo } = getRepoParts();
    const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
    const baseCommitSha = baseRef.object.sha;
    const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
    const baseTreeSha = baseCommit.tree.sha;

    const treeItems = [];
    for (const [path, content] of Object.entries(updates)) {
      const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }

    const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [baseCommitSha],
      }),
    });

    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${GITHUB_BASE_BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return { commitSha: newCommit.sha };
  };

  const applyActions = async (actions, command) => {
    const updates = {};
    let indexHtml = null;
    let appJs = null;
    let styles = null;

    const needsIndex = actions.some((action) =>
      [
        "update_meta",
        "add_page",
        "insert_monetization",
        "update_background_video",
        "update_avatar",
        "insert_section",
        "add_product",
        "insert_video",
        "insert_stream",
      ].includes(action.type)
    );
    const needsApp = actions.some((action) =>
      ["update_copy", "update_theme"].includes(action.type)
    );
    const needsStyles = actions.some(
      (action) =>
        action.type === "insert_monetization" ||
        action.type === "update_wallpaper" ||
        action.type === "inject_css"
    );

    if (needsIndex) indexHtml = await getFileContent("index.html", GITHUB_BASE_BRANCH);
    if (needsApp) appJs = await getFileContent("app.js", GITHUB_BASE_BRANCH);
    if (needsStyles) styles = await getFileContent("styles.css", GITHUB_BASE_BRANCH);

    const newPages = [];

    for (const action of actions) {
      if (action.type === "update_copy" && appJs) {
        appJs = updateAppState(appJs, action.field, action.value);
      }
      if (action.type === "update_theme" && appJs) {
        appJs = updateTheme(appJs, action.theme);
      }
      if (action.type === "update_meta" && indexHtml) {
        indexHtml = updateMeta(indexHtml, action.title, action.description);
      }
      if (action.type === "add_page" && indexHtml) {
        const slug = action.slug || "new-page";
        const title = action.title || "New Page";
        const headline = action.headline || title;
        const body = action.body || "Details coming soon.";
        newPages.push({
          path: `${slug}.html`,
          content: buildPageTemplate({ title, headline, body }),
          slug,
          title,
        });
        indexHtml = addNavLink(indexHtml, slug, title);
        indexHtml = addFooterLink(indexHtml, slug, title);
      }
      if (action.type === "insert_monetization" && indexHtml) {
        indexHtml = insertMonetization(
          indexHtml,
          action.headline || "Monetize this page",
          action.description || "Add a revenue block to capture leads or offers.",
          action.cta || "Get the offer"
        );
        if (styles) {
          styles = ensureMonetizationStyles(styles);
        }
      }
      if (action.type === "update_background_video" && indexHtml) {
        indexHtml = updateBackgroundVideo(indexHtml, action.src);
      }
      if (action.type === "update_wallpaper" && styles) {
        styles = updateWallpaper(styles, action.src);
      }
      if (action.type === "update_avatar" && indexHtml) {
        indexHtml = updateAvatar(indexHtml, action.src);
      }
      if (action.type === "insert_section" && indexHtml) {
        indexHtml = insertSection(indexHtml, action);
      }
      if (action.type === "add_product" && indexHtml) {
        indexHtml = ensureStoreSection(indexHtml);
        indexHtml = addProductCard(indexHtml, action);
      }
      if (action.type === "insert_video" && indexHtml) {
        indexHtml = insertVideoSection(indexHtml, action);
      }
      if (action.type === "insert_stream" && indexHtml) {
        indexHtml = insertStreamSection(indexHtml, action);
      }
      if (action.type === "inject_css" && styles) {
        styles = appendCustomStyles(styles, action.css);
      }
    }

    if (indexHtml) updates["index.html"] = indexHtml;
    if (appJs) updates["app.js"] = appJs;
    if (styles) updates["styles.css"] = styles;
    newPages.forEach((page) => {
      updates[page.path] = page.content;
    });

    const message = `Live update: ${command.slice(0, 60)}`;
    const { commitSha } = await createCommitOnMain(updates, message);

    return { commitSha, files: Object.keys(updates) };
  };

  try {
    const payload = await request.json();
    const mode = payload.mode || "plan";
    const command = payload.command || "";

    if (mode === "rollback") {
      throw new Error("Rollback disabled for live apply mode.");
    }

    if (!command && mode !== "rollback") {
      throw new Error("Missing command.");
    }

    let plan = payload.plan;
    if (!plan) {
      if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content: `
You are a site editor for a static HTML/CSS/JS site.
Return ONLY valid JSON with this schema:
{
  "summary": "short summary",
  "commitMessage": "short git commit message",
  "actions": [
    {"type":"update_copy","field":"headline","value":"..."},
    {"type":"update_meta","title":"...","description":"..."},
    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},
    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},
    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."},
    {"type":"update_background_video","src":"https://...mp4"},
    {"type":"update_wallpaper","src":"https://...jpg"},
    {"type":"update_avatar","src":"https://...jpg"},
    {"type":"insert_section","id":"custom","title":"...","body":"..."},
    {"type":"add_product","name":"...","price":"...","description":"...","image":"https://..."},
    {"type":"insert_video","id":"music-video","title":"...","src":"https://...mp4","poster":"https://...jpg"},
    {"type":"insert_stream","id":"livestream","title":"...","url":"https://..."},
    {"type":"inject_css","css":".class { color: red; }"}
  ]
}
Only include supported actions. Keep values concise and suitable for production.
              `.trim(),
            },
            { role: "user", content: command },
          ],
          temperature: 0.2,
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`OpenAI error ${res.status}: ${raw}`);
      }
      const data = JSON.parse(raw);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`OpenAI response missing content: ${raw}`);
      }
      plan = extractJson(content);
    }

    if (mode === "plan") {
      return new Response(JSON.stringify({ mode, command, plan }), { headers: { "Content-Type": "application/json" } });
    }

    const actions = plan.actions || [];
    const applied = await applyActions(actions, command);
    return new Response(JSON.stringify({ mode, command, plan, ...applied }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
