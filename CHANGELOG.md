# [2.0.0](https://github.com/unional/fixture/compare/v1.8.5...v2.0.0) (2022-06-05)


* feat!: upgrade chalk ([33be932](https://github.com/unional/fixture/commit/33be932904b39c05dde0d07146b2ae203fcda97c))


### BREAKING CHANGES

* upgrade chalk

`chalk@5` is published as ESM, and that breaks `jest`.

Need to add this to `jest.config.js`:

```
{
  moduleNameMapper: {
    '#(.*)': '<rootDir>/node_modules/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk)/)'
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
