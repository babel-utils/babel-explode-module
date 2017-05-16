# babel-explode-module

> Serialize a module into an easier format to work with

```js
import {foo, bar} from "mod";

export default function() {
  // ...
}

const baz = 42,
      bat = class Bat {};

export {
  baz,
  bat
};
```

Creating this AST:

```yml
Program
  body:
    - ImportDeclaration
        specifiers:
          - ImportSpecifier
          - ImportSpecifier
    - ExportDefaultDeclaration
        declaration: FunctionDeclaration
    - VariableDeclaration
        declarations:
          - VariableDeclarator
          - VariableDeclarator
    - ExportNamedDeclaration
        specifiers:
          - ExportSpecifier
          - ExportSpecifier
```

Will be exploded to this:

```js
{
  imports: [
    { local: "foo", external: "bar", source: "mod" },
    { local: "bar", external: "bar", source: "mod" },
  ],
  exports: [
    { local: "_default", external: "default" },
    { local: "baz", external: "baz" },
    { local: "bat", external: "bat" },
  },
  statements: [
    { type: "FunctionDeclaration" },
    { type: "VariableDeclaration", declarations: VariableDeclarator },
    { type: "VariableDeclaration", declarations: VariableDeclarator },
  ],
}
```
