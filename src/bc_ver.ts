import { net } from "electron";

export function fetchLatestBC(): Promise<{ url: string; version: string }> {
  return new Promise<{ url: string; version: string }>((resolve, reject) => {
    net
      .fetch("https://bondageprojects.com/club_game/", {
        bypassCustomProtocolHandlers: true,
      })
      .then(
        async (response) => {
          const html = await response.text();

          const matches = html.match(
            /https:\/\/[^']+bondage[^']+\.com\/(R\d+)\/BondageClub\//g
          );

          if (!matches) reject({ message: "No valid bc version found" });
          else {
            const url = matches[0];
            const version = url.match(/R\d+/)![0];
            resolve({ url, version });
          }
        },
        (error) => reject(error)
      );
  });
}
