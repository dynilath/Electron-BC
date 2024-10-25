const fs = require("fs-extra");
const marked = require("marked");
const path = require("path");

const sourcePath = path.join(
  process.argv[2] || path.join(process.cwd(), "CHANGELOG.md")
);
const targetPath = path.join(
  process.argv[3] || path.join(process.cwd(), "CHANGELOG.html")
);
const cssPath = require.resolve("github-markdown-css");

fs.readFile(sourcePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading README.md:", err);
    process.exit(1);
  }

  fs.readFile(cssPath, "utf8", (cssErr, cssData) => {
    if (cssErr) {
      console.error("Error reading CSS:", cssErr);
      process.exit(1);
    }

    const htmlContent = marked.parse(data);
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${cssData}
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
        }
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body class="markdown-body">
    ${htmlContent}
</body>
</html>`;

    fs.outputFile(targetPath, htmlTemplate, (err) => {
      if (err) {
        console.error(`Error writing ${targetPath}:`, err);
        process.exit(1);
      }

      console.log(
        `${targetPath} has been generated successfully with GitHub style.`
      );
    });
  });
});
