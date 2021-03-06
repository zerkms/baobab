/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Baobab = require('../../src/baobab.js'),
    helpers = require('../../src/helpers.js'),
    update = require('../../src/update.js'),
    merge = require('../../src/merge.js');

describe('Helpers', function() {

  describe('Splice', function() {
    var splice = helpers.splice;

    it('should work in a non-mutative fashion.', function() {
      var array = ['yellow', 'blue', 'purple'];

      assert.deepEqual(
        splice(array, 0, 0),
        array
      );

      assert.deepEqual(
        splice(array, 0, 1),
        ['blue', 'purple']
      );

      assert.deepEqual(
        splice(array, 1, 1),
        ['yellow', 'purple']
      );

      assert.deepEqual(
        splice(array, 2, 1),
        ['yellow', 'blue']
      );

      assert.deepEqual(
        splice(array, 2, 0),
        array
      );

      assert.deepEqual(
        splice(array, 1, 2),
        ['yellow']
      );

      assert.deepEqual(
        splice(array, 2, 1, 'orange', 'gold'),
        ['yellow', 'blue', 'orange', 'gold']
      );

      assert.deepEqual(
        splice(array, 5, 3),
        array
      );

      assert.deepEqual(
        splice(array, 5, 3, 'orange', 'gold'),
        ['yellow', 'blue', 'purple', 'orange', 'gold']
      );

      assert.deepEqual(
        splice(array, 1, 0, 'gold'),
        ['yellow', 'gold', 'blue', 'purple']
      );

      assert.deepEqual(
        splice(array, 1, 1, 'gold'),
        ['yellow', 'gold', 'purple']
      );
    });
  });

  describe('Composition', function() {

    it('should be able to compose two simple functions.', function() {

      var inc = function(i) { return i + 1; },
        add2 = helpers.compose(inc, inc);

      assert.strictEqual(add2(1), 3);
    });
  });

  describe('Decoration', function() {

    it('should be possible to produce a before decoration.', function() {
      var count = 0,
          inc = function(i) { count++; },
          decorated = helpers.before(inc, inc);

      decorated();
      assert.strictEqual(count, 2);
    });
  });

  describe('Nested get', function() {
    it('should be possible to retrieve nested items.', function() {
      assert.deepEqual(helpers.getIn(state, ['one', 'subtwo', 'colors']), state.one.subtwo.colors);
      assert.strictEqual(helpers.getIn(state, ['primitive']), 3);
      assert.deepEqual(helpers.getIn(state), state);
      assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', 1]), 'yellow');
      assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', '1']), 'yellow');
      assert.strictEqual(helpers.getIn(state, ['inexistant', 'path']), undefined);
      assert.strictEqual(helpers.getIn(state, ['items', {id: 'two'}]), state.items[1]);
      assert.strictEqual(
        helpers.getIn(state, ['items', {user: {surname: 'Talbot'}}]),
        state.items[1]
      );
      assert.strictEqual(
        helpers.getIn(state, ['sameStructureItems', {user: {name: 'John'}}]),
        state.sameStructureItems[1]
      );
    });
  });

  describe('Object path', function() {

    it('should be possible to retrieve path objects.', function() {
      var o = helpers.pathObject(['one', 'subtwo'], {$set: ['purple']});
      assert.deepEqual(o, {one: {subtwo: {$set: ['purple']}}});
    });
  });

  describe('Solve path', function() {

    it('should be able to solve a complex path.', function() {
      var o = {
        things: [
          {
            name: 'foo'
          },
          {
            name: 'bar'
          }
        ]
      };
      var res = helpers.solvePath(o, ['things', { name: 'bar' } ]);
      assert.deepEqual(res, ['things', 1]);
    });
  });

  describe('Shallow merge', function() {

    it('should be possible to merge objects shallowly.', function() {
      assert.deepEqual(
        helpers.shallowMerge({hello: 'world', other: 'mate'}, {hello: 'Jack', one: 'two'}),
        {hello: 'Jack', one: 'two', other: 'mate'}
      );
    });
  });

  describe('Shallow clone', function() {

    it('should change references at first level.', function() {
      var o = {
        a: 1,
        b: {
          c: 2
        }
      };

      var clone = helpers.shallowClone(o);

      assert(o !== clone);
      assert(o.b === clone.b);
      assert(o.b.c === clone.b.c);
    });

    it('should clone regexes correctly.', function() {
      var regex = /abc/i,
          clone = helpers.shallowClone(regex);

      assert(regex !== clone);
      assert.strictEqual(regex.source, clone.source);
      assert(regex.ignoreCase, clone.ignoreCase);
    });
  });

  describe('Merge', function() {

    it('should solve edge cases.', function() {
      var spec = {
        hello: {
          $set: 'ok',
          otherKey: {
            world: 'Niet'
          }
        }
      };

      assert.deepEqual(
        merge({}, spec),
        {
          hello: {
            $set: 'ok'
          }
        }
      );

      assert.deepEqual(
        merge(
          {
            hello: {
              $set: [1]
            }
          },
          {
            hello: {
              $push: [2]
            }
          }
        ),
        {
          hello: {
            $set: [1],
            $push: [2]
          }
        }
      );

      assert.deepEqual(
        merge(
          {
            one: {
              two: {
                $set: 'test'
              }
            }
          },
          {
            one: {
              $set: 'ok'
            }
          }
        ),
        {
          one: {
            $set: 'ok'
          }
        }
      );

      assert.deepEqual(
        merge(
          {
            one: {
              $set: 'ok'
            }
          },
          {
            one: {
              two: {
                $set: 'test'
              }
            }
          }
        ),
        {
          one: {
            two: {
              $set: 'test'
            }
          }
        }
      );
    });

    it('should merge merge commands.', function() {

      assert.deepEqual(
        merge(
          {
            hello: {
              $merge: {
                a: 1,
                b: 2
              }
            }
          },
          {
            hello: {
              $merge: {
                a: 42,
                c: 3
              }
            }
          }
        ),
        {
          hello: {
            $merge: {
              a: 42,
              b: 2,
              c: 3
            }
          }
        }
      );
    });
  });

  describe('Update API', function() {

    it('should be possible to set nested values.', function() {
      var o1 = {hello: {world: 'one'}},
          o2 = update(o1, {hello: {world: {$set: 'two'}}}).data;

      assert.deepEqual(o1, {hello: {world: 'one'}});
      assert.deepEqual(o2, {hello: {world: 'two'}});
    });

    it('should be possible to push to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = update(o1, {colors: {$push: 'blue'}}).data;

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['orange', 'blue']});
    });

    it('should be possible to unshift to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = update(o1, {colors: {$unshift: 'blue'}}).data;

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['blue', 'orange']});
    });

    it('should be possible to append to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = update(o1, {colors: {$push: ['blue', 'purple']}}).data;

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['orange', 'blue', 'purple']});

      var o3 = {colors: ['orange']},
          o4 = update(o3, {colors: {$push: 'blue'}}).data;

      assert.deepEqual(o3, {colors: ['orange']});
      assert.deepEqual(o4, {colors: ['orange', 'blue']});
    });

    it('should be possible to prepend to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = update(o1, {colors: {$unshift: ['blue', 'purple']}}).data;

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['blue', 'purple', 'orange']});

      var o3 = {colors: ['orange']},
          o4 = update(o3, {colors: {$unshift: 'blue'}}).data;

      assert.deepEqual(o3, {colors: ['orange']});
      assert.deepEqual(o4, {colors: ['blue', 'orange']});
    });

    it('should be possible to apply a function to nested values.', function() {
      var o1 = {number: 10},
          o2 = update(o1, {number: {$apply: function(n) { return n * 2; }}}).data;

      assert.deepEqual(o1, {number: 10});
      assert.deepEqual(o2, {number: 20});
    });

    it('should be possible to shallowly merge objects.', function() {
      var o1 = {hey: {one: 1, two: 2}},
          o2 = update(o1, {hey: {$merge: {three: 3, two: 4}}}).data;

      assert.deepEqual(o2, {hey: {one: 1, two: 4, three: 3}});
    });

    it('should be possible to unset values.', function() {
      var o1 = {one: 1, two: 2},
          o2 = update(o1, {one: {$unset: true}}).data;

      assert.deepEqual(o1, {one: 1, two: 2});
      assert.deepEqual(o2, {two: 2});
    });

    it('should be possible to splice an array.', function() {
      var o1 = {list: [1, 2, 3]},
          o2 = update(o1, {list: {$splice: [[0, 1], [1, 1, 4]]}}).data;

      assert.deepEqual(o2.list, [2, 4]);
    });

    it('should be possible to set then to push.', function() {
      var o1 = {},
          o2 = update(o1, {
            $set: [1],
            $push: [2, 3]
          }).data;

      assert.deepEqual(o2, [1, 2, 3]);
    });

    it('should be possible to set then to merge.', function() {
      var o1 = {},
          o2 = update(o1, {
            hello: {
              $set: {a: 1, b: 2},
              $merge: {c: 3}
            },
          }).data;

      assert.deepEqual(o2, {hello: {a: 1, b: 2, c: 3}});
    });
  });
});
