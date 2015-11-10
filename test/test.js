var _ = require('lodash');
var assert = require('assert');
var lens = require('../lens');

describe('Lenses', function () {
  beforeEach(function () {
    var barArrayLens = (function () {
      var getter = function (m) {
        return m.bar.array
      };
      var setter = function (m, v) {
        return _.assign({}, m, {
          bar: _.assign({}, m.bar, {
            array: v
          })
        });
      };
      var r = new lens(getter, setter);
      r.name = 'barArrayLens';
      return r;
    })();

    var firstLens = (function () {
      var getter = function (m) { return m[0] };
      var setter = function (m, v) {
        var result = m.slice(1);
        result.splice(0, 0, v);
        return result;
      };

      var r = new lens(getter, setter);
      r.name = 'firstLens';
      return r;
    })();

    _.assign(this, {
      barArrayLens: barArrayLens,
      firstLens: firstLens
    });
  });


  it('basically work', function () {
    var model1 = {
      foo: 3,
      bar: {
        array: [1,2,3],
        string: 'a string'
      }
    };

    assert.deepEqual(
      this.barArrayLens.get(model1),
      [1,2,3]
    );

    var model2 = this.barArrayLens.set(model1, [3,4,5]);

    assert.deepEqual(
      this.barArrayLens.get(model1),
      [1,2,3]
    );
    assert.deepEqual(
      this.barArrayLens.get(model2),
      [3,4,5]
    );

    var model3 = this.barArrayLens.over(model1, function (v) {
      return v.map(function (elm) { return elm + 1 });
    });
    assert.deepEqual(
      this.barArrayLens.get(model1),
      [1,2,3]
    );
    assert.deepEqual(
      this.barArrayLens.get(model3),
      [2,3,4]
    );


    var arrModel = [ 1, 2, 3 ];
    assert.equal(
      this.firstLens.get(arrModel),
      1
    );
    var arrModel2 = this.firstLens.set(arrModel, 10);
    assert.equal(
      this.firstLens.get(arrModel2),
      10
    );
    assert.equal(
      this.firstLens.get(arrModel),
      1
    );
  });


  it('can compose', function () {
    var firstBarString = lens.compose(this.barArrayLens, this.firstLens);

    var model1 = {
      foo: 3,
      bar: {
        array: [ 1, 2, 3 ],
        string: 'a string'
      }
    };

    assert.deepEqual(
      firstBarString.get(model1),
      1
    );

    var model2 = firstBarString.set(model1, 'foo');

    assert.deepEqual(
      firstBarString.get(model1),
      1
    );
    assert.deepEqual(
      firstBarString.get(model2),
      'foo'
    );

    var model3 = firstBarString.over(model1, function (v) { return v + 1 });
    assert.deepEqual(
      firstBarString.get(model1),
      1
    );
    assert.deepEqual(
      firstBarString.get(model3),
      2
    );
  });


  it('can compose more than two lenses', function () {
    var aLens = (function () {
      var getter = function (m) { return m.a };
      var setter = function (m, v) {
        return _.assign({}, m, {
          a: v
        });
      };
      return new lens(getter, setter);
    })();
    var bLens = (function () {
      var getter = function (m) { return m.b };
      var setter = function (m, v) {
        return _.assign({}, m, {
          b: v
        });
      };
      return new lens(getter, setter);
    })();
    var cLens = (function () {
      var getter = function (m) { return m.c };
      var setter = function (m, v) {
        return _.assign({}, m, {
          c: v
        });
      };
      return new lens(getter, setter);
    })();

    var model1 = {
      a: {
        b: {
          c: 1
        }
      }
    };

    abcLens = lens.compose(aLens, bLens, cLens);
    assert.equal(
      abcLens.get(model1),
      1
    );

    var model2 = abcLens.set(model1, 3)

    assert.equal(
      abcLens.get(model2),
      3
    );
    assert.equal(
      abcLens.get(model1),
      1
    );
  });


  it('can be constructed from paths', function () {
    var model1 = {
      foo: 3,
      bar: {
        array: [1,2,3],
        string: 'a string'
      }
    };

    var fbsLens = lens.fromPath('bar.string');

    assert.equal(
      fbsLens.get(model1),
      'a string'
    );

    var model2 = fbsLens.set(model1, 'another string');
    assert.equal(
      fbsLens.get(model1),
      'a string'
    );
    assert.equal(
      fbsLens.get(model2),
      'another string'
    );

    var arrLens = lens.fromPath(['bar', 'array']);
    assert.deepEqual(
      arrLens.get(model1),
      [1, 2, 3]
    );
    var model3 = arrLens.over(model1, function (arr) { return arr.slice(1) });
    assert.deepEqual(
      arrLens.get(model3),
      [2, 3]
    );
  });


  it('respect function fields on `set`', function () {
    var model1 = {
      foo: 3,
      fn: function () { return 1 }
    };

    var fooLens = lens.fromPath('foo');
    var model2 = fooLens.set(model1, 4);

    assert.equal(
      model2.foo,
      4
    );
    assert.equal(
      (model2.fn != null),
      true
    );
    assert.equal(
      model1.fn(),
      model2.fn()
    );
  });


  it('can be abstract', function () {
    var model1 = {
      dicts: {
        fruits: {
          apple: 'apple',
          orange: 'orange',
          banana: 'banana',
          melons: {
            water: 'watermelon',
            friend: 'friend'
          }
        }
      }
    };

    var getter = function (model, fruitName) {
      return model.dicts.fruits[fruitName];
    };
    var setter = function (model, fruitName, value) {
      var dictChange = {};
      dictChange[fruitName] = value;

      return _.assign({}, model, {
        dicts: _.assign({}, model.dicts, {
          fruits: _.assign({}, model.dicts.fruits, dictChange)
        })
      });
    };

    var fruitLens = new lens(getter, setter);
    assert.equal(
      fruitLens.get(model1, 'apple'),
      'apple'
    );
    assert.deepEqual(
      fruitLens.get(model1, 'melons'),
      {
        water: 'watermelon',
        friend: 'friend'
      }
    );

    var model2 = fruitLens.set(model1, 'pear', 'pearfruit');
    assert.equal(
      fruitLens.get(model2, 'apple'),
      'apple'
    );
    assert.deepEqual(
      fruitLens.get(model2, 'melons'),
      {
        water: 'watermelon',
        friend: 'friend'
      }
    );
    assert.equal(
      fruitLens.get(model2, 'pear'),
      'pearfruit'
    );
  });

  it('can be multi-dimensionally abstract', function () {
    var model1 = {
      dicts: {
        fruits: {
          apple: ['delicious', 'granny smith', 'golden'],
          orange: ['orange', 'mandarin', 'clementine'],
          melon: ['water', 'bitter']
        }
      }
    };

    var getter = function (model, fruitName, idx) {
      return model.dicts.fruits[fruitName][idx];
    };
    var setter = function (model, fruitName, idx, value) {
      var dictChange = {};
      var arrCopy = model.dicts.fruits[fruitName].slice(0);
      arrCopy.splice(idx, 0, value);
      dictChange[fruitName] = arrCopy;

      return _.assign({}, model, {
        dicts: _.assign({}, model.dicts, {
          fruits: _.assign({}, model.dicts.fruits, dictChange)
        })
      });
    };

    var fruitLens = new lens(getter, setter);
    assert.equal(
      fruitLens.get(model1, 'apple', 1),
      'granny smith'
    );
    var model2 = fruitLens.set(model1, 'melon', 0, 'summer');
    assert.equal(
      fruitLens.get(model2, 'melon', 0),
      'summer'
    );
    assert.equal(
      fruitLens.get(model1, 'melon', 0),
      'water'
    );

    var objLens = lens.fromPath(function () { return _.toArray(arguments) });

    assert.equal(
      objLens.get(model1, 'dicts', 'fruits', 'apple', '0'),
      'delicious'
    );
    assert.deepEqual(
      objLens.get(model1, 'dicts', 'fruits', 'melon'),
      model1.dicts.fruits.melon
    );
    var model3 = objLens.set(model1, 'dicts', 'FEED ME');
    assert.deepEqual(
      model3,
      {dicts: 'FEED ME'}
    );
  });


  it('can be abstract from paths', function () {
    var model1 = {
      dicts: {
        fruits: {
          apple: 'apple',
          orange: 'orange',
          banana: 'banana',
          melons: {
            water: 'watermelon',
            friend: 'friend'
          }
        }
      }
    };

    var fruitLens = lens.fromPath(function (fruitName) {
      return ['dicts', 'fruits', fruitName];
    });

    assert.equal(
      fruitLens.get(model1, 'apple'),
      'apple'
    );
    assert.deepEqual(
      fruitLens.get(model1, 'melons'),
      {
        water: 'watermelon',
        friend: 'friend'
      }
    );
    var model2 = fruitLens.set(model1, 'pear', 'pearfruit');
    assert.equal(
      fruitLens.get(model2, 'apple'),
      'apple'
    );
    assert.deepEqual(
      fruitLens.get(model2, 'melons'),
      {
        water: 'watermelon',
        friend: 'friend'
      }
    );
    assert.equal(
      fruitLens.get(model2, 'pear'),
      'pearfruit'
    );
  });


  it('support transformers via `fromPath`', function () {
    var model1 = {
      foo: 3,
      bar: {
        array: [1,2,3],
        string: 'a string'
      }
    };


    var addOne = function (n) { return n + 1 };
    var minusOne = function (n) { return n - 1 };
    var fbsLens = lens.fromPath('foo', addOne, minusOne);
    var plainFbsLens = lens.fromPath('foo');

    assert.equal(
      fbsLens.get(model1),
      4
    );
    assert.equal(
      plainFbsLens.get(model1),
      3
    );
    var model2 = fbsLens.set(model1, 10);
    assert.equal(
      plainFbsLens.get(model2),
      9
    );
  });


  it('can compose abstract lenses', function () {
    var model1 = {
      bar: {
        array: [ 1, 2, 3 ],
        string: 'a string'
      }
    };

    var barLens = lens.fromPath(function (key) { return [ 'bar', key ] });
    var nthLens = lens.fromPath(function (idx) { return [ idx ] });

    var barNthLens = lens.compose(barLens, nthLens);

    assert.equal(
      barNthLens.get(model1, ['array'], [0]),
      1
    );
    assert.equal(
      barNthLens.get(model1, ['array'], [1]),
      2
    );

    var model2 = barNthLens.set(model1, ['array'], [2], 'new value');
    assert.equal(
      barNthLens.get(model2, ['array'], [0]),
      1
    );
    assert.equal(
      barNthLens.get(model2, ['array'], [2]),
      'new value'
    );
  });


  it('can compose varargs abstract lenses', function () {
    var objLens = lens.fromPath(function () { return _.toArray(arguments) });
    var barLens = lens.fromPath(function (key) { return [ 'bar', key ] });
    var nthLens = lens.fromPath(function (idx) { return [ idx ] });

    var path_bar_nth_lens = lens.compose(objLens, barLens, nthLens);

    var model1 = {
      a: {
        b: {
          bar: {
            a: [ 2, 3, 5, 8 ],
            b: 0
          }
        }
      }
    };

    assert.equal(
      path_bar_nth_lens.get(model1, ['a', 'b'], ['a'], [1]),
      model1.a.b.bar.a[1]
    );

    var model2 = path_bar_nth_lens.set(model1, ['a', 'b'], ['a'], [3], 42);
    assert.equal(
      path_bar_nth_lens.get(model2, ['a', 'b'], ['a'], [3]),
      42
    );
    assert.equal(
      path_bar_nth_lens.get(model1, ['a', 'b'], ['a'], [1]),
      model1.a.b.bar.a[1]
    );
  });


  /*
  The following spec describes a model which is an instance of a class. Since
    these lenses try to be immutable and create new copies of the models,
    the instance would need to be cloned, respecting its class. This is a
    seemingly impossible spec, since there may exist inaccessible values in
    closures within the instance's constructor.
  */
  xit('respect methods on `set`', function () {
    var ModelClass = (function () {
      var ModelClass = function () { this.foo = 1 };
      ModelClass.prototype.fn = function () { return 2 };
      return ModelClass;
    })();

    var model1 = new ModelClass();

    var fooLens = lens.fromPath('foo');
    var model2 = fooLens.set(model1, 4);

    assert.equal(
      model2.foo,
      4
    );
    assert.equal(
      (model2.fn != null),
      true
    );
    assert.equal(
      model1.fn(),
      model2.fn()
    );
  });
});