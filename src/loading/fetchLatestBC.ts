import { net } from 'electron'

export function fallback (): BCVersion[] {
  // monthly advanced versions
  // 2025/05/16 ~ 2025/06/15 = R116
  // 2025/06/16 ~ 2025/07/15 = R117
  // 2025/07/16 ~ 2025/08/15 = R118

  const dateTime = new Date()
  const year = dateTime.getUTCFullYear()
  const month = dateTime.getUTCMonth()
  const day = dateTime.getUTCDate()

  const vNumber =
    Math.floor((year - 2025) * 12 + month) + 111 + (day >= 16 ? 1 : 0)
  const version = `R${vNumber}`

  console.log(`Using fallback version: ${version}`)

  return [
    {
      version,
      url: `https://www.bondageprojects.elementfx.com/${version}/BondageClub/`,
    },
    {
      version,
      url: `https://www.bondage-europe.com/${version}/`,
    },
    {
      version,
      url: `https://www.bondageprojects.elementfx.com/${version}/`,
    },
  ]
}

export function fetchLatestBC (): Promise<BCVersion[]> {
  return new Promise<BCVersion[]>((resolve, reject) => {
    net
      .fetch('https://bondageprojects.com/club_game/', {
        bypassCustomProtocolHandlers: true,
        cache: 'no-store',
      })
      .then(async response => {
        if (!response.ok)
          throw new Error(`HTTP ${response.status} ${response.statusText}`)

        const html = await response.text()

        const matches = html.match(
          /onclick="window\.location='(https:\/\/www.bondage[^']+)'/g
        )

        if (!matches || matches.length === 0) {
          throw new Error('No valid bc versions found')
        }

        const versions: BCVersion[] = matches
          .map(match => {
            const url = match.match(/'(https:\/\/www\.bondage[^']+)'/)?.[1]
            const version = url?.match(/R\d+/)?.[0]
            if (url && version) {
              return { url, version }
            }
            return undefined
          })
          .filter(Boolean) as BCVersion[]
        resolve(versions)
      })
      .catch(reject)
  })
}
