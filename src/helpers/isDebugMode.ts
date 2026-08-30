const { search } = globalThis.location;
const query = search
  ? search
    .substr(1)
    .split("&")
    // deno-lint-ignore no-explicit-any
    .reduce((prev: Record<string, any>, cur) => {
      const [key, val] = cur.split("=");
      // eslint-disable-next-line no-param-reassign
      prev[key] = val;

      return prev;
    }, {})
  : {};

const isDebugMode = (): boolean => "debug" in query;

export default isDebugMode;
