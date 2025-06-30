import settings, { set } from 'electron-settings'

const SettingTag = 'bcVersion'

type ConfigType = {
  preferredPrefix: string
}

let choices: BCVersion[] = []

let choice: BCVersion | undefined = undefined

function setChoice () {
  const config = settings.getSync(SettingTag) as ConfigType | undefined
  if (config && config.preferredPrefix) {
    const preferred = choices.find(v =>
      v.version.startsWith(config.preferredPrefix)
    )
    if (preferred) {
      choice = preferred
      return
    }
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
    setChoice()
  },
  get choice (): BCVersion {
    return choice as BCVersion
  },
  get choices () {
    return choices
  },
}
