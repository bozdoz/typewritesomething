function createElement<T extends keyof HTMLElementTagNameMap>(
  tagname: T,
  params?: Partial<Writable<HTMLElementTagNameMap[T]>>,
): HTMLElementTagNameMap[T] {
  const elem = document.createElement(tagname);

  // eslint-disable-next-line guard-for-in
  for (const key in params) {
    const typedKey = key as keyof typeof params;
    // deno-lint-ignore no-explicit-any
    (elem as any)[typedKey] = params[typedKey];
  }

  return elem;
}

export default createElement;
