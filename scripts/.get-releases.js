const axios = require("axios").default;

const { setEnv } = require("./.set-env.js");

setEnv();

/**
 * @returns {Promise<{version: string, url: string}[]>}
 */
async function getReleases() {
  const api_url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases`;

  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  };

  const { data } = await axios.get(api_url, config);

  return data.reduce((acc, release) => {
    if (release.draft) return acc;
    
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
