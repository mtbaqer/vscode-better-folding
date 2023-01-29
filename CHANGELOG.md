# Change Log

## [0.2.2] - 2023-01-29

### Changed

- The bundle size should be much smaller now.

### Fixed

- The extension should now work on Linux, WSL and remote workspaces.


## [0.2.1] - 2023-01-26

### Changed

- Made JSX and TSX show up faster on switching between tabs by caching the ranges per document.

### Fixed

- Fixed JSX and TSX ranges unfolding in case of invalid syntax somewhere else in the file.


## [0.2.0] - 2023-01-26

### Added

- Config option to disable chaining of folding ranges.
- Support for showing function params in folded functions.
- Support folding generics.
- Support JSX and TSX (HTML and XML coming next).
- Config option to disable folding closing tags.

### Changed

- Showing function params in folded functions is enabled by default.
- Reorder config options.

## [0.1.1] - 2023-01-22

- Initial release
