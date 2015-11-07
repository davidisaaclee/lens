var _ = require('lodash');

module.exports = (function () {
  /* Helpers */

  // modified from `object-path` to produce new objects instead of mutating
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
  /*
  Constructs a `Lens` given a getter and setter. (Getters and setters may be
    abstract, with multiple parameters.)

  get ::= (model) -> element
        | (model, ...args) -> element
  set ::= (model, value) -> model'
        | (model, ...args, value) -> model'
  */
  var Lens = function (get, set) {
    /*
    Lens::get ::= (model) -> element
                | (model, ...args) -> element
    */
    this.get = function (model, args) {
      return get.apply(null, arguments);
    };

    /*
    Lens::set ::= (model, value) -> model'
                | (model, ...args, value) -> model'
    */
    this.set = function (model, args, value) {
      return set.apply(null, arguments);
    };

    this.over = function () {
      // return set(model, f(get(model)));
      var model = _.head(arguments);
      var args = _.initial(_.tail(arguments));
      var f = _.last(arguments);

      var getArgs = [model].concat(args);

      var oldValue = get.apply(null, getArgs);
      var newValue = f(oldValue);

      var setArgs = [model].concat(args).concat([newValue]);
      return set.apply(null, setArgs);
    };
  };

  Lens.compose = function () {
    return Array.prototype.slice.call(arguments)
      .reduce(function (outer, inner) {
        return new Lens(
          function (m) {
            return inner.get(outer.get(m));
          },
          function (m, v) {
            return outer.set(m, inner.set(outer.get(m), v));
          }
        );
      });
  };

  Lens.fromPath = function (path) {
    if (_.isString(path) || _.isArray(path)) {
      var getter = function (m) {
        return getPath(m, path);
      };
      var setter = function (m, v) {
        return setPath(m, path, v);
      };

      return new Lens(getter, setter);
    } else if (_.isFunction(path)) {
      var getter = function (m) {
        var args = _.tail(arguments);
        return getPath(m, path.apply(null, args));
      };
      var setter = function () {
        var model = _.head(arguments);
        var args = _.initial(_.tail(arguments));
        var value = _.last(arguments);
        return setPath(model, path.apply(null, args), value);
      };

      return new Lens(getter, setter);
    } else {
      throw new Error("Invalid path argument to Lens.fromPath(): " + path);
    }
  };

  return Lens;
})();