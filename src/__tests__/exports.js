// @flow
import {testSuite} from '../../test/helpers';

testSuite({
  name: 'export',
  tests: {
    'default binding': {code: 'export default a;'},
    'default object': {code: 'export default {a};'},
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
});
