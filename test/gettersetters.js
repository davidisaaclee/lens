var _ = require('lodash');
var assert = require('assert');
var lens = require('../lens');
var createLensFunctions = require('../createLensFunctions');

var ClassA = (function () {
  var ClassA = function () {
    this.foo = {
      bar: {
        a: [1,2,3],
        b: 2
      },
      qux: 'brody'
    };
  };

  return ClassA;
})();


describe('getter/setter generation', function () {
  it('should create getters for concrete and abstract fields', function () {
    var empty = {};
    var f = createLensFunctions(empty, {
      'bar': 'foo.bar',
      'barById': function (id) { return 'foo.bar.' + id }
    });

    assert.deepEqual(empty, {});

    var instance = new ClassA();

    assert.deepEqual(
      f.getBar(instance),
      {
        a: [1,2,3],
        b: 2
      }
    );

    assert.deepEqual(
      f.getBarById(instance, 'a'),
      [1,2,3]
    );
    assert.equal(
      f.getBarById(instance, 'c'),
      undefined
    );
  });

  it('should create setters for concrete and abstract fields', function () {
    var f = createLensFunctions({}, {
      'bar': 'foo.bar',
      'barById': function (id) { return 'foo.bar.' + id }
    });

    var instance = new ClassA();

    var instance2 = f.setBar(instance, 'new bar');
    assert.deepEqual(
      f.getBar(instance),
      {
        a: [1,2,3],
        b: 2
      }
    );
    assert.equal(
      f.getBar(instance2),
      'new bar'
    );

    // var instance3 = instance.setBarById('a', 42);
    // assert.deepEqual(
    //   instance.getBarById('a'),
    //   [1,2,3]
    // );
    // assert.equal(
    //   instance3.getBarById('a'),
    //   42
    // );
  })
});