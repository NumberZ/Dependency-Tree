# Dependency Tree
该插件可以帮助你分析项目中文件的依赖关系并生成可视化的图示.

## Usage
1. 在vscode中打开项目目录，插件会自动分析项目。
2. 右键点击所需要分析的文件。
3. 插件提供了两个选项:
    * Gen BeDependent Tree: 生成此文件的被依赖图
    * Gen Dependent Tree: 生成此文件的依赖图
4. 如果是TS项目，需要在根目录创建如下配置文件，并在命令面板运行 "Dependency Tree: 重新分析项目” 即可。
```js
module.exports = {
  isJs: false,
  // tsconfig文件路径
  tsConfigPath: './tsconfig.json',
};
```

## Graph
![img](https://km.meituan.net/118319259.png?contentId=118380009&attachmentId=118319260&originUrl=https://km.meituan.net/118319259.png&contentType=2&isDownload=false&token=9e0260f9a2*64e3da6ceedaa0fa6609c&isNewContent=false&isViewPage=true)
* 标黄色的为选中的文件
* 红色的线条表示发生了循环引用(图中表示d.js依赖了a.js)

## Support Language
* js/jsx
* ts/tsx
