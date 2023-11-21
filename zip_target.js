const fs = require('fs');
const { exec } = require('child_process');

const chunkSize = 500 * 1024 * 1024;

const name = process.env.npm_package_name;
const version = process.env.npm_package_version;

const exeFilePath = `./dist/${name} Setup ${version}.exe`;

exec(`7z a -tzip -v${chunkSize} "${exeFilePath}.zip" "${exeFilePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error : ${stderr}`);
      return;
    }
});