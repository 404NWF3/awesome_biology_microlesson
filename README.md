<<<<<<< HEAD
# 高中生物学微课 - 神经体液调节共同维持稳态

本项目是一个交互式的高中生物学微课学习平台，围绕"神经体液调节共同维持稳态"主题，为学生提供丰富的学习资源和互动体验。

## 项目概述

本项目通过网页应用的形式，为高中生物学习者提供一个全面、互动的学习环境，帮助理解神经调节与体液调节如何共同维持人体稳态。项目包含课前练习、课程动画、概念图构建工具和课后习题四个主要功能模块，还集成了3D模型展示、AI实时答疑等特色功能。

## 项目架构

```
项目根目录/
├── assets/                # 静态资源目录
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript文件
│   ├── images/           # 图片资源
│   ├── video/            # 视频资源
│   ├── questions/        # 习题资源
│   └── webfonts/         # 网页字体
├── model/                # 3D模型文件
├── animation/            # 微课视频相关文件
├── index.html            # 主页
├── pre-test.html         # 课前练习
├── concept-map-iframe.html # 概念图构建
├── post-test.html        # 课后习题
├── smart-recommendation.html # 智能推荐
├── server.js             # Express服务器入口
└── package.json          # 项目配置
```

### 功能模块关系图

```
                    ┌─────────────┐
                    │   主页面    │
                    │ index.html  │
                    └──────┬──────┘
                           │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
┌──────▼─────┐    ┌───────▼──────┐    ┌──────▼─────┐
│  课前练习   │    │   核心学习    │    │  课后巩固   │
│ pre-test.html│  │  (图谱+视频)  │    │ post-test.html│
└──────┬─────┘    └───────┬──────┘    └──────┬─────┘
       │                  │                  │
       │           ┌──────▼─────┐            │
       │           │ 概念图构建  │            │
       │           │concept-map │            │
       │           └──────┬─────┘            │
       │                  │                  │
       └──────────┐ ┌────▼─────────┐ ┌───────┘
                  │ │              │ │
                  └─▼              ▼─┘
                  ┌───────────────────┐
                  │    智能推荐系统    │
                  │smart-recommendation│
                  └───────────────────┘
```

## 项目模块

### 1. 课前练习 (pre-test.html)

**内容**：通过精心设计的练习题，帮助学生检验预备知识，为后续学习做准备。
**特点**：
- 针对性测试学生对相关知识点的掌握程度
- 自动评分系统，提供即时反馈
- 针对错误答案提供详细解析和知识点链接

提高学生对现有知识的认识，明确学习目标，为后续学习奠定基础。

### 2. 课程动画 (animation/knowledge-tree.html, animation/video-player.html)

**内容**：生动的教学视频和交互式动画，直观展示神经调节与体液调节的过程。
**特点**：
- 知识树形式呈现核心概念及关系
- 高质量视频教学内容
- 动态交互图展示体温调节和水盐平衡的过程

通过视觉化和动画方式，帮助学生直观理解复杂的生理调节过程，提高学习效果。

### 3. 概念图构建 (concept-map-iframe.html)

**内容**：在线概念图构建工具，帮助学生梳理知识点之间的关系。
**特点**：
- 拖拽式界面，用户友好
- 可保存和分享概念图
- 预设关键概念，引导构建过程

增强学生对知识体系的整体理解，发展高阶思维能力，巩固对神经体液调节作用过程的理解。

### 4. 课后习题 (post-test.html)

**内容**：综合性练习题，覆盖课程核心内容，巩固所学知识。
**特点**：
- 多样化题型（选择题、填空题、简答题等）
- 智能评测系统
- 按照学生表现提供个性化学习建议

帮助学生检验学习效果，巩固知识点，发现和弥补知识盲点。

### 5. 3D模型展示

**内容**：基于Three.js的3D模型展示功能，包含甲状腺、丘脑和大脑等模型。
**特点**：
- 高质量3D模型 (GLTF格式)
- 交互式操作（旋转、缩放、重置）
- 详细的结构说明和功能解析

为学生提供三维直观的器官结构展示，加深对生理结构的理解，增强学习的趣味性。

### 6. AI实时答疑

**内容**：嵌入对话大模型，提供实时答疑功能。
**特点**：
- 即时回答学生提问
- 深入解析复杂概念
- 知识点链接与拓展

解决学习过程中的疑惑，提供即时帮助，增强学习自主性和效率。

## 技术实现

本项目主要基于以下技术实现：

- 前端：HTML5、CSS3、JavaScript
- 3D模型展示：Three.js、GLTF加载器
- 动画效果：CSS动画、JavaScript动画库
- 响应式设计：适配桌面端与移动端
- 性能优化：资源延迟加载、代码压缩

## 项目亮点

1. **全面的学习体验**：从课前预习到课后巩固，构建完整学习闭环
2. **直观的可视化学习**：3D模型和动态动画使抽象概念具象化
3. **交互式学习工具**：概念图构建促进主动思考和知识整合
4. **个性化学习反馈**：智能评测系统提供针对性的学习建议
5. **优化的用户体验**：响应式设计、性能优化确保流畅的学习过程

## 使用指南

1. 打开 `index.html` 进入主页
2. 点击"开始学习"按钮或导航菜单访问各功能模块：
   - 课前练习
   - 课程动画
   - 概念图构建
   - 课后习题
3. 在3D模型展示区可查看详细的人体器官模型
4. 使用AI答疑功能解决学习中的问题

## 使用Node.js运行项目

本项目可以使用Node.js的本地服务器来运行，这样可以避免跨域问题并更好地模拟真实部署环境：

### 安装Node.js

1. 访问 [Node.js官网](https://nodejs.org/) 下载并安装最新的LTS版本
2. 安装完成后，打开命令行工具验证安装：
   ```
   node -v
   npm -v
   ```

### 使用http-server运行项目

1. 全局安装http-server包：
   ```
   npm install -g http-server
   ```

2. 进入项目根目录：
   ```
   cd 项目路径
   ```

3. 启动服务器：
   ```
   http-server -p 8080
   ```

4. 在浏览器中访问：
   ```
   http://localhost:8080
   ```

### 使用Express框架运行（可选）

1. 在项目根目录初始化package.json：
   ```
   npm init -y
   ```

2. 安装Express：
   ```
   npm install express --save
   ```

3. 在项目根目录创建server.js文件：
   ```javascript
   const express = require('express');
   const app = express();
   const port = 3000;

   // 静态文件服务
   app.use(express.static('./'));

   // 启动服务器
   app.listen(port, () => {
     console.log(`服务器运行在 http://localhost:${port}`);
   });
   ```

4. 启动服务器：
   ```
   node server.js
   ```

5. 在浏览器中访问：
   ```
   http://localhost:3000
   ```

## 未来计划

1. 增加更多互动式实验模拟
2. 扩展更多生物学知识主题
3. 进一步优化移动端体验
4. 添加学习进度跟踪系统
5. 开发更多个性化学习路径


=======
# awesome_biology_microlesson
>>>>>>> 79097597f91d9171f8d35c5f0c89d2d39b8a8f56
