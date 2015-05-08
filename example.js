var Structured = require('structured');
var structure = function() {
  $fn($a, $b, $c);
};
var code = "fn('a', 'b');";
console.log(Structured.match(code, structure));

