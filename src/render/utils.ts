export function sleep(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

type Falsy = false | 0 | "" | null | undefined | typeof NaN;
type Truthy<T> = T extends Falsy ? never : T;

export function waitValue<Func extends () => any>(
  func: Func,
  resolution: number = 100
): Promise<Truthy<ReturnType<Func>>> {
  return new Promise(async (resolve) => {
    while (true) {
      const result = func();
      if (result) {
        resolve(result);
        break;
      }
      await sleep(resolution);
    }
  });
}
