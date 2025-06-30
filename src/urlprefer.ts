import settings, { set } from 'electron-settings'

const SettingTag = 'bcVersion'

type ConfigType = {
  preferredPrefix: string
}

let choices: BCVersion[] = []

let choice: BCVersion | undefined = undefined

function setChoice (prefix?: string) {
  const preferred = (() => {
    if (prefix) {
      return choices.find(v => v.url.startsWith(prefix))
    }
    const config = settings.getSync(SettingTag) as ConfigType | undefined
    if (config && config.preferredPrefix) {
      const preferred = choices.find(v =>
        v.url.startsWith(config.preferredPrefix)
      )
      return preferred
    }
  })()

  if (preferred) {
    choice = preferred
    return
  }

  choice = choices[0]
  return
}

export const BCURLPreference = {
  choose: (versions: BCVersion[]): BCVersion | undefined => {
    if (versions.length === 0) return
    choices = versions
    setChoice()
    return choice
  },
  setPreferredPrefix: (bcv: BCVersion) => {
    const prefixEnd = bcv.url.indexOf(bcv.version)
    if (prefixEnd === -1) {
      return
    }
    const prefix = bcv.url.substring(0, prefixEnd)
    settings.setSync(SettingTag, {
      preferredPrefix: prefix,
    })
    setChoice(prefix)
  },
  setCustomURL: (url: string) => {
    const version = `${url.match(/R\d+/)?.[0] || 'Custom'}-${-Math.random().toString(36).substring(2)}`
    choice = {
      url,
      version
    }
  },
  get choice (): BCVersion {
    return choice as BCVersion
  },
  get choices () {
    return choices
  },
}
