# smooth-scroll-storytelling

### 🔗 在线演示 → **<https://ashely-looki.github.io/smooth-scroll-storytelling-skill/>**

一个 Claude 技能（Skill），用于打造**安静、编辑感、弹性平滑的滚动叙事网页**——复刻 [solomei.ai](https://solomei.ai) 那种动效手感，纯 HTML/CSS/GSAP，**无需构建步骤**。

它把从头到尾做一个这样的页面所沉淀的经验整理成了一套配方，包含踩过的坑，并附上经过验证、可直接复用的代码片段。

## 涵盖内容

- **平滑代理层** —— "顺滑感"的核心：在 `gsap.ticker` 上让一个代理值缓动逼近原始滚动进度，视觉由代理值驱动（而非直接跟原始滚动）。
- **逐词模糊显影** —— 把文案拆成单词，配合轻微模糊 + 错峰显影；划走时仍保持可读。
- **Sticky 滚动场景** —— 高区块 + 内层 sticky 场景 + 随滚动 scrub 的显影时间线。
- **贯穿全页的引导线** —— 一条 SVG 路径物理地贯穿整个文档、随滚动绘制：Catmull-Rom 圆弧（无尖角）、种子化的不规则走线、重布局安全。
- **随滚动响应的 canvas 主视觉** —— 一个 Rive 风格的"轨道核心"，明显随滚动缩放，零外部素材。
- **降级处理**：`prefers-reduced-motion` 与无 JS 兜底，以及性能规则。

## 目录结构

```
smooth-scroll-storytelling/
├── SKILL.md                  # 手法、构建顺序、踩过的坑、Do / Don't
├── references/
│   ├── page-skeleton.html    # 页面骨架
│   ├── styles-core.css       # 变量、玻璃面、sticky 场景、定位、移动端、reduced-motion
│   ├── scroll-proxy.js       # 平滑代理层
│   ├── text-reveal.js        # 逐词拆分 + 入场时间线 + 兜底
│   ├── sticky-scene.js       # 章节级 scrub 显影
│   ├── guide-line.js         # 贯穿全页的引导线（含几何验证法）
│   └── orbital-core.js       # 随滚动响应的 canvas 主视觉
└── examples/demo/            # 可直接打开的完整演示（references 的组合版）
```

## 演示

- **在线直接看**（无需 clone）：<https://ashely-looki.github.io/smooth-scroll-storytelling-skill/>
- **本地运行**：`examples/demo/` 是把所有手法串起来的完整页面，**无需构建**。克隆后直接用浏览器打开 `examples/demo/index.html` 即可；若 CDN 脚本被拦截，在该目录起 `python3 -m http.server 5177` 再访问 http://localhost:5177 。

## 安装

**Claude Code**（本地/团队）—— 克隆到你的 skills 目录：

```bash
git clone https://github.com/ashely-looki/smooth-scroll-storytelling-skill.git \
  ~/.claude/skills/smooth-scroll-storytelling
```

（也可以放在某个项目的 `.claude/skills/` 下。）

**claude.ai / API** —— 把仓库下载为 ZIP，作为 skill 上传。

## 许可证

MIT
