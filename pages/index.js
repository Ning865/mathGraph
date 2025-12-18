import GraphManager from './modules/graph-manager.js';
import {
  extractExpression,
  isValidFunction,
} from './modules/utils/function-utils.js';

class MathGraphApp {

  // 获取 div 容器，作为图形容器
  constructor(container) {

    this.graphManager = new GraphManager(container);
    this.graph = this.graphManager.getGraph();
    this.parent = this.graphManager.getParent();
    this.graphManager.onRightClick = (x, y) => this.showContextMenu(x, y);;

    this.initContextMenu();
    this.initDragAndDrop();
    this.initFunctionRelationships();
  }

  // 初始化右键菜单
  initContextMenu() {
    // 创建右键菜单
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'context-menu';

    // 添加删除菜单项
    let deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '删除';
    deleteItem.onclick = this.deleteSelectedCells.bind(this);

    this.contextMenu.appendChild(deleteItem);
    document.body.appendChild(this.contextMenu);

    // 点击其他地方隐藏菜单
    document.addEventListener('click', this.hideContextMenu.bind(this));
  }

  // 显示右键菜单
  showContextMenu(x, y) {
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.style.display = 'block';
  }

  // 隐藏右键菜单
  hideContextMenu() {
    this.contextMenu.style.display = 'none';
  }

  // 删除选中的单元格
  deleteSelectedCells() {
    let selectedCells = this.graph.getSelectionCells();
    if (selectedCells.length > 0) {
      this.graph.removeCells(selectedCells);
    }
    this.hideContextMenu();
  }

