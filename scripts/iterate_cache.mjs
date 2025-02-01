import { ClassicLevel } from "classic-level";
import path from "path";

const CachePath = path.resolve(
  path.join(process.env.APPDATA, "Bondage Club", "AssetCache")
);

console.log(CachePath);

const db = new ClassicLevel(CachePath, {
  valueEncoding: "binary",
});

for await (const [key, value] of db.iterator()) {
  console.log(key, value.length);
}

console.log(path.join("Room", "Platform"));
