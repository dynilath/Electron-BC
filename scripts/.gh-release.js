const axios = require("axios").default;
const { setEnv } = require("./.set-env.js");
const TAG_NAME = `v${require("../package.json").version}`;

setEnv();

function checkTagExists(tag) {
  return new Promise(async (resolve, reject) => {
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases/tags/${tag}`,
      {
        headers: {
          Authorization: `token ${process.env.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!response.data.draft) reject("Release is not a draft");

    if (
      !response.data.assets.some(
        (asset) => asset.name.endsWith(".exe") && !asset.name.includes("delta")
      )
    )
      reject("No exe file found in the release");

    resolve({ data: response.data });
  });
}

async function createRelease(tag) {
  const body = {
    tag_name: tag,
    name: tag,
    body: `Release for version ${tag}`,
    draft: false,
    prerelease: false,
    make_newest: "legacy",
  };

  const response = await axios.patch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases/${tag}`,
    body,
    {
      headers: {
        Authorization: `token ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  return response.data.html_url; // 返回创建的 Release 数据
}

(async () => {
  await checkTagExists(TAG_NAME)
    .then(({ tag_name }) => createRelease(tag_name))
    .then(
      (data) => console.log(data),
      (error) => console.error(error)
    );
})();
