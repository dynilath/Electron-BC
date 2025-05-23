import { ipcMain } from 'electron'
import { showPrompt, PromptOptions } from '../prompt'
import { i18nText } from '../i18n'

interface PromptExecutor {
  confirm: () => void
  cancel?: () => void
}

const promptList = new Map<string, PromptExecutor>()

async function sendConfirmCancelPrompt (
  i18n: (tag: TextTag) => string,
  message: TextTag,
  confirm: () => void,
  cancel?: () => void
) {
  const result = await showPrompt({
    type: 'confirmCancel',
    message: i18n(message),
    confirmText: i18n('Alert::Confirm'),
    cancelText: i18n('Alert::Cancel')
  })

  if (result) {
    if (result.ok) {
      confirm()
    } else if (cancel) {
      cancel()
    }
  }
}

async function infoPrompt (i18n: (tag: TextTag) => string, message: string) {
  const result = await showPrompt({
    type: 'info',
    title: message,
    message: '',
    confirmText: i18n('Alert::Confirm')
  })
}

async function showPromptLoadurl (
  i18n: (tag: TextTag) => string,
  suggestion?: string
) {
  const result = await showPrompt({
    type: 'input',
    inputPlaceholder: 'https://example.com/script.user.js',
    inputType: 'userscript',
    inputError: i18n('Alert::LoadUrl::PleaseInputCorrectUrl'),
    title: i18n('Alert::LoadUrl::InputScriptURL'),
    defaultValue: suggestion,
    confirmText: i18n('Alert::Confirm'),
    cancelText: i18n('Alert::Cancel')
  })

  if (result && result.ok) {
    ipcMain.emit('load-script-url', result.value)
  }
}

ipcMain.on('web-alert', (event, data) => {
  const i18nObj = new i18nText()
  i18nObj.language = data.language || 'EN'
  infoPrompt(tag => i18nObj.get(tag), data.message)
})

export const MyPrompt = {
  confirmCancel: sendConfirmCancelPrompt,
  info: infoPrompt,
  loadUrl: showPromptLoadurl,
  error: infoPrompt
}
