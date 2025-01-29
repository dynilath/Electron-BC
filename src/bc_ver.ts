import axios from "axios";

export function fetchLatestBC(): Promise<{ url: string; version: string }> {
  return new Promise<{ url: string; version: string }>(
    async (resolve, reject) => {
      const src = "https://bondageprojects.com/club_game/";
      axios.get(src).then(
        (response) => {
          const html = response.data;

          const matches = html.match(
            /https:\/\/[^']+bondage[^']+\.com\/(R\d+)\/BondageClub\//g
          );

          if (!matches) reject({ message: "No valid bc version found" });

          const url = matches[0];
          const version = matches[1];
          resolve({ url, version });
        },
        (error) => reject(error)
      );
    }
  );
}
