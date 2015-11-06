var _ = require('lodash');
var lens = require('./lens');

module.exports = createLensFunctions = function (scope, fields) {
  return _.transform(fields, function (s, path, k) {
    casedKey = k.substring(0, 1).toUpperCase() + k.substring(1)

    var makeLens = function (path, args) {
      if (typeof path == 'function') {
        return lens.fromPath(path.apply(null, args));
      } else if (typeof path == 'string') {
        return lens.fromPath(path);
      }
    };

    // get :: (model) -> value
    //      | (model, ...args) -> value
    s['get' + casedKey] = function (model) {
      var args = _.tail(arguments);
      return makeLens(path, args).get(model);
    }

    // set :: (model, value) -> model
    //      | (model, ...args, value) -> model
    s['set' + casedKey] = function () {
      var model = _.head(arguments);
      var value = _.last(arguments);
      var args = _.initial(_.tail(arguments));
      return makeLens(path, args).set(model, value);
    }

  }, _.clone(scope));
}