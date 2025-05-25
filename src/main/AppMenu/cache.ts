import { dialog, shell } from "electron";
import { AssetCache } from "../AssetCache";
import { getCachePath } from "../AssetCache/cachePath";
import { MyAppMenuConstructorOption } from "./type";
import { reloadAllMenu } from "../reloadAllMenu";
import { MyPrompt } from "../MyPrompt";

export function cacheMenu({
  BCVersion,
  parent,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: parent.i18n("MenuItem::Tools::OpenCacheDir"),
      type: "normal",
      click: () => {
        shell.openPath(AssetCache.cacheDir());
      },
    },
    {
      label: parent.i18n("MenuItem::Tools::RelocateCacheDir"),
      type: "normal",
      enabled: AssetCache.available(),
      click: () => {
        (async () => {
          try {
            const result = await dialog.showOpenDialog(parent.window, {
              properties: ["openDirectory"],
              defaultPath: getCachePath(),
            });

            if (result.canceled) return;

            await AssetCache.relocate(
              result.filePaths[0],
              () => reloadAllMenu(),
              () =>
                new Promise((resolve) => {
                  MyPrompt.confirmCancel(
                    parent,
                    "Alert::Cache::RelocateConfirm",
                    () => resolve(true),
                    () => resolve(false)
                  );
                })
            );
            reloadAllMenu();
          } catch (e: any) {
            console.log(e);
            MyPrompt.error(parent, e);
          }
        })();
      },
    },
    {
      label: parent.i18n("MenuItem::Tools::StartUICacheUpdate"),
      type: "normal",
      enabled: AssetCache.canPreloadCache() && AssetCache.available(),
      ...(AssetCache.canPreloadCache()
        ? {}
        : {
            sublabel: parent.i18n(
              "MenuItem::Tools::StartUICacheUpdate::Loading"
            ),
          }),
      click: () => {
        AssetCache.preloadCache(BCVersion.url, BCVersion.version).then(() =>
          reloadAllMenu()
        );
        reloadAllMenu();
      },
    },
    {
      label: parent.i18n("MenuItem::Tools::ProximateCacheSize"),
      sublabel: AssetCache.fileSizeStr(),
      type: "normal",
      click: () => {
        AssetCache.clearSizeResult();
        reloadAllMenu();
      },
    },
    {
      label: parent.i18n("MenuItem::Tools::ClearCache"),
      type: "normal",
      click: () => {
        MyPrompt.confirmCancel(parent, "Alert::Cache::ClearConfirm", () => {
          AssetCache.clearCache();
        });
      },
    },
  ];
}
