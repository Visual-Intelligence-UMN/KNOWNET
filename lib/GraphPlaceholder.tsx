// GraphPlaceholder.tsx
import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { cn } from '@/lib/utils'

interface Node {
  id: number
  label: string
  group: string
}

interface Edge {
  source: number
  target: number
}

interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

export const GraphPlaceholder: React.FC<{ className?: string }> = ({
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  // Fake data to simulate the structure from Neo4j database
  const fakeGraphData: GraphData = {
    nodes: [
      { id: 1, label: 'Node 1', group: 'type1' },
      { id: 2, label: 'Node 2', group: 'type2' },
      { id: 3, label: 'Node 3', group: 'type3' }
    ],
    edges: [
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  }

  useEffect(() => {
    if (!svgRef.current) return

    const { nodes, edges } = fakeGraphData

    // Set up the simulation and add forces
    let simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3.forceLink(edges).id(d => d.id)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(300, 300)) // Assuming the width and height of the SVG are 600x600

    const svg = d3.select(svgRef.current)

    // Clear the SVG to prevent duplication
    svg.selectAll('*').remove()

    // Draw the links (paths)
    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value))

    // Draw the nodes (circles)
    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => d.group)

    // Add drag behavior to nodes
    node.call(drag(simulation))

    // Define what to do on each tick
    simulation.on('tick', () => {
      // Update link positions
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      // Update node positions
      node.attr('cx', d => d.x).attr('cy', d => d.y)
    })

    // Drag functions for interactivity
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }
  }, [])

  return (
    <div className={cn('graph-placeholder', className)}>
      {/* Create an SVG element where D3 will output the graph */}
      <svg ref={svgRef} width={600} height={600} />
    </div>
  )
}
