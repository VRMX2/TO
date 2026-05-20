import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Network } from 'lucide-react';

export default function NetworkCanvas() {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear any existing svg content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);

    // Nodes data
    const nodes = [
      { id: 'Core', type: 'core', fx: width / 2, fy: height / 2, color: 'var(--accent-cyan)' },
      { id: 'Web Server', type: 'server', fx: width / 2 - 120, fy: height / 2 - 100, color: 'var(--text-secondary)' },
      { id: 'App Server', type: 'server', fx: width / 2, fy: height / 2 - 140, color: 'var(--text-secondary)' },
      { id: 'DB Server', type: 'server', fx: width / 2 + 120, fy: height / 2 - 100, color: 'var(--text-secondary)' },
      { id: 'Endpoint A', type: 'endpoint', fx: width / 2 + 160, fy: height / 2 + 20, color: 'var(--text-secondary)' },
      { id: 'Endpoint B', type: 'endpoint', fx: width / 2 + 100, fy: height / 2 + 120, color: 'var(--text-secondary)' },
      { id: 'Firewall', type: 'firewall', fx: width / 2 - 100, fy: height / 2 + 100, color: 'var(--accent-green)' },
      { id: 'Endpoint C', type: 'endpoint', fx: width / 2 - 160, fy: height / 2 + 20, color: 'var(--text-secondary)' },
    ];

    // Links data
    const links = nodes.slice(1).map(node => ({
      source: 'Core',
      target: node.id
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Draw lines
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'var(--border-subtle)')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Outer glow circle
    node.append('circle')
      .attr('r', d => d.type === 'core' ? 24 : 16)
      .attr('fill', 'transparent')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // Inner filled circle
    node.append('circle')
      .attr('r', d => d.type === 'core' ? 8 : 4)
      .attr('fill', d => d.color);

    // Node labels
    node.append('text')
      .text(d => d.id)
      .attr('y', d => d.type === 'core' ? 40 : 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-sans)');

    // Add icons/shapes based on type (simplified as shapes)
    node.filter(d => d.type === 'server').append('rect')
      .attr('x', -3).attr('y', -3).attr('width', 6).attr('height', 6).attr('fill', 'var(--text-primary)');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, []);

  return (
    <div className="panel network-canvas-container">
      <div className="panel-header">
        <div className="panel-title">
          <Network size={14} />
          <span>NETWORK TOPOLOGY & GAME STATE</span>
        </div>
        <div style={{ border: '1px solid var(--accent-cyan)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
          STAR TOPOLOGY
        </div>
      </div>
      <div className="panel-content" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        
        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }} className="font-mono text-xs">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)' }}></div><span className="text-secondary">Endpoint</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }}></div><span className="text-secondary">Firewall</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, background: 'var(--text-primary)' }}></div><span className="text-secondary">Server</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, border: '1px solid var(--accent-cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 4, height: 4, background: 'var(--accent-cyan)', borderRadius: '50%' }}></div></div><span className="text-secondary">Core/Router</span></div>
        </div>
      </div>
    </div>
  );
}
