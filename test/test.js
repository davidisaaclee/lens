var _ = require('lodash');
var assert = require('assert');
var lens = require('../lens');

describe('Lenses', function () {
  beforeEach(function () {
    var barStringLens = (function () {
      var getter = function (m) { return m.bar.array };
      var setter = function (m, v) {
        return _.assign({}, m, {
          bar: _.assign({}, m.bar, {
            array: v
          })
        });
      };
      return new lens(getter, setter);
    })();

    var firstLens = (function () {
      var getter = function (m) { return m[0] };
      var setter = function (m, v) {
        var result = m.slice(1);
        result.splice(0, 0, v);
        return result;
      };

      return new lens(getter, setter);
    })();

    _.assign(this, {
      barStringLens: barStringLens,
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
      this.barStringLens.get(model1),
      [1,2,3]
    );

    var model2 = this.barStringLens.set(model1, [3,4,5]);

    assert.deepEqual(
      this.barStringLens.get(model1),
      [1,2,3]
    );
    assert.deepEqual(
      this.barStringLens.get(model2),
      [3,4,5]
    );

    var model3 = this.barStringLens.over(model1, function (v) {
      return v.map(function (elm) { return elm + 1 });
    });
    assert.deepEqual(
      this.barStringLens.get(model1),
      [1,2,3]
    );
    assert.deepEqual(
      this.barStringLens.get(model3),
      [2,3,4]
    );
  });


  it('can compose', function () {
    var firstBarString = lens.compose(this.barStringLens, this.firstLens);

    var model1 = {
      foo: 3,
      bar: {
        array: [1,2,3],
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