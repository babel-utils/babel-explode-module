// @flow
const t = require('babel-types');

type Location = {
  line: number,
  column: number,
};

type Node = {
  type: string,
  [key: string]: any,
  start?: number,
  end?: number,
  loc?: {
    start?: Location,
    end?: Location,
  },
  leadingComments?: Object | null | void,
  trailingComments?: Object | null | void,
  innerComments?: Object | null | void,
};

type ModuleSpecifier = {
  kind?: 'value' | 'type' | 'typeof',
  local?: string,
  external?: string,
  source?: string,
};

type ExplodedImports = Array<ModuleSpecifier>;
type ExplodedExports = Array<ModuleSpecifier>;
type ExplodedStatements = Array<Node>;

type Exploded = {
  imports: ExplodedImports,
  exports: ExplodedExports,
  statements: ExplodedStatements,
};

let isProgram = (value: Node) => {
  return value.type === 'Program';
};

let unexpected = (value: Node) => {
  return new Error(`Unexpected node type: ${value.type}`);
};

let location = (node: Node) => {
  return {
    start: node.start,
    end: node.end,
    loc: node.loc,
  };
};

let comments = (node: Node) => {
  return {
    leadingComments: node.leadingComments,
    trailingComments: node.trailingComments,
    innerComments: node.innerComments,
  };
};

let toVariableDeclaration = (kind: string, name: string, declaration: Node) => {
  return {
    ...t.variableDeclaration(kind, [
      {
        ...t.variableDeclarator(
          t.identifier(name),
          t.toExpression(declaration),
        ),
        ...location(declaration),
      },
    ]),
    ...location(declaration),
    ...comments(declaration),
  };
};

let toModuleSpecifier = (
  kind: 'value' | 'type' | 'typeof' | null,
  local: string | null,
  external: string | null,
  source: string | null,
) => {
  let specifier = {};
  if (kind) specifier.kind = kind;
  if (local) specifier.local = local;
  if (external) specifier.external = external;
  if (source) specifier.source = source;
  return specifier;
};

let getSource = (node: Node): string | null => {
  return node.source ? node.source.value : null;
};

let exploders = {};

exploders.ImportDeclaration = (node: Node, exploded: Exploded) => {
  let source = getSource(node);
  let importKind = node.importKind;

  if (node.specifiers.length) {
    for (let specifier of node.specifiers) {
      let local = null;
      let external = null;
      let kind = importKind;

      if (specifier.type === 'ImportSpecifier') {
        external = specifier.imported.name;
        local = specifier.local.name;
        kind = specifier.importKind || kind;
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        external = 'default';
        local = specifier.local.name;
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        local = specifier.local.name;
      } else {
        throw unexpected(specifier);
      }

      exploded.imports.push(toModuleSpecifier(kind, local, external, source));
    }
  } else {
    exploded.imports.push(toModuleSpecifier(null, null, null, source));
  }
};

exploders.ExportDefaultDeclaration = (node: Node, exploded: Exploded) => {
  let source = getSource(node);
  let declaration = node.declaration;
  let local;

  if (t.isIdentifier(declaration)) {
    local = declaration.name;
  } else if (
    t.isFunctionDeclaration(declaration) ||
    t.isClassDeclaration(declaration)
  ) {
    if (declaration.id) {
      local = declaration.id.name;
    } else {
      local = '_default';
      declaration = toVariableDeclaration('const', local, declaration);
    }

    exploded.statements.push(declaration);
  } else if (t.isExpression(declaration)) {
    local = '_default';
    exploded.statements.push(
      toVariableDeclaration('const', local, declaration),
    );
  } else {
    throw unexpected(declaration);
  }

  exploded.exports.push(toModuleSpecifier(null, local, 'default', source));
};

exploders.ExportNamedDeclaration = (node: Node, exploded: Exploded) => {
  let source = getSource(node);
  let declaration = node.declaration;

  if (declaration) {
    if (t.isVariableDeclaration(declaration)) {
      for (let declarator of declaration.declarations) {
        let name = declarator.id.name;
        exploded.exports.push(toModuleSpecifier(null, name, name, source));
        exploded.statements.push({
          ...t.variableDeclaration(declaration.kind, [declarator]),
          ...location(declarator),
          ...comments(declaration),
        });
      }
    } else if (
      t.isClassDeclaration(declaration) ||
      t.isFunctionDeclaration(declaration) ||
      t.isTypeAlias(declaration) ||
      t.isInterfaceDeclaration(declaration)
    ) {
      let name = declaration.id.name;
      exploded.exports.push(toModuleSpecifier(null, name, name, source));
      exploded.statements.push(declaration);
    } else {
      throw unexpected(declaration);
    }
  } else {
    for (let specifier of node.specifiers) {
      let exported = specifier.exported.name;
      let local;
      let external;

      if (specifier.local) {
        local = specifier.local.name;
        external = exported;
      } else {
        local = exported;
        external = exported;
      }

      exploded.exports.push(toModuleSpecifier(null, local, external, source));
    }
  }
};

exploders.ExportAllDeclaration = (node: Node, exploded: Exploded) => {
  let source = getSource(node);
  exploded.exports.push(toModuleSpecifier(null, null, null, source));
};

exploders.VariableDeclaration = (node: Node, exploded: Exploded) => {
  for (let declarator of node.declarations) {
    exploded.statements.push({
      ...t.variableDeclaration(node.kind, [declarator]),
      ...location(declarator),
      ...comments(node),
    });
  }
};

// do nothing...
exploders.EmptyStatement = () => {};

export default function explodeModule(node: Node): Exploded {
  if (t.isFile(node)) {
    node = node.program;
  } else if (!t.isProgram(node)) {
    throw new Error(
      `Must pass a "File" or "Program" node to explode module, received ${node.type}`,
    );
  }

  let exploded = {
    imports: [],
    exports: [],
    statements: [],
  };

  for (let item of node.body) {
    let exploder = exploders[item.type];
    if (exploder) {
      exploder(item, exploded);
    } else {
      exploded.statements.push(item);
    }
  }

  return exploded;
}
