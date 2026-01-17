export async function onRequestPost(context) {
  const { request, env } = context;
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  const OPENAI_MODEL = env.OPENAI_MODEL || "gpt-4o-mini";
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const GITHUB_REPO = env.GITHUB_REPO;
  const GITHUB_BASE_BRANCH = env.GITHUB_BASE_BRANCH || "main";
  const ADMIN_ROLE = env.ADMIN_ROLE;

  const allowedFields = ["eyebrow", "headline", "subhead", "cta", "price", "metric1", "metric2", "metric3"];

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
    const [owner, repo] = GITHUB_REPO.split("/");
    return { owner, repo };
  };

  const getFileContent = async (path, ref) => {
    const { owner, repo } = getRepoParts();
    const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`);
    return atob(data.content);
  };

  try {
    const payload = await request.json();
    const mode = payload.mode || "plan";
    const command = payload.command || "";

    if (mode === "plan") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: "You are a site editor for a static site. Return JSON with 'actions' (type: update_copy, field, value)." },
            { role: "user", content: command }
          ]
        })
      });
      const data = await res.json();
      const plan = extractJson(data.choices[0].message.content);
      return new Response(JSON.stringify({ mode, command, plan }), { headers: { "Content-Type": "application/json" } });
    }

    // Cloudflare migration in progress - simple response for now
    return new Response(JSON.stringify({ status: "success", info: "Cloudflare function active" }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
