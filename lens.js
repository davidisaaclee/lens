var objectPath = require('object-path');
var _ = require('lodash');

module.exports = (function () {
  /* Helpers */

  // modified from object-path to produce a new object instead of mutating
  // https://github.com/mariocasciaro/object-path
  function getKey(key){
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  }
  function isEmpty(value){
    if (!value) {
      return true;
    }
    if (_.isArray(value) && value.length === 0) {
        return true;
    } else if (!_.isString(value)) {
        for (var i in value) {
            if (Object.prototype.hasOwnProperty.call(value, i)) {
                return false;
            }
        }
        return true;
    }
    return false;
  }

  function setPath (obj, path, value){
    if (_.isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (_.isString(path)) {
      return setPath(obj, path.split('.').map(getKey), value);
    }
    var currentPath = path[0];

    if (path.length === 1) {
      var oldVal = obj[currentPath];
      var change = {}
      change[currentPath] = value;
      return _.assign({}, obj, change);
    }

    if (obj[currentPath] === void 0) {
      //check if we assume an array
      if(_.isNumber(path[1])) {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    var change = {};
    change[currentPath] = setPath(obj[currentPath], path.slice(1), value);
    return _.assign({}, obj, change);
  }

  function getPath (obj, path, defaultValue) {
    if (_.isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return defaultValue;
    }
    if (_.isString(path)) {
      return getPath(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);

    if (path.length === 1) {
      if (obj[currentPath] === void 0) {
        return defaultValue;
      }
      return obj[currentPath];
    }

    return getPath(obj[currentPath], path.slice(1), defaultValue);
  }

  /* Lens class definition */
  var Lens = function (get, set) {
    this.getter = get;
    this.setter = set;
  };

  Lens.prototype.get = function (model) {
    return this.getter(model);
  };

  Lens.prototype.set = function (model, value) {
    return this.setter(model, value);
  };

  Lens.prototype.over = function (model, f) {
    return this.set(model, f(this.get(model)));
  };

  Lens.compose = function () {
    return Array.prototype.slice.call(arguments)
      .reduce(function (outer, inner) {
        return new Lens(
          function (m) { return inner.get(outer.get(m)) },
          function (m, v) {
            return outer.set(m, inner.set(outer.get(m), v));
          }
        );
      });
  };

  Lens.fromPath = function (path) {
    var getter = function (m) {
      return getPath(m, path);
    };
    var setter = function (m, v) {
      return setPath(m, path, v);
    };

    return new Lens(getter, setter);
  };

  return Lens;
})();