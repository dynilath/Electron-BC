export function sleep(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export function acquire<T extends { [key: string]: () => any }>(
  funcs: T,
  retries: number = 1
): Promise<{ [K in keyof T]: ReturnType<T[K]> }> {
  return new Promise(async (resolve, reject) => {
    while (retries > 0) {
      const results = await (async () => {
        const results: { [K in keyof T]: ReturnType<T[K]> } = {} as any;
        for (const key in funcs) {
          results[key] = await funcs[key]();
        }
        return results;
      })();
      if (Object.values(results).every((v) => Boolean(v))) resolve(results);
      else if (retries <= 0) reject("Timeout");
      else {
        retries--;
        await sleep(100);
      }
    }
  });
}
