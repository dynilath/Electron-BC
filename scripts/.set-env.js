const fs = require("fs");

function setEnv() {
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
      console.error(
        "Please provide GITHUB_REPOSITORY and GH_TOKEN in .env file"
      );
      process.exit(1);
    }
  }
}

module.exports = { setEnv };
