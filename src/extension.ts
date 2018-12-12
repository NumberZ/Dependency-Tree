'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import Pylon, {
  genDepenceTree,
  genBeDependentTree,
  IuserOpton,
  analyzeFile
} from 'pylonn-llh';

import { getWebviewContent } from './util';
// type Path = Pick<UserOption, 'dictionaryPath' | 'tsConfigPath' | 'statFile'>;
interface UserOption extends IuserOpton {
  dictionaryPath: string;
  tsConfigPath: string;
  isJs: boolean;
  alias?: any;
}
let p: Pylon;
let gTree: any;
const rootPath = vscode.workspace.rootPath;
const LANGUAGE_IDS = [
  'javascriptreact',
  'javascript',
  'typescriptreact',
  'typescript'
];

const DEFAULT_OPTION = {
  dictionaryPath: './',
  tsConfigPath: './tsconfig.json',
  isJs: true,
  alias: {}
};

function getOption() {
  if (rootPath) {
    let option: UserOption = DEFAULT_OPTION;
    const jsProjectConfig = path.resolve(rootPath, './config/default.js');
    const jsonProjectConfig = path.resolve(rootPath, './config/default.json');
    const optionFilePath = path.resolve(rootPath, './.depentrc.js');
    if (fs.existsSync(jsProjectConfig)) {
      let defaultConfig = require(jsProjectConfig);
      option.alias = defaultConfig.alias;
    }
    if (fs.existsSync(jsonProjectConfig)) {
      let defaultConfig = require(jsonProjectConfig);
      option.alias = defaultConfig.alias;
    }
    if (fs.existsSync(optionFilePath)) {
      option = require(optionFilePath);
    }
    option = {
      ...DEFAULT_OPTION,
      ...option
    };
    if (option.dictionaryPath) {
      option.dictionaryPath = path.resolve(rootPath, option.dictionaryPath);
    }
    if (option.tsConfigPath) {
      option.tsConfigPath = path.resolve(rootPath, option.tsConfigPath);
    }
    if (option.statFile) {
      option.statFile = path.resolve(rootPath, option.statFile);
    }
    // ['dictionaryPath', 'tsConfigPath', 'statFile'].forEach((p) => {
    //   if (option[p]) {
    //   }
    // });
    return option;
  }
  return DEFAULT_OPTION;
}

// 生成gTree并写入缓存
const genGtree = async (cacheFile: string) => {
  const statusMessage = vscode.window.setStatusBarMessage(
    '正在分析Dependency Tree...'
  );
  p = new Pylon(getOption());
  setTimeout(async () => {
    gTree = await p.genGTree();
    // 生产缓存文件
    fs.writeFile(cacheFile, JSON.stringify(gTree), () => {
      gTree = JSON.parse(fs.readFileSync(cacheFile).toString());
      vscode.window.showInformationMessage('Dependency Tree: 分析工作完成!');
      statusMessage.dispose();
    });
  }, 500);
};

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-pylonn" is now active!');
  // 插件目录
  const storagePath = context.storagePath || '';
  const workSpanceName = vscode.workspace.name;
  const cacheFile = path.resolve(
    storagePath,
    '../',
    `${workSpanceName}-pylon.json`
  );
  const isExistedCacheFile = fs.existsSync(cacheFile);
  console.log('cacheFile', cacheFile);
  console.log('isExistedCacheFile', isExistedCacheFile);
  if (isExistedCacheFile) {
    try {
      gTree = JSON.parse(fs.readFileSync(cacheFile).toString());
    } catch (error) {
      fs.unlinkSync(cacheFile);
    }
  } else {
    genGtree(cacheFile);
  }

  let UpdateCache = vscode.commands.registerCommand('pylon.updateCache', () => {
    genGtree(cacheFile);
  });

  let DependentTree = vscode.commands.registerCommand(
    'pylon.genDependentTree',
    param => {
      const fsPath = param.fsPath;
      const { dependentTree, circle } = genDepenceTree(fsPath, gTree);
      const panel = vscode.window.createWebviewPanel(
        'DpTree',
        'Dependent Tree',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent(
        dependentTree,
        String(rootPath),
        circle
      );
    }
  );

  let BeDpendentTree = vscode.commands.registerCommand(
    'pylon.genBeDependentTree',
    param => {
      const fsPath = param.fsPath;
      const { beDependentTree, circle } = genBeDependentTree(fsPath, gTree);
      const panel = vscode.window.createWebviewPanel(
        'BeDpTree',
        'Bedependent Tree',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent(
        beDependentTree,
        String(rootPath),
        circle
      );
    }
  );

  let ClearCache = vscode.commands.registerCommand('pylon.clearCache', () => {
    if (fs.existsSync(cacheFile)) {
      fs.unlink(cacheFile, error => {
        if (error) {
          console.log(error);
          vscode.window.showErrorMessage('Dependency Tree: 清除缓存失败!');
        }
        vscode.window.showInformationMessage('Dependency Tree: 清除缓存成功!');
      });
    }
  });

  vscode.workspace.onDidSaveTextDocument(
    async (document: vscode.TextDocument) => {
      if (
        LANGUAGE_IDS.some(l => {
          return l === document.languageId;
        })
      ) {
        console.log('file saved!', document);
        const fileName = document.fileName;
        const option = getOption();
        const analyzedFile = await analyzeFile({
          filePath: fileName,
          tsconfigPath: option.tsConfigPath,
          isJs: option.isJs,
          alias: option.alias
        });
        gTree[fileName] = analyzedFile[fileName];
        fs.writeFileSync(cacheFile, JSON.stringify(gTree));
      }
    }
  );

  context.subscriptions.push(
    DependentTree,
    BeDpendentTree,
    ClearCache,
    UpdateCache
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
