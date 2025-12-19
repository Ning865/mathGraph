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
  if (!funcStr || typeof funcStr !== 'string' || funcStr.length === 0) {
    return false;
  }
  
  // 如果是运算符，直接返回true
  if (['+', '-', '*', '/'].includes(funcStr.trim())) {
    return true;
  }
  
  // 移除空白字符
  const trimmed = funcStr.trim();
  
  // 检查是否包含等号
  if (trimmed.includes('=')) {
    return true;
  }
  
  // 检查是否是有效的数学表达式
  // 简化正则表达式，允许更多的函数名和数学符号
  const mathPattern = /^[\d\s+xX\+\-\*\/\^\(\)\.,a-zA-Z]+$/;
  
  // 检查是否包含等号或常见数学函数名
  if (trimmed.includes('=') || 
      trimmed.match(/(sin|cos|tan|exp|abs|log|sqrt|ln|e\^|\^)/i)) {
    return mathPattern.test(trimmed);
  }
  
  // 对于简单表达式，检查是否包含变量x
  return trimmed.includes('x') || trimmed.includes('X');
}

/**
 * 解析用户输入的函数表达式
 * @param {string} funcStr - 用户输入的函数字符串
 * @returns {string|null} 解析后的函数字符串，无效则返回null
 */
export function parseUserFunction(funcStr) {
  if (!isValidFunction(funcStr)) {
    return null;
  }
  
  let parsed = funcStr.trim();
  
  // 标准化函数表达式
  parsed = parsed.replace(/e\^x/gi, 'e^x'); // 保持e^x形式
  parsed = parsed.replace(/\|x\|/gi, 'abs(x)'); // 替换绝对值符号为abs(x)
  parsed = parsed.replace(/x\^/gi, 'x^'); // 保持x^形式
  
  // 如果没有等号，添加Y = 前缀
  if (!parsed.includes('=')) {
    parsed = `Y = ${parsed}`;
  }
  
  return parsed;
}
