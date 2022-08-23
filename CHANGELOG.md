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
