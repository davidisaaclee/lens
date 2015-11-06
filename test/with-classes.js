var assert = require('assert');
var _ = require('lodash');

var lens = require('../lens');

describe('using lenses with classes', function () {
  beforeEach(function () {
    var Person = (function () {
      var count = 0;
      var Person = function (name, age) {
        this.id = 'Person' + count++;
        this.info = {
          name: name,
          age: age
        };
      };

      Person.nameLens = lens.fromPath('info.name');
      Person.age = lens.fromPath('info.age');

      return Person;
    })();

    this.Person = Person;
  });

  it('works', function () {
    var tom = new this.Person('Tom', 60);

    assert.equal(
      this.Person.nameLens.get(tom),
      'Tom'
    );
    assert.equal(
      this.Person.age.get(tom),
      60
    );

    var teenTom = this.Person.age.set(tom, 18);

    assert.equal(
      this.Person.age.get(teenTom),
      18
    );
    assert.equal(
      this.Person.nameLens.get(teenTom),
      'Tom'
    );
    assert.equal(
      this.Person.age.get(tom),
      60
    );

    var teenThomas = this.Person.nameLens.set(teenTom, 'Thomas');
    assert.equal(
      this.Person.nameLens.get(teenThomas),
      'Thomas'
    );
    assert.equal(
      this.Person.nameLens.get(teenTom),
      'Tom'
    );
  });
});