# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.11.0](https://github.com/adbayb/stack/compare/v0.10.0...v0.11.0) (2022-03-31)


### Bug Fixes

* **scripts:** filter ts files for typechecking ([20760ee](https://github.com/adbayb/stack/commit/20760eea7db77de6037e6592d816ca9a0fc3b5d1))
* **scripts:** resolve root directory with git ([7ba133c](https://github.com/adbayb/stack/commit/7ba133c5740eee35697728651394ed5224b087ff))


### Features

* **prettier-config:** add singleAttributePerLine property ([433e86f](https://github.com/adbayb/stack/commit/433e86fc92bfc3498598e480362ef301dcd945a4))
* **scripts:** add commit-msg linter ([ad76f3a](https://github.com/adbayb/stack/commit/ad76f3a5071824c7ca137357695bef7ce4686f69))
* **scripts:** add git hooks installation ([60c6612](https://github.com/adbayb/stack/commit/60c661273fe90db9ca777f82ed6245455b44316b))
* **scripts:** add prettier formatter for unsupported linter ext ([901b128](https://github.com/adbayb/stack/commit/901b12818298957899347e3e7da7f98f82b893ea))
* **scripts:** add release command ([f04dba9](https://github.com/adbayb/stack/commit/f04dba9e2be1fb72d1966bcf0dfa46542e8eeeb6))
* **scripts:** add setup command ([4fe191c](https://github.com/adbayb/stack/commit/4fe191c746652c9fd0e589ae7fae157f72f9b889))
* **scripts:** add test step in verify command ([4b0383c](https://github.com/adbayb/stack/commit/4b0383c4b240944c7df41046c4c89f261342d39e))
* **scripts:** automatically run setup command on module installation ([391be78](https://github.com/adbayb/stack/commit/391be7876ac88c712c1a4e61091014f0dc6f67d4))
* **scripts:** support file inputs ([7fefbae](https://github.com/adbayb/stack/commit/7fefbaec69e9d3904b655064834b7d587b3f6ea7))
* **scripts:** upgrade quickbundle and termost ([b0249db](https://github.com/adbayb/stack/commit/b0249db4d84271d351810366a246448ad49017fe))
* **scripts:** use built-in package manager to resolve bin instead of yarn ([80a5fd4](https://github.com/adbayb/stack/commit/80a5fd4776b4f36ac6e583e289342bfe2474e22e))
* **scripts:** use vitest API globally ([798d7a0](https://github.com/adbayb/stack/commit/798d7a04aada8240eb1c6e5f42545325efb93892))





# [0.10.0](https://github.com/adbayb/stack/compare/v0.9.0...v0.10.0) (2021-11-25)

### Features

-   **prettier-config:** make prettier a peer dependency ([7ff4fe8](https://github.com/adbayb/stack/commit/7ff4fe86438dbccfebe27ad71fabd2108e1b848e))

# [0.9.0](https://github.com/adbayb/stack/compare/v0.8.0...v0.9.0) (2021-11-23)

**Note:** Version bump only for package @adbayb/scripts

# [0.8.0](https://github.com/adbayb/stack/compare/v0.7.0...v0.8.0) (2021-11-23)

**Note:** Version bump only for package @adbayb/scripts

# [0.7.0](https://github.com/adbayb/stack/compare/v0.6.1...v0.7.0) (2021-07-17)

**Note:** Version bump only for package @adbayb/scripts

## [0.6.1](https://github.com/adbayb/stack/compare/v0.6.0...v0.6.1) (2021-04-05)

### Bug Fixes

-   **scripts:** outDir wrong update ([54f60f7](https://github.com/adbayb/stack/commit/54f60f78edd6ac4a582bd1ea523ff7d95960b6ed))

# [0.6.0](https://github.com/adbayb/stack/compare/v0.5.0...v0.6.0) (2021-04-05)

### Bug Fixes

-   **scripts:** allow live output display for child processes" ([623f581](https://github.com/adbayb/stack/commit/623f5815f8edf7a234a5e968f355c9b546b10ea2))

### Features

-   **scripts:** pre clean before watching ([6a8ab3c](https://github.com/adbayb/stack/commit/6a8ab3c11bc3248e54d5298a2b96356a22882b1c))
-   **scripts:** use quickbundle for build and watch commands ([f0dbb1e](https://github.com/adbayb/stack/commit/f0dbb1e7071f4c4da989833f294dd9d8302f808b))
-   **terminal-kit:** add library ([4c515b0](https://github.com/adbayb/stack/commit/4c515b0094beadf12d7169dc658a7de8917bfbde))

# [0.5.0](https://github.com/adbayb/create/compare/v0.4.0...v0.5.0) (2021-04-03)

### Features

-   **create:** remove adbayb pkg from create ([885f3d0](https://github.com/adbayb/create/commit/885f3d09f99cfbfd84729331bf06c2de10eb2bfe))
-   **scripts:** add build command ([63071b2](https://github.com/adbayb/create/commit/63071b2511be3e1263f5afec4bc3506ce2c12a16))
-   **scripts:** add clean command ([977e83f](https://github.com/adbayb/create/commit/977e83fc629a021b5b8f5d501ec363ecb5a5f4c2))
-   **scripts:** add fix command ([151ce13](https://github.com/adbayb/create/commit/151ce13dc11d884973d49cc2df713f6906413e51))
-   **scripts:** add preact build preset ([e9f71e0](https://github.com/adbayb/create/commit/e9f71e0ec1defcc3f7406c7a5e4eee6fd6f20c46))
-   **scripts:** add verify command ([a9d7ca3](https://github.com/adbayb/create/commit/a9d7ca3796b6c330efb2935aae6db252757894d7))
-   **scripts:** handle error gracefully ([0b9a921](https://github.com/adbayb/create/commit/0b9a92112ff52656f7d5f622ef825f09f0bf47e4))
-   **scripts:** read target from tsconfig and presets from pkg metadata ([5f0ebc5](https://github.com/adbayb/create/commit/5f0ebc5deaa482cf6d3fac3cb611c593e8293e30))

# [0.4.0](https://github.com/adbayb/create/compare/v0.3.0...v0.4.0) (2021-03-27)

### Features

-   **scripts:** add package ([0b956dc](https://github.com/adbayb/create/commit/0b956dc328f751b25fc89311953029a8fc2e4087))
