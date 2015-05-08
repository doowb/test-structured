/*!
 * test-structured <https://github.com/doowb/test-structured>
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */


var Structured = require('structured');

var structure = function() {
  $fn($a, $b, $next);
};

function createArgs () {
  var args = [].slice.call(arguments);
  var jsonArgs = new Array(args.length);
  var i = 0, len = args.length;
  while (len--) {
    var arg = args[i];
    if (typeof arg !== 'function') {
      jsonArgs[i++] = JSON.stringify(arg);
    } else {
      jsonArgs[i++] = arg.toString();
    }
  }
  return jsonArgs.join(', ');
}

var middleware = {};

var loader = {
  use: function (pattern, fn) {
    middleware[pattern] = (middleware[pattern] || []).concat([fn]);
  }
};

var matcher = function (pattern, args) {
  var params = pattern.split(',');
  if (params.length !== args.length)
    return false;

  var len = params.length, i = 0;
  var varCallbacks = {};
  while (len--) {
    var param = params[i++].trim();
    var cb = function (node) {
      // console.log('default', arguments);
      // return node.type === 'Literal';
      return true;
    };
    switch (param.split('_')[1]) {
      case 'number':
        cb = function (num) {
          return true;
        };
        break;
      case 'array':
        cb = function (node) {
          return node.type === 'ArrayExpression';
        };
        break;
      case 'object':
        cb = function (node) {
          return node.type === 'ObjectExpression';
        };
        break;
      case 'function':
        cb = function (node) {
          return node.type === 'FunctionExpression';
        };
        break;
    }
    varCallbacks[param] = cb;
  }
  var structure = new Function ("$fn(" + pattern + ")");
  // console.log('structure', structure.toString());
  var code = 'fn(' + createArgs.apply(null, args) + ');';
  // console.log('code', code);
  return Structured.match(code, structure, {varCallbacks: varCallbacks});
};

function load () {
  var args = [].slice.call(arguments);
  var results = [];
  for (var pattern in middleware) {
    if (middleware.hasOwnProperty(pattern)) {
      var match = matcher(pattern, args);
      // console.log(match, pattern, args);
      if (!match) continue;
      var fns = middleware[pattern] || [];
      fns = Array.isArray(fns) ? fns : [fns];
      var len = fns.length, i = 0;
      while (len--) {
        var fn = fns[i++];
        results.push(fn.apply(fn, args));
      }
    }
  }
  return results;
}

loader.use('$patterns_array, $options_object, $cb_function', function (pattern, object, next) {
  return next();
});

var x = 100;
while (x--) {
  loader.use('$path' + x + ', $content', function (path, content) {
    return {
      path: path,
      content: content
    };
  });
}

var results = null;
var options = {foo: 'bar'};
results = load(['**/*.hbs'], options, function next (err, files) {
  if (err) return done(err);
  console.log('files', files);
});
console.log(results);

results = load('foo.hbs', 'some content');
console.log(results);

// var varCallbacks = {
//   "$a": function(a) {
//     console.log('$a', a);
//     return true;
//   },
//   "$a, $b": function(a, b) {
//     console.log('$a, $b', a, b);
//     return true;
//   },
//   "$next": function (next) {
//     console.log('$next', next);
//     return true;
//   }
// };

// console.log('code');
// console.log(code);
// console.log(Structured.match(code, structure, { varCallbacks: varCallbacks }));

