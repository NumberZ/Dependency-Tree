export function getWebviewContent(data: any, rootPath: string, circle: any) {
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

    line.link-red {
      fill: none;
      stroke: #f44336;
      stroke-width: 1.5px;
    }
  </style>
  <body>
    <script src="https://d3js.org/d3.v3.min.js"></script>
    <script>
      var width = 1000,
          rootPath = ${JSON.stringify(rootPath + '/')},
        height = 800,
        root =${JSON.stringify(data)},
        circle=${JSON.stringify(circle)}
  
        const l = v => console.log(v);
        var force = d3.layout
          .force()
          .linkDistance(80)
          .charge(-900)
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
          circle.forEach(st => {
            const source = nodes.find(n => n.name === st.source);
            const target = nodes.find(n => n.name === st.target);
            links.push({
              source,
              target,
              isCircle: true
            });
          });
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
            .attr('class', l => {
              return l.isCircle ? 'link-red' : 'link';
            });
    
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
    
          nodeEnter.append('circle').attr('r', 10);
    
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
          return root.name === d.name ? '#ffeb3b' : '#c6dbef';
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
