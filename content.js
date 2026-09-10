const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN"
};

const EXACT_TEXT_MAP = new Map([
  ["Pull requests", "拉取请求"],
  ["Issues", "议题"],
  ["Marketplace", "市场"],
  ["Explore", "探索"],
  ["Codespaces", "云端开发环境"],
  ["Projects", "项目"],
  ["Wiki", "维基"],
  ["Security", "安全"],
  ["Insights", "洞察"],
  ["Actions", "操作"],
  ["Code", "代码"],
  ["Settings", "设置"],
  ["Discussions", "讨论"],
  ["Notifications", "通知"],
  ["New issue", "新建议题"],
  ["New pull request", "新建拉取请求"],
  ["Create new file", "创建新文件"],
  ["Upload files", "上传文件"],
  ["Go to file", "跳转到文件"],
  ["Raw", "原始内容"],
  ["Blame", "追溯"],
  ["History", "历史"],
  ["Releases", "版本发布"],
  ["Packages", "软件包"],
  ["Pinned", "置顶"],
  ["Overview", "概览"],
  ["Repositories", "仓库"],
  ["Stars", "星标"],
  ["Followers", "关注者"],
  ["Following", "正在关注"],
  ["Edit profile", "编辑资料"],
  ["Sign in", "登录"],
  ["Sign up", "注册"],
  ["Search or jump to...", "搜索或跳转到..."],
  ["Open issue", "打开的议题"],
  ["Closed issue", "已关闭的议题"],
  ["Open pull request", "打开的拉取请求"],
  ["Merged pull request", "已合并的拉取请求"],
  ["Closed pull request", "已关闭的拉取请求"],
  ["Assignees", "负责人"],
  ["Labels", "标签"],
  ["Milestone", "里程碑"],
  ["Reviewers", "审查者"],
  ["Conversation", "讨论串"],
  ["Commits", "提交"],
  ["Checks", "检查"],
  ["Files changed", "文件变更"],
  ["Add file", "添加文件"],
  ["Compare", "比较"],
  ["Fork", "派生"],
  ["Star", "星标"],
  ["Watch", "关注"],
  ["Unwatch", "取消关注"],
  ["Sponsor", "赞助"],
  ["Contributors", "贡献者"],
  ["Languages", "语言"],
  ["About", "关于"],
  ["Readme", "说明文档"],
  ["README", "说明文档"]
]);

const REGEX_REPLACEMENTS = [
  [/\b(\d+)\s+commits?\b/gi, "$1 次提交"],
  [/\b(\d+)\s+branches\b/gi, "$1 个分支"],
  [/\b(\d+)\s+tags\b/gi, "$1 个标签"],
  [/\b(\d+)\s+releases\b/gi, "$1 个版本发布"],
  [/\b(\d+)\s+contributors\b/gi, "$1 位贡献者"],
  [/\b(\d+)\s+issues?\b/gi, "$1 个议题"],
  [/\b(\d+)\s+pull requests?\b/gi, "$1 个拉取请求"],
  [/\b(\d+)\s+forks?\b/gi, "$1 次派生"],
  [/\b(\d+)\s+stars?\b/gi, "$1 个星标"],
  [/\b(\d+)\s+watching\b/gi, "$1 人关注"],
  [/Open/gi, "打开"],
  [/Closed/gi, "关闭"],
  [/Merged/gi, "已合并"],
  [/Comment/gi, "评论"],
  [/Review/gi, "审查"]
];

const translatedTextNodes = new Map();
const translatedAttributes = new Map();
let observer;
let currentSettings = { ...DEFAULT_SETTINGS };

function isGitHubPage() {
  return window.location.hostname === "github.com";
}

function shouldSkipNode(node) {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }
  if (
    parent.closest(
      "pre, code, textarea, input, select, option, script, style, .gh-translator-panel, .gh-translator-result"
    )
  ) {
    return true;
  }
  return false;
}

function translateTextByDictionary(text) {
  const original = text;
  const trimmed = text.trim();
  if (!trimmed) {
    return original;
  }

  let translated = EXACT_TEXT_MAP.get(trimmed) || trimmed;
  for (const [pattern, replacement] of REGEX_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }

  if (translated === trimmed) {
    return original;
  }

  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateNodeText(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pending = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (shouldSkipNode(node)) {
      continue;
    }
    const nextValue = translateTextByDictionary(node.nodeValue || "");
    if (nextValue !== node.nodeValue) {
      pending.push([node, node.nodeValue, nextValue]);
    }
  }

  for (const [node, original, nextValue] of pending) {
    if (!translatedTextNodes.has(node)) {
      translatedTextNodes.set(node, original);
    }
    node.nodeValue = nextValue;
  }
}

