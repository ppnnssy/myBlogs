let xLength = 15;
let dataAxis = Array.from({ length: xLength }, (item, index) => index);
let data = [];
let rodData = [];
dataAxis.forEach((item, index) => {
  // 设置基础bar数据
  data.push(item + 10);
  // 设置markPoint数据
  rodData.push({
    symbol: 'rect',
    symbolSize: [20, 4],
    xAxis: item,
    yAxis: data[index], // 对应每列基础bar的值
    itemStyle: {
      color: 'rgba(0,222,255,1)'
    }
  });
});
option = {
  xAxis: {
    data: dataAxis,
    axisLabel: {
      color: '#999'
    },
    axisTick: {
      show: false
    },
    axisLine: {
      show: false
    }
  },
  yAxis: {
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    splitLine: {
      show: false
    },
    axisLabel: {
      color: '#999'
    }
  },
  series: [
    {
      // 基础bar
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,222,255,0.3)' },
          { offset: 1, color: 'rgba(0,222,255,0.8)' }
        ])
      },
      data,
      barWidth: 20,
      markPoint: {
        data: rodData
      }
    }
  ]
};
