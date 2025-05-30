import { app, BrowserWindow, ipcMain } from 'electron'

import keytar from 'keytar'
import { UserInfo } from '../bridge'
import { MyPrompt } from './MyPrompt'
import { PromptParent } from '../prompt/types'
import { randomString } from '../utility'

const serviceName = app.name

const tempCredentialMap = new Map<string, { user: string; pass: string }>()

function initCredentialHandler () {
  ipcMain.handle(
    'credential-query-select',
    (event, source): Promise<UserInfo> => {
      return new Promise((resolve, reject) => {
        keytar.getPassword(serviceName, source).then(result => {
          if (result) resolve({ user: source, pass: result })
          else reject(`Credential Not Found : ${source}`)
        })
      })
    }
  )

  ipcMain.handle('credential-query-suggestion', async (event, account) => {
    const lacc = account.toLowerCase()
    const credentials = await keytar.findCredentials(serviceName)
    return credentials
      .filter(i => !account || i.account.toLowerCase().includes(lacc))
      .map(i => i.account)
  })

  ipcMain.handle('credential-save', (event, handle) => {
    const saved = tempCredentialMap.get(handle)
    if (saved) {
      keytar.setPassword(serviceName, saved.user, saved.pass)
      return Promise.resolve(saved.user)
    } else {
      return Promise.reject(`Invalid Handle: ${handle}`)
    }
  })

  ipcMain.handle('credential-relog', (event, handle): Promise<UserInfo> => {
    const saved = tempCredentialMap.get(handle)
    if (saved) {
      return Promise.resolve(saved)
    } else {
      return Promise.reject(`Invalid Handle: ${handle}`)
    }
  })
}

function createOnLoginListener (parent: PromptParent) {
  const { i18n } = parent
  return (async (event, { user, pass }) => {
    const handle = randomString()
    tempCredentialMap.set(handle, { user, pass })

    const oldPass = await keytar.getPassword(serviceName, user)
    const state =
      oldPass === pass ? 'nochange' : oldPass === null ? 'new' : 'changed'
    if (
      event.sender.id === parent.window.webContents.id &&
      state !== 'nochange'
    ) {
      MyPrompt.confirmCancel(
        parent,
        (state == 'changed'
          ? i18n('Alert::Credential::Change')
          : i18n('Alert::Credential::New')
        ).replace('USERNAME', user),
        () => {
          keytar.setPassword(serviceName, user, pass)
          MyPrompt.confirmCancel(
            parent,
            i18n('Alert::Credential::Saved').replace('USERNAME', user),
            () => {}
          )
        }
      )
    }
    return handle
  }) as Parameters<typeof ipcMain.handle>[1]
}

export const Credential = {
  init: initCredentialHandler,
  createOnLoginListener,
}
