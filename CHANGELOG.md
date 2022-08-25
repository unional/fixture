## [3.0.1](https://github.com/unional/fixture/compare/v3.0.0...v3.0.1) (2022-08-25)


### Bug Fixes

* update README ([9ba6776](https://github.com/unional/fixture/commit/9ba6776ee029181cf2bf2de8f549b389e2b67543))

# [3.0.0](https://github.com/unional/fixture/compare/v2.0.2...v3.0.0) (2022-08-25)


### Bug Fixes

* improve code comments ([9cea98b](https://github.com/unional/fixture/commit/9cea98bfa47e49801821fd9e49728bcee7fc5ae9))


### Features

* adjust folders to paths ([92cce46](https://github.com/unional/fixture/commit/92cce4638411abe11b19fbd6533cca117a368cf1))


### BREAKING CHANGES

* context behavir changed

The handler context now contains `case|baseline|resultPath` instead of folder.

The behavior for file-case and folder-case now are are same.

`casePath` points to the actual case file or folder.
`baseline|resultPath` always points to a folder  with case name.
Even if it is a file-case,
a folder with that name (including file extension) will be created.

This allows user to simply check `caseType` to see if it is a file or folder case and read the right thing,
based on their assumption of the structure.

This allows the `baseline()` to be used in a fixture folder with mixed file and folder cases.

## [2.0.2](https://github.com/unional/fixture/compare/v2.0.1...v2.0.2) (2022-08-23)


### Bug Fixes

* upgrade standard-log ([857a7a8](https://github.com/unional/fixture/commit/857a7a81b1f4452f1c2161093beab6c7832646ef))

## [2.0.1](https://github.com/unional/fixture/compare/v2.0.0...v2.0.1) (2022-06-07)


### Bug Fixes

* **deps:** update dependency standard-log to v8 ([2a2afbf](https://github.com/unional/fixture/commit/2a2afbf2492e21d4c33fa8db8099c1f6b32e71bf))
* **deps:** upgrade standard-log-color ([0ea01a7](https://github.com/unional/fixture/commit/0ea01a723ed8b44bee7906137166cbccdcda9b52))

# [2.0.0](https://github.com/unional/fixture/compare/v1.8.5...v2.0.0) (2022-06-05)


* feat!: upgrade chalk ([33be932](https://github.com/unional/fixture/commit/33be932904b39c05dde0d07146b2ae203fcda97c))


### BREAKING CHANGES

* upgrade chalk

`chalk@5` is published as ESM, and that breaks `jest`.

Need to add this to `jest.config.js`:

```jsonc
{
  moduleNameMapper: {
    '#(.*)': '<rootDir>/node_modules/$1' // needed for `chalk` getting `#ansi-styles`
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@unional\\fixture|chalk)/)'
  ]
}
```

## [1.8.5](https://github.com/unional/fixture/compare/v1.8.4...v1.8.5) (2022-06-05)


### Bug Fixes

* downgrade chalk ([41c89f2](https://github.com/unional/fixture/commit/41c89f2d84ee843ef4ae64a2b46965d56bc4927c))

## [1.8.4](https://github.com/unional/fixture/compare/v1.8.3...v1.8.4) (2022-06-05)


### Bug Fixes

* adding cjs back ([cbc9b9a](https://github.com/unional/fixture/commit/cbc9b9a5c1d92575989e5478dc29810f938df4ad))

## [1.8.3](https://github.com/unional/fixture/compare/v1.8.2...v1.8.3) (2022-06-05)


### Bug Fixes

* update deps ([a9f14d1](https://github.com/unional/fixture/commit/a9f14d1db6682b31a568126f12c844150a8e1217))
