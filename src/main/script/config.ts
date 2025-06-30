import settings from 'electron-settings'
import { SettingTag } from './constants'
import { ScriptConfigItem } from './types'

let config_storage: Map<string, ScriptConfigItem> | null = null

function config() {
  if (config_storage) return config_storage
  else {
    config_storage = new Map<string, ScriptConfigItem>(
      ((settings.getSync(SettingTag) as ScriptConfigItem[] | null) || []).map(
        c => [c.name, c] as [string, ScriptConfigItem]
      )
    )
    return config_storage
  }
}

async function saveConfig () {
  return settings.set(
    SettingTag,
    Array.from(config().values(), v => {
      return {
        name: v.name,
        setting: {
          enabled: v.setting.enabled,
          url: v.setting.url,
          lastUpdate: v.setting.lastUpdate,
        },
      }
    })
  )
}

export const ScriptConfig = {
  shrinkConfig: (names: string[]) => {
    const unused = [] as string[]
    config().forEach((v, k) => {
      if (!names.includes(k)) unused.push(k)
    })
    unused.forEach(k => config().delete(k))
    saveConfig()
  },
  saveConfig: async (item: ScriptConfigItem) => {
    config().set(item.name, item)
    await saveConfig()
  },
  getConfig: (name: string, url: string | null = null): ScriptConfigItem => {
    let ret = config().get(name)
    if (ret) return ret
    ret = {
      name,
      setting: {
        enabled: true,
        url,
        lastUpdate: Date.now(),
      },
    }
    config().set(name, ret)
    saveConfig()
    return ret
  },
}
