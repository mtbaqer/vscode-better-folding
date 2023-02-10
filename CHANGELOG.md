# Change Log

## [0.5.0] - 2023-02-010

### Added

- Support showing the first property in a folded object literal.
- New config option to showing folded object previews.

### Fixed

- Fixed the extension not working on files that have an empty bracket ranges as first range.

## [0.4.0] - 2023-02-07

### Changed

- showOnlyRegionsDescriptions settings now defaults to false.

### Fixed

- Improved performance significantly. Extension should run 2-3 times faster now.
- Fixed collapsed text not showing in bright themes. (not that we support such practices).

## [0.3.1] - 2023-02-03

### Fixed

- The extension should now work on Dev Containers. (Thanks to @tom-fletcher).
- Improve performance for non-jsx languages.
- Fixed a bug where including the closing brackets would not work sometimes on newly opened tabs with new languages.

## [0.3.0] - 2023-01-31

### Added

- Two new commands, `Create Zen Folds Around Selection` and `Clear Zen Folds`. Zen folds are folds that hide everything expect the selected lines. They are useful for hiding code that is not relevant to the current task.

### Fixed

- Fixed a bug where the including the closing brackets would not work on some Windows 10 machines.

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
