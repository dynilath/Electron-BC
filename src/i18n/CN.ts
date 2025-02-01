const translation: Record<TextTag, string> = {
  "MenuItem::Tools": "工具",
  "MenuItem::Tools::OpenCacheDir": "打开缓存数据目录",
  "MenuItem::Tools::ProximateCacheSize": "缓存估计大小（点击刷新）",
  "MenuItem::Tools::ClearCache": "清除缓存",
  "MenuItem::Tools::DevTools": "开发者工具",
  "MenuItem::Tools::Refresh": "刷新页面",
  "MenuItem::Tools::FullScreen": "全屏模式",
  "MenuItem::Tools::Exit": "退出",
  "MenuItem::Script": "脚本",
  "MenuItem::Script::Load From URL": "从网址加载",
  "MenuItem::Script::Open Script Folder": "打开脚本文件夹",
  "MenuItem::Script::UpdateScript": "从网址更新现有脚本",
  "MenuItem::Script::Author": "作者",
  "MenuItem::Script::Version": "版本",
  "MenuItem::Script::URL": "网址",
  "MenuItem::Script::Unknown": "未知",
  "ContextMenu::Cut": "剪切",
  "ContextMenu::Copy": "复制",
  "ContextMenu::Paste": "粘贴",
  "Alert::LoadUrl::InputScriptURL": "输入脚本网址",
  "Alert::Confirm": "确认",
  "Alert::Cancel": "取消",
  "Alert::LoadUrl::PleaseInputCorrectUrl":
    "请输入正确的网址，格式应该类似于 'https://example.com/script.user.js'",
  "Alert::Title": "提示",
  "MenuItem::About": "关于",
  "MenuItem::About::ChangeLog": "显示更新日志",
  "MenuItem::About::Suggestions": "建议或反馈",
  "MenuItem::About::GitHub": "访问GitHub源码",
  "MenuItem::About::Version": "Electron-BC 版本",
  "Alert::Credential::Title": "凭据支持",
  "Alert::Credential::Change": "保存用户USERNAME的密码修改？",
  "Alert::Credential::New": "保存新的用户USERNAME？",
  "Alert::Credential::Saved": "已保存USERNAME的凭据。",
  "MenuItem::BuiltIns": "内置支持",
  "MenuItem::BuiltIns::Intro": "点击下面的按钮来开关内置支持功能",
  "MenuItem::BuiltIns::CredentialSupport": "内置凭据支持",
  "MenuItem::BuiltIns::CredentialSupport::Info":
    "使用操作系统凭据管理器保存密码",
  "Credential::SavedCredential": "已保存的凭据🔑",
  "MenuItem::BuiltIns::AutoRelog": "自动重连",
  "MenuItem::BuiltIns::AutoRelog::Info": "断线自动重连，需要启用凭据支持",
  "MenuItem::Script::InstallTips": "可以点击游戏中的脚本链接来安装脚本",
  "Alert::Cache::ClearConfirm":
    '<p>确认清除缓存？</p><p style="font-style:italic;">备注：由于缓存工作的特性，清除缓存后可能需要经过一些时间缓存文件体积才会减小。如果需要立即释放磁盘空间，请关闭程序后手动删除缓存目录。</p>',
  "MenuItem::Tools::StartUICacheUpdate": "预加载用户界面资源",
  "Alert::Cache::UpdateConfirm":
    '<p>发现版本更新，点击确认立即开始缓存用户界面相关资源（不含角色资源）。</p><p style="font-style:italic;">备注：首次加载会消耗网络流量，提前加载可以避免游戏中的图片加载延迟。如果现在取消加载，之后也可以通过菜单启动加载。</p>',
};

export default translation;
