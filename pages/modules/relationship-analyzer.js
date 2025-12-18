import { extractExpression, isValidFunction } from './utils/function-utils.js';

export default class RelationshipAnalyzer {
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * 分析函数之间的关系
   * @returns {Array} 关系分析结果
   */
  analyze() {
    const functionVertices = this.collectFunctionVertices();
    const edges = this.collectEdges(functionVertices);
    const chains = this.findFunctionChains(edges, functionVertices);

    return this.buildRelationships(chains, functionVertices);
  }

  /**
   * 收集所有函数顶点
   * @returns {Object} 顶点ID到函数表达式的映射
   */
  collectFunctionVertices() {
    const model = this.graph.getModel();
    const cells = model.cells;
    const functionVertices = {};

    Object.keys(cells).forEach(key => {
      const cell = cells[key];
      if (cell.value && typeof cell.value === 'string') {
        const content = cell.value.toString();
        const functionStr = content.split('\n')[0].trim();

        if (isValidFunction(functionStr)) {
          functionVertices[key] = functionStr;
        }
      }
    });

    return functionVertices;
  }

  /**
   * 收集边的关系
   * @param {Object} functionVertices 函数顶点映射
   * @returns {Array} 边数组
   */
  collectEdges(functionVertices) {
    const model = this.graph.getModel();
    const cells = model.cells;
    const edges = [];

    Object.keys(cells).forEach(key => {
      const cell = cells[key];
      if (cell.source && cell.target &&
        functionVertices[cell.source.id] &&
        functionVertices[cell.target.id]) {

        edges.push({
          sourceId: cell.source.id,
          targetId: cell.target.id,
          sourceFunc: functionVertices[cell.source.id],
          targetFunc: functionVertices[cell.target.id]
        });
      }
    });

    return edges;
  }

  /**
   * 构建带运算符的表达式
   * @param {Array} chain 链式顶点ID数组
   * @param {Object} functionVertices 顶点映射
   * @returns {string|null} 组合表达式或null
   */
  buildExpressionWithOperators(chain, functionVertices) {
    const exprParts = [];
    let currentExpr = null;
    let currentOperator = null;

    for (let i = 0; i < chain.length; i++) {
      const func = functionVertices[chain[i]];
      const isOperator = ['+', '-', '*', '/'].includes(func);

      if (!isOperator && currentOperator === null) {
        // 第一个函数表达式
        currentExpr = extractExpression(func);
      } else if (isOperator) {
        // 运算符
        currentOperator = func;
      } else if (currentExpr !== null && currentOperator !== null) {
        // 第二个函数表达式，进行运算
        const nextExpr = extractExpression(func);

        exprParts.push(currentExpr);
        exprParts.push(currentOperator);

        // 重置，准备下一组运算
        currentExpr = nextExpr;
        currentOperator = null;
      }
    }

    // 添加最后一个表达式
    if (currentExpr !== null) {
      exprParts.push(currentExpr);
    }

    // 返回完整表达式
    return exprParts.length > 0 ? `y = ${exprParts.join(' ')}` : null;
  }

  /**
   * 构建关系描述
   * @param {Array} chains 函数链数组
   * @param {Object} functionVertices 顶点映射
   * @returns {Array} 关系数组
   */
  buildRelationships(chains, functionVertices) {
    const relationships = [];

    chains.forEach(chain => {
      if (chain.length >= 3) {
        // 链式关系
        const combinedExpr = this.buildExpressionWithOperators(chain, functionVertices);
        if (combinedExpr) {
          relationships.push({
            sourceIds: chain.filter(id => !['+', '-', '*', '/'].includes(functionVertices[id])),
            operators: chain.filter(id => ['+', '-', '*', '/'].includes(functionVertices[id])),
            targetId: chain[chain.length - 1],
            chainFunctions: chain.map(id => functionVertices[id]),
            relationshipType: '带运算符的链式关系',
            combinedFunction: combinedExpr
          });
        }
      } else if (chain.length === 2) {
        // 检查是否包含运算符
        const hasOperator = ['+', '-', '*', '/'].includes(functionVertices[chain[0]]) ||
          ['+', '-', '*', '/'].includes(functionVertices[chain[1]]);

        if (hasOperator) {
          const expr1 = extractExpression(functionVertices[chain[0]]);
          const expr2 = extractExpression(functionVertices[chain[1]]);
          let operator = null;
          let expression = null;

          if (['+', '-', '*', '/'].includes(expr1)) {
            operator = expr1;
            expression = expr2;
          } else if (['+', '-', '*', '/'].includes(expr2)) {
            operator = expr2;
            expression = expr1;
          }

          if (operator && expression) {
            const combinedExpr = `y = ${expression} ${operator}`;
            relationships.push({
              sourceIds: [chain[0]],
              targetId: chain[1],
              chainFunctions: chain.map(id => functionVertices[id]),
              relationshipType: '带运算符的简单关系',
              combinedFunction: combinedExpr
            });
          }
        } else {
          // 简单相加关系
          const sourceExpr = extractExpression(functionVertices[chain[0]]);
          const targetExpr = extractExpression(functionVertices[chain[1]]);
          const combinedExpr = `y = ${sourceExpr} + ${targetExpr}`;

          relationships.push({
            sourceIds: [chain[0]],
            targetId: chain[1],
            chainFunctions: chain.map(id => functionVertices[id]),
            relationshipType: '简单相加',
            combinedFunction: combinedExpr
          });
        }
      }
    });

    return relationships;
  }

  /**
   * 识别函数链式关系（深度优先搜索）
   * @param {Array} edges 边数组
   * @param {Object} functionVertices 顶点映射
   * @returns {Array} 链式关系数组
   */
  findFunctionChains(edges, functionVertices) {
    // 构建邻接表
    const adjacencyList = {};
    const allVertices = Object.keys(functionVertices);

    // 初始化邻接表
    allVertices.forEach(id => {
      adjacencyList[id] = [];
    });

    // 填充邻接表
    edges.forEach(edge => {
      adjacencyList[edge.sourceId].push(edge.targetId);
    });

    // 找出所有链
    const chains = [];
    const visited = {};

    // 深度优先搜索
    const dfs = (current, path) => {
      visited[current] = true;
      path.push(current);

      const neighbors = adjacencyList[current];
      if (neighbors.length === 0) {
        // 链的末端
        if (path.length > 1) {
          chains.push([...path]);
        }
      } else {
        neighbors.forEach(neighbor => {
          if (!visited[neighbor]) {
            dfs(neighbor, path);
          }
        });
      }

      path.pop();
    };

    // 对每个起点开始DFS
    allVertices.forEach(id => {
      // 检查是否是起点（没有入边的顶点）
      const isStart = edges.every(edge => edge.targetId !== id);

      if (isStart && !visited[id]) {
        dfs(id, []);
      }
    });

    // 如果没有找到链，尝试其他可能的路径
    if (chains.length === 0 && edges.length > 0) {
      allVertices.forEach(id => {
        if (!visited[id]) {
          dfs(id, []);
        }
      });
    }

    return chains;
  }
}
