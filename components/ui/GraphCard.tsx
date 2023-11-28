// GraphCard.tsx
import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { GraphData } from '@/lib/types'

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
    // let simulation = d3
    //   .forceSimulation(nodes)
    //   .force(
    //     'link',
    //     d3.forceLink(edges).id((d: { id: any }) => d.id)
    //   )
    //   .force('charge', d3.forceManyBody())
    //   .force('center', d3.forceCenter(300, 300)) // Assuming the width and height of the SVG are 600x600

    // const svg = d3.select(svgRef.current)

    // // Clear the SVG to prevent duplication
    // svg.selectAll('*').remove()
    let simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3.forceLink(edges).id((d: { id: any }) => d.id)
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
      .data(edges)
      .join('line')
      .attr('stroke-width', (d: { value: number }) => Math.sqrt(d.value))

    // Draw the nodes (circles)
    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d: { group: any }) => d.group)

    // Add drag behavior to nodes
    node.call(drag(simulation))

    // Define what to do on each tick
    simulation.on('tick', () => {
      // Update link positions
      link
        .attr('x1', (d: { source: { x: any } }) => d.source.x)
        .attr('y1', (d: { source: { y: any } }) => d.source.y)
        .attr('x2', (d: { target: { x: any } }) => d.target.x)
        .attr('y2', (d: { target: { y: any } }) => d.target.y)

      // Update node positions
      node.attr('cx', (d: { x: any }) => d.x).attr('cy', (d: { y: any }) => d.y)
    })

    // Drag functions for interactivity
    function drag(simulation: {
      alphaTarget: (arg0: number) => {
        (): any
        new (): any
        restart: { (): void; new (): any }
      }
    }) {
      function dragstarted(event: {
        active: any
        subject: { fx: any; x: any; fy: any; y: any }
      }) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: {
        subject: { fx: any; fy: any }
        x: any
        y: any
      }) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event: {
        active: any
        subject: { fx: null; fy: null }
      }) {
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
  }, [graphData])

  return (
    <div className="rounded-lg border bg-background p-8 shadow">
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  )
}