function translateAttributes(root = document.body) {
  const elements = root.querySelectorAll("[aria-label], [placeholder], [title]");
  for (const element of elements) {
    for (const attributeName of ["aria-label", "placeholder", "title"]) {
      const original = element.getAttribute(attributeName);
      if (!original) {
        continue;
      }
      const translated = translateTextByDictionary(original);
      if (translated === original) {
        continue;
      }

      let cached = translatedAttributes.get(element);
      if (!cached) {
        cached = {};
        translatedAttributes.set(element, cached);
      }
      if (!(attributeName in cached)) {
        cached[attributeName] = original;
      }
      element.setAttribute(attributeName, translated);
    }
  }
}

function applyUiTranslation(root = document.body) {
  if (!currentSettings.enabled || !isGitHubPage()) {
    return;
  }
  translateNodeText(root);
  if (root.querySelectorAll) {
    translateAttributes(root);
  }
}

function restoreUiTranslation() {
  for (const [node, original] of translatedTextNodes.entries()) {
    if (node.isConnected) {
      node.nodeValue = original;
    }
  }
  for (const [element, originalAttrs] of translatedAttributes.entries()) {
    if (!element.isConnected) {
      continue;
    }
    Object.entries(originalAttrs).forEach(([attributeName, value]) => {
      element.setAttribute(attributeName, value);
    });
  }

  document.querySelectorAll(".gh-translator-result").forEach((node) => node.remove());
}

function collectBlocks() {
  const selectors = [
    "article.markdown-body",
    ".markdown-body",
    ".comment-body",
    ".js-comment-body",
    "[data-testid='issue-body']",
    "[data-testid='issue-comment-body']",
    "[data-testid='pr-timeline-comment-body']",
    ".review-comment-contents"
  ];

  const blocks = [];
  const seen = new Set();
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((element) => {
      if (seen.has(element)) {
        return;
      }
      const text = element.innerText?.trim();
      if (!text || text.length < 20) {
        return;
      }
      seen.add(element);
      blocks.push(element);
    });
  }
  return blocks;
}

function injectTranslationResult(element, translatedText) {
  if (element.previousElementSibling?.classList.contains("gh-translator-result")) {
    element.previousElementSibling.remove();
  }

  const panel = document.createElement("div");
  panel.className = "gh-translator-result";
  panel.style.border = "1px solid #1f6feb";
  panel.style.borderRadius = "6px";
  panel.style.padding = "12px";
  panel.style.marginBottom = "12px";
  panel.style.background = "#ddf4ff";
  panel.style.whiteSpace = "pre-wrap";
  panel.style.fontSize = "14px";
  panel.style.lineHeight = "1.6";
  panel.innerText = `中文翻译\n\n${translatedText}`;
  element.parentNode?.insertBefore(panel, element);
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

async function translatePageContent() {
  const blocks = collectBlocks();
  if (!blocks.length) {
    return { ok: false, error: "当前页面没有找到适合翻译的正文区域。" };
  }

  for (const element of blocks) {
    const response = await sendRuntimeMessage({
      action: "translateText",
      text: element.innerText.trim()
    });
    if (!response?.ok) {
      return { ok: false, error: response?.error || "翻译失败。" };
    }
    injectTranslationResult(element, response.translatedText);
  }

  return { ok: true, count: blocks.length };
}

async function loadSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  currentSettings = { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) };
}

function startObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    if (!currentSettings.enabled) {
      return;
    }
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
          applyUiTranslation(node.parentElement);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyUiTranslation(node);
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "translatePage") {
    translatePageContent().then(sendResponse);
    return true;
  }

  if (message?.action === "restorePage") {
    restoreUiTranslation();
    if (currentSettings.enabled) {
      applyUiTranslation(document.body);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message?.action === "refreshSettings") {
    loadSettings()
      .then(() => {
        restoreUiTranslation();
        if (currentSettings.enabled) {
          applyUiTranslation(document.body);
        }
        sendResponse({ ok: true });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function init() {
  if (!isGitHubPage()) {
    return;
  }
  await loadSettings();
  if (currentSettings.enabled) {
    applyUiTranslation(document.body);
  }
  startObserver();
}

init();
