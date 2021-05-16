import { compressToUTF16 } from 'lz-string';
import * as Storage from './Storage';

jest.mock('lz-string', () => ({
  // fake compress
  compressToUTF16: jest.fn((str: string) => `_____${str}`),
  // fake decompress
  decompressFromUTF16: jest.fn((str: string) => str.substr(5)),
}));

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('gets storage info', () => {
    const info = Storage.getInfo();

    expect(info.numCreated).toBe(0);
    expect(info.data).toHaveLength(0);
  });

  it('can set info', () => {
    const info: ReturnType<typeof Storage.getInfo> = {
      data: [
        {
          created: 123,
          lastModified: 123,
          name: 'Undefined',
          key: 'tws-4',
        },
      ],
      numCreated: 2,
    };

    Storage.setInfo(info);

    const newInfo = Storage.getInfo();

    expect(newInfo).toEqual(expect.objectContaining(info));
  });

  it('compresses new data before saving', () => {
    const str = '[JSON data]';
    Storage.create(str);

    expect(compressToUTF16).toHaveBeenCalledTimes(1);
    expect(compressToUTF16).toHaveBeenCalledWith(str);
  });

  it('can create new entry', () => {
    const str = '[JSON data]';
    Storage.create(str);

    const info = Storage.getInfo();

    expect(info.data).toHaveLength(1);
    expect(info.numCreated).toBe(1);
    expect(Number(info.data[0].created)).not.toBeNaN();
    expect(Number(info.data[0].lastModified)).not.toBeNaN();
    expect(info.data[0].name).toBe('Writing #1');
    expect(info.data[0].key).toBe('tws-1');
  });

  it('can get info for created item by id', () => {
    const str = '[JSON data]';
    const id = Storage.create(str);
    const [item, index] = Storage.getDataById(id);

    expect(item).not.toBeNull();
    expect(index).toBe(0);
    expect(item?.name).toBe(`Writing #1`);
  });

  it('returns null for getDataById if does not exist', () => {
    const [item, index] = Storage.getDataById('nada');

    expect(item).toBeNull();
    expect(index).toBe(-1);
  });

  it('can get saved data', () => {
    const str = '[JSON data]';
    Storage.create(str);

    const data = Storage.get('tws-1');

    expect(data).toBe(str);
  });

  it('returns null for get if does not exist', () => {
    const data = Storage.get('nada');

    expect(data).toBeNull();
  });

  it('can update name of saved data', () => {
    const str = '[JSON data]';
    Storage.create(str);

    Storage.update('tws-1', { name: 'Wow' });

    const info = Storage.getInfo();

    expect(info.data[0].name).toBe('Wow');
  });

  it('can delete saved data', () => {
    // eslint-disable-next-line no-proto
    jest.spyOn(window.localStorage.__proto__, 'removeItem');

    const str = '[JSON data]';
    Storage.create(str);

    expect(localStorage.getItem('tws-1')).toBeTruthy();

    Storage.deleteById('tws-1');

    const info = Storage.getInfo();

    // clears info
    expect(info.data).toHaveLength(0);
    expect(info.numCreated).toBe(1);
    // clears saved item
    expect(localStorage.getItem('tws-1')).toBeFalsy();

    expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
  });

  it('does not throw when does not exist', () => {
    // eslint-disable-next-line no-proto
    jest.spyOn(window.localStorage.__proto__, 'removeItem');

    expect(() => {
      Storage.deleteById('tws-101');
    }).not.toThrow();

    expect(localStorage.removeItem).toHaveBeenCalledTimes(0);
  });

  it('returns id from create method', () => {
    const str = '[JSON data]';
    const id = Storage.create(str);

    expect(id).toBe('tws-1');
  });

  it('can update last loaded writing', () => {
    const id = Storage.create('temp');
    const str = '[JSON data]';
    Storage.updateWriting(id, str);

    expect(Storage.get(id)).toBe(str);
  });
});
