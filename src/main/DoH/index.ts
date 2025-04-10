import { app, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { parse, stringify } from 'yaml'

const configMainPath = path.join(
  app.getPath('appData'),
  'Bondage Club',
  'Config'
)
if (!fs.existsSync(configMainPath)) {
  fs.mkdirSync(configMainPath, { recursive: true })
}

interface DoHConfig {
  mode: 'automatic' | 'secure' | 'off'
  servers: string[]
}

const defaultDoHConfig: DoHConfig = {
  mode: 'automatic',
  servers: [
    'https://cloudflare-dns.com/dns-query',
    'https://doh.opendns.com/dns-query',
    'https://dns.google/dns-query'
  ]
}

function ensureConfigFile (configPath: string) {
  if (!fs.existsSync(configPath)) {
    console.warn(
      `DoH config file not found at ${configPath}, creating default config.`
    )

    const defaultConfigWithComments = `# DoH Configuration
# mode: Specifies the DNS over HTTPS mode. Possible values are:
#   - 'automatic': Automatically use DoH when available.
#   - 'secure': Enforce secure DNS resolution using DoH.
#   - 'off': Disable DoH and use traditional DNS resolution.
mode: ${defaultDoHConfig.mode}

# servers: A list of DNS over HTTPS server URLs.
servers:
${defaultDoHConfig.servers.map(server => `  - ${server}`).join('\n')}`.trim()

    fs.mkdirSync(path.dirname(configPath), { recursive: true })
    fs.writeFileSync(configPath, defaultConfigWithComments, 'utf8')
    return defaultDoHConfig
  }
}

function loadDoHConfig (): DoHConfig {
  const configPath = path.join(configMainPath, 'DoH.yml')

  ensureConfigFile(configPath)

  const fileContent = fs.readFileSync(configPath, 'utf8')
  try {
    const config = parse(fileContent) as DoHConfig
    return config
  } catch (error) {
    console.error(`Failed to parse DoH config file: ${error}`)
    return defaultDoHConfig
  }
}

function activateDoH () {
  app.whenReady().then(() => {
    const config = loadDoHConfig()

    if (!['automatic', 'secure', 'off'].includes(config.mode)) {
      console.error(
        `Invalid DoH mode: ${config.mode}. Defaulting to 'automatic'.`
      )
      config.mode = 'automatic'
    }

    app.configureHostResolver({
      secureDnsMode: config.mode,
      secureDnsServers: config.servers
    })
  })
}

activateDoH()

function openConfigFile () {
  const configPath = path.join(configMainPath, 'DoH.yml')
  ensureConfigFile(configPath)
  shell.openPath(configPath)
}

export class DoH {
  static refresh = activateDoH
  static openConfigFile = openConfigFile
}
