// 等待页面加载完成后绘制函数图像
document.addEventListener('DOMContentLoaded', function() {
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
});