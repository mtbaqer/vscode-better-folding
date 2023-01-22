<p align="center">
    <img width="128" alt="icon" src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/icon/icon_large.png">
</p>

<h2 align="center"> Better Folding - VSCode Extension </h2>

# Better Folding

Better Folding provides many commonly requested folding-related features all together in one extension. 

</br>

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/Preview.png"
  alt="VS Code Blockman Icon"
/>
</p>

## Disclaimer
This is the first release of the extension, so it is not fully battle tested yet. If you encounter any issue or would like to contribute, [please visit the GitHub page](https://github.com/mtbaqer/vscode-better-folding).

## Features
### Folding Closing Brackets

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/closingBrackets.png"
  alt="VS Code Blockman Icon"
/>
</p>


### Showing Folded Lines Count

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/lineCount.png"
  alt="VS Code Blockman Icon"
/>
</p>

## Showing Folded Brackets

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/showFoldedBrackets.png"
  alt="VS Code Blockman Icon"
/>
</p>

### Showing Only The Region Description

<p align="center">
<img
  src="https://raw.githubusercontent.com/mtbaqer/vscode-better-folding/main/demo-media/images/regions.png"
  alt="VS Code Blockman Icon"
/>
</p>

## Planned Features

### Folding closing HTML/JSX/TSX tags
Based on [microsoft/vscode#24515](https://github.com/microsoft/vscode/issues/24515)

### Show function content for short functions
Based on [microsoft/vscode#76396](https://github.com/microsoft/vscode/issues/76396)

### Show objects preview
Based on [microsoft/vscode#168028](https://github.com/microsoft/vscode/issues/168028)

### Show only function arguments names in folded function parentheses

Inspired by [microsoft/pylance-release#3385](https://github.com/microsoft/pylance-release/issues/3385)

## Supported Languages:
**Most brackets-based languages:** JavaScript, TypeScript, C, C#, C++, Java, Kotlin, PHP, Go (Golang), Dart, Rust, Swift, CSS, LESS, SCSS and more...

**Work in progress:** HTML, JSX and TSX.

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

- Folding not working if it is the at the end of the file (you can temporarily fix this by add an empty comment below it). This is a problem with VSCode API, waiting the bug to be address by the VSCode team.

## Big thanks to these source codes
[Bracket-Pair-Colorizer-2](https://github.com/CoenraadS/Bracket-Pair-Colorizer-2) (by CoenraadS)

[vscode-blockman](https://github.com/leodevbro/vscode-blockman) (by leodevbro)

[vscode-inline-fold](https://github.com/moalamri/vscode-inline-fold) (by moalamri)

[vscode-explicit-folding](https://github.com/zokugun/vscode-explicit-folding) (by zokugun)