  // 初始化拖拽功能
  initDragAndDrop() {
    let self = this;
    let functionItems = document.querySelectorAll('.function-item');

    functionItems.forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', function (evt) {
        evt.dataTransfer.setData('text/plain', this.dataset.function);
      });
    });

    let graphContainer = document.getElementById('graphContainer');
    graphContainer.addEventListener('dragover', function (evt) {
      evt.preventDefault();
    });

    graphContainer.addEventListener('drop', function (evt) {
      evt.preventDefault();
      let functionStr = evt.dataTransfer.getData('text/plain');
      let rect = graphContainer.getBoundingClientRect();
      let x = evt.clientX - rect.left;
      let y = evt.clientY - rect.top;
      self.drawFunction(functionStr, x, y);
    });
  }

  // 初始化函数关系功能
  initFunctionRelationships() {
    let self = this;

    // 初始化关系识别按钮事件
    document.getElementById('identifyRelationshipsButton').addEventListener('click', function () {
      self.displayFunctionRelationships();
    });
  }

  // 绘制函数图像
  drawFunction(funcStr, x, y) {
    let graph = this.graph;
    let parent = this.parent;

    // 验证函数表达式
    if (!isValidFunction(funcStr)) {
      alert('函数表达式无效');
      return;
    }

    graph.getModel().beginUpdate();
    try {
      // 生成唯一ID
      let timestamp = Date.now();
      let vertexId = funcStr.replace(/[^a-z0-9]/g, ' ');

      // 在顶点内容中显示函数表达式和ID
      let vertexContent = funcStr + '\n(ID: ' + vertexId + ')';
      if (funcStr.includes('=')) {
        graph.insertVertex(parent, vertexId, vertexContent, x, y, 150, 100, 'fillColor=white;strokeColor=blue;');
      }
      else graph.insertVertex(parent, vertexId, vertexContent, x, y, 100, 50, 'fillColor=white;strokeColor=blue;strokeWidth=2;shape=ellipse;');

    } finally {
      graph.getModel().endUpdate();
    }
  }

  // 识别并获取画布上所有函数
  identifyFunctions() {
    let graph = this.graph;
    let model = graph.getModel();
    let cells = model.cells;
    let functions = [];

    // 遍历所有单元格
    for (let key in cells) {
      if (cells.hasOwnProperty(key)) {
        let cell = cells[key];

        // 检查是否为函数顶点（包含函数表达式）
        if (cell.value && typeof cell.value === 'string') {
          // 提取函数表达式（去除ID部分）
          let content = cell.value.toString();
          let funcStr = content.split('\n')[0].trim();

          if (isValidFunction(funcStr)) {
            functions.push({
              id: cell.id,
              expression: funcStr,
              x: cell.geometry ? cell.geometry.x : 0,
              y: cell.geometry ? cell.geometry.y : 0,
              isCombined: funcStr.includes('+') // 标记是否为组合函数
            });
          }
        }
      }
    }

    return functions;
  }

  // 识别函数之间的关系（支持链式合并）
  // 识别函数之间的关系（支持带运算符的链式合并）
  identifyFunctionRelationships() {
    let graph = this.graph;
    let model = graph.getModel();
    let cells = model.cells;
    let relationships = [];

    // 收集所有函数顶点（包括运算符）
    let functionVertices = {};
    for (let key in cells) {
      if (cells.hasOwnProperty(key) && cells[key].value && typeof cells[key].value === 'string') {
        let content = cells[key].value.toString();
        let functionStr = content.split('\n')[0].trim();
        // 增加对运算符的识别
        if (isValidFunction(functionStr)) {
          functionVertices[key] = functionStr;
        }
      }
    }

    // 构建边的映射关系
    let edges = [];
    for (let key in cells) {
      if (cells.hasOwnProperty(key)) {
        let cell = cells[key];
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
      }
    }

    // 识别链式关系
    let chains = this.identifyFunctionChains(edges, functionVertices);

    // 辅助函数：构建带运算符的表达式
    function buildExpressionWithOperators(chain, functionVertices) {
      let exprParts = [];
      let currentExpr = null;
      let currentOperator = null;

      // 处理链中的每个元素
      for (let i = 0; i < chain.length; i++) {
        let func = functionVertices[chain[i]];
        let isOperator = ['+', '-', '*', '/'].includes(func);

        if (!isOperator && currentOperator === null) {
          // 第一个函数表达式
          currentExpr = extractExpression(func);
        } else if (isOperator) {
          // 运算符
          currentOperator = func;
        } else if (currentExpr !== null && currentOperator !== null) {
          // 第二个函数表达式，进行运算
          let nextExpr = extractExpression(func);

          // 根据运算符类型构建表达式部分
          exprParts.push(currentExpr);
          exprParts.push(currentOperator);

          // 重置，准备下一组运算
          currentExpr = nextExpr;
          currentOperator = null;
        }
      }

      // 添加最后一个表达式（如果有）
      if (currentExpr !== null) {
        exprParts.push(currentExpr);
      }

      // 如果有有效的表达式部分，返回完整表达式
      if (exprParts.length > 0) {
        return 'y = ' + exprParts.join(' ');
      }

      return null;
    }

    // 为每个链创建组合函数关系
    chains.forEach(function (chain) {
      if (chain.length >= 3) {  // 至少需要：函数-运算符-函数
        // 检查并构建表达式
        let combinedExpr = buildExpressionWithOperators(chain, functionVertices);
        if (combinedExpr) {
          // 添加到关系数组
          relationships.push({
            sourceIds: chain.filter(id => !['+', '-', '*', '/'].includes(functionVertices[id])),
            operators: chain.filter(id => ['+', '-', '*', '/'].includes(functionVertices[id])),
            targetId: chain[chain.length - 1],
            chainFunctions: chain.map(function (id) { return functionVertices[id]; }),
            relationshipType: '带运算符的链式关系',
            combinedFunction: combinedExpr
          });
        }
      } else if (chain.length === 2) {  // 兼容原来的简单相加关系
        // 检查是否包含运算符
        let hasOperator = ['+', '-', '*', '/'].includes(functionVertices[chain[0]]) ||
          ['+', '-', '*', '/'].includes(functionVertices[chain[1]]);

        if (hasOperator) {
          let expr1 = extractExpression(functionVertices[chain[0]]);
          let expr2 = extractExpression(functionVertices[chain[1]]);

          // 确定哪个是运算符，哪个是表达式
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
            let combinedExpr = 'y = ' + expression + ' ' + operator;  // 注意：这种情况下可能需要进一步处理
            relationships.push({
              sourceIds: [chain[0]],
              targetId: chain[1],
              chainFunctions: chain.map(function (id) { return functionVertices[id]; }),
              relationshipType: '带运算符的简单关系',
              combinedFunction: combinedExpr
            });
          }
        } else {
          // 原来的简单相加逻辑
          let sourceExpr = extractExpression(functionVertices[chain[0]]);
          let targetExpr = extractExpression(functionVertices[chain[1]]);

          let combinedExpr = 'y = ' + sourceExpr + ' + ' + targetExpr;

          relationships.push({
            sourceIds: [chain[0]],
            targetId: chain[1],
            chainFunctions: chain.map(function (id) { return functionVertices[id]; }),
            relationshipType: '简单相加',
            combinedFunction: combinedExpr
          });
        }
      }
    });

    return relationships;
  }

  // 识别函数链式关系
  identifyFunctionChains(edges, functionVertices) {
    // 构建图的邻接表表示
    let adjacencyList = {};
    let allVertices = Object.keys(functionVertices);

    // 初始化邻接表
    allVertices.forEach(function (id) {
      adjacencyList[id] = [];
    });

    // 填充邻接表
    edges.forEach(function (edge) {
      adjacencyList[edge.sourceId].push(edge.targetId);
    });

    // 找出所有链
    let chains = [];
    let visited = {};

    // 深度优先搜索找出链
    function dfs(current, path) {
      visited[current] = true;
      path.push(current);

      let neighbors = adjacencyList[current];
      if (neighbors.length === 0) {
        // 如果是链的末端，保存链
        if (path.length > 1) {
          chains.push(path.slice());
        }
      } else {
        neighbors.forEach(function (neighbor) {
          if (!visited[neighbor]) {
            dfs(neighbor, path);
          }
        });
      }

      path.pop();
    }

    // 对每个未访问的顶点开始DFS
    allVertices.forEach(function (id) {
      // 检查是否是链的起点（没有入边的顶点）
      let isStart = edges.every(function (edge) {
        return edge.targetId !== id;
      });

      if (isStart && !visited[id]) {
        dfs(id, []);
      }
    });

    // 如果没有找到链，尝试其他可能的路径
    if (chains.length === 0 && edges.length > 0) {
      // 找到一个起始点进行DFS
      allVertices.forEach(function (id) {
        if (!visited[id]) {
          dfs(id, []);
        }
      });
    }

    return chains;
  }

  // 修改显示函数关系的方法
  displayFunctionRelationships() {
    let relationships = this.identifyFunctionRelationships();
    let resultDiv = document.getElementById('functionsResult');

    if (relationships.length === 0) {
      resultDiv.innerHTML += '<p><strong>未检测到函数之间的连接关系</strong></p>';
      return;
    }

    // 构建结果HTML
    let resultHTML = '<h4>函数关系：</h4><ul>';
    relationships.forEach(function (rel, index) {
      let expr = extractExpression(rel.combinedFunction);
      if (rel.chainFunctions) {
        // 显示链式关系
        resultHTML += '<li>' +
          '<strong>链式关系 ' + (index + 1) + '</strong>: ' +
          rel.chainFunctions.join(' → ') + '<br>' +
          '<em>组合函数:</em> <strong>' + rel.combinedFunction + '</strong>' +
          '<button onclick="window.location.href = \'graph.html?function=' + encodeURIComponent(expr) + '\'" ' +
          'style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">绘制</button>' +
          '</li>';
      } else {
        // 显示普通关系
        resultHTML += '<li>' +
          '<strong>关系 ' + (index + 1) + '</strong>: ' +
          rel.sourceFunc + ' → ' + rel.targetFunc + '<br>' +
          '<em>组合函数:</em> <strong>' + rel.combinedFunction + '</strong>' +
          '<button onclick="window.location.href = \'graph.html?function=' + encodeURIComponent(expr) + '\'" ' +
          'style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">绘制</button>' +
          '</li>';
      }
    });
    resultHTML += '</ul>';

    resultDiv.innerHTML += resultHTML;
    return relationships;
  }

  // 生成两个函数相加的组合函数表达式
  generateCombinedFunction(func1, func2) {
    let expr1 = extractExpression(func1);
    let expr2 = extractExpression(func2);
    return 'y = ' + expr1 + ' + ' + expr2;
  }
}

let mathGraphApp = new MathGraphApp(document.getElementById('graphContainer'));
const deleteButton = document.getElementById('deleteSelectedButton');
// 绑定删除事件
if (deleteButton) {
  deleteButton.addEventListener('click', () => {
    mathGraphApp.deleteSelectedCells();
  });
}
