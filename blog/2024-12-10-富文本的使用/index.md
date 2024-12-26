---
slug: wangEditor的基本使用
title:  wangEditor的基本使用
authors: [ppnnssy]
tags: [wangEditor, 富文本]
---

### 起因
平台管理功能需要用到富文本。项目中用的quill，但是视频上传功能只能上传网络视频，如果想上传本地，修改起来比较麻烦，所以转用了wangEditor。
因为是vue2项目，比较老旧，网上资料好多过时了，不太好用，所以记录一下。
官网：https://www.wangeditor.com/

### 安装
需要安装这两个包：
```
  "@wangeditor/editor": "^5.1.23",
  "@wangeditor/editor-for-vue": "^1.0.2",
```
命令：
```
yarn add @wangeditor/editor
# 或者 npm install @wangeditor/editor --save

yarn add @wangeditor/editor-for-vue
# 或者 npm install @wangeditor/editor-for-vue --save
```

### 使用
有官网示例：https://github.com/wangfupeng1988/vue2-wangeditor-demo
这个demo还挺好用的，基本涵盖了所有常用功能。

### 视频图片上传
一共就一百多行代码，直接贴上了
Editor.vue
```
<template>
  <div>
    <div style="border: 1px solid #ccc; margin-top: 10px">
      <!-- 工具栏 -->
      <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editor"
        :defaultConfig="toolbarConfig"
      />
      <!-- 编辑器 -->
      <Editor
        style="height: 400px; width: 600px; overflow-y: hidden"
        :defaultConfig="editorConfig"
        v-model="html"
        @onChange="onChange"
        @onCreated="onCreated"
      />
    </div>
  </div>
</template>

<script>
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { uploadImgApi } from "@/api/notify-management/notify";
import axios from "axios";
export default {
  name: "MyEditor",
  components: { Editor, Toolbar },
  data() {
    return {
      editor: null,
      html: "",
      toolbarConfig: {
        toolbarKeys: [
          "bold", // 加粗
          "italic", // 斜体
          "fontSize", // 字号
          "fontFamily", // 字体
          "bulletedList", // 无序列表
          "numberedList", // 有序列表
          "color",
          "insertLink", // 插入链接
          "insertTable", // 插入表格
          "deleteTable", // 删除表格
          // "tables",
          {
            key: "group-justify",
            title: "对齐",
            menuKeys: [
              "justifyLeft",
              "justifyRight",
              "justifyCenter",
              "justifyJustify",
            ],
          },
          {
            key: "group-image",
            title: "图片",
            iconSvg:
              '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
            menuKeys: ["uploadImage"],
          },
          {
            key: "group-video",
            title: "视频",
            iconSvg:
              '<svg t="1733467132853" class="icon" viewBox="0 0 1496 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1478" width="200" height="200"><path d="M1181.538462 380.691692L1496.615385 118.153846v787.692308l-315.076923-262.537846V945.230769a78.769231 78.769231 0 0 1-78.769231 78.769231H78.769231a78.769231 78.769231 0 0 1-78.769231-78.769231V78.769231a78.769231 78.769231 0 0 1 78.769231-78.769231h1024a78.769231 78.769231 0 0 1 78.769231 78.769231v301.922461zM157.538462 157.538462v708.923076h866.461538V157.538462H157.538462z" p-id="1479"></path></svg>',
            menuKeys: ["uploadVideo"],
          },
          "undo", // 撤销
          "redo", // 重复
        ],
        // excludeKeys: [
        // ],
      },
      editorConfig: {
        placeholder: "请输入内容...",
        // autoFocus: false,

        // 所有的菜单配置，都要在 MENU_CONF 属性下
        MENU_CONF: {
          uploadImage: {
            customUpload: this.uploadImg,
          },
          uploadVideo: {
            customUpload: this.uploadVideo,
          },
        },
      },
    };
  },
  methods: {
    //上传图片       //上传图片
    uploadImg(file, insertFn) {
      let formdata = new FormData();
      formdata.append("file", file, file.name);
      formdata.append("resourceId", 6);
      //调用上传图片接口，上传图片  我这里testUpImg是测试接口
      axios({
        method: "post",
        url: process.env.VUE_APP_BASE_API + "/xinwei-obs/file/upload/single",
        data: formdata,
      }).then((response) => {
        insertFn(response.data.file_path);
      });
    },
    uploadVideo(file, insertFn) {
      let formdata = new FormData();
      formdata.append("file", file, file.name);
      formdata.append("resourceId", 6);
      //调用上传图片接口，上传图片
      axios({
        method: "post",
        url: process.env.VUE_APP_BASE_API + "/xinwei-obs/file/upload/single",
        // url:
        //   process.env.VUE_APP_BASE_API +
        //   "/xinwei-backstage/admin-api/infra/file/upload",
        data: formdata,
      }).then((response) => {
        insertFn(response.data.file_path);
      });
    },
    onCreated(editor) {
      this.editor = Object.seal(editor); // 【注意】一定要用 Object.seal() 否则会报错
    },
    onChange(editor) {
      // console.log("onChange", editor.getHtml()); // onChange 时获取编辑器最新内容
      this.$emit("contentChange", editor.getHtml());
    },
    // insertTextHandler() {
    //   const editor = this.editor;
    //   if (editor == null) return;
    //   editor.insertText(" hello ");
    // },
    // printEditorHtml() {
    //   const editor = this.editor;
    //   if (editor == null) return;
    //   console.log(editor.getHtml());
    // },
    disableHandler() {
      setTimeout(() => {
        const editor = this.editor;
        editor.disable();
      });
    },
    enableHandler() {
      setTimeout(() => {
        const editor = this.editor;
        editor.enable();
      });
    },
    setValue(val) {
      console.log("设置值==>", val);

      setTimeout(() => {
        this.html = val;
      });
    },
  },

  beforeDestroy() {
    const editor = this.editor;
    if (editor == null) return;
    editor.destroy(); // 组件销毁时，及时销毁 editor ，重要！！！
  },
};
</script>

<style src="@wangeditor/editor/dist/css/style.css"></style>
```

主要是在data中配置toolbarConfig控制工具栏，在editorConfig.MENU_CONF中配置自定义的上传图片视频接口

### 上传图片和视频的函数
这个之前没自己写过，所以需要自己写一下
首先项目中一般有固定的上传接口，后端会把视频图片上传到云端。
前端请求的时候直接使用axios，写好请求参数
需要使用：
```
    let formdata = new FormData();
    formdata.append("file", file, file.name);
```
来格式化媒体文件
如果有额外的参数，也可以使用 formdata.append("字段名", 字段值); 来添加

本项目中没有对图片和视频进行大小限制之类的校验，工期太紧了就没做(产品也没要求)

### 使用组件的细节
项目中编辑器是在dialog中，所以首屏并不加载，而是弹出后才加载，如果需要对ref进行操作，需要使用nextTick()等待加载完成：
```
      this.addNotifyVisible = true;
      this.$nextTick(() => {
        this.$refs["editorRef"].setValue(this.addNotifyForm.content);
        this.$refs["editorRef"].disableHandler();
      });
```
例如这个，查看消息的时候，需要先弹出dialog，再给编辑器赋值和禁用

