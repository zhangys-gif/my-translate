const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN",
  apiBaseUrl: "http://127.0.0.1:1234/v1",
  apiKey: "",
  model: "qwen2.5-1.5b-instruct"
};

const GITHUB_TERM_GUIDE = [
  "repository -> 仓库",
  "repositories -> 仓库",
  "issue -> 议题",
  "issues -> 议题",
  "pull request -> 拉取请求",
  "pull requests -> 拉取请求",
  "discussion -> 讨论",
  "discussions -> 讨论",
  "branch -> 分支",
  "branches -> 分支",
  "commit -> 提交",
  "commits -> 提交",
  "release -> 发行版",
  "releases -> 发行版",
  "tag -> 标签",
  "tags -> 标签",
  "fork -> 派生",
  "star -> 星标",
  "watch -> 关注",
  "contributor -> 贡献者",
  "review -> 审查",
  "workflow -> 工作流",
  "action -> 操作",
  "actions -> 操作",
  "code review -> 代码审查"
].join("\n");

const TRANSLATION_STYLE_GUIDE = [
  "优先保证语义自然、通顺，允许意译，不要生硬逐词直译。",
  "语气保持像中文技术文档或 GitHub 中文说明，而不是机器翻译。",
  "标题尽量短，列表项尽量直接，说明句尽量符合中文阅读习惯。",
  "代码、命令、文件路径、配置键名、链接、变量名、类名、函数名不要翻译。",
  "项目名、品牌名、协议名、库名通常保留英文。",
  "遇到 README、Issue、PR 说明时，优先让中文读起来顺，再考虑逐词对应。",
  "如果原文是有序列表、无序列表、标题或代码块，译文必须保留相同的 Markdown 结构。",
  "尤其不要把 `1. 2. 3.` 这样的编号列表翻译成普通段落。"
].join("\n");

const SEMANTIC_PHRASE_GUIDE = [
  "dig deeper -> 深入研究 / 继续深入分析（不要直译成“深入挖掘”）",
  "bury the answer -> 把答案埋在冗长表述里",
  "lead with the next action -> 先给出下一步行动",
  "make wins visible -> 让进展清晰可见",
  "suppress tangents -> 减少跑题内容",
  "matter-of-fact errors -> 直接指出错误",
  "cap lists to 5 items -> 将列表控制在 5 项以内",
  "restate state every turn -> 每轮重申当前状态",
  "specific time estimates -> 给出明确的时间预估",
  "no preamble / no recap / no closers -> 不写开场套话 / 不写总结回顾 / 不写收尾客套话"
].join("\n");

function buildPrimaryMessages(text) {
  return [
    {
      role: "system",
      content:
        [
          "你是 GitHub 页面翻译助手。",
          "你的任务是把英文翻译成自然、准确的简体中文。",
          "你可以意译，但不能漏信息，也不要添加原文没有的内容。",
          "必须只输出中文译文，不要解释，不要复述原文。",
          "保留 Markdown 结构、标题层级、列表、表格、链接、代码块、行内代码、命令、变量名、项目名和专有名词。",
          "如果原文中有编号列表，译文必须保留相同编号，不得改写成普通段落。",
          "请遵守以下术语：",
          GITHUB_TERM_GUIDE,
          "请参考以下常见意译示例：",
          SEMANTIC_PHRASE_GUIDE,
          "请遵守以下中文风格：",
          TRANSLATION_STYLE_GUIDE
        ].join("\n\n")
    },
    {
      role: "user",
      content: `请把下面这段 GitHub 内容翻译成简体中文，只输出译文：\n\n${text}`
    }
  ];
}

function buildRetryMessages(text) {
  return [
    {
      role: "system",
      content:
        [
          "你是中英翻译器，不是摘要器，也不是解释器。",
          "把输入英文直接翻译成简体中文。",
          "必须使用自然、通顺的中文，不要生硬直译。",
          "允许意译，但不得漏译。",
          "不要保留原文段落。",
          "保留 Markdown、链接、代码块、命令、专有名词和 GitHub 术语。",
          "如果原文有 `1. 2. 3.` 这样的有序列表，译文必须保留编号。",
          "术语优先使用以下译法：",
          GITHUB_TERM_GUIDE,
          "以下表达请优先意译：",
          SEMANTIC_PHRASE_GUIDE
        ].join("\n\n")
    },
    {
      role: "user",
      content:
        `把下面英文翻译成自然的简体中文技术文档风格。\n` +
        `如果输出仍然大部分是英文，或中文读起来明显不通顺，就视为失败。\n\n${text}`
    }
  ];
}

async function getSettings() {
  const { [STORAGE_KEY]: storedSettings } = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS, ...(storedSettings || {}) };
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

async function translateWithAi(text, settings) {
  const endpoint = buildChatEndpoint(settings.apiBaseUrl);
  if (!endpoint || !settings.model) {
    throw new Error("请先在扩展弹窗中填写 API Base URL 和 Model。");
  }

  const headers = {
    "Content-Type": "application/json"
  };
  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  async function requestTranslation(messages) {
    return fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.1,
        messages
      })
    });
  }

  let response;
  try {
    response = await requestTranslation(buildPrimaryMessages(text));
  } catch (error) {
    if (endpoint.includes("127.0.0.1:1234") || endpoint.includes("localhost:1234")) {
      throw new Error(
        "连接不到 LM Studio 本地接口。请确认 LM Studio 已启动本地服务器，并且 http://127.0.0.1:1234 可访问。"
      );
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`翻译接口调用失败：${response.status} ${errorText}`);
  }

  const data = await response.json();
  let translatedText = data?.choices?.[0]?.message?.content?.trim();
  if (!translatedText) {
    throw new Error("翻译接口没有返回可用内容。");
  }

  const normalizedInput = text.replace(/\s+/g, " ").trim();
  const normalizedOutput = translatedText.replace(/\s+/g, " ").trim();
  const looksUntranslated =
    normalizedOutput === normalizedInput ||
    (normalizedOutput.length > 0 &&
      normalizedInput.length > 0 &&
      normalizedOutput.includes(normalizedInput.slice(0, Math.min(120, normalizedInput.length))));

  const awkwardLiteralSigns = [
    "我会",
    "great question",
    "let me think",
    "hope this helps"
  ];
  const looksAwkward = awkwardLiteralSigns.some((phrase) =>
    translatedText.toLowerCase().includes(phrase.toLowerCase())
  );

  if (looksUntranslated || looksAwkward) {
    const retryResponse = await requestTranslation(buildRetryMessages(text));

    if (!retryResponse.ok) {
      const retryErrorText = await retryResponse.text();
      throw new Error(`翻译接口二次调用失败：${retryResponse.status} ${retryErrorText}`);
    }

    const retryData = await retryResponse.json();
    const retriedText = retryData?.choices?.[0]?.message?.content?.trim();
    if (retriedText) {
      translatedText = retriedText;
    }
  }

  return translatedText;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "translateText") {
    getSettings()
      .then((settings) => translateWithAi(message.text, settings))
      .then((translatedText) => sendResponse({ ok: true, translatedText }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
