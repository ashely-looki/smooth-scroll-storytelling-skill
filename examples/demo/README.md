# 演示 Demo

一个可直接打开的完整示例，把本技能的所有手法串在一起：平滑代理层、逐词模糊显影、sticky 滚动场景、贯穿全页的引导线、随滚动缩放的 canvas 主视觉、固定玻璃输入条。

复刻的是 [solomei.ai](https://solomei.ai) 的动效手感，用原始内容，**无需构建步骤**。

## 运行

直接用浏览器打开 `index.html` 即可。

如果浏览器拦截了 CDN 脚本（GSAP 从 jsDelivr 加载），在本目录起一个本地服务器：

```bash
python3 -m http.server 5177
```

然后访问 **http://localhost:5177**。

## 文件

- `index.html` —— 页面结构（顶栏、hero + canvas、sticky 章节、结尾面板、输入条、引导线 SVG）。
- `styles.css` —— 变量、玻璃面、sticky 场景、引导线/canvas 定位、移动端、reduced-motion。
- `app.js` —— 全部动效：平滑代理、逐词显影、章节 scrub、引导线绘制、canvas 轨道核心。

这些文件就是上一级 `../../references/` 里那些代码片段的完整组合版——想看单独某块手法，去对照 references。

## 可调的旋钮

- 平滑代理的缓动 `EASE`（[app.js](app.js) 里 `startScrollProxy`）—— 越小越柔/滞后，越大越跟手。
- 引导线的二次缓动 `LINE_EASE`、走线的不规则扰动、圆弧圆度 `k`（`buildGuidePath` / `bindGuideLine`）。
- canvas 核心的滚动缩放曲线 `scaleScroll`（`startField` 的 `draw`）。
