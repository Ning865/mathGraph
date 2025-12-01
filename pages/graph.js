// 等待页面加载完成后绘制函数图像
document.addEventListener('DOMContentLoaded', function() {
        // 显示当前函数表达式
    function displayCurrentFunction() {
        const functionExpression = getFunctionFromUrl();
        const expressionElement = document.getElementById('functionExpression');
        if (expressionElement) {
            expressionElement.textContent = '函数: ' + functionExpression;
        }
    }
     
    // 设置返回按钮功能
    function setupReturnButton() {
        const returnButton = document.getElementById('returnButton');
        if (returnButton) {
            returnButton.addEventListener('click', function() {
                // 跳转到索引页面
                window.location.href = 'index.html';
            });
        }
    }
    
    // 导出HTML代码功能
    function setupExportFunctionality() {
        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            exportButton.addEventListener('click', exportGraphAsHTML);
        }
    }
    
    // 导出当前图形为完整的HTML文件
    function exportGraphAsHTML() {
        // 获取当前绘制的函数表达式
        const functionExpression = getFunctionFromUrl();
        
        // 创建包含所有必要内容的HTML代码
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>函数图像 - ${functionExpression}</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100%;
      width: 100%;
      font-family: Arial, sans-serif;
    }
    
    #my-graph {
      width: 100%;
      height: 100%;
    }
    
    .title {
      position: absolute;
      top: 10px;
      left: 10px;
      background: white;
      padding: 5px 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 10;
    }
  </style>
  <!-- 使用CDN引入function-plot库 -->
  <script src="https://cdn.jsdelivr.net/npm/function-plot@1/dist/function-plot.js"></script>
</head>
<body>
  <div class="title">函数: ${functionExpression}</div>
  <div id="my-graph"></div>
  
  <script>
    // 绘制函数图像
    document.addEventListener('DOMContentLoaded', function() {
        // 函数表达式
        const functionToPlot = '${functionExpression}';
        
        // 创建函数图像
        functionPlot({
            target: '#my-graph',
            width: window.innerWidth,
            height: window.innerHeight,
            margin: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            },
            data: [{
                fn: functionToPlot,
                color: '#ff0000'
            }],
            grid: true,
            xAxis: {
                label: 'X 轴',
                domain: [-10, 10]
            },
            yAxis: {
                label: 'Y 轴',
                domain: [-5, 50]
            }
        });
        
        // 窗口大小变化时重新绘制
        window.addEventListener('resize', function() {
            functionPlot({
                target: '#my-graph',
                width: window.innerWidth,
                height: window.innerHeight,
                margin: {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50
                },
                data: [{
                    fn: functionToPlot,
                    color: '#ff0000'
                }],
                grid: true,
                xAxis: {
                    label: 'X 轴',
                    domain: [-10, 10]
                },
                yAxis: {
                    label: 'Y 轴',
                    domain: [-5, 50]
                }
            });
        });
    });
  </script>
</body>
</html>`;
    
    // 创建Blob对象
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `function-graph-${Date.now()}.html`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}
    // 从URL获取函数表达式参数
    function getFunctionFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const result =  urlParams.get('function');
        //将result中的e^x整体替换成可识别的Math.exp(x)，同时把 |x| 转换成Math.abs(x)
        const newResult = result.replace(/e\^x/g, 'exp(x)').replace(/\|x\|/g, 'abs(x)');
        console.log(newResult);
        return  newResult || 'sin(x)+cos(x)'; // 默认函数
    }
    
    // 监听窗口大小变化，动态调整图像
    function resizePlot() {
        // 获取要绘制的函数
        const functionToPlot = getFunctionFromUrl();
        
        // 创建函数图像
        functionPlot({
            target: '#my-graph',
            width: window.innerWidth,  // 设置宽度为窗口宽度
            height: window.innerHeight, // 设置高度为窗口高度
            margin: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            },
            data: [{
                fn: functionToPlot,
                color: '#ff0000' // 红色曲线
            }],
            grid: true, // 显示网格
            xAxis: {
                label: 'X 轴',
                domain: [-10, 10] // X轴范围
            },
            yAxis: {
                label: 'Y 轴',
                domain: [-5, 50] // Y轴范围
            }
        });
    }
    
    // 初始绘制
    resizePlot();
    
    // 窗口大小变化时重新绘制
    window.addEventListener('resize', resizePlot);
    
    // 设置导出功能
    setupExportFunctionality();

    // 设置返回按钮功能
    setupReturnButton();

     // 显示当前函数表达式
    displayCurrentFunction();
});