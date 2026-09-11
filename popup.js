const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN",
  apiBaseUrl: "http://127.0.0.1:1234/v1",
  apiKey: "",
  model: "qwen2.5-1.5b-instruct"
};

const elements = {
  enabled: document.getElementById("enabled"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  saveButton: document.getElementById("saveButton"),
  refreshButton: document.getElementById("refreshButton"),
  translateButton: document.getElementById("translateButton"),
  restoreButton: document.getElementById("restoreButton"),
  status: document.getElementById("runtimeStatus")
};

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#cf222e" : "#57606a";
}

function isGitHubTab(tab) {
  return typeof tab?.url === "string" && tab.url.startsWith("https://github.com/");
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function canRetryByInjecting(error) {
  return (
    typeof error?.message === "string" &&
    (error.message.includes("Receiving end does not exist") ||
      error.message.includes("The message port closed before a response was received"))
  );
}

function injectContentScript(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function waitForContentScript(tabId, attempts = 5, delayMs = 250) {
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await sendMessageToTab(tabId, { action: "ping" });
      if (response?.ok) {
        return true;
      }
    } catch (error) {
      lastError = error;
    }

    if (index < attempts - 1) {
      await delay(delayMs);
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("content script 未响应。");
}

async function notifyContentScript(tab, action) {
  if (!tab?.id) {
    throw new Error("没有找到当前标签页。");
  }

  if (!isGitHubTab(tab)) {
    throw new Error("请先切换到 github.com 页面再使用这个扩展。");
  }

  try {
    return await sendMessageToTab(tab.id, { action });
  } catch (error) {
    if (canRetryByInjecting(error)) {
      try {
        await injectContentScript(tab.id);
        await waitForContentScript(tab.id);
        return await sendMessageToTab(tab.id, { action });
      } catch (retryError) {
        if (canRetryByInjecting(retryError)) {
          throw new Error("当前 GitHub 页面还没准备好，稍等一秒后再试一次。");
        }
        throw retryError;
      }
    }
    throw error;
  }
}

async function loadSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const settings = { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) };

  elements.enabled.checked = settings.enabled;
  elements.apiBaseUrl.value = settings.apiBaseUrl;
  elements.apiKey.value = settings.apiKey;
  elements.model.value = settings.model;
}

async function saveSettings() {
  const settings = {
    enabled: elements.enabled.checked,
    targetLanguage: "zh-CN",
    apiBaseUrl: elements.apiBaseUrl.value.trim(),
    apiKey: elements.apiKey.value.trim(),
    model: elements.model.value.trim()
  };

  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });

  const tab = await getCurrentTab();
  if (tab?.id && isGitHubTab(tab)) {
    try {
      await notifyContentScript(tab, "refreshSettings");
      setStatus("设置已保存，并已应用到当前 GitHub 页面。");
      return;
    } catch (error) {
      setStatus(`设置已保存。${error.message}`, true);
      return;
    }
  }
  setStatus("设置已保存。打开 GitHub 页面后会自动生效。");
}

async function refreshCurrentPage() {
  const tab = await getCurrentTab();
  await notifyContentScript(tab, "refreshSettings");
  setStatus("当前页已重新应用界面词典翻译。");
}

async function translateCurrentPage() {
  const tab = await getCurrentTab();
  setStatus("正在调用 AI 翻译当前页主要内容...");
  const response = await notifyContentScript(tab, "translatePage");
  if (!response?.ok) {
    setStatus(response?.error || "AI 翻译失败。", true);
    return;
  }
  setStatus(`AI 翻译完成，共处理 ${response.count} 个内容区块。`);
}

async function restoreCurrentPage() {
  const tab = await getCurrentTab();
  await notifyContentScript(tab, "restorePage");
  setStatus("页面已恢复。");
}

elements.saveButton.addEventListener("click", () => {
  saveSettings().catch((error) => setStatus(error.message, true));
});

elements.refreshButton.addEventListener("click", () => {
  refreshCurrentPage().catch((error) => setStatus(error.message, true));
});

elements.translateButton.addEventListener("click", () => {
  translateCurrentPage().catch((error) => setStatus(error.message, true));
});

elements.restoreButton.addEventListener("click", () => {
  restoreCurrentPage().catch((error) => setStatus(error.message, true));
});

loadSettings().catch((error) => setStatus(error.message, true));
setStatus("默认使用 LM Studio 本地接口；如果你改用别的本地或云端模型，也可以直接覆盖这些配置。");
