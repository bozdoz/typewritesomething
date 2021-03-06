import * as Storage from '../Storage';
import { downloadFile, JSONToFileString } from './downloadFile';
import getFileContents from './getFileContents';

interface Exported {
  data: ReturnType<typeof Storage.getInfo>['data'];
  writings: string[];
}

export const exportSaved = () => {
  const output: Exported = {
    data: Storage.getInfo().data,
    writings: [],
  };

  if (output.data.length === 0) {
    return;
  }

  for (const { key } of output.data) {
    const writing = Storage.get(key);
    if (writing) {
      output.writings.push(writing);
    }
  }

  const fileData = JSONToFileString(output);

  downloadFile('tws.json', fileData);
};

export const importSaved = async () => {
  // file prompt
  const contents = await getFileContents();

  const { writings, data }: Exported = JSON.parse(contents);

  // import to Storage
  writings.forEach((writing, i) => {
    Storage.create(writing, data[i]);
  });
};
