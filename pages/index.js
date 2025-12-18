// 定义全局应用程序对象
var MathGraphApp = {
  graph: null,
  parent: null,
  contextMenu: null,

  // 初始化应用程序
  init: function () {
    // 检查浏览器兼容性
    if (!mxClient.isBrowserSupported()) {
      mxUtils.error('浏览器不支持！', 200, false);
      return;
    }

    // 获取图形容器
    var container = document.getElementById('graphContainer');

    // 禁用内置的上下文菜单
    mxEvent.disableContextMenu(container);

    // 创建图形
    this.graph = new mxGraph(container);
    this.parent = this.graph.getDefaultParent();

    // 初始化图形设置
    this.initGraphSettings();

    // 初始化右键菜单
    this.initContextMenu();

    // 初始化功能模块
    this.initDragAndDrop();
    this.initFunctionRelationships();

  },

  // 初始化图形设置
  initGraphSettings: function () {
    var graph = this.graph;

    // 启用编辑功能
    graph.setEnabled(true);
    graph.setCellsResizable(true);
    graph.setConnectable(true);
    graph.connectionHandler.setCreateTarget(true);

    // 启用橡皮筋选择
    new mxRubberband(graph);

    // 设置网格可见
    graph.setGridEnabled(true);
    graph.gridSize = 10;

    // 创建坐标系样式
    var style = graph.getStylesheet().getDefaultVertexStyle();
    style.shape = 'stroke';
    style.perimeter = mxPerimeter.RectanglePerimeter;

    // 添加右键点击事件
    this.addRightClickHandler();
  },

  // 初始化右键菜单
  initContextMenu: function () {
    // 创建右键菜单
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'context-menu';

    // 添加删除菜单项
    var deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '删除';
    deleteItem.onclick = this.deleteSelectedCells.bind(this);

    this.contextMenu.appendChild(deleteItem);
    document.body.appendChild(this.contextMenu);

    // 点击其他地方隐藏菜单
    document.addEventListener('click', this.hideContextMenu.bind(this));
  },

  // 添加右键点击事件处理
  addRightClickHandler: function () {
    var self = this;
    var container = this.graph.container;

    // 监听右键点击事件
    mxEvent.addListener(container, 'contextmenu', function (evt) {
      evt.preventDefault();

      // 获取点击位置
      var pt = mxUtils.convertPoint(container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));

      // 显示右键菜单
      self.showContextMenu(pt.x, pt.y);
    });
  },

  // 显示右键菜单
  showContextMenu: function (x, y) {
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.style.display = 'block';
  },

  // 隐藏右键菜单
  hideContextMenu: function () {
    this.contextMenu.style.display = 'none';
  },

  // 删除选中的单元格
  deleteSelectedCells: function () {
    var selectedCells = this.graph.getSelectionCells();
    if (selectedCells.length > 0) {
      this.graph.removeCells(selectedCells);
    }
    this.hideContextMenu();
  },

  // 初始化拖拽功能（简化版）
  initDragAndDrop: function () {
    var self = this;
    var functionItems = document.querySelectorAll('.function-item');

    functionItems.forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', function (evt) {
        evt.dataTransfer.setData('text/plain', this.dataset.function);
      });
    });

    var graphContainer = document.getElementById('graphContainer');
    graphContainer.addEventListener('dragover', function (evt) {
      evt.preventDefault();
    });

    graphContainer.addEventListener('drop', function (evt) {
      evt.preventDefault();
      var functionStr = evt.dataTransfer.getData('text/plain');
      var rect = graphContainer.getBoundingClientRect();
      var x = evt.clientX - rect.left;
      var y = evt.clientY - rect.top;
      self.drawFunction(functionStr, x, y);
    });
  },

  // 初始化函数关系功能
  initFunctionRelationships: function () {
    var self = this;

    // 初始化关系识别按钮事件
    document.getElementById('identifyRelationshipsButton').addEventListener('click', function () {
      self.displayFunctionRelationships();
    });
  },

  // 绘制函数图像（改进版）
  drawFunction: function (functionStr, x, y) {
    var graph = this.graph;
    var parent = this.parent;

    // 验证函数表达式
    if (!this.validateFunction(functionStr)) {
      alert('函数表达式无效');
      return;
    }

    graph.getModel().beginUpdate();
    try {
      // 生成唯一ID
      var timestamp = Date.now();
      var vertexId = functionStr.replace(/[^a-z0-9]/g, ' ');

      // 在顶点内容中显示函数表达式和ID
      var vertexContent = functionStr + '\n(ID: ' + vertexId + ')';
      if (functionStr.includes('=')) {
        graph.insertVertex(parent, vertexId, vertexContent, x, y, 150, 100, 'fillColor=white;strokeColor=blue;');
      }
      else graph.insertVertex(parent, vertexId, vertexContent, x, y, 100, 50, 'fillColor=white;strokeColor=blue;strokeWidth=2;shape=ellipse;');

    } finally {
      graph.getModel().endUpdate();
    }
  },

  // 识别并获取画布上所有函数
  identifyFunctions: function () {
    var graph = this.graph;
    var model = graph.getModel();
    var cells = model.cells;
    var functions = [];

    // 遍历所有单元格
    for (var key in cells) {
      if (cells.hasOwnProperty(key)) {
        var cell = cells[key];

        // 检查是否为函数顶点（包含函数表达式）
        if (cell.value && typeof cell.value === 'string') {
          // 提取函数表达式（去除ID部分）
          var content = cell.value.toString();
          var functionStr = content.split('\n')[0].trim();

          // 检查是否是有效的函数表达式
          if (functionStr && (functionStr.includes('=') ||
            functionStr.includes('sin') ||
            functionStr.includes('cos') ||
            functionStr.includes('tan') ||
            functionStr.includes('x^'))) {

            functions.push({
              id: cell.id,
              expression: functionStr,
              x: cell.geometry ? cell.geometry.x : 0,
              y: cell.geometry ? cell.geometry.y : 0,
              isCombined: functionStr.includes('+') // 标记是否为组合函数
            });
          }
        }
      }
    }

    return functions;
  },

  // 验证函数表达式
  validateFunction: function (functionStr) {
    // 简单验证，确保包含必要的字符
    return functionStr && typeof functionStr === 'string' && functionStr.length > 0;
  },

  // 识别函数之间的关系（支持链式合并）
  // 识别函数之间的关系（支持带运算符的链式合并）
  identifyFunctionRelationships: function () {
    var graph = this.graph;
    var model = graph.getModel();
    var cells = model.cells;
    var relationships = [];

    // 收集所有函数顶点（包括运算符）
    var functionVertices = {};
    for (var key in cells) {
      if (cells.hasOwnProperty(key) && cells[key].value && typeof cells[key].value === 'string') {
        var content = cells[key].value.toString();
        var functionStr = content.split('\n')[0].trim();
        // 增加对运算符的识别
        if (functionStr && (functionStr.includes('=') ||
          functionStr.includes('sin') ||
          functionStr.includes('cos') ||
          functionStr.includes('tan') ||
          functionStr.includes('x^') ||
          ['+', '-', '*', '/'].includes(functionStr))) {
          functionVertices[key] = functionStr;
        }
      }
    }

    // 构建边的映射关系
    var edges = [];
    for (var key in cells) {
      if (cells.hasOwnProperty(key)) {
        var cell = cells[key];
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
    var chains = this.identifyFunctionChains(edges, functionVertices);

    // 辅助函数：构建带运算符的表达式
    function buildExpressionWithOperators(chain, functionVertices) {
      var exprParts = [];
      var currentExpr = null;
      var currentOperator = null;

      // 处理链中的每个元素
      for (var i = 0; i < chain.length; i++) {
        var func = functionVertices[chain[i]];
        var isOperator = ['+', '-', '*', '/'].includes(func);

        if (!isOperator && currentOperator === null) {
          // 第一个函数表达式
          currentExpr = func.includes('=') ? func.split('=')[1].trim() : func;
        } else if (isOperator) {
          // 运算符
          currentOperator = func;
        } else if (currentExpr !== null && currentOperator !== null) {
          // 第二个函数表达式，进行运算
          var nextExpr = func.includes('=') ? func.split('=')[1].trim() : func;

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
        var combinedExpr = buildExpressionWithOperators(chain, functionVertices);
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
        var hasOperator = ['+', '-', '*', '/'].includes(functionVertices[chain[0]]) ||
          ['+', '-', '*', '/'].includes(functionVertices[chain[1]]);

        if (hasOperator) {
          // 如果包含运算符，尝试简单构建表达式
          var expr1 = functionVertices[chain[0]].includes('=')
            ? functionVertices[chain[0]].split('=')[1].trim()
            : functionVertices[chain[0]];
          var expr2 = functionVertices[chain[1]].includes('=')
            ? functionVertices[chain[1]].split('=')[1].trim()
            : functionVertices[chain[1]];

          // 确定哪个是运算符，哪个是表达式
          var operator = null;
          var expression = null;

          if (['+', '-', '*', '/'].includes(expr1)) {
            operator = expr1;
            expression = expr2;
          } else if (['+', '-', '*', '/'].includes(expr2)) {
            operator = expr2;
            expression = expr1;
          }

          if (operator && expression) {
            var combinedExpr = 'y = ' + expression + ' ' + operator;  // 注意：这种情况下可能需要进一步处理
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
          var sourceExpr = functionVertices[chain[0]].includes('=')
            ? functionVertices[chain[0]].split('=')[1].trim()
            : functionVertices[chain[0]];
          var targetExpr = functionVertices[chain[1]].includes('=')
            ? functionVertices[chain[1]].split('=')[1].trim()
            : functionVertices[chain[1]];

          var combinedExpr = 'y = ' + sourceExpr + ' + ' + targetExpr;

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
  },

  // 识别函数链式关系
  identifyFunctionChains: function (edges, functionVertices) {
    // 构建图的邻接表表示
    var adjacencyList = {};
    var allVertices = Object.keys(functionVertices);

    // 初始化邻接表
    allVertices.forEach(function (id) {
      adjacencyList[id] = [];
    });

    // 填充邻接表
    edges.forEach(function (edge) {
      adjacencyList[edge.sourceId].push(edge.targetId);
    });

    // 找出所有链
    var chains = [];
    var visited = {};

    // 深度优先搜索找出链
    function dfs(current, path) {
      visited[current] = true;
      path.push(current);

      var neighbors = adjacencyList[current];
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
      var isStart = edges.every(function (edge) {
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
  },

  // 修改显示函数关系的方法
  displayFunctionRelationships: function () {
    var relationships = this.identifyFunctionRelationships();
    var resultDiv = document.getElementById('functionsResult');

    if (relationships.length === 0) {
      resultDiv.innerHTML += '<p><strong>未检测到函数之间的连接关系</strong></p>';
      return;
    }

    // 构建结果HTML
    var resultHTML = '<h4>函数关系：</h4><ul>';
    relationships.forEach(function (rel, index) {
      var expr = rel.combinedFunction;
      if (expr.includes('=')) {// 提取纯函数表达式
        expr = expr.split('=')[1].trim();
      }
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
  },

  // 生成两个函数相加的组合函数表达式
  generateCombinedFunction: function (func1, func2) {
    // 提取函数表达式部分（去除y = 部分）
    var extractExpression = function (func) {
      if (func.includes('=')) {
        return func.split('=')[1].trim();
      }
      return func;
    };

    var expr1 = extractExpression(func1);
    var expr2 = extractExpression(func2);

    // 创建组合函数表达式
    return 'y = ' + expr1 + ' + ' + expr2;
  },


  // 获取随机颜色
  getRandomColor: function () {
    // 使用更高效的随机颜色生成方式
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
};

window.onload = function () {
  MathGraphApp.init();
};
