const express = require('express');
const app = express();
const port = 3000;

// 静态文件服务
app.use(express.static('./'));

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});