/* 依赖：
* 1. 在 HTML 中需要预先加载 mxGraph：
*    <script src="../node_modules/mxgraph/javascript/mxClient.js"></script>
* 2. 确保 mxBasePath 已设置：
*    <script>mxBasePath = '../node_modules/mxgraph/javascript/src'</script>
*/
export default class GraphManager {

  constructor(container) {
    this.container = container;
    this.graph = null;
    this.parent = null;

    this.initGraph();
  }

  initGraph() {
    // 禁用容器右键菜单
    mxEvent.disableContextMenu(this.container);

    // 创建图形实例
    this.graph = new mxGraph(this.container);
    this.parent = this.graph.getDefaultParent();

    this.applyGraphSettings();
    this.setupRightClickHandler();
  }

  applyGraphSettings() {
    const graph = this.graph;

    // 启用编辑功能
    graph.setEnabled(true);
    graph.setCellsResizable(true);
    graph.setConnectable(true);
    graph.connectionHandler.setCreateTarget(true);

    // 启用橡皮筋选择
    new mxRubberband(graph);

    // 设置网格
    graph.setGridEnabled(true);
    graph.gridSize = 10;

    // 设置默认顶点样式
    const style = graph.getStylesheet().getDefaultVertexStyle();
    style.shape = 'stroke';
    style.perimeter = mxPerimeter.RectanglePerimeter;
  }

  setupRightClickHandler() {
    const container = this.graph.container;
    const self = this;

    mxEvent.addListener(container, 'contextmenu', function (evt) {
      evt.preventDefault();

      const pt = mxUtils.convertPoint(
        container,
        mxEvent.getClientX(evt),
        mxEvent.getClientY(evt)
      );

      // 触发右键点击事件
      if (self.onRightClick) {
        self.onRightClick(pt.x, pt.y);
      }
    });
  }

  // 工具方法
  getGraph() {
    return this.graph;
  }

  getParent() {
    return this.parent;
  }

  getContainer() {
    return this.container;
  }
}
