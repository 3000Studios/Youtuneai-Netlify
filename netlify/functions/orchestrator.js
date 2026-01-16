const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const ADMIN_ROLE = process.env.ADMIN_ROLE;

const allowedFields = [
  "eyebrow",
  "headline",
  "subhead",
  "cta",
  "price",
  "metric1",
  "metric2",
  "metric3",
];

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const requireUser = (context) => {
  const user = context?.clientContext?.user;
  if (!user) {
    return null;
  }
  if (ADMIN_ROLE) {
    const roles = user?.app_metadata?.roles || [];
    if (!roles.includes(ADMIN_ROLE)) {
      return null;
    }
  }
  return user;
};

const toSafeJsString = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const extractJson = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match) {
    return JSON.parse(match[1]);
  }
  throw new Error("Failed to parse JSON response.");
};

const callOpenAI = async (command) => {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const systemPrompt = `
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
    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."}
  ]
}
Only include supported actions. Keep values concise and suitable for production.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: command },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error: ${detail}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return extractJson(content);
};

const githubRequest = async (path, options = {}) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO.");
  }
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub error: ${text}`);
  }
  return response.json();
};

const getRepoParts = () => {
  const [owner, repo] = (GITHUB_REPO || "").split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must be in the form owner/repo.");
  }
  return { owner, repo };
};

const getFileContent = async (path, ref) => {
  const { owner, repo } = getRepoParts();
  const data = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`
  );
  const content = Buffer.from(data.content, data.encoding).toString("utf-8");
  return content;
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

const createCommit = async (updates, message) => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const baseCommitSha = baseRef.object.sha;
  const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const branchName = `voice/${Date.now()}`;
  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseCommitSha,
    }),
  });

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

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { branchName, commitSha: newCommit.sha };
};

const createPullRequest = async (branchName, title, body) => {
  const { owner, repo } = getRepoParts();
  const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      head: branchName,
      base: GITHUB_BASE_BRANCH,
      body,
    }),
  });
  return pr;
};

const applyActions = async (actions, command) => {
  const updates = {};
  let indexHtml = null;
  let appJs = null;
  let styles = null;

  const needsIndex = actions.some((action) =>
    ["update_meta", "add_page", "insert_monetization"].includes(action.type)
  );
  const needsApp = actions.some((action) =>
    ["update_copy", "update_theme"].includes(action.type)
  );
  const needsStyles = actions.some((action) => action.type === "insert_monetization");

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
  }

  if (indexHtml) updates["index.html"] = indexHtml;
  if (appJs) updates["app.js"] = appJs;
  if (styles) updates["styles.css"] = styles;
  newPages.forEach((page) => {
    updates[page.path] = page.content;
  });

  const message = `Voice update: ${command.slice(0, 60)}`;
  const { branchName } = await createCommit(updates, message);
  const pr = await createPullRequest(
    branchName,
    "Voice update",
    `Command: ${command}\n\nActions:\n${actions.map((a) => `- ${a.type}`).join("\n")}`
  );

  return { prUrl: pr.html_url, branchName };
};

const createRollbackPR = async () => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const headSha = baseRef.object.sha;
  const headCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headSha}`);
  const parentSha = headCommit.parents?.[0]?.sha;
  if (!parentSha) {
    throw new Error("No parent commit available for rollback.");
  }
  const parentCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${parentSha}`);
  const branchName = `rollback/${Date.now()}`;

  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: headSha,
    }),
  });

  const rollbackCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "Rollback last commit",
      tree: parentCommit.tree.sha,
      parents: [headSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: rollbackCommit.sha }),
  });

  const pr = await createPullRequest(
    branchName,
    "Rollback last commit",
    "Reverts the latest commit on main."
  );
  return { prUrl: pr.html_url, branchName };
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const user = requireUser(context);
  if (!user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const mode = payload.mode || "plan";

    if (mode === "rollback") {
      const rollback = await createRollbackPR();
      return jsonResponse(200, { mode, ...rollback });
    }

    const command = payload.command || "";
    if (!command && mode !== "rollback") {
      return jsonResponse(400, { error: "Missing command." });
    }

    let plan = payload.plan;
    if (!plan) {
      plan = await callOpenAI(command);
    }

    if (mode === "plan") {
      return jsonResponse(200, { mode, command, plan });
    }

    const actions = plan.actions || [];
    const applied = await applyActions(actions, command);
    return jsonResponse(200, { mode, command, plan, ...applied });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
};
