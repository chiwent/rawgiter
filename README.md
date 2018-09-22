# rawgiter

[![NPM](https://nodei.co/npm/rawgiter.png)](https://nodei.co/npm/rawgiter/)

将静态资源内的本地路径转换为github远程仓库资源对应的rawgit地址，方便静态资源的部署<br>

在使用github page的时候，如果远程仓库上有html内引用的静态资源，那么我们可以加一个rawgit头，在page服务的时候就可以正确加载需要的内容，rawgit的基本规则是：`https://rawgit.com/:id/:repo/:branch/远程仓库路径`<br>

如果我们要手动修改HTML文档的静态资源，会比较麻烦，所以就写了一个工具，可以自动化地将项目内的静态资源转成rawgit形式（如果超出项目主目录的将不会转换）<br>
此外，首次执行命令的时候会根据你填入的信息执行`git config`操作<br>

## 安装

```
npm i rawgiter -g
```

## 基本使用
安装完成后直接在项目根目录下运行`rawgiter`，按照提示来操作，第一次在项目中使用时需要先配置信息，配置完成后会在项目下生成一个配置文件<br>


## 补充

有一部分代码来自[Aaaaaaaty](https://github.com/Aaaaaaaty/blog/blob/master/fsPathSys/fs.js)，并做了点修改<br>

