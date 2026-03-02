const math = require('mathjs');

const calculate = (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression || typeof expression !== 'string') {
      return res.json({
        success: false,
        message: 'No expression provided'
      });
    }

    /* ================= CLEAN INPUT ================= */

    const cleanExpression = expression.replace(/\s+/g, '');

    /* ================= UNDEFINED TAN CHECK ================= */

    // Detect tan((X*pi)/180) with optional negative and decimals
    const tanMatch = cleanExpression.match(
      /tan\(\(([-]?\d+(\.\d+)?)\*pi\)\/180\)/
    );

    if (tanMatch) {
      const degree = parseFloat(tanMatch[1]);

      // Normalize angle (handle negative & large values)
      const normalized = ((degree % 360) + 360) % 360;

      if (normalized === 90 || normalized === 270) {
        return res.json({
          success: false,
          message: 'Result is undefined'
        });
      }
    }

    /* ================= SAFE EVALUATION ================= */

    let result;

    try {
      result = math.evaluate(expression);
    } catch (err) {
      return res.json({
        success: false,
        message: 'Invalid expression'
      });
    }

    /* ================= INVALID NUMBER CHECK ================= */

    if (!isFinite(result) || isNaN(result)) {
      return res.json({
        success: false,
        message: 'Result is undefined'
      });
    }

    /* ================= ROUNDING FIX ================= */

    result = parseFloat(Number(result).toPrecision(12));

    // Fix floating precision errors
    if (Math.abs(result) < 1e-10) result = 0;
    if (Math.abs(result - 1) < 1e-10) result = 1;
    if (Math.abs(result + 1) < 1e-10) result = -1;

    return res.json({
      success: true,
      result
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = calculate;