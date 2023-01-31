<p align="center">
    <img width="128" alt="icon" src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/icon_large.png">
</p>

<h2 align="center"> Better Folding - VSCode Extension </h2>

# Better Folding

Better Folding provides many commonly requested folding-related features all together in one extension. 

</br>

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/Preview.gif"
  alt="Better Folding Extension Preview"
/>
</p>

## Disclaimer
This is the first release of the extension, so it is not fully battle tested yet. If you encounter any issue or would like to contribute, [please visit the GitHub page](https://github.com/mtbaqer/vscode-better-folding).

## Features
### Folding Closing Brackets

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/closingBrackets.png"
  alt="Better Folding Extension Folding Closing Brackets Feature Preview"
/>
</p>


### Showing Folded Lines Count

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/lineCount.png"
  alt="Better Folding Extension Showing Folded Lines Count Feature Preview"
/>
</p>

## Showing Folded Brackets

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/showFoldedBrackets.png"
  alt="Better Folding Extension Showing Folded Brackets Feature Preview"
/>
</p>

### Showing Only The Region Description

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/regions.png"
  alt="Better Folding Extension Showing Only The Region Description Feature Preview"
/>
</p>


### Show only function parameters names in folded function parentheses

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/functionParams.png"
  alt="Better Folding Extension Function Params Folding Preview"
/>
</p>


### Folding closing tags (currently JSX and TSX, HTML next)

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/foldingTags.png"
  alt="Better Folding Extension Folding Closing Tags Preview"
/>
</p>

### Zen Folding

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/zenFolding.gif"
  alt="Better Folding Extension Zen Folding Preview"
/>
</p>


## Planned Features

### Show function content for short functions
Based on [microsoft/vscode#76396](https://github.com/microsoft/vscode/issues/76396)

### Show objects preview
Based on [microsoft/vscode#168028](https://github.com/microsoft/vscode/issues/168028)

## Supported Languages:
**Most brackets-based languages:** JavaScript, TypeScript, C, C#, C++, Java, Kotlin, PHP, Go (Golang), Dart, Rust, Swift, CSS, LESS, SCSS and more...

**XML-based languages:** JSX and TSX.

**Work in progress:** HTML.

## Settings

For example:

This extension contributes the following settings:

- `betterFolding.foldClosingBrackets`: Include closing brackets like `}` and `]` in the folding range. extension.
- `betterFolding.showFoldedBodyLinesCount`: Shows the number of lines folded, excluding the closing bracket line.
<br />Example: `function example() { ⋯ 3 lines ⋯ `.
- `betterFolding.showFoldedBrackets`: 
Shows brackets like `{` and `}` in the collapsed text.
<br />Example: `function example() {…}`.
- `betterFolding.showOnlyRegionsDescriptions`: Only shows the region description in the collapsed text. 
<br />Example: `//#region some text ⋯`.
<br />Becomes: `some text`.
- `betterFolding.excludedLanguages`: List of languages to exclude from folding.

## Known Issues

- When switching between tabs, the folding ranges take a second to update. This is an issue with [VS Code itself](https://github.com/microsoft/vscode/issues/154977). Waiting for a fix.
- If a folding range is at the end of the file, sometimes it would fold the start line while scrolling. Again, this is an issue with VS Code API, will submit an issue to their repo soon.
- The cursor can hide behind the folded text. Working on a fix.

## Changelog

See the project's [changelog](https://github.com/mtbaqer/vscode-better-folding/blob/main/CHANGELOG.md) here.

## Big thanks to these source codes
[Bracket-Pair-Colorizer-2](https://github.com/CoenraadS/Bracket-Pair-Colorizer-2) (by CoenraadS)

[vscode-blockman](https://github.com/leodevbro/vscode-blockman) (by leodevbro)

[vscode-inline-fold](https://github.com/moalamri/vscode-inline-fold) (by moalamri)

[vscode-explicit-folding](https://github.com/zokugun/vscode-explicit-folding) (by zokugun)