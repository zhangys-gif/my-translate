const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN"
};

function normalizeLookupText(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

const EXACT_TEXT_MAP = new Map(
  [
    ["Pull requests", "拉取请求"],
    ["Issues", "议题"],
    ["Marketplace", "市场"],
    ["Explore", "探索"],
    ["Codespaces", "云端开发"],
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
    ["New discussion", "新建讨论"],
    ["Create new file", "创建新文件"],
    ["Upload files", "上传文件"],
    ["Go to file", "转到文件"],
    ["Edit", "编辑"],
    ["Delete", "删除"],
    ["Preview", "预览"],
    ["Submit", "提交"],
    ["Cancel", "取消"],
    ["Reply", "回复"],
    ["Description", "描述"],
    ["Owner", "所有者"],
    ["Public", "公开"],
    ["Private", "私有"],
    ["Pinned repositories", "置顶仓库"],
    ["Activity", "动态"],
    ["People", "成员"],
    ["Branches", "分支"],
    ["Tags", "标签"],
    ["Releases", "发行版"],
    ["Raw", "原始文件"],
    ["Blame", "逐行追溯"],
    ["History", "历史记录"],
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
    ["Open issue", "未关闭议题"],
    ["Closed issue", "已关闭议题"],
    ["Open pull request", "未关闭拉取请求"],
    ["Merged pull request", "已合并拉取请求"],
    ["Closed pull request", "已关闭拉取请求"],
    ["Assignees", "负责人"],
    ["Labels", "标签"],
    ["Milestone", "里程碑"],
    ["Reviewers", "审查者"],
    ["Conversation", "讨论"],
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
    ["Deployments", "部署"],
    ["Environments", "环境"],
    ["Branches and tags", "分支和标签"],
    ["Manage topics", "管理主题"],
    ["View all branches", "查看所有分支"],
    ["View all tags", "查看所有标签"],
    ["Latest commit", "最新提交"],
    ["Updated", "最近更新"],
    ["Readme", "说明文档"],
    ["README", "说明文档"],
    ["All activity", "全部动态"],
    ["Notifications settings", "通知设置"],
    ["Create issue", "创建议题"],
    ["Create pull request", "创建拉取请求"],
    ["Create discussion", "创建讨论"],
    ["Create repository", "创建仓库"],
    ["Create project", "创建项目"],
    ["Code review", "代码审查"],
    ["Review changes", "审查变更"],
    ["Requested changes", "请求修改"],
    ["Approve", "批准"],
    ["Approved", "已批准"],
    ["Changes requested", "已请求修改"],
    ["Comment", "评论"],
    ["Comments", "评论"],
    ["Review", "审查"],
    ["Reviews", "审查"],
    ["Filter", "筛选"],
    ["Sort", "排序"],
    ["Author", "作者"],
    ["Closed", "已关闭"],
    ["Open", "未关闭"],
    ["Merged", "已合并"],
    ["Draft", "草稿"],
    ["Members", "成员"],
    ["No results", "无结果"],
    ["Loading", "加载中"],
    ["Copied!", "已复制"],
    ["Copy", "复制"],
    ["Permalink", "永久链接"],
    ["View", "查看"],
    ["Details", "详情"]
  ].map(([key, value]) => [normalizeLookupText(key), value])
);

const PHRASE_REPLACEMENTS = [
  [/\bNo description, website, or topics provided\./gi, "未提供描述、网站或主题。"],
  [/\bLearn more about labels\b/gi, "了解更多关于标签的信息"],
  [/\bLearn more about pull requests\b/gi, "了解更多关于拉取请求的信息"],
  [/\bLearn more about issues\b/gi, "了解更多关于议题的信息"],
  [/\bLearn more about code review\b/gi, "了解更多关于代码审查的信息"],
  [/\bThere was a problem loading this page\./gi, "加载此页面时出现问题。"],
  [/\bThis branch is up to date with\b/gi, "此分支与以下目标保持最新："],
  [/\bThis branch is out-of-date with\b/gi, "此分支已落后于："],
  [/\bWant to contribute\?/gi, "想要参与贡献吗？"],
  [/\bUse Git or checkout with SVN using the web URL\b/gi, "使用 Git，或通过网页 URL 使用 SVN 检出"],
  [/\bOpen an issue\b/gi, "创建议题"],
  [/\bOpen a pull request\b/gi, "创建拉取请求"],
  [/\bCreate new\b/gi, "新建"],
  [/\bView all\b/gi, "查看全部"],
  [/\bLatest\b/gi, "最新"],
  [/\bDefault branch\b/gi, "默认分支"],
  [/\bProtected branch\b/gi, "受保护分支"],
  [/\bCompare changes\b/gi, "比较变更"],
  [/\bNew discussion\b/gi, "新建讨论"],
  [/\bNew repository\b/gi, "新建仓库"],
  [/\bNew project\b/gi, "新建项目"],
  [/\bPull request\b/gi, "拉取请求"],
  [/\bPull requests\b/gi, "拉取请求"],
  [/\bIssue comments\b/gi, "议题评论"],
  [/\bReview comments\b/gi, "审查评论"],
  [/\bCode review\b/gi, "代码审查"],
  [/\bReview required\b/gi, "需要审查"],
  [/\bRequested reviewers\b/gi, "请求的审查者"],
  [/\bAssignees\b/gi, "负责人"],
  [/\bLabels\b/gi, "标签"],
  [/\bMilestone\b/gi, "里程碑"],
  [/\bProjects\b/gi, "项目"],
  [/\bReleases\b/gi, "发行版"],
  [/\bPackages\b/gi, "软件包"],
  [/\bContributors\b/gi, "贡献者"],
  [/\bLanguages\b/gi, "语言"],
  [/\bForks\b/gi, "派生"],
  [/\bStars\b/gi, "星标"],
  [/\bWatchers\b/gi, "关注者"],
  [/\bFollowers\b/gi, "关注者"],
  [/\bFollowing\b/gi, "正在关注"],
  [/\bDiscussions\b/gi, "讨论"],
  [/\bNotifications\b/gi, "通知"],
  [/\bConversation\b/gi, "讨论"],
  [/\bFiles changed\b/gi, "文件变更"],
  [/\bChanged files\b/gi, "已变更文件"],
  [/\bCommits\b/gi, "提交"],
  [/\bChecks\b/gi, "检查"],
  [/\bComments\b/gi, "评论"],
  [/\bComment\b/gi, "评论"],
  [/\bReviews\b/gi, "审查"],
  [/\bReview\b/gi, "审查"],
  [/\bApprove\b/gi, "批准"],
  [/\bApproved\b/gi, "已批准"],
  [/\bChanges requested\b/gi, "已请求修改"],
  [/\bRequested changes\b/gi, "请求修改"],
  [/\bSubmit review\b/gi, "提交审查"],
  [/\bAdd a comment\b/gi, "添加评论"],
  [/\bLeave a comment\b/gi, "发表评论"],
  [/\bWrite\b/gi, "编写"],
  [/\bPreview\b/gi, "预览"],
  [/\bClose issue\b/gi, "关闭议题"],
  [/\bReopen issue\b/gi, "重新打开议题"],
  [/\bClose pull request\b/gi, "关闭拉取请求"],
  [/\bReopen pull request\b/gi, "重新打开拉取请求"],
  [/\bMerge pull request\b/gi, "合并拉取请求"],
  [/\bSquash and merge\b/gi, "压缩后合并"],
  [/\bRebase and merge\b/gi, "变基后合并"],
  [/\bCreate a new branch\b/gi, "创建新分支"],
  [/\bGo to file\b/gi, "转到文件"],
  [/\bAdd file\b/gi, "添加文件"],
  [/\bUpload files\b/gi, "上传文件"],
  [/\bCreate new file\b/gi, "创建新文件"],
  [/\bLatest commit\b/gi, "最新提交"],
  [/\b(\d+)\s+commits?\b/gi, "$1 次提交"],
  [/\b(\d+)\s+branches\b/gi, "$1 个分支"],
  [/\b(\d+)\s+tags\b/gi, "$1 个标签"],
  [/\b(\d+)\s+releases\b/gi, "$1 个发行版"],
  [/\b(\d+)\s+contributors\b/gi, "$1 位贡献者"],
  [/\b(\d+)\s+issues?\b/gi, "$1 个议题"],
  [/\b(\d+)\s+pull requests?\b/gi, "$1 个拉取请求"],
  [/\b(\d+)\s+forks?\b/gi, "$1 次派生"],
  [/\b(\d+)\s+stars?\b/gi, "$1 个星标"],
  [/\b(\d+)\s+watchers?\b/gi, "$1 位关注者"],
  [/\b(\d+)\s+watching\b/gi, "$1 人关注"],
  [/\b(\d+)\s+open\b/gi, "$1 个未关闭"],
  [/\b(\d+)\s+closed\b/gi, "$1 个已关闭"],
  [/\b(\d+)\s+merged\b/gi, "$1 个已合并"]
];

const CONTEXTUAL_TEXT_MAPS = [
  {
    selectors: [".UnderlineNav", ".tabnav", '[role="tablist"]'],
    map: new Map(
      [
        ["Conversation", "讨论"],
        ["Commits", "提交"],
        ["Checks", "检查"],
        ["Files changed", "文件变更"],
        ["Open", "未关闭"],
        ["Closed", "已关闭"],
        ["Merged", "已合并"],
        ["Comments", "评论"],
        ["Review", "审查"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  },
  {
    selectors: [".file-navigation", ".file-header", ".js-blob-header", ".react-blob-header"],
    map: new Map(
      [
        ["Raw", "查看原始文件"],
        ["Blame", "逐行追溯"],
        ["History", "提交历史"],
        ["Edit", "编辑文件"],
        ["Delete", "删除文件"],
        ["Copy path", "复制路径"],
        ["Download raw file", "下载原始文件"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  },
  {
    selectors: ['button', '[role="button"]', 'summary', '.Button', '.btn'],
    map: new Map(
      [
        ["Open", "打开"],
        ["Close", "关闭"],
        ["Comment", "发表评论"],
        ["Review", "发起审查"],
        ["Approve", "批准合并"],
        ["Merge", "合并"],
        ["Details", "查看详情"],
        ["View", "查看"],
        ["Copy", "复制"],
        ["Reply", "回复"],
        ["Submit", "提交"],
        ["Preview", "预览"],
        ["Watch", "关注仓库"],
        ["Star", "添加星标"],
        ["Fork", "创建派生"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  },
  {
    selectors: [".js-issue-sidebar", ".discussion-sidebar", ".TimelineItem"],
    map: new Map(
      [
        ["Assignees", "负责人"],
        ["Labels", "标签"],
        ["Projects", "项目"],
        ["Milestone", "里程碑"],
        ["Reviewers", "审查者"],
        ["Participants", "参与者"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  },
  {
    selectors: [".Layout-sidebar", ".BorderGrid", ".BorderGrid-row"],
    map: new Map(
      [
        ["About", "仓库简介"],
        ["Releases", "发行版"],
        ["Packages", "软件包"],
        ["Languages", "开发语言"],
        ["Contributors", "贡献者"],
        ["Deployments", "部署记录"],
        ["Environments", "部署环境"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  }
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

function getElementContextMaps(referenceElement) {
  if (!referenceElement?.closest) {
    return [];
  }

  return CONTEXTUAL_TEXT_MAPS.filter(({ selectors }) =>
    selectors.some((selector) => referenceElement.closest(selector))
  ).map(({ map }) => map);
}

function translateTextByDictionary(text, referenceElement = null) {
  const original = text;
  const trimmed = text.trim();
  if (!trimmed) {
    return original;
  }

  const normalized = normalizeLookupText(trimmed);
  const contextMaps = getElementContextMaps(referenceElement);
  let translated = trimmed;

  for (const contextMap of contextMaps) {
    const contextualHit = contextMap.get(normalized);
    if (contextualHit) {
      translated = contextualHit;
      break;
    }
  }

  if (translated === trimmed) {
    translated = EXACT_TEXT_MAP.get(normalized) || trimmed;
  }

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
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
    const nextValue = translateTextByDictionary(node.nodeValue || "", node.parentElement);
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
      const translated = translateTextByDictionary(original, element);
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
  translatedTextNodes.clear();
  translatedAttributes.clear();
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
  if (message?.action === "restorePage") {
    restoreUiTranslation();
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
