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
    { local: "foo", external: "foo", source: "mod" },
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

#### Serializes imports/exports to an easy to work with format

```js
// input
import a, {b} from "mod";
import * as c from "mod";
export default function d() {}
export {e, f as g};
export {default as h} from "mod";
export * from "mod";
```

```js
// output
{
  imports: [
    { local: "a", external: "a", source: "mod" },
    { local: "b", external: "b", source: "mod" },
    { local: "c", source: "d" },
  ],
  exports: [
    { local: "d", external: "d" },
    { local: "e", external: "e" },
    { local: "f", external: "g" },
    { local: "default", external: "g", source: "mod" },
    { source: "mod" },
  ]
}
```

#### Simplifies declarations to create 1 binding per statement (i.e. variables)

```js
// input
function a() {}
var b,
    c;
```

```js
// output (printed)
function a() {}
var b;
var c;
```

#### Splits export values away from their exports

```js
// input
export function a() {}
export default function() {}
```

```js
// output (printed)
function a() {}
var _default = function() {};
export {a};
export default _default;
```
