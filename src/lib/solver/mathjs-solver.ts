/**
 * Symbolic Math Solver using mathjs
 *
 * Verifies math answers in Snap & Solve instead of relying on the LLM alone.
 * The LLM explains the solver's answer — it doesn't compute independently.
 */

import { create, all, type MathJsInstance } from 'mathjs';

const math: MathJsInstance = create(all, {
  number: 'number',
  precision: 14,
});

export interface SolverResult {
  success: boolean;
  input: string;
  result: string;
  steps: string[];
  error?: string;
}

/**
 * Attempt to solve a mathematical expression symbolically.
 * Returns the exact result + intermediate steps where possible.
 */
export function solveMathExpression(expression: string): SolverResult {
  const cleaned = expression
    .replace(/\s+/g, ' ')
    .trim();

  try {
    // Try to parse and evaluate
    const node = math.parse(cleaned);
    const simplified = math.simplify(node);
    const result = math.evaluate(cleaned);

    const steps: string[] = [];
    steps.push(`Input: ${cleaned}`);

    // Show simplified form if different from input
    const simplifiedStr = simplified.toString();
    if (simplifiedStr !== cleaned) {
      steps.push(`Simplified: ${simplifiedStr}`);
    }

    steps.push(`Result: ${result}`);

    return {
      success: true,
      input: cleaned,
      result: String(result),
      steps,
    };
  } catch {
    // Try specific patterns
    return tryAlternativeSolvers(cleaned);
  }
}

/**
 * Attempt equation solving and other specialized operations.
 */
function tryAlternativeSolvers(expression: string): SolverResult {
  const steps: string[] = [];
  steps.push(`Input: ${expression}`);

  try {
    // Try solving equations (e.g., "2x + 3 = 7")
    if (expression.includes('=')) {
      const [lhs, rhs] = expression.split('=').map(s => s.trim());

      // Find variable
      const varMatch = expression.match(/[a-z]/i);
      if (varMatch) {
        const variable = varMatch[0];
        // Rearrange: lhs - rhs = 0
        const equation = `(${lhs}) - (${rhs})`;
        const node = math.parse(equation);
        const simplified = math.simplify(node);
        steps.push(`Rearranged: ${simplified.toString()} = 0`);

        // Try numeric root finding for simple linear equations
        try {
          // For linear equations ax + b = 0, solve for x = -b/a
          const withZero = math.evaluate(equation.replace(new RegExp(variable, 'g'), '0'));
          const withOne = math.evaluate(equation.replace(new RegExp(variable, 'g'), '1'));
          const a = withOne - withZero;
          const b = withZero;

          if (a !== 0) {
            const solution = -b / a;
            steps.push(`${variable} = ${solution}`);
            return {
              success: true,
              input: expression,
              result: `${variable} = ${solution}`,
              steps,
            };
          }
        } catch {
          // Not a simple linear equation
        }
      }
    }

    // Try derivative (if expression contains "derivative" or "d/dx")
    if (expression.toLowerCase().includes('derivative') || expression.includes('d/dx')) {
      const exprPart = expression
        .replace(/derivative\s*(of)?/i, '')
        .replace(/d\/d[a-z]/i, '')
        .trim();

      const node = math.parse(exprPart);
      const derivative = math.derivative(node, 'x');
      steps.push(`d/dx(${exprPart}) = ${derivative.toString()}`);

      return {
        success: true,
        input: expression,
        result: derivative.toString(),
        steps,
      };
    }

    // Fallback: try direct evaluation
    const result = math.evaluate(expression);
    steps.push(`Result: ${result}`);

    return {
      success: true,
      input: expression,
      result: String(result),
      steps,
    };
  } catch (error) {
    return {
      success: false,
      input: expression,
      result: '',
      steps,
      error: error instanceof Error ? error.message : 'Unable to solve this expression',
    };
  }
}

/**
 * Solve multiple expressions and return all results.
 */
export function solveMultiple(expressions: string[]): SolverResult[] {
  return expressions.map(expr => solveMathExpression(expr));
}
