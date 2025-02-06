import { net } from "electron";

export function fetchLatestBC(): Promise<BCVersion> {
  return new Promise<BCVersion>((resolve, reject) => {
    net
      .fetch("https://bondageprojects.com/club_game/", {
        bypassCustomProtocolHandlers: true,
      })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const html = await response.text();

        const matches = html.match(
          /https:\/\/[^']+bondage[^']+\.com\/(R\d+)\/BondageClub\//g
        );

        if (!matches) throw new Error("No valid bc version found");
        else {
          const url = matches[0];
          const version = url.match(/R\d+/)![0];
          resolve({ url, version });
        }
      })
      .catch(reject);
  });
}
