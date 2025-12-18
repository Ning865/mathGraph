import GraphManager from './modules/graph-manager.js';
import FunctionManager from './modules/function-manager.js';
import RelationshipAnalyzer from './modules/relationship-analyzer.js';
import { extractExpression, } from './modules/utils/function-utils.js';

class MathGraphApp {

  // 获取 div 容器，作为图形容器
  constructor(container) {
    this.graphManager = new GraphManager(container);
    this.graph = this.graphManager.getGraph();

    this.functionManager = new FunctionManager(this.graph);

    this.relationshipAnalyzer = new RelationshipAnalyzer(this.graph);

    this.graphManager.onRightClick = this.showContextMenu.bind(this);

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

      self.functionManager.drawFunction(functionStr, x, y);
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

  // 修改显示函数关系的方法
  displayFunctionRelationships() {
    const relationships = this.relationshipAnalyzer.analyze();
    const resultDiv = document.getElementById('functionsResult');

    if (!resultDiv) {
      console.error('结果显示容器未找到');
      return;
    }

    if (relationships.length === 0) {
      resultDiv.innerHTML += '<p><strong>未检测到函数之间的连接关系</strong></p>';
      return;
    }

    // 构建结果HTML
    let resultHTML = '<h4>函数关系：</h4><ul>';

    relationships.forEach((rel, index) => {
      const expr = extractExpression(rel.combinedFunction);
      const drawButton = `<button onclick="window.location.href='graph.html?function=${encodeURIComponent(expr)}'" 
                         style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">
                         绘制
                       </button>`;

      if (rel.chainFunctions) {
        // 链式关系
        resultHTML += `
        <li>
          <strong>链式关系 ${index + 1}</strong>: ${rel.chainFunctions.join(' → ')}<br>
          <em>组合函数:</em> <strong>${rel.combinedFunction}</strong>
          ${drawButton}
        </li>`;
      } else {
        // 普通关系
        resultHTML += `
        <li>
          <strong>关系 ${index + 1}</strong>: ${rel.sourceFunc || ''} → ${rel.targetFunc || ''}<br>
          <em>组合函数:</em> <strong>${rel.combinedFunction}</strong>
          ${drawButton}
        </li>`;
      }
    });

    resultHTML += '</ul>';
    resultDiv.innerHTML += resultHTML;
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
