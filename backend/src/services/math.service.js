const { create, all } = require('mathjs');

const math = create(all, {});

// Disable only dangerous functions
math.import({
  'import': function () { throw new Error('Function not allowed'); },
  'createUnit': function () { throw new Error('Function not allowed'); }
}, { override: true });

exports.evaluateExpression = (expression) => {

  if (expression.length > 200) {
    throw new Error('Expression too long');
  }

  let result;

  try {
    result = math.evaluate(expression);
  } catch (err) {
    throw new Error('Invalid mathematical expression');
  }

  if (!isFinite(result)) {
    throw new Error('Invalid mathematical result');
  }

  return result;
}