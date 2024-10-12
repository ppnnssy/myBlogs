---
slug: el-dialog对话框拖动功能
title:  el-dialog对话框拖动功能
authors: [ppnnssy]
tags: [Vue3, 组件, element, 自定义指令]
---

### 起因
群里的一个伙伴问到，如何在对话框中实现拖动功能。实际上el-dialog本身能支持拖动，但是不太自由，严格限制在了可见区域内，所以自己手写一个拖动功能，练练手吧

### 实现
使用自定义指令实现，基本原理就是写一个自定义指令，监听dialog的mousedown事件，在mousemove中计算位置，然后设置dialog的left和top属性

还挺简单的。但是实现过程中遇到一个问题，自定义指令不能直接绑到el-dialog上，需要绑定到它的子元素上。

```
<el-dialog
    v-model="dialogVisible"
    title="Draggable Dialog"
   v-draggable
  >

   </el-dialog>
```

这样会报警告：`[Vue warn]: Runtime directive used on component with non-element root node. The directives will not function as intended. `，然后自定义指令不起作用
查了一下，自定义指令不能直接绑定到组件上

解决方法是绑定到子元素上，然后直接通过`document.getElementById('dialog-box')`获取dialog盒子

具体代码如下：

App.vue:

```
<template>
  <el-button type="primary" @click="dialogVisible = true">Open Dialog</el-button>
  <el-dialog
    v-model="dialogVisible"
    title="Draggable Dialog"
    id="dialog-box"
  >
    <template #header>
      <div  class="draggable-header" v-draggable>
        Draggable Header
      </div>
    </template>
    <p>Dialog content goes here.</p>
    <template #footer>
      <el-button @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import vDraggable from './draggable.js';

const dialogVisible = ref(false);
</script>

<style scoped>
.draggable-header {
  cursor: move; /* 显示为可拖拽的光标 */
}
</style>
```

draggable.js

```
export default {
  mounted(el) {
    let startPosition = { x: 0, y: 0 };
    let dialogPosition = { x: 0, y: 0 };
    let dragging = false;

    const dialog = document.getElementById('dialog-box')

    const handleMouseDown = (e) => {
      
      
      // 鼠标位置记录
      startPosition.x = e.clientX;
      startPosition.y = e.clientY;

      // dialog位置记录
      // dialogPosition.x = dialog.getBoundingClientRect().left; 
      // dialogPosition.y = dialog.getBoundingClientRect().top; 

      dragging = true;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
      
    };

    const handleMouseMove = (e) => {
      if (dragging) {
        const offsetX = e.clientX - startPosition.x;
        const offsetY = e.clientY - startPosition.y;
        
        // dialog盒子本身有    position: relative; 属性，但是原生没有left, top
        // 所以直接改变盒子的left, top属性即可
        // 也可以使用transform改变盒子位置
        dialog.style.left = `${offsetX}px`;
        dialog.style.top = `${offsetY}px`;
        console.log("dialog==>",[dialog.style.left,dialog.style.top]);
        
      }
    };

    const handleMouseUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    el.addEventListener('mousedown', handleMouseDown);
  },
};
```
