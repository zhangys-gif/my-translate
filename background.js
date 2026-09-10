const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN",
  apiBaseUrl: "",
  apiKey: "",
  model: ""
};

async function getSettings() {
  const { ghTranslatorSettings } = await chrome.storage.sync.get("ghTranslatorSettings");
  return { ...DEFAULT_SETTINGS, ...(ghTranslatorSettings || {}) };
}

function buildChatEndpoint(baseUrl) {
  const normalized = (baseUrl || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }
  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }
  if (normalized.endsWith("/v1")) {
    return `${normalized}/chat/completions`;
  }
  return `${normalized}/v1/chat/completions`;
}

async function translateWithLlm(text, settings) {
  const endpoint = buildChatEndpoint(settings.apiBaseUrl);
  if (!endpoint || !settings.apiKey || !settings.model) {
    throw new Error("请先在扩展弹窗中填写 API Base URL、API Key 和 Model。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是一个 GitHub 页面翻译助手。请把用户提供的英文内容翻译成简体中文，保留 Markdown 结构、链接、代码块、行内代码、专有名词和变量名。只输出翻译结果，不要添加解释。"
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`翻译接口调用失败：${response.status} ${errorText}`);
  }

  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) {
    throw new Error("翻译接口没有返回可用内容。");
  }
  return translated;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "translateText") {
    getSettings()
      .then((settings) => translateWithLlm(message.text, settings))
      .then((translatedText) => sendResponse({ ok: true, translatedText }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.action === "getSettings") {
    getSettings()
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
