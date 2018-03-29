// @flow
'use strict';
const t = require('@babel/types');
const {explodeModule} = require('./');
const pluginTester = require('babel-plugin-tester');
const printAST = require('ast-pretty-print');
const getBabylonOptions = require('babylon-options');

const babelOptions = (plugins=[]) => ({
  parserOpts: getBabylonOptions({
    stage: 0,
    plugins,
  }),
});

const plugin = () => {
  return {
    name: 'babel-explode-module',
    visitor: {
      Program(path) {
        let exploded = explodeModule(path.node);
        let printed = printAST(exploded) + '\n';

        path.replaceWith(
          t.program([
            t.expressionStatement(
              t.templateLiteral([
                t.templateElement({ raw: printed }, true)
              ], [])
            )
          ])
        );
        path.stop();
      },
    },
  };
};

/*::
type Tests = { [string]: { code: string } }
*/

function runTests(name, tests /*: { js: Tests, flow?: Tests, ts?: Tests }*/) {
  pluginTester({
    title: name,
    plugin,
    snapshot: true,
    babelOptions: babelOptions(),
    tests: tests.js,
  });
  
  pluginTester({
    title: `${name} (ts)`,
    plugin,
    snapshot: true,
    babelOptions: babelOptions(['typescript']),
    tests: Object.assign({}, tests.js, tests.ts),
  });
  
  pluginTester({
    title: `${name} (flow)`,
    plugin,
    snapshot: true,
    babelOptions: babelOptions(['flow']),
    tests: Object.assign({}, tests.js, tests.flow),
  });
}

runTests('export', {
  js: {
    'default binding': {code: 'export default a;'},
    'default object': {code: 'export default {a};'},
    'default array': {code: 'export default [a];'},
    'default number': {code: 'export default 1;'},
    'default string': {code: 'export default "a";'},
    'default boolean': {code: 'export default true;'},
    'default expression': {code: 'export default a ? b : c;'},
    'default named function': {code: 'export default function a() {}'},
    'default function': {code: 'export default function() {}'},
    'default named class': {code: 'export default class a {}'},
    'default class': {code: 'export default class {}'},
    'named specifier': {code: 'export {a}'},
    'named specifier multiple': {code: 'export {a, b}'},
    'named specifier renamed': {code: 'export {a as b}'},
    'named function': {code: 'export function a() {}'},
    'named class': {code: 'export class a {}'},
    'named var': {code: 'export var a;'},
    'named var multiple': {code: 'export var a, b;'},
    'named let': {code: 'export let a;'},
    'from default': {code: 'export default from "b";'},
    'from default renamed': {code: 'export a from "b";'},
    'from all': {code: 'export * from "b";'},
    'from named': {code: 'export {a} from "b";'},
    'from named multiple': {code: 'export {a, b} from "b";'},
    'from named renamed': {code: 'export {a as b} from "c";'},
    'from named default renamed': {code: 'export {default as a} from "b";'},
  },
  ts: {
    'export type': { code: 'export type a = {}' },
    'export interface': { code: 'export interface a {}' },
  }
});

runTests('imports', {
  js: {
    default: {code: 'import a from "b";'},
    named: {code: 'import {a} from "b";'},
    'named renamed': {code: 'import {a as b} from "c";'},
    namespace: {code: 'import * as a from "b";'},
    'default and named': {code: 'import a, {b} from "c";'},
    effect: {code: 'import "c";'},
  },
  flow: {
    'import type': {code: 'import type a from "b";'},
    'import typeof': {code: 'import typeof a from "b";'},
    'import type inner': {code: 'import {type a} from "b";'},
    'import typeof inner': {code: 'import {typeof a} from "b";'},
    'import value/type/typeof inner': {
      code: 'import {a, type b, typeof c} from "b";',
    },
  }
});

runTests('statements', {
  js: {
    empty: {code: ';'},
    variable: {code: 'var a;'},
    function: {code: 'function a() {}'},
    class: {code: 'class a {}'},
    'variable multiple': {code: 'var a, b;'},
    for: {code: 'for (;;) {}'},
    while: {code: 'while (a) {}'},
  },
  flow: {
    'type alias': {code: 'type a = {};'},
    interface: {code: 'interface a {}'},
  },
  ts: {
    'type alias': {code: 'type a = {};'},
    interface: {code: 'interface a {}'},
  },
});
