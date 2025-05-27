import { ipcMain } from 'electron'
import { showPrompt } from '../prompt'
import { PromptOptions, PromptParent } from '../prompt/types'

type TextContent = string | Pick<PromptOptions, 'title' | 'content'>

function resolveTextContent (
  text: TextContent
): Pick<PromptOptions, 'title' | 'content'> {
  if (typeof text === 'string') {
    return { content: text }
  } else {
    return text
  }
}

async function sendConfirmCancelPrompt (
  parent: PromptParent,
  text: TextContent,
  confirm: () => void,
  cancel?: () => void
) {
  const { window, i18n } = parent
  const result = await showPrompt(window, {
    type: 'confirmCancel',
    ...resolveTextContent(text),
    confirmText: i18n('Alert::Confirm'),
    cancelText: i18n('Alert::Cancel'),
  })

  if (result) {
    if (result.ok) {
      confirm()
    } else if (cancel) {
      cancel()
    }
  }
}

async function infoPrompt (parent: PromptParent, text: TextContent) {
  const { window, i18n } = parent

  await showPrompt(window, {
    ...resolveTextContent(text),
    type: 'info',
    confirmText: i18n('Alert::Confirm'),
  })
}

async function showPromptLoadurl (parent: PromptParent, suggestion?: string) {
  const { window, i18n } = parent
  const result = await showPrompt(window, {
    type: 'input',
    inputPlaceholder: 'https://example.com/script.user.js',
    inputType: 'userscript',
    inputError: i18n('Alert::LoadUrl::PleaseInputCorrectUrl'),
    title: i18n('Alert::LoadUrl::InputScriptURL'),
    defaultValue: suggestion,
    confirmText: i18n('Alert::Confirm'),
    cancelText: i18n('Alert::Cancel'),
  })

  if (result && result.ok) {
    ipcMain.emit('load-script-url', parent.window.webContents.id, result.value)
  }
}

async function showPromptLoadPackage (parent: PromptParent) {
  const { window, i18n } = parent
  const result = await showPrompt(window, {
    type: 'input',
    inputPlaceholder: 'https://example.com/package.ebcspkg',
    inputType: 'ebcspackage',
    inputError: i18n('Alert::LoadPackage::PleaseInputCorrectUrl'),
    title: i18n('Alert::LoadPackage::InputPackageURL'),
    confirmText: i18n('Alert::Confirm'),
    cancelText: i18n('Alert::Cancel'),
  })

  if (result && result.ok) {
    ipcMain.emit(
      'load-script-package',
      parent.window.webContents.id,
      result.value
    )
  }
}

export const MyPrompt = {
  confirmCancel: sendConfirmCancelPrompt,
  info: infoPrompt,
  loadUrl: showPromptLoadurl,
  loadPackage: showPromptLoadPackage,
  error: infoPrompt,
}
