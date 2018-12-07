'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import Pylon, { genDepenceTree, genBeDependentTree } from 'pylonn';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let p: Pylon;
let gTree: any;
const rootPath = vscode.workspace.rootPath;

const DEFAULT_OPTION = {
  dictionaryPath: './',
  tsconfigPath: './'
};
export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-pylonn" is now active!');
  let init = vscode.commands.registerCommand('pylon.init', async () => {
    if (rootPath) {
      const optionFile = path.resolve(rootPath, './pylon.config.js');
      if (!fs.existsSync(optionFile)) {
        vscode.window.showErrorMessage(
          'Please add pylon.config.js in your workspace!'
        );
        return;
      }
      let option = require(optionFile);
      option = {
        ...DEFAULT_OPTION,
        ...option
      };
      option.dictionaryPath = path.resolve(rootPath, option.dictionaryPath);
      option.tsconfigPath = path.resolve(rootPath, option.tsconfigPath);
      option.statFile = path.resolve(rootPath, option.statFile);
      p = new Pylon({
        isJs: true,
        ...option
      });
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Init Pylon'
        },
        async progress => {
          // setTimeout(() => {
          //   progress.report({ message: 'still going...' });
          // }, 500);

          // setTimeout(() => {
          //     progress.report({ percentage: 50, message: "still going harder..."});
          // }, 2000);

          // setTimeout(() => {
          //     progress.report({ percentage: 90, message: "almost there..."});
          // }, 3000);

          // var p = new Promise(resolve => {
          //   setTimeout(() => {
          //     resolve();
          //   }, 5000);
          // });

          // return p;
          if (gTree) {
            progress.report({ message: 'Success' });
            await Promise.resolve();
          } else {
            gTree = await p.genGTree();
            progress.report({ message: 'Success' });
            await Promise.resolve();
          }
        }
      );
    }
  });

  // let update = vscode.commands.registerCommand('pylon.updateGtree', () => {});
  let DependentTree = vscode.commands.registerCommand(
    'pylon.genDependentTree',
    param => {
      const fsPath = param.fsPath;
      const dependentTree = genDepenceTree(fsPath, gTree);
      const panel = vscode.window.createWebviewPanel(
        'DpTree',
        'Dependent Tree',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent(dependentTree, String(rootPath));
    }
  );

  let BeDpendentTree = vscode.commands.registerCommand(
    'pylon.genBeDependentTree',
    param => {
      const fsPath = param.fsPath;
      const beDependentTree = genBeDependentTree(fsPath, gTree);
      const panel = vscode.window.createWebviewPanel(
        'BeDpTree',
        'Bedependent Tree',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent(beDependentTree, String(rootPath));
    }
  );

  context.subscriptions.push(DependentTree, BeDpendentTree, init);
}

function getWebviewContent(data: any, rootPath: string) {
  return `<!DOCTYPE html> <meta charset="utf-8" />
  <style>
    html, body {
      height: 100%;
      width: 100%;
      background: #fff;
    }
    .node circle {
      cursor: pointer;
      stroke: #3182bd;
      stroke-width: 1.5px;
    }
  
    .node text {
      font: 10px sans-serif;
      pointer-events: none;
      text-anchor: middle;
    }
  
    line.link {
      fill: none;
      stroke: #9ecae1;
      stroke-width: 1.5px;
    }
  </style>
  <body>
    <script src="https://d3js.org/d3.v3.min.js"></script>
    <script>
      var width = 1000,
          rootPath = ${JSON.stringify(rootPath + '/')},
        height = 800,
        root =${JSON.stringify(data)}
  
      var force = d3.layout
        .force()
        .linkDistance(100)
        .charge(-320)
        .gravity(0.08)
        .size([width, height])
        .on('tick', tick);
  
      var svg = d3
        .select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
  
      var link = svg.selectAll('.link'),
        node = svg.selectAll('.node');
        update();
      function update() {
        var nodes = flatten(root),
          links = d3.layout.tree().links(nodes);
  
        // Restart the force layout.
        force
          .nodes(nodes)
          .links(links)
          .start();
  
        // Update links.
        link = link.data(links, function(d) {
          return d.target.id;
        });
  
        link.exit().remove();
  
        link
          .enter()
          .insert('line', '.node')
          .attr('class', 'link');
  
        // Update nodes.
        node = node.data(nodes, function(d) {
          return d.id;
        });
  
        node.exit().remove();
  
        var nodeEnter = node
          .enter()
          .append('g')
          .attr('class', 'node')
          .on('click', click)
          .call(force.drag);
  
        nodeEnter.append('circle').attr('r',10);
  
        nodeEnter
          .append('text')
          .attr('dy', '.35em')
          .text(function(d) {
            return d.name.replace(rootPath, '');
          });
  
        node.select('circle').style('fill', color);
      }
  
      function tick() {
        link
          .attr('x1', function(d) {
            return d.source.x;
          })
          .attr('y1', function(d) {
            return d.source.y;
          })
          .attr('x2', function(d) {
            return d.target.x;
          })
          .attr('y2', function(d) {
            return d.target.y;
          });
  
        node.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      }
  
      function color(d) {
        return d._children
          ? '#3182bd' // collapsed package
          : d.children
          ? '#c6dbef' // expanded package
          : '#fd8d3c'; // leaf node
      }
  
      // Toggle children on click.
      function click(d) {
        if (d3.event.defaultPrevented) return; // ignore drag
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update();
      }
  
      // Returns a list of all nodes under the root.
      function flatten(root) {
        var nodes = [],
          i = 0;
  
        function recurse(node) {
          if (node.children) node.children.forEach(recurse);
          if (!node.id) node.id = ++i;
          nodes.push(node);
        }
  
        recurse(root);
        return nodes;
      }
    </script>
  </body>
  `;
}
// this method is called when your extension is deactivated
export function deactivate() {}
