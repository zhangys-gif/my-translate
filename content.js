if (!globalThis.__ghTranslatorContentScriptLoaded) {
  globalThis.__ghTranslatorContentScriptLoaded = true;
  document.documentElement.dataset.ghTranslatorLoaded = "true";

const STORAGE_KEY = "ghTranslatorSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "zh-CN",
  apiBaseUrl: "http://127.0.0.1:1234/v1",
  apiKey: "",
  model: "qwen2.5-1.5b-instruct"
};

function normalizeLookupText(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function hasMixedChineseAndEnglish(text) {
  return /[\u4e00-\u9fff]/.test(text) && /[A-Za-z]/.test(text);
}

function canUseUiAiFallback(text, referenceElement = null) {
  const trimmed = text.trim();
  if (!shouldUseDictionaryForText(trimmed, referenceElement)) {
    return false;
  }
  if (!/[A-Za-z]{2,}/.test(trimmed)) {
    return false;
  }
  if (hasMixedChineseAndEnglish(trimmed)) {
    return false;
  }
  if (/https?:\/\//i.test(trimmed) || /@[\w-]+/.test(trimmed) || /\S+@\S+\.\S+/.test(trimmed)) {
    return false;
  }
  return true;
}

const EXACT_TEXT_MAP = new Map(
  [
    ["Pull requests", "拉取请求"],
    ["All pull requests", "全部拉取请求"],
    ["Pull request", "拉取请求"],
    ["Issues", "议题"],
    ["All issues", "全部议题"],
    ["Issue", "议题"],
    ["is:", "类型:"],
    ["state:", "状态:"],
    ["archived:", "已归档:"],
    ["assignee:", "负责人:"],
    ["sort:", "排序:"],
    ["issue", "议题"],
    ["open", "未关闭"],
    ["false", "否"],
    ["true", "是"],
    ["@me", "@我"],
    ["updated-desc", "最近更新优先"],
    ["updated-asc", "最早更新优先"],
    ["is:issue", "类型:议题"],
    ["state:open", "状态:未关闭"],
    ["archived:false", "已归档:否"],
    ["archived:true", "已归档:是"],
    ["assignee:@me", "负责人:@我"],
    ["sort:updated-desc", "排序:最近更新优先"],
    ["sort:updated-asc", "排序:最早更新优先"],
    ["Assigned to me", "分配给我的"],
    ["Created by me", "我创建的"],
    ["Mentioning me", "提及我的"],
    ["Recently updated", "最近更新"],
    ["Marketplace", "市场"],
    ["Explore", "探索"],
    ["Codespaces", "云端开发"],
    ["Projects", "项目"],
    ["Agents", "智能体"],
    ["Wiki", "维基"],
    ["Security", "安全"],
    ["Security and quality", "安全与质量"],
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
    ["Security policy", "安全策略"],
    ["Security advisories", "安全通告"],
    ["Dependabot alerts", "Dependabot 警报"],
    ["Code scanning alerts", "代码扫描警报"],
    ["Secret scanning alerts", "敏感信息扫描警报"],
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
    ["No", "无"],
    ["Members", "成员"],
    ["No results", "无结果"],
    ["None", "无"],
    ["Loading", "加载中"],
    ["Copied!", "已复制"],
    ["Copy", "复制"],
    ["Permalink", "永久链接"],
    ["View", "查看"],
    ["Details", "详情"],
    ["Dashboard", "仪表盘"],
    ["Home", "首页"],
    ["Saved", "已保存"],
    ["Trending", "趋势"],
    ["Topics", "主题"],
    ["Collections", "精选集"],
    ["Events", "事件"],
    ["Sponsors", "赞助"],
    ["Your profile", "你的资料"],
    ["Your repositories", "你的仓库"],
    ["Your projects", "你的项目"],
    ["Your stars", "你的星标"],
    ["Feature preview", "功能预览"],
    ["Help", "帮助"],
    ["Sign out", "退出登录"],
    ["Appearance settings", "外观设置"],
    ["Enterprise", "企业版"],
    ["Team", "团队版"],
    ["Pricing", "价格"],
    ["Search", "搜索"],
    ["Create", "新建"],
    ["New", "新建"],
    ["Clone", "克隆"],
    ["Download ZIP", "下载 ZIP"],
    ["Use template", "使用模板"],
    ["This repository", "此仓库"],
    ["Branch", "分支"],
    ["Tag", "标签"],
    ["Release", "发行版"],
    ["Pages", "页面"],
    ["General", "常规"],
    ["Access", "访问权限"],
    ["Collaborators", "协作者"],
    ["Collaborators and teams", "协作者与团队"],
    ["Manage access", "管理访问权限"],
    ["Code and automation", "代码与自动化"],
    ["Webhooks", "Webhooks"],
    ["Deploy keys", "部署密钥"],
    ["Rules", "规则"],
    ["Rulesets", "规则集"],
    ["Branch protection rules", "分支保护规则"],
    ["Custom properties", "自定义属性"],
    ["Secrets", "机密"],
    ["Variables", "变量"],
    ["Secrets and variables", "机密与变量"],
    ["Code security and analysis", "代码安全与分析"],
    ["Dependency graph", "依赖关系图"],
    ["Code scanning", "代码扫描"],
    ["Secret scanning", "敏感信息扫描"],
    ["Alerts", "警报"],
    ["Policies", "策略"],
    ["Archived", "已归档"],
    ["Archive", "归档"],
    ["Unarchive", "取消归档"],
    ["Danger Zone", "危险区域"],
    ["Community standards", "社区规范"],
    ["License", "许可证"],
    ["Saved replies", "已保存回复"],
    ["Templates", "模板"],
    ["Watching", "正在关注"],
    ["Participating and @mentions", "参与和 @提及"],
    ["Custom", "自定义"],
    ["Ignore", "忽略"],
    ["Subscribe", "订阅"],
    ["Unsubscribe", "取消订阅"],
    ["Mute", "静音"],
    ["Unmute", "取消静音"],
    ["Mark as read", "标记为已读"],
    ["Done", "完成"],
    ["Save", "保存"],
    ["Choose a branch", "选择分支"],
    ["Switch branches/tags", "切换分支/标签"],
    ["Find file", "查找文件"],
    ["View file", "查看文件"],
    ["Copy path", "复制路径"],
    ["Download raw file", "下载原始文件"],
    ["Commit changes", "提交更改"],
    ["Commit message", "提交说明"],
    ["Propose changes", "提交更改建议"],
    ["Create branch", "创建分支"],
    ["Create branch and open a pull request", "创建分支并发起拉取请求"],
    ["Compare & pull request", "比较并发起拉取请求"],
    ["Create draft pull request", "创建草稿拉取请求"],
    ["Base repository", "基准仓库"],
    ["Base branch", "基准分支"],
    ["Compare branch", "对比分支"],
    ["Development", "开发进展"],
    ["Participants", "参与者"],
    ["Linked issues", "关联议题"],
    ["Linked pull requests", "关联拉取请求"],
    ["Status", "状态"],
    ["Ready for review", "准备接受审查"],
    ["Convert to draft", "转为草稿"],
    ["Mark as ready for review", "标记为可审查"],
    ["Auto-merge", "自动合并"],
    ["Enable auto-merge", "启用自动合并"],
    ["Disable auto-merge", "禁用自动合并"],
    ["Resolve conflicts", "解决冲突"],
    ["Start a review", "开始审查"],
    ["Add your review", "添加审查"],
    ["Finish your review", "完成审查"],
    ["Viewed", "已查看"],
    ["Outdated", "已过时"],
    ["Resolved", "已解决"],
    ["Hide resolved", "隐藏已解决"],
    ["Show resolved", "显示已解决"],
    ["Workflows", "工作流"],
    ["Artifacts", "构建产物"],
    ["Runs", "运行记录"],
    ["Top repositories", "常用仓库"],
    ["Ask", "提问"],
    ["All repositories", "所有仓库"],
    ["Debug", "调试"],
    ["Agent", "智能体"],
    ["Write code", "编写代码"],
    ["Feed", "动态流"],
    ["Trending repositories", "热门仓库"],
    ["See more", "查看更多"],
    ["Auto", "自动"],
    ["Download for Windows", "下载 Windows 版"],
    ["MCP registry", "MCP 注册表"],
    ["Views", "视图"],
    ["No saved views", "暂无已保存视图"],
    ["searching and filtering issues and", "搜索和筛选议题与"],
    ["pull requests.", "拉取请求。"],
    ["pull requests", "拉取请求"]
  ].map(([key, value]) => [normalizeLookupText(key), value])
);

const PHRASE_REPLACEMENTS = [
  [/\bNo description, website, or topics provided\./gi, "未提供描述、网站或主题。"],
  [/\bNo description provided\./gi, "未提供描述。"],
  [/\bNo security policy detected\b/gi, "未检测到安全策略"],
  [/\bSecurity policy not enabled\b/gi, "未启用安全策略"],
  [/\bNo releases published\b/gi, "暂无发行版"],
  [/\bNo packages published\b/gi, "暂无软件包"],
  [/\bNo projects\b/gi, "暂无项目"],
  [/\bNo milestone\b/gi, "无里程碑"],
  [/\bNo assignees\b/gi, "无负责人"],
  [/\bNo reviewers\b/gi, "无审查者"],
  [/\bNo labels\b/gi, "无标签"],
  [/\bNo branches\b/gi, "无分支"],
  [/\bNo tags\b/gi, "无标签"],
  [/\bNo commits yet\b/gi, "暂无提交记录"],
  [/\bNo results matched your search\b\.?/gi, "没有匹配你搜索条件的结果"],
  [/\bNo results found\b/gi, "未找到结果"],
  [/\bTry a different search query\b\.?/gi, "试试其他搜索条件"],
  [/\bLearn more about searching and filtering issues and pull requests\b\.?/gi, "了解更多关于搜索和筛选议题与拉取请求的信息"],
  [/\bLearn more about\b/gi, "了解更多关于"],
  [/\bsearching and filtering issues and pull requests\b/gi, "搜索和筛选议题与拉取请求"],
  [/\bAsk anything or type @ to add context\b/gi, "可直接提问，或输入 @ 添加上下文"],
  [/\bNo one assigned\b/gi, "无人负责"],
  [/\bNo workflows\b/gi, "暂无工作流"],
  [/\bNo workflow runs yet\b/gi, "暂无工作流运行记录"],
  [/\bNo deployments\b/gi, "暂无部署记录"],
  [/\bNo environments\b/gi, "暂无环境"],
  [/\bNo discussions yet\b/gi, "暂无讨论"],
  [/\bNo packages yet\b/gi, "暂无软件包"],
  [/\bNo projects yet\b/gi, "暂无项目"],
  [/\bNo branches matched\b/gi, "没有匹配的分支"],
  [/\bNo tags matched\b/gi, "没有匹配的标签"],
  [/\bThere aren'?t any open issues\./gi, "暂无未关闭议题。"],
  [/\bThere aren'?t any closed issues\./gi, "暂无已关闭议题。"],
  [/\bThere aren'?t any open pull requests\./gi, "暂无未关闭拉取请求。"],
  [/\bThere aren'?t any closed pull requests\./gi, "暂无已关闭拉取请求。"],
  [/\bThere aren'?t any merged pull requests\./gi, "暂无已合并拉取请求。"],
  [/\bThere aren'?t any discussions yet\./gi, "暂无讨论。"],
  [/\bThere aren'?t any projects yet\./gi, "暂无项目。"],
  [/\bThere aren'?t any releases here\b/gi, "这里还没有发行版"],
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
  [/\bFind or create a branch\.\.\.\b/gi, "查找或创建分支..."],
  [/\bFind or create a tag\.\.\.\b/gi, "查找或创建标签..."],
  [/\bFilter branches \/ tags\b/gi, "筛选分支 / 标签"],
  [/\bChoose a branch\b/gi, "选择分支"],
  [/\bSwitch branches\/tags\b/gi, "切换分支/标签"],
  [/\bFind a file\b/gi, "查找文件"],
  [/\bCommit changes\b/gi, "提交更改"],
  [/\bPropose changes\b/gi, "提交更改建议"],
  [/\bCreate branch\b/gi, "创建分支"],
  [/\bBase repository\b/gi, "基准仓库"],
  [/\bBase branch\b/gi, "基准分支"],
  [/\bCompare branch\b/gi, "对比分支"],
  [/\bReady for review\b/gi, "准备接受审查"],
  [/\bConvert to draft\b/gi, "转为草稿"],
  [/\bMark as ready for review\b/gi, "标记为可审查"],
  [/\bResolve conflicts\b/gi, "解决冲突"],
  [/\bStart a review\b/gi, "开始审查"],
  [/\bAdd your review\b/gi, "添加审查"],
  [/\bFinish your review\b/gi, "完成审查"],
  [/\bEnable auto-merge\b/gi, "启用自动合并"],
  [/\bDisable auto-merge\b/gi, "禁用自动合并"],
  [/\bOpen in desktop\b/gi, "在桌面端打开"],
  [/\bDownload ZIP\b/gi, "下载 ZIP"],
  [/\bUse this template\b/gi, "使用此模板"],
  [/\bGo to parent directory\b/gi, "转到上级目录"],
  [/\bThis repository is archived\b/gi, "此仓库已归档"],
  [/\bThis repository was archived by the owner\b/gi, "此仓库已被所有者归档"],
  [/\bPublic repository\b/gi, "公开仓库"],
  [/\bPrivate repository\b/gi, "私有仓库"],
  [/\bGo to file\b/gi, "转到文件"],
  [/\bAdd file\b/gi, "添加文件"],
  [/\bUpload files\b/gi, "上传文件"],
  [/\bCreate new file\b/gi, "创建新文件"],
  [/\bLatest commit\b/gi, "最新提交"],
  [/\bUpdated (\d+) days ago\b/gi, "$1 天前更新"],
  [/\bUpdated (\d+) hours ago\b/gi, "$1 小时前更新"],
  [/\bUpdated (\d+) minutes ago\b/gi, "$1 分钟前更新"],
  [/\b(\d+)\s+repositories\b/gi, "$1 个仓库"],
  [/\b(\d+)\s+projects\b/gi, "$1 个项目"],
  [/\b(\d+)\s+packages\b/gi, "$1 个软件包"],
  [/\b(\d+)\s+participants\b/gi, "$1 位参与者"],
  [/\b(\d+)\s+comments\b/gi, "$1 条评论"],
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
  [/\b(\d+)\s+merged\b/gi, "$1 个已合并"],
  [/\bLoad more\.\.\.\b/gi, "加载更多..."]
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
        ["Participants", "参与者"],
        ["Agents", "智能体"],
        ["Security", "安全"]
      ].map(([key, value]) => [normalizeLookupText(key), value])
    )
  },
  {
    selectors: [".Layout-sidebar", ".BorderGrid", ".BorderGrid-row"],
    map: new Map(
      [
        ["About", "仓库简介"],
        ["Agents", "智能体"],
        ["Security", "安全"],
        ["Security and quality", "安全与质量"],
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

const MODULE_HELP_DEFINITIONS = [
  { aliases: ["Code", "代码"], description: "查看仓库文件、目录结构和源码内容。" },
  { aliases: ["Issues", "议题"], description: "提交、跟踪和讨论 Bug、需求与任务。" },
  { aliases: ["Pull requests", "拉取请求"], description: "对代码改动发起合并申请并进行审查。" },
  { aliases: ["Discussions", "讨论"], description: "围绕想法、提问和社区交流进行讨论。" },
  { aliases: ["Actions", "操作"], description: "配置和查看自动化构建、测试与部署流程。" },
  { aliases: ["Projects", "项目"], description: "用看板或列表管理任务进度和协作流程。" },
  { aliases: ["Wiki", "维基"], description: "存放项目说明、文档和长期维护资料。" },
  { aliases: ["Security", "安全"], description: "查看安全策略、漏洞提醒和安全相关配置。" },
  {
    aliases: ["Security and quality", "安全与质量"],
    description: "集中展示安全扫描、依赖风险和代码质量相关信息。"
  },
  { aliases: ["Insights", "洞察"], description: "查看仓库活跃度、贡献情况和统计信息。" },
  { aliases: ["Settings", "设置"], description: "管理仓库权限、分支规则、页面和集成配置。" },
  { aliases: ["Agents", "智能体"], description: "查看或使用仓库中可用的自动化智能助手能力。" }
];

const MODULE_HELP_MAP = new Map(
  MODULE_HELP_DEFINITIONS.flatMap(({ aliases, description }) =>
    aliases.map((alias) => [normalizeLookupText(alias), description])
  )
);

const MODULE_HELP_ALIASES = Array.from(MODULE_HELP_MAP.keys()).sort((a, b) => b.length - a.length);
const MODULE_HELP_SELECTORS = [
  ".UnderlineNav-item",
  ".js-selected-navigation-item.UnderlineNav-item",
  "nav[aria-label*='Repository'] a",
  "nav[aria-label*='repository'] a"
].join(", ");

const MODULE_HELP_STYLE_ID = "gh-translator-help-style";
const MODULE_HELP_POPOVER_ID = "gh-translator-help-popover";
const TRANSLATION_RESULT_STYLE_ID = "gh-translator-result-style";
const FLOATING_PANEL_STYLE_ID = "gh-translator-panel-style";
const FLOATING_PANEL_ID = "gh-translator-floating-panel";
const FLOATING_PANEL_POSITION_KEY = "ghTranslatorPanelPosition";
const UI_AI_CACHE_STORAGE_KEY = "ghTranslatorUiAiCache";
const UI_AI_CACHE_MISS = "__MISS__";
const MAX_UI_TEXT_LENGTH = 80;
const MAX_UI_LINE_BREAKS = 1;
const LONG_TEXT_CONTAINER_SELECTORS = [
  "article.markdown-body",
  ".markdown-body",
  ".comment-body",
  ".js-comment-body",
  ".review-comment-contents",
  "[data-testid='issue-body']",
  "[data-testid='issue-comment-body']",
  "[data-testid='pr-timeline-comment-body']",
  ".repository-content .Box-body"
].join(", ");
const USER_CONTENT_EXCLUDE_SELECTORS = [
  "[itemprop='about']",
  ".f4.my-3",
  ".js-issue-title",
  "[data-testid='issue-title']",
  ".commit-title",
  ".commit-desc",
  ".js-pinned-item-desc",
  ".pinned-item-desc"
].join(", ");
const UI_TRANSLATION_CONTAINER_SELECTORS = [
  "header",
  ".Header",
  ".AppHeader",
  ".UnderlineNav",
  ".tabnav",
  "nav",
  "[role='navigation']",
  "[role='menu']",
  "[role='menuitem']",
  ".Layout-sidebar",
  ".BorderGrid",
  ".BorderGrid-row",
  ".js-issue-sidebar",
  ".discussion-sidebar",
  ".file-navigation",
  ".file-header",
  ".js-blob-header",
  ".react-blob-header",
  ".pagehead",
  ".pagehead-actions",
  "main",
  "aside",
  ".application-main",
  ".feed-left-sidebar",
  ".feed-main",
  ".feed-item",
  ".feed-item-content",
  ".dashboard-sidebar",
  ".dashboard",
  ".repository-content .Box-header",
  ".repository-content .Box-title",
  ".repository-content .commit-tease",
  ".select-menu",
  ".SelectMenu",
  ".SelectMenu-modal",
  ".Overlay",
  ".ActionList-sectionTitle",
  "button",
  "[role='button']",
  "summary",
  ".Button",
  ".btn",
  "details-menu",
  ".ActionList",
  ".ActionList-item"
].join(", ");
const translatedTextNodes = new Map();
const translatedAttributes = new Map();
const uiAiTranslationCache = new Map();
const uiAiPendingRequests = new Map();
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
      "pre, code, textarea, input, select, option, script, style, .gh-translator-panel, .gh-translator-result, .gh-translator-help-badge"
    )
  ) {
    return true;
  }
  if (parent.closest(LONG_TEXT_CONTAINER_SELECTORS)) {
    return true;
  }
  if (parent.closest(USER_CONTENT_EXCLUDE_SELECTORS)) {
    return true;
  }
  return false;
}

function shouldUseDictionaryForText(text, referenceElement = null) {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  if (referenceElement?.closest?.(LONG_TEXT_CONTAINER_SELECTORS)) {
    return false;
  }

  if (referenceElement?.closest?.(USER_CONTENT_EXCLUDE_SELECTORS)) {
    return false;
  }

  const lineBreakCount = (trimmed.match(/\n/g) || []).length;
  if (lineBreakCount > MAX_UI_LINE_BREAKS) {
    return false;
  }

  if (trimmed.length > MAX_UI_TEXT_LENGTH) {
    return false;
  }

  if (referenceElement?.closest && !referenceElement.closest(UI_TRANSLATION_CONTAINER_SELECTORS)) {
    return false;
  }

  return true;
}

function getElementLabelText(element) {
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll(".Counter, .counter, .gh-translator-help-badge, svg, img, .octicon")
    .forEach((node) => node.remove());
  const pieces = [];
  for (const node of clone.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      if (text) {
        pieces.push(text);
      }
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const childText = node.textContent?.replace(/\s+/g, " ").trim();
      if (childText) {
        pieces.push(childText);
      }
    }
  }

  const joined = pieces.join(" ").trim();
  return joined || clone.textContent?.replace(/\s+/g, " ").trim() || "";
}

function isRepositoryModuleButton(element) {
  if (!element?.matches) {
    return false;
  }

  if (element.matches(".UnderlineNav-item")) {
    return true;
  }

  return Boolean(
    element.closest("nav[aria-label*='Repository']") ||
      element.closest("nav[aria-label*='repository']") ||
      element.closest(".UnderlineNav-body")
  );
}

function ensureHelpStyles() {
  if (document.getElementById(MODULE_HELP_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = MODULE_HELP_STYLE_ID;
  style.textContent = `
    .gh-translator-help-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin-left: 6px;
      border: 1px solid var(--borderColor-default, #d0d7de);
      border-radius: 999px;
      background: var(--button-default-bgColor-rest, #f6f8fa);
      color: var(--fgColor-muted, #656d76);
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      vertical-align: text-bottom;
      cursor: help;
      user-select: none;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .gh-translator-help-badge:hover,
    .gh-translator-help-badge:focus-visible {
      background: var(--button-default-bgColor-hover, #f3f4f6);
      border-color: var(--borderColor-muted, #afb8c1);
      color: var(--fgColor-default, #24292f);
      outline: none;
    }

    .gh-translator-help-popover {
      position: fixed;
      min-width: 180px;
      max-width: 260px;
      padding: 8px 10px;
      border: 1px solid var(--borderColor-default, #d0d7de);
      border-radius: 6px;
      background: var(--overlay-bgColor, #ffffff);
      color: var(--fgColor-default, #24292f);
      font-size: 12px;
      font-weight: 400;
      line-height: 1.5;
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
      white-space: normal;
      text-align: left;
      z-index: 999999;
      pointer-events: none;
    }

    .gh-translator-help-popover::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 100%;
      width: 8px;
      height: 8px;
      background: inherit;
      border-right: 1px solid var(--borderColor-default, #d0d7de);
      border-bottom: 1px solid var(--borderColor-default, #d0d7de);
      transform: translateX(-50%) rotate(45deg);
    }
  `;
  document.head.appendChild(style);
}

function ensureTranslationResultStyles() {
  if (document.getElementById(TRANSLATION_RESULT_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = TRANSLATION_RESULT_STYLE_ID;
  style.textContent = `
    .gh-translator-result {
      margin: 16px 0;
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 6px;
      overflow: hidden;
      background: var(--bgColor-default, #0d1117);
      color: var(--fgColor-default, #e6edf3);
      box-shadow: var(--shadow-resting-small, none);
    }

    .gh-translator-result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--borderColor-muted, #21262d);
      background: var(--bgColor-muted, #161b22);
      color: var(--fgColor-muted, #8b949e);
      font-size: 12px;
      line-height: 1.5;
    }

    .gh-translator-result-badge {
      display: inline-flex;
      align-items: center;
      padding: 0 8px;
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 999px;
      background: transparent;
      color: var(--fgColor-muted, #8b949e);
      font-weight: 600;
      line-height: 20px;
      white-space: nowrap;
    }

    .gh-translator-result-body {
      padding: 16px;
      background: var(--bgColor-default, #0d1117);
      color: var(--fgColor-default, #e6edf3);
      font-size: 14px;
      line-height: 1.7;
    }

    .gh-translator-result-body.markdown-body {
      background: transparent !important;
      color: inherit !important;
    }

    .gh-translator-result-body.markdown-body h1,
    .gh-translator-result-body.markdown-body h2,
    .gh-translator-result-body.markdown-body h3,
    .gh-translator-result-body.markdown-body h4,
    .gh-translator-result-body.markdown-body h5,
    .gh-translator-result-body.markdown-body h6 {
      border-bottom-color: var(--borderColor-muted, #21262d);
      color: var(--fgColor-default, #e6edf3);
    }

    .gh-translator-result-body.markdown-body p,
    .gh-translator-result-body.markdown-body li,
    .gh-translator-result-body.markdown-body blockquote {
      color: var(--fgColor-default, #e6edf3);
    }

    .gh-translator-result-body.markdown-body ol {
      list-style: decimal;
      padding-left: 2em;
      margin: 0 0 16px;
    }

    .gh-translator-result-body.markdown-body ul {
      list-style: disc;
      padding-left: 2em;
      margin: 0 0 16px;
    }

    .gh-translator-result-body.markdown-body li + li {
      margin-top: 4px;
    }

    .gh-translator-result-body.markdown-body a {
      color: var(--fgColor-accent, #2f81f7);
    }

    .gh-translator-result-body.markdown-body code {
      background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.4));
      color: var(--fgColor-default, #e6edf3);
    }

    .gh-translator-result-body.markdown-body pre {
      background: var(--bgColor-muted, #161b22);
      border: 1px solid var(--borderColor-muted, #30363d);
      border-radius: 6px;
    }

    .gh-translator-result-body.markdown-body pre code {
      background: transparent;
    }

    .gh-translator-result-body.markdown-body blockquote {
      color: var(--fgColor-muted, #8b949e);
      border-left-color: var(--borderColor-accent-muted, #1f6feb);
    }

    .gh-translator-result-body.markdown-body hr {
      background: var(--borderColor-muted, #21262d);
    }
  `;
  document.head.appendChild(style);
}

function ensureFloatingPanelStyles() {
  if (document.getElementById(FLOATING_PANEL_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = FLOATING_PANEL_STYLE_ID;
  style.textContent = `
    .gh-translator-panel {
      position: fixed;
      top: 88px;
      right: 24px;
      width: 320px;
      z-index: 999998;
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bgColor-muted, #161b22);
      color: var(--fgColor-default, #e6edf3);
      box-shadow: 0 16px 40px rgba(1, 4, 9, 0.24);
      backdrop-filter: blur(8px);
      font-size: 12px;
    }

    .gh-translator-panel[data-collapsed="true"] {
      width: auto;
    }

    .gh-translator-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--borderColor-muted, #21262d);
      background: var(--bgColor-default, #0d1117);
      cursor: move;
      user-select: none;
    }

    .gh-translator-panel-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .gh-translator-panel-title strong {
      font-size: 13px;
      line-height: 1.3;
      color: var(--fgColor-default, #e6edf3);
    }

    .gh-translator-panel-title span {
      color: var(--fgColor-muted, #8b949e);
      line-height: 1.3;
    }

    .gh-translator-panel-toggle {
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 6px;
      background: var(--button-default-bgColor-rest, #21262d);
      color: var(--fgColor-default, #e6edf3);
      width: 28px;
      height: 28px;
      cursor: pointer;
    }

    .gh-translator-panel-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .gh-translator-panel[data-collapsed="true"] .gh-translator-panel-body,
    .gh-translator-panel[data-collapsed="true"] .gh-translator-panel-title span {
      display: none;
    }

    .gh-translator-panel-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .gh-translator-panel-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--fgColor-default, #e6edf3);
      font-size: 12px;
    }

    .gh-translator-panel-input {
      width: 100%;
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 6px;
      padding: 7px 10px;
      background: var(--bgColor-default, #0d1117);
      color: var(--fgColor-default, #e6edf3);
      box-sizing: border-box;
      font-size: 12px;
    }

    .gh-translator-panel-input::placeholder {
      color: var(--fgColor-muted, #8b949e);
    }

    .gh-translator-panel-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .gh-translator-panel-button {
      border: 1px solid var(--borderColor-default, #30363d);
      border-radius: 6px;
      padding: 7px 10px;
      background: var(--button-default-bgColor-rest, #21262d);
      color: var(--fgColor-default, #e6edf3);
      font-size: 12px;
      cursor: pointer;
    }

    .gh-translator-panel-button:hover,
    .gh-translator-panel-toggle:hover {
      background: var(--button-default-bgColor-hover, #30363d);
    }

    .gh-translator-panel-button.primary {
      background: var(--button-primary-bgColor-rest, #238636);
      border-color: var(--button-primary-borderColor-rest, rgba(240, 246, 252, 0.1));
      color: var(--button-primary-fgColor-rest, #ffffff);
    }

    .gh-translator-panel-button.primary:hover {
      background: var(--button-primary-bgColor-hover, #2ea043);
    }

    .gh-translator-panel-hint {
      color: var(--fgColor-muted, #8b949e);
      line-height: 1.5;
      font-size: 11px;
    }

    .gh-translator-panel-status {
      min-height: 18px;
      color: var(--fgColor-muted, #8b949e);
      line-height: 1.5;
      font-size: 11px;
    }

    .gh-translator-panel-details {
      border-top: 1px solid var(--borderColor-muted, #21262d);
      padding-top: 10px;
    }

    .gh-translator-panel-details summary {
      cursor: pointer;
      color: var(--fgColor-muted, #8b949e);
      user-select: none;
    }

    .gh-translator-panel-details[open] summary {
      margin-bottom: 10px;
    }
  `;
  document.head.appendChild(style);
}

function getFloatingPanel() {
  return document.getElementById(FLOATING_PANEL_ID);
}

function clampFloatingPanelPosition(left, top, width, height) {
  const maxLeft = Math.max(12, window.innerWidth - width - 12);
  const maxTop = Math.max(12, window.innerHeight - height - 12);
  return {
    left: Math.min(Math.max(12, left), maxLeft),
    top: Math.min(Math.max(12, top), maxTop)
  };
}

async function saveFloatingPanelPosition(position) {
  await chrome.storage.sync.set({ [FLOATING_PANEL_POSITION_KEY]: position });
}

async function loadFloatingPanelPosition() {
  const result = await chrome.storage.sync.get(FLOATING_PANEL_POSITION_KEY);
  return result[FLOATING_PANEL_POSITION_KEY] || null;
}

function applyFloatingPanelPosition(panel, position) {
  const rect = panel.getBoundingClientRect();
  const nextPosition = clampFloatingPanelPosition(position.left, position.top, rect.width, rect.height);
  panel.style.top = `${nextPosition.top}px`;
  panel.style.left = `${nextPosition.left}px`;
  panel.style.right = "auto";
}

async function initializeFloatingPanelPosition(panel) {
  const savedPosition = await loadFloatingPanelPosition();
  if (!savedPosition) {
    return;
  }
  applyFloatingPanelPosition(panel, savedPosition);
}

function enableFloatingPanelDrag(panel) {
  const header = panel.querySelector(".gh-translator-panel-header");
  if (!header) {
    return;
  }

  let dragState = null;

  const onPointerMove = (event) => {
    if (!dragState) {
      return;
    }

    const nextLeft = event.clientX - dragState.offsetX;
    const nextTop = event.clientY - dragState.offsetY;
    const nextPosition = clampFloatingPanelPosition(nextLeft, nextTop, dragState.width, dragState.height);
    panel.style.left = `${nextPosition.left}px`;
    panel.style.top = `${nextPosition.top}px`;
    panel.style.right = "auto";
  };

  const onPointerUp = async () => {
    if (!dragState) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const finalPosition = { left: Math.round(rect.left), top: Math.round(rect.top) };
    dragState = null;
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    await saveFloatingPanelPosition(finalPosition);
  };

  header.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button, input, summary, a")) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };

    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = "auto";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });
}

function setFloatingPanelStatus(message, isError = false) {
  const status = document.getElementById("gh-translator-panel-status");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.style.color = isError ? "var(--fgColor-danger, #f85149)" : "var(--fgColor-muted, #8b949e)";
}

function syncFloatingPanelFields() {
  const panel = getFloatingPanel();
  if (!panel) {
    return;
  }

  const enabledInput = panel.querySelector("[data-role='enabled']");
  const apiBaseInput = panel.querySelector("[data-role='apiBaseUrl']");
  const apiKeyInput = panel.querySelector("[data-role='apiKey']");
  const modelInput = panel.querySelector("[data-role='model']");

  if (enabledInput) {
    enabledInput.checked = currentSettings.enabled;
  }
  if (apiBaseInput) {
    apiBaseInput.value = currentSettings.apiBaseUrl || "";
  }
  if (apiKeyInput) {
    apiKeyInput.value = currentSettings.apiKey || "";
  }
  if (modelInput) {
    modelInput.value = currentSettings.model || "";
  }
}

async function saveCurrentSettings(nextSettings) {
  currentSettings = { ...currentSettings, ...nextSettings };
  await chrome.storage.sync.set({ [STORAGE_KEY]: currentSettings });
  syncFloatingPanelFields();
}

async function applyCurrentUiTranslation() {
  restoreUiTranslation();
  if (currentSettings.enabled) {
    applyUiTranslation(document.body);
  }
}

async function handleFloatingPanelSave() {
  const panel = getFloatingPanel();
  if (!panel) {
    return;
  }

  await saveCurrentSettings({
    enabled: panel.querySelector("[data-role='enabled']")?.checked ?? true,
    apiBaseUrl: panel.querySelector("[data-role='apiBaseUrl']")?.value.trim() || "",
    apiKey: panel.querySelector("[data-role='apiKey']")?.value.trim() || "",
    model: panel.querySelector("[data-role='model']")?.value.trim() || ""
  });
  await applyCurrentUiTranslation();
  setFloatingPanelStatus("设置已保存。");
}

async function handleFloatingPanelApply() {
  await applyCurrentUiTranslation();
  setFloatingPanelStatus("已重新应用界面翻译。");
}

async function handleFloatingPanelTranslate() {
  setFloatingPanelStatus("正在翻译当前页正文...");
  const result = await translatePageContent();
  if (!result.ok) {
    setFloatingPanelStatus(result.error || "AI 翻译失败。", true);
    return;
  }
  setFloatingPanelStatus(`AI 翻译完成，共处理 ${result.count} 个内容区块。`);
}

function handleFloatingPanelRestore() {
  restoreUiTranslation();
  setFloatingPanelStatus("页面已恢复。");
}

function createFloatingPanel() {
  if (getFloatingPanel()) {
    syncFloatingPanelFields();
    return;
  }

  ensureFloatingPanelStyles();

  const panel = document.createElement("aside");
  panel.id = FLOATING_PANEL_ID;
  panel.className = "gh-translator-panel";
  panel.setAttribute("data-collapsed", "false");
  panel.innerHTML = `
    <div class="gh-translator-panel-header">
      <div class="gh-translator-panel-title">
        <strong>GitHub 翻译器</strong>
        <span>本地词典 + AI 正文翻译</span>
      </div>
      <button type="button" class="gh-translator-panel-toggle" data-role="toggle" aria-label="折叠面板">-</button>
    </div>
    <div class="gh-translator-panel-body">
      <div class="gh-translator-panel-section">
        <label class="gh-translator-panel-label">
          <input type="checkbox" data-role="enabled" />
          <span>启用界面词典翻译</span>
        </label>
        <div class="gh-translator-panel-actions">
          <button type="button" class="gh-translator-panel-button" data-action="apply">应用界面翻译</button>
          <button type="button" class="gh-translator-panel-button primary" data-action="translate">AI 翻译正文</button>
          <button type="button" class="gh-translator-panel-button" data-action="restore">恢复页面</button>
          <button type="button" class="gh-translator-panel-button" data-action="save">保存设置</button>
        </div>
      </div>
      <details class="gh-translator-panel-details">
        <summary>AI 设置</summary>
        <div class="gh-translator-panel-section">
          <input class="gh-translator-panel-input" data-role="apiBaseUrl" type="text" placeholder="API Base URL" />
          <input class="gh-translator-panel-input" data-role="model" type="text" placeholder="Model" />
          <input class="gh-translator-panel-input" data-role="apiKey" type="password" placeholder="API Key（本地接口可留空）" />
        </div>
      </details>
      <div class="gh-translator-panel-hint">悬浮面板始终可用，适合边看 GitHub 边切换翻译方式。</div>
      <div class="gh-translator-panel-status" id="gh-translator-panel-status"></div>
    </div>
  `;

  panel.querySelector("[data-role='toggle']")?.addEventListener("click", () => {
    const collapsed = panel.getAttribute("data-collapsed") === "true";
    panel.setAttribute("data-collapsed", collapsed ? "false" : "true");
    panel.querySelector("[data-role='toggle']").textContent = collapsed ? "-" : "+";
  });

  panel.querySelector("[data-action='save']")?.addEventListener("click", () => {
    handleFloatingPanelSave().catch((error) => setFloatingPanelStatus(error.message, true));
  });
  panel.querySelector("[data-action='apply']")?.addEventListener("click", () => {
    handleFloatingPanelApply().catch((error) => setFloatingPanelStatus(error.message, true));
  });
  panel.querySelector("[data-action='translate']")?.addEventListener("click", () => {
    handleFloatingPanelTranslate().catch((error) => setFloatingPanelStatus(error.message, true));
  });
  panel.querySelector("[data-action='restore']")?.addEventListener("click", () => {
    try {
      handleFloatingPanelRestore();
    } catch (error) {
      setFloatingPanelStatus(error.message, true);
    }
  });

  document.body.appendChild(panel);
  enableFloatingPanelDrag(panel);
  syncFloatingPanelFields();
  setFloatingPanelStatus("面板已就绪。");
  initializeFloatingPanelPosition(panel).catch(() => {});
}

function getHelpPopover() {
  let popover = document.getElementById(MODULE_HELP_POPOVER_ID);
  if (popover) {
    return popover;
  }

  popover = document.createElement("div");
  popover.id = MODULE_HELP_POPOVER_ID;
  popover.className = "gh-translator-help-popover";
  popover.hidden = true;
  document.body.appendChild(popover);
  return popover;
}

function hideHelpPopover() {
  const popover = document.getElementById(MODULE_HELP_POPOVER_ID);
  if (!popover) {
    return;
  }
  popover.hidden = true;
}

function showHelpPopover(target, description) {
  const popover = getHelpPopover();
  popover.textContent = description;
  popover.hidden = false;

  const targetRect = target.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, targetRect.left + targetRect.width / 2 - popoverRect.width / 2),
    window.innerWidth - popoverRect.width - 12
  );
  const top = Math.max(12, targetRect.top - popoverRect.height - 10);

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

function createHelpBadge(description) {
  const badge = document.createElement("span");
  badge.className = "gh-translator-help-badge";
  badge.tabIndex = 0;
  badge.setAttribute("role", "button");
  badge.textContent = "?";
  badge.title = description;
  badge.setAttribute("aria-label", description);

  badge.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  badge.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  badge.addEventListener("mouseenter", () => showHelpPopover(badge, description));
  badge.addEventListener("focus", () => showHelpPopover(badge, description));
  badge.addEventListener("mouseleave", hideHelpPopover);
  badge.addEventListener("blur", hideHelpPopover);

  return badge;
}

function getUniqueModuleCandidates(root) {
  const candidates = [];
  if (root.matches?.(MODULE_HELP_SELECTORS)) {
    candidates.push(root);
  }
  root.querySelectorAll(MODULE_HELP_SELECTORS).forEach((element) => candidates.push(element));

  return [...new Set(candidates)];
}

function findModuleHelpDescription(labelText) {
  const normalized = normalizeLookupText(labelText);
  const exactDescription = MODULE_HELP_MAP.get(normalized);
  if (exactDescription) {
    return exactDescription;
  }

  for (const alias of MODULE_HELP_ALIASES) {
    if (
      normalized === alias ||
      normalized.startsWith(`${alias} `) ||
      normalized.endsWith(` ${alias}`) ||
      normalized.includes(` ${alias} `)
    ) {
      return MODULE_HELP_MAP.get(alias);
    }
  }

  return null;
}

function applyModuleHelp(root = document.body) {
  if (!root?.querySelectorAll) {
    return;
  }

  ensureHelpStyles();
  const candidates = getUniqueModuleCandidates(root);

  for (const element of candidates) {
    if (!isRepositoryModuleButton(element)) {
      continue;
    }

    if (element.querySelector(":scope > .gh-translator-help-badge")) {
      continue;
    }

    if (element.closest(".gh-translator-help-badge")) {
      continue;
    }

    const labelText = getElementLabelText(element);
    if (!labelText || labelText.length > 40) {
      continue;
    }

    const description = findModuleHelpDescription(labelText);
    if (!description) {
      continue;
    }

    element.appendChild(createHelpBadge(description));
  }
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
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
    ".review-comment-contents",
    ".Layout-sidebar p.f4",
    ".f4.my-3",
    "[itemprop='about']"
  ];

  const blocks = [];
  const seen = new Set();
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((element) => {
      if (seen.has(element)) {
        return;
      }
      if (
        element.closest(".gh-translator-result") ||
        element.classList.contains("gh-translator-rendered-markdown")
      ) {
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

  return blocks.filter(
    (element) => !blocks.some((other) => other !== element && other.contains(element))
  );
}

function collapseInlineWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function serializeInlineNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return collapseInlineWhitespace(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "br") {
    return "\n";
  }

  if (tagName === "code" && element.parentElement?.tagName.toLowerCase() !== "pre") {
    return `\`${collapseInlineWhitespace(element.textContent || "")}\``;
  }

  const childrenText = Array.from(element.childNodes)
    .map((child) => serializeInlineNode(child))
    .join("");

  if (tagName === "a") {
    const href = element.getAttribute("href");
    if (href && !href.startsWith("#")) {
      return `[${childrenText || collapseInlineWhitespace(element.textContent || "")}](${href})`;
    }
    return childrenText;
  }

  if (tagName === "strong" || tagName === "b") {
    return `**${childrenText}**`;
  }

  if (tagName === "em" || tagName === "i") {
    return `*${childrenText}*`;
  }

  return childrenText;
}

function serializeListItem(element, depth, ordered, index) {
  const indent = "  ".repeat(depth);
  const marker = ordered ? `${index}. ` : "- ";
  const inlineParts = [];
  const nestedBlocks = [];

  for (const child of element.childNodes) {
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      ["ul", "ol"].includes(child.tagName.toLowerCase())
    ) {
      nestedBlocks.push(serializeBlockNode(child, depth + 1));
      continue;
    }
    inlineParts.push(serializeInlineNode(child));
  }

  const mainLine = `${indent}${marker}${collapseInlineWhitespace(inlineParts.join(""))}`.trimEnd();
  const nestedText = nestedBlocks.filter(Boolean).join("\n");
  return [mainLine, nestedText].filter(Boolean).join("\n");
}

function serializeBlockNode(node, depth = 0) {
  if (node.nodeType === Node.TEXT_NODE) {
    return collapseInlineWhitespace(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "pre") {
    const codeElement = element.querySelector("code");
    const codeText = codeElement ? codeElement.textContent || "" : element.textContent || "";
    const languageClass = codeElement?.className
      ?.split(/\s+/)
      .find((className) => className.startsWith("language-"));
    const language = languageClass ? languageClass.replace("language-", "") : "";
    return `\`\`\`${language}\n${codeText.trimEnd()}\n\`\`\``;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number.parseInt(tagName.slice(1), 10);
    return `${"#".repeat(level)} ${collapseInlineWhitespace(Array.from(element.childNodes).map((child) => serializeInlineNode(child)).join(""))}`;
  }

  if (tagName === "p") {
    return collapseInlineWhitespace(Array.from(element.childNodes).map((child) => serializeInlineNode(child)).join(""));
  }

  if (tagName === "blockquote") {
    const content = Array.from(element.childNodes)
      .map((child) => serializeBlockNode(child, depth))
      .filter(Boolean)
      .join("\n");
    return content
      .split("\n")
      .map((line) => (line ? `> ${line}` : ">"))
      .join("\n");
  }

  if (tagName === "ul" || tagName === "ol") {
    const ordered = tagName === "ol";
    const start = Number.parseInt(element.getAttribute("start") || "1", 10);
    return Array.from(element.children)
      .filter((child) => child.tagName?.toLowerCase() === "li")
      .map((child, index) => serializeListItem(child, depth, ordered, start + index))
      .join("\n");
  }

  if (tagName === "hr") {
    return "---";
  }

  if (tagName === "table") {
    return collapseInlineWhitespace(element.innerText || "");
  }

  if (tagName === "img") {
    const alt = element.getAttribute("alt");
    return alt ? `![${alt}]` : "";
  }

  return Array.from(element.childNodes)
    .map((child) => serializeBlockNode(child, depth))
    .filter(Boolean)
    .join("\n\n");
}

function extractStructuredText(element) {
  if (
    element.matches?.(
      "article.markdown-body, .markdown-body, .comment-body, .js-comment-body, .review-comment-contents"
    )
  ) {
    return Array.from(element.childNodes)
      .map((child) => serializeBlockNode(child))
      .filter(Boolean)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return element.innerText?.trim() || "";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(text) {
  let rendered = escapeHtml(text);
  rendered = rendered.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  rendered = rendered.replace(/(^|[^\*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  rendered = rendered.replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
  rendered = rendered.replace(/\n/g, "<br>");
  return rendered;
}

function renderMarkdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraphLines = [];
  let listType = null;
  let orderedListStart = 1;
  let codeFence = null;

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }
    html.push(`<p>${renderInlineMarkdown(paragraphLines.join("\n"))}</p>`);
    paragraphLines = [];
  }

  function closeList() {
    if (!listType) {
      return;
    }
    html.push(listType === "ol" ? "</ol>" : "</ul>");
    listType = null;
    orderedListStart = 1;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (codeFence) {
      if (trimmed.startsWith("```")) {
        html.push(
          `<pre><code class="language-${escapeHtml(codeFence.language)}">${escapeHtml(codeFence.lines.join("\n"))}</code></pre>`
        );
        codeFence = null;
      } else {
        codeFence.lines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      closeList();
      codeFence = {
        language: trimmed.slice(3).trim(),
        lines: []
      };
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      flushParagraph();
      const itemNumber = Number.parseInt(trimmed.match(/^(\d+)\./)?.[1] || "1", 10);
      if (listType !== "ol") {
        closeList();
        orderedListStart = Number.isNaN(itemNumber) ? 1 : itemNumber;
        html.push(orderedListStart > 1 ? `<ol start="${orderedListStart}">` : "<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInlineMarkdown(orderedListMatch[1])}</li>`);
      continue;
    }

    const unorderedListMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedListMatch) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInlineMarkdown(unorderedListMatch[1])}</li>`);
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeList();
      html.push(`<blockquote><p>${renderInlineMarkdown(blockquoteMatch[1])}</p></blockquote>`);
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();
  closeList();

  if (codeFence) {
    html.push(
      `<pre><code class="language-${escapeHtml(codeFence.language)}">${escapeHtml(codeFence.lines.join("\n"))}</code></pre>`
    );
  }

  return html.join("\n");
}

function injectTranslationResult(element, translatedText) {
  if (element.previousElementSibling?.classList.contains("gh-translator-result")) {
    element.previousElementSibling.remove();
  }

  ensureTranslationResultStyles();

  const panel = document.createElement("div");
  panel.className = "gh-translator-result";

  const heading = document.createElement("div");
  heading.className = "gh-translator-result-header";

  const badge = document.createElement("span");
  badge.className = "gh-translator-result-badge";
  badge.innerText = "AI 中文译文";

  const headingText = document.createElement("span");
  headingText.innerText = "已按 GitHub 文档样式渲染";

  heading.appendChild(badge);
  heading.appendChild(headingText);

  const content = document.createElement("div");
  content.className = "markdown-body gh-translator-rendered-markdown gh-translator-result-body";
  const renderedHtml = renderMarkdownToHtml(translatedText);
  if (renderedHtml.trim()) {
    content.innerHTML = renderedHtml;
  } else {
    content.innerText = translatedText;
    content.style.whiteSpace = "pre-wrap";
  }

  panel.appendChild(heading);
  panel.appendChild(content);
  element.parentNode?.insertBefore(panel, element);
}

async function translatePageContent() {
  const blocks = collectBlocks();
  if (!blocks.length) {
    return { ok: false, error: "当前页面没有找到适合翻译的正文区域。" };
  }

  for (const element of blocks) {
    const sourceText = extractStructuredText(element);
    if (!sourceText) {
      continue;
    }
    const response = await sendRuntimeMessage({
      action: "translateText",
      text: sourceText
    });
    if (!response?.ok) {
      return { ok: false, error: response?.error || "AI 翻译失败。" };
    }
    injectTranslationResult(element, response.translatedText);
  }

  return { ok: true, count: blocks.length };
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

  if (!shouldUseDictionaryForText(trimmed, referenceElement)) {
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

  if (hasMixedChineseAndEnglish(translated)) {
    return original;
  }

  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

async function loadUiAiCache() {
  const result = await chrome.storage.local.get(UI_AI_CACHE_STORAGE_KEY);
  const cacheObject = result[UI_AI_CACHE_STORAGE_KEY] || {};
  uiAiTranslationCache.clear();
  Object.entries(cacheObject).forEach(([key, value]) => {
    if (typeof value === "string") {
      uiAiTranslationCache.set(key, value);
    }
  });
}

async function persistUiAiCache() {
  await chrome.storage.local.set({
    [UI_AI_CACHE_STORAGE_KEY]: Object.fromEntries(uiAiTranslationCache.entries())
  });
}

async function cacheUiAiTranslation(text, translatedText) {
  uiAiTranslationCache.set(normalizeLookupText(text), translatedText);
  await persistUiAiCache();
}

async function requestUiAiTranslation(text) {
  const key = normalizeLookupText(text);
  if (uiAiTranslationCache.has(key)) {
    const cachedValue = uiAiTranslationCache.get(key);
    return cachedValue === UI_AI_CACHE_MISS ? null : cachedValue;
  }

  if (uiAiPendingRequests.has(key)) {
    return uiAiPendingRequests.get(key);
  }

  const pending = sendRuntimeMessage({
    action: "translateUiText",
    text
  })
    .then(async (response) => {
      if (!response?.ok || !response.translatedText) {
        if (response?.error?.includes("完整中文结果") || response?.error?.includes("大部分是英文")) {
          await cacheUiAiTranslation(text, UI_AI_CACHE_MISS);
        }
        return null;
      }

      const translatedText = response.translatedText.trim();
      if (!translatedText || hasMixedChineseAndEnglish(translatedText) || /[A-Za-z]/.test(translatedText)) {
        await cacheUiAiTranslation(text, UI_AI_CACHE_MISS);
        return null;
      }

      await cacheUiAiTranslation(text, translatedText);
      return translatedText;
    })
    .catch(() => null)
    .finally(() => {
      uiAiPendingRequests.delete(key);
    });

  uiAiPendingRequests.set(key, pending);
  return pending;
}

async function applyUiAiFallback(textCandidates = [], attributeCandidates = []) {
  const uniqueTexts = Array.from(
    new Set(
      [...textCandidates.map((candidate) => candidate.original), ...attributeCandidates.map((candidate) => candidate.original)].map(
        (text) => text.trim()
      )
    )
  ).filter(Boolean);

  if (!uniqueTexts.length) {
    return;
  }

  const translationResults = new Map();
  await Promise.all(
    uniqueTexts.map(async (text) => {
      const translatedText = await requestUiAiTranslation(text);
      translationResults.set(text, translatedText);
    })
  );

  for (const candidate of textCandidates) {
    const translatedText = translationResults.get(candidate.original.trim());
    if (!translatedText || !candidate.node.isConnected || candidate.node.nodeValue !== candidate.original) {
      continue;
    }
    if (!translatedTextNodes.has(candidate.node)) {
      translatedTextNodes.set(candidate.node, candidate.original);
    }
    candidate.node.nodeValue = translatedText;
  }

  for (const candidate of attributeCandidates) {
    const translatedText = translationResults.get(candidate.original.trim());
    if (!translatedText || !candidate.element.isConnected || candidate.element.getAttribute(candidate.attributeName) !== candidate.original) {
      continue;
    }

    let cached = translatedAttributes.get(candidate.element);
    if (!cached) {
      cached = {};
      translatedAttributes.set(candidate.element, cached);
    }
    if (!(candidate.attributeName in cached)) {
      cached[candidate.attributeName] = candidate.original;
    }
    candidate.element.setAttribute(candidate.attributeName, translatedText);
  }
}

function translateNodeText(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pending = [];
  const aiCandidates = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (shouldSkipNode(node)) {
      continue;
    }
    const nextValue = translateTextByDictionary(node.nodeValue || "", node.parentElement);
    if (nextValue !== node.nodeValue) {
      pending.push([node, node.nodeValue, nextValue]);
      continue;
    }

    if (canUseUiAiFallback(node.nodeValue || "", node.parentElement)) {
      aiCandidates.push({
        node,
        original: node.nodeValue || ""
      });
    }
  }

  for (const [node, original, nextValue] of pending) {
    if (!translatedTextNodes.has(node)) {
      translatedTextNodes.set(node, original);
    }
    node.nodeValue = nextValue;
  }

  return aiCandidates;
}

function translateAttributes(root = document.body) {
  const elements = root.querySelectorAll(
    "[aria-label], [placeholder], [title], [data-disable-with], input[type='button'][value], input[type='submit'][value], input[type='reset'][value]"
  );
  const aiCandidates = [];
  for (const element of elements) {
    if (element.closest(USER_CONTENT_EXCLUDE_SELECTORS)) {
      continue;
    }

    for (const attributeName of ["aria-label", "placeholder", "title", "data-disable-with", "value"]) {
      if (
        attributeName === "value" &&
        (!(element instanceof HTMLInputElement) ||
          !["button", "submit", "reset"].includes((element.type || "").toLowerCase()))
      ) {
        continue;
      }

      const original = element.getAttribute(attributeName);
      if (!original) {
        continue;
      }
      if (!shouldUseDictionaryForText(original, element)) {
        continue;
      }
      const translated = translateTextByDictionary(original, element);
      if (translated === original) {
        if (canUseUiAiFallback(original, element)) {
          aiCandidates.push({
            element,
            attributeName,
            original
          });
        }
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

  return aiCandidates;
}

function applyUiTranslation(root = document.body) {
  if (!currentSettings.enabled || !isGitHubPage()) {
    return;
  }
  const textCandidates = translateNodeText(root);
  if (root.querySelectorAll) {
    const attributeCandidates = translateAttributes(root);
    applyModuleHelp(root);
    if (textCandidates.length || attributeCandidates.length) {
      applyUiAiFallback(textCandidates, attributeCandidates).catch(() => {});
    }
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

  document
    .querySelectorAll(".gh-translator-result, .gh-translator-help-badge, #gh-translator-help-popover")
    .forEach((node) => node.remove());
  translatedTextNodes.clear();
  translatedAttributes.clear();
}
async function loadSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  currentSettings = { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) };
  syncFloatingPanelFields();
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
  if (message?.action === "ping") {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.action === "translatePage") {
    translatePageContent().then(sendResponse);
    return true;
  }

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
  await Promise.all([loadSettings(), loadUiAiCache()]);
  createFloatingPanel();
  if (currentSettings.enabled) {
    applyUiTranslation(document.body);
  }
  startObserver();
}

init();
}
