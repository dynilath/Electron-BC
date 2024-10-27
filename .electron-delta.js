// .electron-delta.js
const DeltaBuilder = require("@electron-delta/builder");
const path = require("path");
const packageJSON = require("./package.json");
const { getReleases } = require("./scripts/.get-releases.js");

const options = {
  productIconPath: path.join(__dirname, packageJSON.build.icon),
  productName: packageJSON.build.appId,
  cache: path.join(__dirname, "dist"),

  getPreviousReleases: async () => {
    return await getReleases();
  },
  sign: async (filePath) => {
    return filePath;
  },
};

exports.default = async function (context) {
  const deltaInstallerFiles = await DeltaBuilder.build({
    context,
    options,
  });
  return deltaInstallerFiles;
};
