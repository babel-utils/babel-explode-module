// @flow
import {testSuite} from '../../test/helpers';

testSuite({
  name: 'imports',
  tests: {
    default: {code: 'import a from "b";'},
    named: {code: 'import {a} from "b";'},
    'named renamed': {code: 'import {a as b} from "c";'},
    namespace: {code: 'import * as a from "b";'},
    'default and named': {code: 'import a, {b} from "c";'},
    effect: {code: 'import "c";'},
    'import type': {code: 'import type a from "b";'},
    'import typeof': {code: 'import typeof a from "b";'},
    'import type inner': {code: 'import {type a} from "b";'},
    'import typeof inner': {code: 'import {typeof a} from "b";'},
    'import value/type/typeof inner': {
      code: 'import {a, type b, typeof c} from "b";',
    },
  },
});
