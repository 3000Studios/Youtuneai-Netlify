import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple script to verify OpenAI API Key validity
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY is not set in the environment.");
  console.log("👉 Usage: $env:OPENAI_API_KEY='sk-...' ; node scripts/test-openai-connection.js");
  process.exit(1);
}

console.log(`🔑 Key found: ${OPENAI_API_KEY.slice(0, 3)}...${OPENAI_API_KEY.slice(-4)}`);
console.log("📡 Testing connection to OpenAI...");

try {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error (${response.status}): ${errorText}`);
    process.exit(1);
  }

  const data = await response.json();
  console.log("✅ API Connection Successful!");
  console.log(`📚 Available models: ${data.data.length} found.`);
  // Check if gpt-4o-mini is available
  const hasModel = data.data.some(m => m.id === "gpt-4o-mini");
  console.log(`🤖 Model 'gpt-4o-mini' available: ${hasModel ? "YES" : "NO"}`);

} catch (error) {
  console.error("❌ Connection failed:", error.message);
  process.exit(1);
}
