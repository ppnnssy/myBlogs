---
slug: Vue3的组件封装经验总结
title: Vue3的组件封装经验总结
authors: [ppnnssy]
tags: [Vue3, 组件, ProTable,开发笔记,芯位]
---

## 吐槽在先
以前用Vue2+js比较多，最近开发的项目用的Vue3+ts，写的多了之后慢慢熟悉了，读源码和写代码效率都高不少。最近是封装 ECharts 组件和使用 ProTable 组件的时候遇到一些问题。写文总结一下

## 封装ECharts组件

### 封装思路
因为最熟悉的是Vue2，最开始的时候当然是准备传入数据，然后在组件中渲染出来：

```vue
<template>
  <div class="bar-box" id="bar1"></div>
</template>

<script setup lang="ts">
// 接收数据
const props = defineProps(["data"])

// 渲染图表函数
const initBar = () => {...}

// 渲染
onMounted(() => {
    initBar()
})
</script>
```
这样写的话，每次数据变化重新渲染图表。需要使用 watch 监听数据变化，然后调用initBar。不够灵活。

### 改进思路
使用defineExpose暴露方法，让父组件调用initBar。数据通过参数传入
```vue
import { defineExpose, ref } from "vue";

...

const initBar = (barData: IBarData) => {...}

...

defineExpose({ initBar });
```
因为barData是后端返回的，所以可以在父组件中请求数据后调用initBar<br/>
父组件中的使用：

```vue
<template>
  <Bar ref="barRef" />
</template>

<script setup lang="ts">
const barRef = ref();
const barData = ref({
  value: [],
  category: [],
  dataType: "评分",
});

const getData = async() => {
    const res = await ... //获取数据的接口请求

    // 请求成功后，将数据赋值给barData
    ...
    // 绘制图表
     barRef.value.initBar(barData.value);
}
...

</script>
```

这样暴漏出来的好处是比较方便的在数据更新后更新图表，而且更加灵活<br/>
这个例子中还不够明显，可以继续看下面的ProTable组件的使用过程

## ProTable组件使用过程
这个组件在我博客中出现好几次了，主要是封装的功能比较多，能学习的地方也多。<br/>
使用组件的时候，按照文档，传入数据和配置项，然后渲染出来。<br/>
现在的问题是，有一个配置项（columns.enum）需要从后端请求数据后再传入，这样组件在挂载的时候拿不到数据，这个配置项的数据就没了

于是进入组件源码中找找办法：

PTable.vue:
```js 
// 定义 enumMap 存储 enum 值（避免异步请求无法格式化单元格内容 || 无法填充搜索下拉选择）
const enumMap = ref(new Map<string, { [key: string]: any }[]>());
provide("enumMap", enumMap);
const setEnumMap = async (col: ColumnProps) => {
  if (!col.enum) return;
  // 如果当前 enum 为后台数据需要请求数据，则调用该请求接口，并存储到 enumMap
  if (typeof col.enum !== "function") return enumMap.value.set(col.prop!, col.enum!);
  const { data } = await col.enum(col.enumParams || "");
  enumMap.value.set(col.prop!, data);
};

。。。

// 暴露给父组件的参数和方法(外部需要什么，都可以从这里暴露出去)
defineExpose({
  element: tableRef,
  tableData,
  pageable,
  searchParam,
  searchInitParam,
  getTableList,
  search,
  reset,
  handleSizeChange,
  handleCurrentChange,
  clearSelection,
  refresh,
  enumMap,
  isSelected,
  selectedList,
  selectedListIds,
  selectedCustomList,
  refreshTimeRef,
});
```

enum配置项中的数据被存储在enumMap中，并在组件暴露出来<br/>
那么就可以在异步请求拿到数据之后，手动修改这个数据：

```js
// 获取学期列表
let semesterList = ref([]); //学期列表
const getSemesterList = async () => {
  const res = await getSemesterAllApi();
  semesterList.value = res.data;

  // 设置proTable的搜索选项
  const tableSemesterList = [];
  (res.data as any)?.forEach(item => {
    tableSemesterList.push({ value: item.id, label: item.name });
  });
  proTableRef.value.enumMap.set("semesterId", tableSemesterList);

  ...
};
```

同样的，默认值、重置、搜索等操作，都可以手动操作

## 总结
从上面的例子可以看出，封装组件的时候需要考虑组件的用处和场景，暴露出适当的方法来。<br/>
Vue2中可以使用$ref.xxx来操作组件，Vue3中需要使用defineExpose暴露出来的方法。

