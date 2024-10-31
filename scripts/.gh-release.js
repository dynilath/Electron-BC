const axios = require("axios").default;
const { setEnv } = require("./.set-env.js");
const TAG_NAME = `v${require("../package.json").version}`;

setEnv();

function checkTagExists(tag) {
  const url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases`;
  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  };

  return new Promise(async (resolve, reject) =>
    axios
      .get(url, config)
      .then((response) => {
        const target = response.data.find(
          (release) => release.tag_name === tag
        );

        if (!target) reject("Release does not exist");
        else return target;
      })
      .then((target) => axios.get(target.url, config))
      .then((response) => {
        const { draft } = response.data;
        if (!draft) reject("Release is not a draft");
        else resolve(response.data);
      })
      .catch(reject)
  );
}

async function createRelease({ tag_name, name, url }) {
  const body = {
    tag_name: tag_name,
    name: name,
    body: `Release for version ${name}`,
    draft: false,
    prerelease: false,
    make_newest: "legacy",
  };

  const config = {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  };

  const response = await axios.patch(url, body, config);

  return response.data.html_url;
}

(async () => {
  await checkTagExists(TAG_NAME)
    .then((data) => createRelease(data))
    .then(console.log, console.error);
})();
