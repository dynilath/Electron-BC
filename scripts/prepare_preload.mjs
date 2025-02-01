import fs from "fs";
import path from "path";
import LZString from "lz-string";

const result = {};

function processPath(path) {
  const parts = path.split(/\\|\//);
  let current = result;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = 0;
    } else {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  });
}

const room_platform = path.join("Room", "Platform");
const minigame_kinkydungeon = path.join("MiniGame", "KinkyDungeon");

["Assets", "Backgrounds", "Screens"].forEach((root) => {
  fs.readdirSync(`./${root}`, { withFileTypes: true, recursive: true }).forEach(
    (file) => {
      if (file.isDirectory()) return;
      if (file.parentPath.includes(room_platform)) return;
      if (file.parentPath.includes(minigame_kinkydungeon)) return;
      if (
        file.name.endsWith(".png") ||
        file.name.endsWith(".jpg") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".csv")
      )
        processPath(path.join(file.parentPath, file.name));
    }
  );
});

fs.writeFileSync(
  "./preload.data",
  LZString.compressToUint8Array(JSON.stringify(result)),
  { encoding: "binary" }
);
