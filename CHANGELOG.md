## [3.2.2](https://github.com/unional/fixture/compare/v3.2.1...v3.2.2) (2022-10-02)


### Bug Fixes

* **deps:** update dependency standard-log-color to v9 ([40acb22](https://github.com/unional/fixture/commit/40acb22d4ce6e1ba330785bad7cc57cca0be94d4))

## [3.2.1](https://github.com/unional/fixture/compare/v3.2.0...v3.2.1) (2022-09-07)


### Bug Fixes

* upgrade standard-log ([c2d875b](https://github.com/unional/fixture/commit/c2d875b87c16b642130080c145b8608f9de6300b))

# [3.2.0](https://github.com/unional/fixture/compare/v3.1.4...v3.2.0) (2022-09-07)


### Features

* add execCommand alt signature ([435a2d9](https://github.com/unional/fixture/commit/435a2d9a62d1fc768b71fd4d56be02adab8ad885))

## [3.1.4](https://github.com/unional/fixture/compare/v3.1.3...v3.1.4) (2022-09-05)


### Bug Fixes

* bundle cjs files ([6b352b8](https://github.com/unional/fixture/commit/6b352b8b3d087fabab829c908beda936373b337f))

## [3.1.3](https://github.com/unional/fixture/compare/v3.1.2...v3.1.3) (2022-09-05)


### Bug Fixes

* avoid creating baselines folder ([ee3a5c3](https://github.com/unional/fixture/commit/ee3a5c3f0b4870c8d604e6e717789c65ceb60253))

## [3.1.2](https://github.com/unional/fixture/compare/v3.1.1...v3.1.2) (2022-08-27)


### Bug Fixes

* misc adjustments ([3d72152](https://github.com/unional/fixture/commit/3d72152673bd3e5963300afc5a97712c41f504a2))

## [3.1.1](https://github.com/unional/fixture/compare/v3.1.0...v3.1.1) (2022-08-27)


### Bug Fixes

* update docs ([e1794a7](https://github.com/unional/fixture/commit/e1794a736d9522a2302f34a0e3422f587563d66b))

# [3.1.0](https://github.com/unional/fixture/compare/v3.0.1...v3.1.0) (2022-08-27)


### Bug Fixes

* adjust escape sequence ([4556b35](https://github.com/unional/fixture/commit/4556b3588c3beda728c6a1e6ab8cdfec4ee2cf31))
* another way to escape ([6de3428](https://github.com/unional/fixture/commit/6de34288e1a1ae1b4e41c86c568897cea1466cdc))
* do not create baseline folder ([6ab9111](https://github.com/unional/fixture/commit/6ab911176b5e36bb55d9e10d55908d3285399b3f))
* error case ([2485cff](https://github.com/unional/fixture/commit/2485cff420014ebe5877d9ffdfd9e25490f8af6e))
* try using execa ([ac3aab1](https://github.com/unional/fixture/commit/ac3aab1f435f72e07ac43fadf58f59edd0a8b782))
* update cp-file ([4953ee1](https://github.com/unional/fixture/commit/4953ee14d0db53f0afaa1d93e43a2f37c6ebab9c))


### Features

* add command support ([f8c612f](https://github.com/unional/fixture/commit/f8c612fc3ab3958efd41863ffe85744a3b32fa5c)), closes [#142](https://github.com/unional/fixture/issues/142)
* support windows ([3a95bf0](https://github.com/unional/fixture/commit/3a95bf04e08081bfc8689286598020a674d4b489))

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
