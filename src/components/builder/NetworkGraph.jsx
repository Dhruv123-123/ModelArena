import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { estimateParams } from '../../utils/shapeCalculator';
import { getInputShape } from '../../utils/shapeCalculator';
import { useGameStore } from '../../stores/useGameStore';

const TYPE_COLORS = {
  dense: '#aaffdc',
  conv2d: '#6e9bff',
  dropout: '#e966ff',
  batchnorm: '#6b6b82',
  flatten: '#3b82f6',
  activation: '#f97316',
};

export function NetworkGraph({ layers, width = 300, height = 500 }) {
  const svgRef = useRef(null);
  const activeGameId = useGameStore((s) => s.activeGameId);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const inputShape = getInputShape(activeGameId);
    const allLayers = [
      { type: 'input', id: 'input' },
      ...layers,
      { type: 'output', id: 'output' },
    ];

    const nodeCount = allLayers.length;
    const stepY = height / (nodeCount + 1);
    const cx = width / 2;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g');

    const nodes = allLayers.map((layer, i) => {
      const y = stepY * (i + 1);
      let radius = 14;
      if (layer.type === 'input' || layer.type === 'output') radius = 18;
      else {
        const idx = layers.indexOf(layer);
        const sub = layers.slice(0, idx + 1);
        const params = estimateParams(sub, inputShape, 4);
        radius = Math.min(28, 10 + Math.log10(params + 1) * 4);
      }
      return { ...layer, x: cx, y, radius };
    });

    const link = d3
      .linkVertical()
      .x((d) => d.x)
      .y((d) => d.y)
      .source((d) => ({ x: d.source.x, y: d.source.y + d.source.radius }))
      .target((d) => ({ x: d.target.x, y: d.target.y - d.target.radius }));

    for (let i = 0; i < nodes.length - 1; i++) {
      g.append('path')
        .attr('d', link({ source: nodes[i], target: nodes[i + 1] }))
        .attr('fill', 'none')
        .attr('stroke', '#2a2a38')
        .attr('stroke-width', 2);
    }

    const node = g
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => TYPE_COLORS[d.type] ?? '#6b6b82')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#2a2a38')
      .attr('stroke-width', 1.5);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#0b0b0e')
      .attr('font-size', 9)
      .attr('font-weight', 700)
      .text((d) =>
        d.type === 'input' ? 'IN' : d.type === 'output' ? 'OUT' : d.type.slice(0, 3).toUpperCase()
      );

    node.append('title').text((d) =>
      d.type === 'input'
        ? `Input ${getInputShape(activeGameId)}`
        : d.type === 'output'
          ? 'Output layer (auto)'
          : `${d.type}${d.units ? ` · ${d.units} units` : ''}`
    );
  }, [layers, activeGameId, width, height]);

  return (
    <svg
      ref={svgRef}
      className="rounded-lg border border-border bg-bg-panel/50"
      aria-label="Network architecture graph"
    />
  );
}
