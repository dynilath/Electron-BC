const axios = require('axios').default;
const { setEnv } = require('./.set-env.js');
const TAG_NAME = `v${require('../package.json').version}`;
const SHOULD_UNDRAFT = !process.argv.includes('--keep-draft');

setEnv();

function checkTagExists(tag) {
  const url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases`;
  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  };

  return new Promise(async (resolve, reject) =>
    axios
      .get(url, config)
      .then(response => {
        const target = response.data.find(release => release.tag_name === tag);

        if (!target) reject('Release does not exist');
        else return target;
      })
      .then(target => axios.get(target.url, config))
      .then(response => {
        const { draft } = response.data;
        if (!draft) reject('Release is not a draft');
        else resolve(response.data);
      })
      .catch(reject)
  );
}

function normalizeAssetUrl(asset) {
  return asset.browser_download_url.replace(/untagged-\d+[a-z]+/, '');
}

function getAssetLine(assets, label, matcher) {
  const asset = Array.isArray(assets) ? assets.find(matcher) : undefined;

  if (!asset) return `- ${label}: not included in this release`;

  const normalizedUrl = normalizeAssetUrl(asset);
  return `- ${label}: [${asset.name}](${normalizedUrl})`;
}

async function createRelease(release) {
  const { tag_name, name, url, html_url, assets } = release;

  const setupLine = getAssetLine(
    assets,
    'Windows Setup',
    asset =>
      asset.name.endsWith('.exe') &&
      asset.name.includes('Setup') &&
      !asset.name.toLowerCase().includes('delta')
  );

  const appImageLine = getAssetLine(assets, 'Linux AppImage', asset =>
    asset.name.endsWith('.AppImage')
  );

  const body = {
    tag_name,
    name,
    body: `Release ${name}\n\n${setupLine}\n${appImageLine}`,
    draft: !SHOULD_UNDRAFT,
    prerelease: false,
    make_newest: 'legacy',
  };

  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  };

  const response = await axios.patch(url, body, config);

  return response.data.html_url;
}

(async () => {
  await checkTagExists(TAG_NAME)
    .then(data => createRelease(data))
    .then(console.log, console.error);
})();
