/** It adds a script tag to the DOM */
const loadScript = (
  src: string,
  options: Partial<Writable<HTMLScriptElement>> = {}
) => {
  const script = document.createElement('script');
  const firstScript = document.getElementsByTagName('script')[0];
  script.async = true;
  script.src = src;

  for (const key in options) {
    const typedKey = key as keyof typeof options;
    (script as any)[typedKey] = options[typedKey];
  }

  firstScript.parentNode?.insertBefore(script, firstScript);
};

export default loadScript;
