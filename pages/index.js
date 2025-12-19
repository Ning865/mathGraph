import GraphManager from './modules/graph-manager.js';
import FunctionManager from './modules/function-manager.js';
import RelationshipAnalyzer from './modules/relationship-analyzer.js';
import { extractExpression, parseUserFunction } from './modules/function-utils.js';

/**
 * 数学函数绘图应用主类
 * 作为应用的协调器，负责：
 * - 初始化各个功能模块
 * - 管理用户界面组件（右键菜单、拖拽功能）
 * - 协调模块间的通信和事件处理
 * - 提供应用级的功能入口
 */
class MathGraphApp {

  constructor(container) {
    if (!container) {
      throw new Error('图形容器必须提供');
    }

    // 初始化图形管理器
    this.graphManager = new GraphManager(container);
    this.graph = this.graphManager.getGraph();

    // 初始化函数管理器
    this.functionManager = new FunctionManager(this.graph);

    // 初始化关系分析器
    this.relationshipAnalyzer = new RelationshipAnalyzer(this.graph);

    // 设置右键点击回调
    this.graphManager.onRightClick = this.showContextMenu.bind(this);

    // 初始化用户界面组件
    this.initContextMenu();
    this.initDragAndDrop();
    this.initFunctionRelationships();
    
    // 初始化自定义函数功能
    this.initCustomFunction();
  }

  /**
   * 初始化右键菜单
   * 
   * 创建自定义的右键菜单，提供删除选中单元格的功能。
   * 菜单会在右键点击图形元素时显示。
   */
  initContextMenu() {
    // 创建右键菜单容器
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'context-menu';
    this.contextMenu.style.display = 'none';

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

  /**
   * 显示右键菜单
   * 
   * @param {number} x - 菜单显示的X坐标（相对于页面）
   * @param {number} y - 菜单显示的Y坐标（相对于页面）
   */
  showContextMenu(x, y) {
    if (this.contextMenu) {
      this.contextMenu.style.left = x + 'px';
      this.contextMenu.style.top = y + 'px';
      this.contextMenu.style.display = 'block';
    }
  }

  /**
   * 隐藏右键菜单
   */
  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
  }

  /**
   * 删除选中的单元格
   * 
   * 删除当前在画布上选中的所有单元格（函数顶点和边）。
   * 操作完成后会自动隐藏右键菜单。
   */
  deleteSelectedCells() {
    let selectedCells = this.graph.getSelectionCells();
    if (selectedCells.length > 0) {
      this.graph.removeCells(selectedCells);
    }
    this.hideContextMenu();
  }

  /**
   * 初始化拖拽功能
   * 
   * 为工具栏中的函数项启用拖拽功能，允许用户将函数拖拽到画布上。
   * 支持从工具栏拖拽函数表达式到画布指定位置绘制。
   */
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

  /**
   * 初始化自定义函数功能
   * 
   * 绑定"绘制自定义函数"按钮的点击事件，点击后会解析用户输入的函数表达式
   * 并将其绘制到画布上。
   */
  initCustomFunction() {
    let self = this;
    
    // 获取自定义函数输入框和按钮
    const input = document.getElementById('customFunctionInput');
    const button = document.getElementById('drawCustomFunctionButton');
    
    // 添加点击事件监听器
    button.addEventListener('click', function() {
      self.handleCustomFunction(input.value);
    });
    
    // 添加回车键监听器
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        self.handleCustomFunction(input.value);
      }
    });
  }
  
  /**
   * 处理自定义函数输入
   * 
   * 解析用户输入的函数表达式，验证其有效性，然后在画布上绘制该函数。
   * @param {string} funcStr - 用户输入的函数表达式
   */
  handleCustomFunction(funcStr) {
    // 解析函数表达式
    const parsedFunc = parseUserFunction(funcStr);
    
    if (!parsedFunc) {
      alert('请输入有效的函数表达式！');
      return;
    }
    
    // 在画布中心绘制函数
    const graphContainer = document.getElementById('graphContainer');
    const rect = graphContainer.getBoundingClientRect();
    const x = rect.width / 2 - 50;
    const y = rect.height / 2 - 25;
    
    // 绘制函数
    this.functionManager.drawFunction(parsedFunc, x, y);
    
    // 清空输入框
    document.getElementById('customFunctionInput').value = '';
    
    alert('自定义函数绘制成功！');
  }
  
  /**
   * 初始化函数关系功能
   * 
   * 绑定"识别函数关系"按钮的点击事件，点击后会分析并显示
   * 画布上函数之间的关系。
   */
  initFunctionRelationships() {
    let self = this;

    // 初始化关系识别按钮事件
    document.getElementById('identifyRelationshipsButton').addEventListener('click', function () {
      self.displayFunctionRelationships();
    });
  }

  /**
   * 显示函数关系分析结果
   * 
   * 分析画布上函数之间的关系，并将结果显示在指定的结果区域。
   * 支持链式关系和简单关系两种类型的分析。
   * 每个关系都提供"绘制"按钮，可以跳转到图形页面绘制组合函数。
   * 
   * @returns {Array} 分析得到的关系数组
   */
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
    return relationships;
  }
}

const mathGraphApp = new MathGraphApp(document.getElementById('graphContainer'));
// 绑定删除按钮事件
const deleteButton = document.getElementById('deleteSelectedButton');
deleteButton.addEventListener('click', () => {
  mathGraphApp.deleteSelectedCells();
});
