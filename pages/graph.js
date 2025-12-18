// 从URL获取函数表达式参数
function getFunctionFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const result = urlParams.get('function');
  //将result中的e^x整体替换成可识别的Math.exp(x)，同时把 |x| 转换成Math.abs(x)
  const newResult = result.replace(/e\^x/g, 'exp(x)').replace(/\|x\|/g, 'abs(x)');
  console.log(newResult);
  return newResult || 'sin(x)+cos(x)'; // 默认函数
}

function downloadFile(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 导出当前图形为完整的HTML文件
function exportAsHTML() {
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

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `function-graph-${Date.now()}.html`)
}

/**
 * 将当前函数图像（SVG）导出为 PNG 图片文件
 */
function exportAsImage() {
  try {
    console.log('开始导出PNG图片...');

    // 1. 获取function-plot创建的SVG元素
    const svgElement = document.querySelector('#my-graph svg');
    if (!svgElement) {
      console.error('找不到SVG元素');
      alert('无法找到函数图像，请确保图像已加载完成');
      return;
    }

    console.log('找到SVG元素');

    // 2. 克隆SVG元素，避免修改原始元素
    const clonedSvg = svgElement.cloneNode(true);

    // 3. 设置SVG的明确尺寸（function-plot可能使用百分比）
    const svgWidth = parseInt(svgElement.getAttribute('width')) || window.innerWidth;
    const svgHeight = parseInt(svgElement.getAttribute('height')) || window.innerHeight;

    clonedSvg.setAttribute('width', svgWidth);
    clonedSvg.setAttribute('height', svgHeight);
    clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // 4. 确保SVG有白色背景
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', svgWidth);
    rect.setAttribute('height', svgHeight);
    rect.setAttribute('fill', 'white');
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    // 5. 将SVG转换为字符串
    const svgString = new XMLSerializer().serializeToString(clonedSvg);

    // 6. 创建Canvas并绘制SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 设置高清画布（2倍缩放）
    const scale = 2;
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;

    // 创建Image对象
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        // 绘制图像到Canvas（高质量渲染）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 转换为PNG Data URL
        const pngDataUrl = canvas.toDataURL('image/png');

        // 生成文件名
        const functionExpression = getFunctionFromUrl();
        const safeFilename = functionExpression
          .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
          .substring(0, 30);

        const filename = `函数图像_${safeFilename}_${Date.now()}.png`;

        // 下载文件
        downloadFile(pngDataUrl, filename);

        console.log('PNG图片导出完成:', filename);

        // 清理URL对象
        URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Canvas绘制失败:', error);
        alert('导出图片失败: ' + error.message);
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = (error) => {
      console.error('SVG加载失败:', error);
      alert('SVG图像加载失败，无法导出图片');
      URL.revokeObjectURL(url);
    };

    img.src = url;

  } catch (error) {
    console.error('导出PNG图片失败:', error);
    alert('导出图片失败: ' + error.message);
  }
}

// 显示当前函数表达式
function displayCurrentFunction() {
  const functionExpression = getFunctionFromUrl();
  const expressionElement = document.getElementById('functionExpression');
  if (expressionElement) {
    expressionElement.textContent = '函数: ' + functionExpression;
  }
}

// 监听窗口大小变化，动态调整图像
function resizePlot() {
  // 获取要绘制的函数
  const functionToPlot = getFunctionFromUrl();

  // 创建函数图像
  this.functionPlot({
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


resizePlot();
displayCurrentFunction();

// 窗口大小变化时重新绘制
window.addEventListener('resize', resizePlot);

// 绑定事件
document.getElementById('returnButton').addEventListener('click', () => window.location.href = 'index.html');
document.getElementById('exportHTMLButton').addEventListener('click', exportAsHTML);
document.getElementById('exportImageButton').addEventListener('click', () => exportAsImage());
