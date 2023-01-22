# Better Folding

Better Folding provides many commonly requested folding-related features put all together in one extension. 

[Preview](demo-media/images/Preview.png)

[Preview with line count](demo-media/images/PreviewWithCount.png)

## Features
### Folding Closing Brackets

[Closing Brackets](demo-media/images/closingBrackets.png)

### Showing Folded Lines Count

[Closing Brackets](demo-media/images/lineCount.png)

### Showing Only The Region Description

[Closing Brackets](demo-media/images/regions.png)


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