import { net } from "electron";

export function fetchLatestBC(): Promise<BCVersion[]> {
  return new Promise<BCVersion[]>((resolve, reject) => {
    net
      .fetch("https://bondageprojects.com/club_game/", {
        bypassCustomProtocolHandlers: true,
        cache: "no-store",
      })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const html = await response.text();

        const matches = html.match(
          /onclick="window\.location='(https:\/\/www.bondage[^']+)'/g
        );

        if (!matches || matches.length === 0) {
          throw new Error("No valid bc versions found");
        }

        const versions: BCVersion[] = matches.map((match) => {
          const url = match.match(/'(https:\/\/www\.bondage[^']+)'/)?.[1];
          const version = url?.match(/R\d+/)?.[0];
          if (url && version) {
            return { url, version };
          }
          return undefined;
        }).filter(Boolean) as BCVersion[];
        resolve(versions);
      })
      .catch(reject);
  });
}
