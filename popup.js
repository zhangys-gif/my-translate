const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN",
  apiBaseUrl: "",
  apiKey: "",
  model: ""
};

const elements = {
  enabled: document.getElementById("enabled"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  saveButton: document.getElementById("saveButton"),
  translateButton: document.getElementById("translateButton"),
  restoreButton: document.getElementById("restoreButton"),
  status: document.getElementById("status")
};

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#cf222e" : "#57606a";
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
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
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: "refreshSettings" });
  }
  setStatus("设置已保存。");
}

async function translateCurrentPage() {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    setStatus("没有找到当前标签页。", true);
    return;
  }
  setStatus("正在翻译正文，请稍等...");
  const response = await chrome.tabs.sendMessage(tab.id, { action: "translatePage" });
  if (!response?.ok) {
    setStatus(response?.error || "翻译失败。", true);
    return;
  }
  setStatus(`翻译完成，共处理 ${response.count} 个正文区域。`);
}

async function restoreCurrentPage() {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    setStatus("没有找到当前标签页。", true);
    return;
  }
  await chrome.tabs.sendMessage(tab.id, { action: "restorePage" });
  setStatus("页面已恢复。");
}

elements.saveButton.addEventListener("click", () => {
  saveSettings().catch((error) => setStatus(error.message, true));
});

elements.translateButton.addEventListener("click", () => {
  translateCurrentPage().catch((error) => setStatus(error.message, true));
});

elements.restoreButton.addEventListener("click", () => {
  restoreCurrentPage().catch((error) => setStatus(error.message, true));
});

loadSettings().catch((error) => setStatus(error.message, true));
