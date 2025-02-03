export function readMeta(scriptContent: string): ScriptMeta | undefined {
  const match =
    /^\s*\/\/\s*==UserScript==\s*([\s\S\/@]+?)\/\/\s*==\/UserScript==/.exec(
      scriptContent
    );

  if (match) {
    const scriptBlock = match[1];
    const regContent = /^\/\/\s+@(\S+)\s+(.+)/gm;

    let result = regContent.exec(scriptBlock);

    let ret = {} as Partial<ScriptMeta>;
    while (result) {
      switch (result[1]) {
        case "author":
          ret.author = result[2];
          break;
        case "name":
          ret.name = result[2];
          break;
        case "version":
          ret.version = result[2];
          break;
      }

      result = regContent.exec(scriptBlock);
    }

    if (ret.name === undefined) return undefined;

    return ret as ScriptMeta;
  }
}
