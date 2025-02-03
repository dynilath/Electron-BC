const translation: Record<TextTag, string> = {
  "MenuItem::Tools": "Tools",
  "MenuItem::Tools::OpenCacheDir": "Open Cache Directory",
  "MenuItem::Tools::ProximateCacheSize":
    "Proximate Cache Size (Click to Refresh)",
  "MenuItem::Tools::StartUICacheUpdate::Loading":
    "Loading, close window to abort",
  "MenuItem::Tools::ClearCache": "Clear Cache",
  "MenuItem::Tools::DevTools": "Dev Tools",
  "MenuItem::Tools::Refresh": "Refresh Page",
  "MenuItem::Tools::FullScreen": "Full Screen Mode",
  "MenuItem::Tools::Exit": "Exit",
  "MenuItem::Script": "Script",
  "MenuItem::Script::NeedRefresh": "Need Refresh to Apply Changes",
  "MenuItem::Script::Load From URL": "Load From URL",
  "MenuItem::Script::Open Script Folder": "Open Script Folder",
  "MenuItem::Script::UpdateScript": "Update Exisiting Script From URL",
  "MenuItem::Script::Author": "Author",
  "MenuItem::Script::Version": "Version",
  "MenuItem::Script::URL": "URL",
  "MenuItem::Script::Unknown": "Unknown",
  "ContextMenu::Cut": "Cut",
  "ContextMenu::Copy": "Copy",
  "ContextMenu::Paste": "Paste",
  "Alert::LoadUrl::InputScriptURL": "Input Script URL",
  "Alert::Confirm": "Confirm",
  "Alert::Cancel": "Cancel",
  "Alert::LoadUrl::PleaseInputCorrectUrl":
    "Please input correct url, which should be like 'https://example.com/script.user.js'",
  "Alert::Title": "Alert",
  "MenuItem::About": "About",
  "MenuItem::About::Suggestions": "Suggestions or Feedback",
  "MenuItem::About::ChangeLog": "Show Electron-BC Change Log",
  "MenuItem::About::GitHub": "Visit GitHub Repo",
  "MenuItem::About::BCVersion": "BondageClub Version",
  "MenuItem::About::Version": "Electron-BC Version",
  "Alert::Credential::Title": "Credential Support",
  "Alert::Credential::Change": "Save the password change for user USERNAME?",
  "Alert::Credential::New": "Save new user USERNAME?",
  "Alert::Credential::Saved": "Credential saved for USERNAME.",
  "MenuItem::BuiltIns": "Built-ins",
  "MenuItem::BuiltIns::Intro": "Click buttons below to toggle built-in support",
  "MenuItem::BuiltIns::CredentialSupport": "Built-in Credential Support",
  "MenuItem::BuiltIns::CredentialSupport::Info":
    "Save passwords using OS credential manager",
  "Credential::SavedCredential": "Saved Credentials🔑",
  "MenuItem::BuiltIns::AutoRelog": "Auto Relog",
  "MenuItem::BuiltIns::AutoRelog::Info":
    "Relog on disconnect, requires credential support",
  "MenuItem::Script::InstallTips":
    "Can also install scripts by clicking links in game",
  "Alert::Cache::ClearConfirm":
    '<p>Confirm to clear cache?</p><p style="font-style:italic;">Note: Due to the nature of cache work, it may take some time for cache file size to reduce after clearing. If you need to release disk space immediately, please close the program and manually delete the cache directory.</p>',
  "MenuItem::Tools::StartUICacheUpdate": "Preload UI Resources",
  "Alert::Cache::UpdateConfirm":
    '<p>Version update found, click confirm to start caching UI related resources immediately.</p><p style="font-style:italic;">Note: Initial loading will consume network traffic, preloading can avoid image loading delay in game. If you cancel loading now, you can also start loading via menu later.</p>',
};

export default translation;
