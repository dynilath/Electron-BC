import { MyPrompt } from '../MyPrompt'
import { reloadAllMenu } from '../reloadAllMenu'
import { openScriptFolder } from '../script'
import { ScriptResource } from '../script/resource'
import { MyAppMenuConstructorOption } from './type'
import { dialog, ipcMain } from 'electron'
import fs from 'fs'
import {
  exportScript,
  ExportedScriptData,
  exportScriptPackageBuffer,
  importScriptPackageBuffer
} from '../script/export'
import { ScriptResourceItem } from '../script/types'

export function scriptMenu ({
  refreshPage,
  parent,
  scriptState
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n, window } = parent

  const scriptMenu = scriptState.menuItems.reduce((pv, cv) => {
    if (!pv[cv.scriptName]) {
      pv[cv.scriptName] = []
    }
    pv[cv.scriptName].push({
      label: cv.menuName,
      click: () => scriptState.invokeMenu(cv.id)
    })
    return pv
  }, {} as { [key: string]: Electron.MenuItemConstructorOptions[] })

  const makeSublabel = (script: ScriptResourceItem) => {
    const meta = script.meta
    const sAuthor = i18n('MenuItem::Script::Author')
    const sVersion = i18n('MenuItem::Script::Version')
    const sURL = i18n('MenuItem::Script::URL')
    const sUnknown = i18n('MenuItem::Script::Unknown')
    return `${sAuthor}: ${meta.author ?? sUnknown}, ${sVersion}: ${
      meta.version ?? sUnknown
    },\n ${sURL}: ${script.setting.url ?? sUnknown}`
  }

  ipcMain.on('load-user-script', (event, url) => {
    if (event.sender.id !== window.webContents.id) return
    MyPrompt.loadUrl(parent, url)
  })

  ipcMain.on('load-script-package', async (id: any, url) => {
    if (id !== window.webContents.id) return
    try {
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      await importScriptPackageBuffer(buffer)
      await MyPrompt.confirmCancel(
        parent,
        i18n('MenuItem::Script::ImportSuccess'),
        () => refreshPage()
      )
    } catch (err: any) {
      MyPrompt.error(
        parent,
        i18n('MenuItem::Script::ImportFailed').replace(
          '$reason',
          err?.message ?? err
        )
      )
    }
  })

  return {
    label: i18n('MenuItem::Script'),
    id: 'script' as AppMenuIds,
    submenu: [
      {
        label: i18n('MenuItem::Script::Load From URL'),
        type: 'normal',
        sublabel: i18n('MenuItem::Script::InstallTips'),
        click: () => MyPrompt.loadUrl(parent)
      },
      {
        label: i18n('MenuItem::Script::Open Script Folder'),
        type: 'normal',
        click: () => openScriptFolder()
      },
      {
        label: i18n('MenuItem::Script::UpdateScript'),
        type: 'normal',
        click: () => ScriptResource.updateScripts()
      },
      {
        type: 'separator'
      },
      {
        label: i18n('MenuItem::Script::ExportPackage'),
        sublabel: i18n('MenuItem::Script::ExportPackageTips'),
        type: 'normal',
        click: async () => {
          const enabledScripts = scriptState.scripts.filter(
            s => s.setting.enabled
          )
          const scriptData: ExportedScriptData[] = await Promise.all(
            enabledScripts.map(s => exportScript(s))
          )
          const now = new Date()
          const pad = (n: number) => n.toString().padStart(2, '0')
          const fileName = `script-package-${now.getFullYear()}${pad(
            now.getMonth() + 1
          )}${pad(now.getDate())}-${pad(now.getHours())}${pad(
            now.getMinutes()
          )}${pad(now.getSeconds())}.ebcspkg`
          const { filePath } = await dialog.showSaveDialog({
            title: i18n('MenuItem::Script::ExportPackage'),
            defaultPath: fileName,
            filters: [{ name: 'EBC Script Package', extensions: ['ebcspkg'] }]
          })
          if (filePath) {
            const compressed = exportScriptPackageBuffer(scriptData)
            fs.writeFileSync(filePath, compressed)
          }
        }
      },
      {
        label: i18n('MenuItem::Script::ImportPackage'),
        type: 'normal',
        click: async () => {
          const { filePaths } = await dialog.showOpenDialog({
            title: i18n('MenuItem::Script::ImportPackage'),
            filters: [{ name: 'EBC Script Package', extensions: ['ebcspkg'] }],
            properties: ['openFile']
          })
          if (filePaths && filePaths[0]) {
            try {
              const compressed = fs.readFileSync(filePaths[0])
              await importScriptPackageBuffer(compressed)
              MyPrompt.confirmCancel(
                parent,
                i18n('MenuItem::Script::ImportSuccess'),
                async () => refreshPage()
              )
            } catch (err: any) {
              MyPrompt.error(
                parent,
                i18n('MenuItem::Script::ImportFailed').replace(
                  '$reason',
                  err?.message ?? err
                )
              )
            }
          }
        }
      },
      {
        label: i18n('MenuItem::Script::ImportPackageFromURL'),
        type: 'normal',
        click: () => MyPrompt.loadPackage(parent)
      },
      {
        type: 'separator'
      },
      ...(scriptState.needRefresh
        ? [
            {
              label: i18n('MenuItem::Script::NeedRefresh'),
              type: 'normal',
              enabled: false
            } as Electron.MenuItemConstructorOptions
          ]
        : []),
      ...scriptState.scripts.map(
        (script): Electron.MenuItemConstructorOptions => {
          const ret = {
            label: script.meta.name,
            type: 'checkbox',
            checked: script.setting.enabled,
            sublabel: makeSublabel(script),
            click: async () => {
              await scriptState.toggleConfig(script.meta.name)
              reloadAllMenu()
            }
          } as Electron.MenuItemConstructorOptions

          if (script.setting.enabled && scriptMenu[script.meta.name]) {
            ret.type = 'submenu'
            ret.submenu = [
              {
                label: i18n('MenuItem::Script::SubMenu::Switch'),
                type: 'checkbox',
                checked: script.setting.enabled,
                click: async () => {
                  await scriptState.toggleConfig(script.meta.name)
                  reloadAllMenu()
                }
              },
              {
                type: 'separator'
              },
              ...scriptMenu[script.meta.name]
            ]
          }

          return ret
        }
      )
    ]
  }
}
