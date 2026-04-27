// pages/api/chat.js
// 이 파일은 서버에서 실행되므로 API 키가 외부에 노출되지 않습니다.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." });
  }

  const { prompt, maxTokens = 1000 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "prompt가 필요합니다." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: JSON.stringify(data.error) });

    const text = (data.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
