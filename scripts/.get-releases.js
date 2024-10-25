const axios = require("axios").default;
const fs = require("fs");

if (!process.env.GH_TOKEN) {
  if (!fs.existsSync(".env")) {
    console.error("Please create a valid .env file");
    process.exit(1);
  }

  fs.readFileSync(".env", "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, value] = line.split("=");
      process.env[key] = value;
    });

  if (!process.env.GITHUB_REPOSITORY || !process.env.GH_TOKEN) {
    console.error("Please provide GITHUB_REPOSITORY and GH_TOKEN in .env file");
    process.exit(1);
  }
}

/**
 * @returns {Promise<{version: string, url: string}[]>}
 */
async function getReleases() {
  const api_url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases`;

  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
    },
  };

  const { data } = await axios.get(api_url, config);

  return data.reduce((acc, release) => {
    acc.push({
      version: release.tag_name,
      url: release.assets.find(
        (asset) => asset.name.includes(".exe") && !asset.name.includes("delta")
      ).browser_download_url,
    });
    return acc;
  }, []);
}

module.exports = { getReleases };
