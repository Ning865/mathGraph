import {
  extractExpression,
  isValidFunction,
} from './function-utils.js';

export default class FunctionManager {
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * 绘制函数到画布
   * @param {string} funcStr - 函数表达式
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @returns {string|null} 顶点 ID，如果失败返回 null
   */
  drawFunction(funcStr, x, y) {
    const graph = this.graph;
    const parent = graph.getDefaultParent();

    // 验证函数表达式
    if (!isValidFunction(funcStr)) {
      console.warn('函数表达式无效:', funcStr);
      return null;
    }

    let vertexId = null;
    graph.getModel().beginUpdate();

    try {
      // 生成唯一 ID，使用随机数确保唯一性
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      vertexId = `func_${funcStr.replace(/[^a-z0-9]/gi, '_')}_${timestamp}_${random}`;

      // 在顶点内容中显示函数表达式和 ID
      const vertexContent = `${funcStr}\n(ID: ${vertexId})`;
      let style = 'fillColor=white;strokeColor=blue;';

      if (funcStr.includes('=')) {
        style += 'shape=rectangle;';
        graph.insertVertex(parent, vertexId, vertexContent, x, y, 150, 100, style);
      } else {
        style += 'strokeWidth=2;shape=ellipse;';
        graph.insertVertex(parent, vertexId, vertexContent, x, y, 100, 50, style);
      }

      //console.log('函数绘制成功:', funcStr, 'ID:', vertexId);

    } catch (error) {
      console.error('绘制函数失败:', error);
      vertexId = null;
    } finally {
      graph.getModel().endUpdate();
    }

    return vertexId;
  }

  /**
   * 识别并获取画布上所有函数
   * @returns {Array} 函数对象数组
   */
  identifyFunctions() {
    const graph = this.graph;
    const model = graph.getModel();
    const cells = model.cells;
    const functions = [];

    // 遍历所有单元格
    Object.keys(cells).forEach(key => {
      const cell = cells[key];

      // 检查是否为函数顶点
      if (cell.value && typeof cell.value === 'string') {
        const content = cell.value.toString();
        const funcStr = content.split('\n')[0].trim();

        if (isValidFunction(funcStr)) {
          functions.push({
            id: cell.id,
            expression: funcStr,
            x: cell.geometry ? cell.geometry.x : 0,
            y: cell.geometry ? cell.geometry.y : 0,
            isCombined: funcStr.includes('+') || funcStr.includes('-') ||
              funcStr.includes('*') || funcStr.includes('/')
          });
        }
      }
    });

    return functions;
  }

  /**
   * 生成两个函数相加的组合函数表达式
   * @param {string} func1 - 第一个函数
   * @param {string} func2 - 第二个函数
   * @returns {string} 组合函数表达式
   */
  generateCombinedFunction(func1, func2) {
    const expr1 = extractExpression(func1);
    const expr2 = extractExpression(func2);
    return `y = ${expr1} + ${expr2}`;
  }

  /**
   * 从单元格内容中提取函数表达式（去除 ID 部分）
   * @param {mxCell} cell - 单元格
   * @returns {string|null} 函数表达式或 null
   */
  extractFunctionFromCell(cell) {
    if (!cell.value || typeof cell.value !== 'string') {
      return null;
    }

    const content = cell.value.toString();
    const funcStr = content.split('\n')[0].trim();

    return isValidFunction(funcStr) ? funcStr : null;
  }
}
