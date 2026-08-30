interface GTag {
  // deno-lint-ignore no-explicit-any
  (...args: any[]): void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare interface Window {
  // deno-lint-ignore no-explicit-any
  dataLayer: any[];
  gtag: GTag;
}

const loadScript = (src: string) => {
  const script = document.createElement("script");
  const firstScript = document.getElementsByTagName("script")[0];
  script.async = true;
  script.src = src;
  firstScript.parentNode!.insertBefore(script, firstScript);
};

// deno-lint-ignore no-process-globals
if (process.env.NODE_ENV === "production") {
  // breaks down the snippet given by google analytics
  loadScript("https://www.googletagmanager.com/gtag/js?id=UA-73887811-5");

  globalThis.dataLayer = globalThis.dataLayer || [];

  globalThis.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    globalThis.dataLayer.push(arguments);
  };

  globalThis.gtag("js", new Date());

  globalThis.gtag("config", "UA-73887811-5");
} else {
  // eslint-disable-next-line no-console
  globalThis.gtag = console.log;
}
