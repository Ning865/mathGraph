/**
 * 从函数字符串中提取表达式部分
 * @param {string} func - 函数字符串，如 "y = x^2" 或 "sin(x)"
 * @returns {string} 纯表达式，如 "x^2"
 */
export function extractExpression(func) {
  if (!func || typeof func !== 'string') return '';
  if (func.includes('=')) {
    return func.split('=')[1].trim();
  }
  return func.trim();
}

/**
 * 验证是否是有效的函数表达式
 * @param {string} funcStr - 函数字符串
 * @returns {boolean} 是否有效
 */
export function isValidFunction(funcStr) {
  // 简单实现
  return funcStr &&
    typeof funcStr === 'string' &&
    funcStr.length > 0 &&
    (funcStr.includes('=') ||
      funcStr.includes('sin') ||
      funcStr.includes('cos') ||
      funcStr.includes('tan') ||
      funcStr.includes('x^') ||
      ['+', '-', '*', '/'].includes(funcStr));
}
