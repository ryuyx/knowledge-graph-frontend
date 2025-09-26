import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface Node {
    id: string;
    group: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Link {
    source: string | Node;
    target: string | Node;
    value: number;
}

interface Data {
    nodes: Node[];
    links: Link[];
}

interface GraphProps {
    data: Data;
    width?: number | string;
    height?: number | string;
    onNodeDoubleClick?: (node: Node) => void;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 200;

const Graph: React.FC<GraphProps> = ({ data, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, onNodeDoubleClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeSet3);

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        // Use fixed width/height for layout and viewBox
        const w = typeof width === 'number' ? width : DEFAULT_WIDTH;
        const h = typeof height === 'number' ? height : DEFAULT_HEIGHT;

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(w / 2, h / 2))
            .on("tick", ticked);

        // Create the SVG container.
        const svg = d3.select(svgRef.current)
            .attr("width", w)
            .attr("height", h)
            .attr("viewBox", [0, 0, w, h])
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("style", "width:100%;height:100%;display:block;");

        // Add a zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Disable double-click to zoom
        svg.on("dblclick.zoom", null);

        // Create a group for zooming
        const g = svg.append("g");

        // Add a line for each link, and a circle for each node.
        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 15)
            .attr("fill", d => color(d.group.toString()))
            .style("cursor", "pointer")
            .on("click", (_, d) => {
                setSelectedNodeIds(prev => {
                    if (prev.includes(d.id)) {
                        // 取消选择
                        return prev.filter(id => id !== d.id);
                    } else {
                        // 多选
                        return [...prev, d.id];
                    }
                });
            })
            .on("dblclick", (_, d) => {
                if (typeof (window as any).onNodeDoubleClick === 'function') {
                    (window as any).onNodeDoubleClick(d);
                }
                if (typeof onNodeDoubleClick === 'function') {
                    onNodeDoubleClick?.(d);
                }
            });

        // Add labels below nodes
        const text = g.append("g")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("x", (d: any) => d.x)
            .attr("y", (d: any) => d.y + 50)
            .text((d: any) => d.id)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "gray");

        node.append("title")
            .text((d: any) => d.id);

        // Add a drag behavior.
        node.call(d3.drag<SVGCircleElement, Node>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Set the position attributes of links and nodes each time the simulation ticks.
        function ticked() {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            text
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y + 25);
        }

        // Reheat the simulation when drag starts, and fix the subject position.
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // 保存 node selection 到 ref，供后续 useEffect 使用
        (svgRef.current as any).__nodeSelection = node;
        (svgRef.current as any).__colorScale = color;

        return () => {
            simulation.stop();
        };
    }, [data, width, height]);

    // 多选高亮
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        const color = (svg as any).__colorScale as d3.ScaleOrdinal<string, string>;
        if (!node || !color) return;
        node.transition().duration(300)
            .attr("fill", d => color(d.group.toString()))
            .attr("stroke", d => selectedNodeIds.includes(d.id) ? 'black' : "none")
            .attr("stroke-width", d => selectedNodeIds.includes(d.id) ? 3 : 0)
            .attr("r", d => selectedNodeIds.includes(d.id) ? 18 : 15);
    }, [selectedNodeIds]);

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            style={{ width: "100%", height: "100%", display: "block" }}
        ></svg>
    );
};

export default Graph;
