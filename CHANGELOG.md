## 1.0.1 (2021-04-14)

### Bug Fixes

- Fixed saved writing compression for Firefox (using lz-string compressToUTF16)

### Performance Improvements

- Likely reduced file size (124.33kb) due to tree-shaking

### BREAKING CHANGES

- lz-string compress is not compatible with compressToUTF16; all previously saved writings are lost :(

## 1.0.0 (2021-04-13)

### Features

- Saving writings, and exporting
- Moved to Typescript, with Rollup, prettier, and jest tests