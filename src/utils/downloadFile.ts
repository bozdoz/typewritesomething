export const downloadFile = (filename: string, data: string) => {
  const a = document.createElement("a");
  a.href = data;
  a.rel = "download";
  a.download = filename;
  a.click();
};

export const JSONToFileString = (json: unknown): string =>
  `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json))}`;
