---
slug: 制作像素风网站
title: 搭建一个像素风Sui Move合约红包网站
authors: [ppnnssy]
tags: [像素风]
---

## 起因
朋友在参加一个SUIMove活动，制作一个随机红包网站作为作品。前端页面需要帮助。于是帮忙写前端
风格使用了像素风（主要是因为有个别人的成品页面作为UI参考）

## 技术参考
样式：CSS和tailwind混着写的
字体：[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
像素风组件：[NES.css](https://nostalgic-css.github.io/NES.css/)

## 搭建过程
1.创建React项目。虽然现在都用NEXT.js，但是为了方便，还是直接用React
    `npx create-react-app my-project`
2.安装tailwindcss,参考官方文档https://tailwindcss.com/docs/guides/create-react-app
前两步可以合并成一步的`npx create-react-app my-project` 

3.使用Press Start 2P字体 https://fonts.google.com/specimen/Press+Start+2P
    注意这个字体不支持中文
    首先在index.html中引入字体
```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

然后在index.css中设置字体
```

body {
  margin: 0;
  font-family:"Press Start 2P" , 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

4.安装NES.css
说明文档：https://nostalgic-css.github.io/NES.css/
安装：`npm install nes.css`
引入样式：在index.jss中引入:`import "nes.css/css/nes.min.css";`
使用组件：`  <button type="button" className="nes-btn is-primary">Primary</button>`
可以看到就是使用样式改变的组件效果。比如nes-btn类名，给h2加上也能显示出button效果
```
        <main style={{ padding: "1rem 0" }}>
          <h2 className="text-3xl font-bold underline nes-btn">我是Tab1</h2>
          <button onClick={()=>{ navigate("/")}}>Home</button>

          <button type="button" className="nes-btn is-primary">Primary</button>
        </main>
```
显示效果
![alt text](image.png)

## 总结
不难，但是效果还是挺好玩的，以后自己想做什么东西的时候可以参考