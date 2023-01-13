import { ExtensionContext, FoldingRange, FoldingRangeKind, languages, window } from "vscode";

export function activate(context: ExtensionContext) {
  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second,
  // it can override the default language folding provider.
  setTimeout(() => {
    context.subscriptions.push(
      languages.registerFoldingRangeProvider(
        { language: "typescript", scheme: "file" },
        {
          provideFoldingRanges(document) {
            const ranges = [];

            //regex to match functions in typescript
            const functionRegex =
              /function\s*([A-z0-9]+)?\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}/g;

            let match;
            while ((match = functionRegex.exec(document.getText()))) {
              if (match && !match[0]) continue;

              const startPosition = document.positionAt(match.index);
              const endPosition = document.positionAt(match.index + match[0].length);

              if (startPosition.line !== endPosition.line) {
                ranges.push(new FoldingRange(startPosition.line, endPosition.line, FoldingRangeKind.Region));
              }
            }

            return ranges;
          },
        }
      )
    );
  }, 1000);

  context.subscriptions.push(
    window.onDidChangeTextEditorVisibleRanges((e) => {
      if (e) {
        console.log("onDidChangeTextEditorVisibleRanges");
      }
    })
  );
}

export function deactivate() {}
