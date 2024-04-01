// const translation: Map<TextTag, string> = new Map<string, string>([
//     ["MenuItem::Tools", "工具"],
//     ["MenuItem::Tools::Open Dev Tools", "打开开发者工具"],
//     ["MenuItem::Tools::Refresh", "刷新页面"],
//     ["MenuItem::Script", "脚本"],
//     ["MenuItem::Script::Load From URL", "从网址加载"],
//     ["MenuItem::Script::Open Script Folder", "打开脚本文件夹"],
//     ["MenuItem::Script::UpdateScript", "从网址更新现有脚本"],
//     ["MenuItem::Script::Author", "作者"],
//     ["MenuItem::Script::Version", "版本"],
//     ["MenuItem::Script::URL", "网址"],
//     ["MenuItem::Script::Unknown", "未知"],
//     ["ContextMenu::Cut", "剪切"],
//     ["ContextMenu::Copy", "复制"],
//     ["ContextMenu::Paste", "粘贴"],
//     ["Alert::LoadUrl::Input script URL", "输入脚本网址"],
//     ["Alert::LoadUrl::Confirm", "确认"],
//     ["Alert::LoadUrl::Cancel", "取消"],
//     ["Alert::LoadUrl::Please Input Correct", "请输入正确的网址"]
// ]);

const translation: Record<TextTag, string> = {
    "MenuItem::Tools": "工具",
    "MenuItem::Tools::Open Dev Tools": "打开开发者工具",
    "MenuItem::Tools::Refresh": "刷新页面",
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
    "Alert::LoadUrl::Input script URL": "输入脚本网址",
    "Alert::Confirm": "确认",
    "Alert::Cancel": "取消",
    "Alert::LoadUrl::Please Input Correct": "请输入正确的网址",
    "Alert::Title": "提示"
}

export default translation;