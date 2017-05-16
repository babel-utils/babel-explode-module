// @flow
import * as babylon from 'babylon';
import explodeModule from '../src';
import printAST from 'ast-pretty-print';

export let parse = (code: string) => {
  return babylon.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'doExpressions',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'asyncGenerators',
      'functionBind',
      'functionSent',
      'dynamicImport',
    ],
  });
};

type Suite = {
  name: string,
  tests: {
    [name: string]: {
      code: string,
      skip?: boolean,
      only?: boolean,
    },
  },
};

export let testSuite = (suite: Suite) => {
  describe(suite.name, () => {
    for (let testName of Object.keys(suite.tests)) {
      let testOpts = suite.tests[testName];
      let testFn;

      if (testOpts.only) testFn = test.only;
      else if (testOpts.skip) testFn = test.skip;
      else testFn = test;

      testFn(testName, () => {
        let code = testOpts.code;
        let ast = parse(code);
        let exploded = explodeModule(ast);
        let printed = printAST(exploded);
        expect(`\ncode:\n\n${code}\n\nexploded:\n${printed}`).toMatchSnapshot();
      });
    }
  });
};
