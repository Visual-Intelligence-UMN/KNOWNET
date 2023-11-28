// GraphCard.tsx
import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { GraphData } from '@/lib/types'
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  group: string
}

export const GraphCard: React.FC<{ graphData: GraphData }> = ({
  graphData
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const svgElement = svgRef.current
    const width = svgElement.getBoundingClientRect().width
    const height = svgElement.getBoundingClientRect().height
    const { nodes, edges } = graphData
    // Ensure nodes are compatible with SimulationNodeDatum
    const simulationNodes: SimulationNode[] = nodes.map(node => ({
      ...node,
      id: node.id.toString()
    }))
    const simulationEdges = edges.map(edge => ({
      ...edge,
      source: edge.source.toString(),
      target: edge.target.toString()
    }))
    // Extend your Node type to include properties required by SimulationNodeDatum

    let simulation = d3
      .forceSimulation(simulationNodes)
      .force(
        'link',
        d3
          .forceLink(simulationEdges)
          .id((d: d3.SimulationNodeDatum) => (d as any).id)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))

    const svg = d3.select(svgElement)

    // Clear the SVG to prevent duplication
    svg.selectAll('*').remove()

    // Draw the links (paths)
    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(simulationEdges)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value))

    // Draw the nodes (circles)
    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll<SVGCircleElement, SimulationNode>('circle')
      .data(simulationNodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d: any) => d.group)

    // Define what to do on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)
    })

    // Modify the drag function
    // Modify the drag function to match the SVGCircleElement type
    function drag(simulation: d3.Simulation<SimulationNode, undefined>) {
      function dragstarted(
        event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
        d: SimulationNode
      ) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(
        event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
        d: SimulationNode
      ) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragended(
        event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
        d: SimulationNode
      ) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      return d3
        .drag<SVGCircleElement, SimulationNode, SimulationNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }

    // Add drag behavior to nodes
    node.call(drag(simulation))
  }, [graphData])

  return (
    <div className="rounded-lg border bg-background p-8 shadow">
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  )
}
