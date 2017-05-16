// @flow
import {testSuite} from '../../test/helpers';

testSuite({
  name: 'statements',
  tests: {
    empty: {code: ';'},
    variable: {code: 'var a;'},
    function: {code: 'function a() {}'},
    class: {code: 'class a {}'},
    'variable multiple': {code: 'var a, b;'},
    for: {code: 'for (;;) {}'},
    while: {code: 'while (a) {}'},
    'type alias': {code: 'type a = {};'},
    interface: {code: 'interface a {}'},
  },
});
