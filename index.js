// @flow
'use strict';
const t = require('babel-types');

/*::
type Location = {
  line: number,
  column: number,
};

type Loc = {
  start?: Location,
  end?: Location,
};

type Node = {
  type: string,
  [key: string]: any,
  start?: number,
  end?: number,
  loc?: Loc,
  leadingComments?: Object | null | void,
  trailingComments?: Object | null | void,
  innerComments?: Object | null | void,
};

type ModuleSpecifier = {
  kind?: 'value' | 'type' | 'typeof',
  local?: string,
  external?: string,
  source?: string,
  loc: Loc,
};

type ExplodedImports = Array<ModuleSpecifier>;
type ExplodedExports = Array<ModuleSpecifier>;
type ExplodedStatements = Array<Node>;

type Exploded = {
  imports: ExplodedImports,
  exports: ExplodedExports,
  statements: ExplodedStatements,
};
*/

let isProgram = node => {
  return node.type === 'Program';
};

let unexpected = node => {
  return new Error(`Unexpected node type: ${node.type}`);
};

let location = node => {
  let obj = {};
  if (node.start !== undefined) obj.start = node.start;
  if (node.end !== undefined) obj.end = node.end;
  if (node.loc !== undefined) obj.loc = node.loc;
  return obj;
};

let comments = node => {
  let obj = {};
  if (node.leadingComments !== undefined)
    obj.leadingComments = node.leadingComments;
  if (node.trailingComments !== undefined)
    obj.trailingComments = node.trailingComments;
  if (node.innerComments !== undefined) obj.innerComments = node.innerComments;
  return obj;
};

let toVariableDeclaration = (
  kind /*: string */,
  name /*: string */,
  declaration /*: Node */
) => {
  return Object.assign(
    t.variableDeclaration(kind, [
      Object.assign(
        t.variableDeclarator(t.identifier(name), t.toExpression(declaration)),
        location(declaration)
      ),
    ]),
    location(declaration),
    comments(declaration)
  );
};

let toModuleSpecifier = (
  kind /*: 'value' | 'type' | 'typeof' | null */,
  local /*: string | null */,
  external /*: string | null */,
  source /*: string | null */,
  loc /*: Loc */
) => {
  let specifier = {};
  if (kind) specifier.kind = kind;
  if (local) specifier.local = local;
  if (external) specifier.external = external;
  if (source) specifier.source = source;
  specifier.loc = loc;
  return specifier;
};

let getSource = node => {
  return node.source ? node.source.value : null;
};

let exploders = {};

exploders.ImportDeclaration = (node, exploded) => {
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
        local = specifier.local.name;
        external = kind === 'value' ? 'default' : local; // Flow is dumb...
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        local = specifier.local.name;
      } else {
        throw unexpected(specifier);
      }

      exploded.imports.push(toModuleSpecifier(kind, local, external, source, specifier.loc));
    }
  } else {
    exploded.imports.push(toModuleSpecifier(null, null, null, source, node.loc));
  }
};

exploders.ExportDefaultDeclaration = (node, exploded) => {
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
      toVariableDeclaration('const', local, declaration)
    );
  } else {
    throw unexpected(declaration);
  }

  exploded.exports.push(toModuleSpecifier(null, local, 'default', source, node.loc));
};

exploders.ExportNamedDeclaration = (node, exploded) => {
  let source = getSource(node);
  let declaration = node.declaration;

  if (declaration) {
    if (t.isVariableDeclaration(declaration)) {
      for (let declarator of declaration.declarations) {
        let name = declarator.id.name;
        exploded.exports.push(toModuleSpecifier(null, name, name, source, declaration.loc));
        exploded.statements.push(
          Object.assign(
            t.variableDeclaration(declaration.kind, [declarator]),
            location(declarator),
            comments(declaration)
          )
        );
      }
    } else if (
      t.isClassDeclaration(declaration) ||
      t.isFunctionDeclaration(declaration) ||
      t.isTypeAlias(declaration) ||
      t.isInterfaceDeclaration(declaration)
    ) {
      let name = declaration.id.name;
      exploded.exports.push(toModuleSpecifier(null, name, name, source, declaration.loc));
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

      exploded.exports.push(toModuleSpecifier(null, local, external, source, specifier.loc));
    }
  }
};

exploders.ExportAllDeclaration = (node, exploded) => {
  let source = getSource(node);
  exploded.exports.push(toModuleSpecifier(null, null, null, source, node.loc));
};

exploders.VariableDeclaration = (node, exploded) => {
  for (let declarator of node.declarations) {
    exploded.statements.push(
      Object.assign(
        t.variableDeclaration(node.kind, [declarator]),
        location(declarator),
        comments(node)
      )
    );
  }
};

// do nothing...
exploders.EmptyStatement = () => {};

function explodeModule(node /*: Node */) /*: Exploded */ {
  if (t.isFile(node)) {
    node = node.program;
  } else if (!t.isProgram(node)) {
    throw new Error(
      `Must pass a "File" or "Program" node to explode module, received ${node.type}`
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

module.exports = explodeModule;
