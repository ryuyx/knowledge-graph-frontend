import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';

interface Node {
    id: string;
    name: string;
    group: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    highlighted?: boolean;
}

interface Link {
    source: string | Node;
    target: string | Node;
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
    onNodesSelect?: (nodes: Node[]) => void;
    selectedNodeIds?: string[];
    onFileDropped?: (file: File, position: { x: number; y: number }) => void;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 200;

const Graph = forwardRef<any, GraphProps>(({ data, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, onNodeDoubleClick, onNodesSelect, selectedNodeIds = [], onFileDropped }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [internalSelectedNodeIds, setInternalSelectedNodeIds] = useState<string[]>([]);
    const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
    const [rightSelectedNode, setRightSelectedNode] = useState<Node | null>(null);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
    const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
    const nodesDataRef = useRef<Node[]>([]);
    const linksDataRef = useRef<Link[]>([]);

    // Consolidated event handlers
    const handleNodeClick = (d: Node) => {
        console.log('节点信息:', d);
        setInternalSelectedNodeIds((prev: string[]) => {
            const newSelectedIds = prev.includes(d.id)
                ? prev.filter((id: string) => id !== d.id)
                : [...prev, d.id];
            
            if (onNodesSelect) {
                const selectedNodes = nodesDataRef.current.filter(node => newSelectedIds.includes(node.id));
                onNodesSelect(selectedNodes);
            }
            return newSelectedIds;
        });
    };

    const createLink = (source: Node, target: Node) => {
        const exists = linksDataRef.current.some(l =>
            (l.source === source.id && l.target === target.id) ||
            (l.source === target.id && l.target === source.id)
        );
        
        if (!exists) {
            linksDataRef.current.push({ source: source.id, target: target.id });
            // Update links visualization
            const svg = svgRef.current;
            const g = svg ? (svg as any).__gSelection : null;
            if (g) {
                const linkGroup = g.select('g');
                const updatedLinks = linkGroup.selectAll("line")
                    .data(linksDataRef.current, (l: any) =>
                        (typeof l.source === 'object' ? l.source.id : l.source) + '-' +
                        (typeof l.target === 'object' ? l.target.id : l.target)
                    );
                updatedLinks.exit().remove();
                updatedLinks.enter()
                    .append("line")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 1.5);
            }
            simulationRef.current?.force("link", d3.forceLink(linksDataRef.current).id((d: any) => d.id).distance(100));
            simulationRef.current?.alpha(0.3).restart();
        }
    };

    const handleNodeRightClick = (event: MouseEvent, d: Node) => {
        event.preventDefault();
        setRightSelectedNode((prev) => {
            if (!prev) {
                return d;
            } else if (prev.id !== d.id) {
                createLink(prev, d);
                return null;
            } else {
                return null;
            }
        });
    };

    const handleNodeDoubleClick = (d: Node) => {
        if (typeof (window as any).onNodeDoubleClick === 'function') {
            (window as any).onNodeDoubleClick(d);
        }
        onNodeDoubleClick?.(d);
    };

    // 批量设置节点高亮状态
    const setNodesHighlighted = (ids: string[], highlighted: boolean) => {
        nodesDataRef.current.forEach(node => {
            if (ids.includes(node.id)) {
                node.highlighted = highlighted;
            }
        });
        setHighlightedNodeIds(ids);
        // 触发d3样式更新
        const svg = svgRef.current;
        if (!svg) return;
        const nodeSel = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        if (!nodeSel) return;
        nodeSel.transition().duration(300)
            .attr("stroke", d => d.highlighted ? "#ff9800" : (internalSelectedNodeIds.includes(d.id) ? "black" : (rightSelectedNode && rightSelectedNode.id === d.id ? "#007bff" : "none")))
            .attr("stroke-width", d => d.highlighted ? 5 : (internalSelectedNodeIds.includes(d.id) ? 3 : (rightSelectedNode && rightSelectedNode.id === d.id ? 3 : 0)))
            .attr("stroke-dasharray", d => d.highlighted ? "2,2" : (rightSelectedNode && rightSelectedNode.id === d.id ? "6,3" : "0"));

        // 自动调整视图以显示所有高亮节点
        if (ids.length > 0) {
            // 获取高亮节点的坐标
            const highlightedNodes = nodesDataRef.current.filter(node => ids.includes(node.id) && node.x !== undefined && node.y !== undefined);
            if (highlightedNodes.length > 0) {
                const xs = highlightedNodes.map(n => n.x!);
                const ys = highlightedNodes.map(n => n.y!);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                // 计算边界中心和缩放
                const svgW = typeof width === 'number' ? width : DEFAULT_WIDTH;
                const svgH = typeof height === 'number' ? height : DEFAULT_HEIGHT;
                const padding = 40; // 视图边距
                const boxW = maxX - minX + padding * 2;
                const boxH = maxY - minY + padding * 2;
                const scale = Math.min(svgW / boxW, svgH / boxH, 2); // 限制最大缩放
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                // 直接对 g 元素做 transform
                const svgEl = svg;
                const gEl = d3.select(svgEl).select('g');
                gEl.transition().duration(500)
                    .attr('transform', `translate(${svgW / 2},${svgH / 2}) scale(${scale}) translate(${-centerX},${-centerY})`);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        setNodesHighlighted
    }));

    useEffect(() => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll('*').remove();
        setInternalSelectedNodeIds([]);
        onNodesSelect?.([]);

        const color = d3.scaleOrdinal(d3.schemeSet3);
        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        nodesDataRef.current = nodes;
        linksDataRef.current = links;

        const w = typeof width === 'number' ? width : DEFAULT_WIDTH;
        const h = typeof height === 'number' ? height : DEFAULT_HEIGHT;

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(w / 2, h / 2))
            .on("tick", ticked);

        simulationRef.current = simulation;

        const svg = d3.select(svgRef.current)
            .attr("width", w)
            .attr("height", h)
            .attr("viewBox", [0, 0, w, h])
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("style", "width:100%;height:100%;display:block;");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom).on("dblclick.zoom", null);

        // File drop handlers
        svg.on("dragover", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const [x, y] = d3.pointer(event, g.node());
                setDragOverPosition({ x, y });
            })
            .on("dragleave", (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverPosition(null);
            })
            .on("drop", (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverPosition(null);
                
                const files = event.dataTransfer?.files;
                if (files && files.length > 0) {
                    const [x, y] = d3.pointer(event, g.node());
                    const file = files[0];
                    const newNode: Node = {
                        id: file.name + '-' + Date.now(),
                        name: file.name,
                        group: 2,
                        x: x,
                        y: y
                    };
                    const addNodeFn = (svgRef.current as any).__addNodeDynamically;
                    if (addNodeFn) {
                        addNodeFn(newNode);
                    }
                    onFileDropped?.(file, { x, y });
                }
            });

        const g = svg.append("g");

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", 1.5);

        const node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 15)
            .attr("fill", d => color(d.group.toString()))
            .style("cursor", "pointer")
            .on("click", (_, d) => handleNodeClick(d))
            .on("contextmenu", (event, d) => handleNodeRightClick(event, d))
            .on("dblclick", (_, d) => handleNodeDoubleClick(d));

        const text = g.append("g")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("x", (d: any) => d.x)
            .attr("y", (d: any) => d.y + 50)
            .text((d: any) => d.name || d.id)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "gray");

        node.append("title").text((d: any) => d.id);

        // Drag behavior functions
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        node.call(d3.drag<SVGCircleElement, Node>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        function ticked() {
            g.select('g').selectAll('line')
                .attr("x1", (d: any) => (typeof d.source === 'object' ? d.source.x : nodes.find(n => n.id === d.source)?.x))
                .attr("y1", (d: any) => (typeof d.source === 'object' ? d.source.y : nodes.find(n => n.id === d.source)?.y))
                .attr("x2", (d: any) => (typeof d.target === 'object' ? d.target.x : nodes.find(n => n.id === d.target)?.x))
                .attr("y2", (d: any) => (typeof d.target === 'object' ? d.target.y : nodes.find(n => n.id === d.target)?.y));

            const currentNode = (svgRef.current as any).__nodeSelection || node;
            const currentText = (svgRef.current as any).__textSelection || text;

            currentNode
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            currentText
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y + 25);
        }

        // Store references
        (svgRef.current as any).__nodeSelection = node;
        (svgRef.current as any).__colorScale = color;
        (svgRef.current as any).__textSelection = text;
        (svgRef.current as any).__gSelection = g;

        // Simplified addNodeDynamically function
        const addNodeDynamically = (newNode: Node) => {
            nodesDataRef.current.push(newNode);
            simulation.nodes(nodesDataRef.current);
            simulation.alpha(0.3).restart();
            
            const updatedNodeSelection = node.data(nodesDataRef.current, d => d.id);
            const newNodeElements = updatedNodeSelection
                .enter()
                .append("circle")
                .attr("r", 15)
                .attr("fill", d => color(d.group.toString()))
                .attr("stroke", "none")
                .attr("stroke-width", 0)
                .style("cursor", "pointer")
                .on("click", (_, d) => handleNodeClick(d))
                .on("contextmenu", (event, d) => handleNodeRightClick(event, d))
                .on("dblclick", (_, d) => handleNodeDoubleClick(d))
                .call(d3.drag<SVGCircleElement, Node>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            newNodeElements.append("title").text((d: any) => d.id);

            const updatedTextSelection = text.data(nodesDataRef.current, d => d.id);
            const newTextElements = updatedTextSelection
                .enter()
                .append("text")
                .attr("x", (d: any) => d.x || 0)
                .attr("y", (d: any) => d.y ? d.y + 25 : 25)
                .text((d: any) => d.name || d.id)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "gray");

            (svgRef.current as any).__nodeSelection = updatedNodeSelection.merge(newNodeElements);
            (svgRef.current as any).__textSelection = updatedTextSelection.merge(newTextElements);
        };

        (svgRef.current as any).__addNodeDynamically = addNodeDynamically;

        return () => {
            simulation.stop();
        };
    }, [data, width, height]);

    useEffect(() => {
        setInternalSelectedNodeIds(selectedNodeIds);
    }, [selectedNodeIds]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        const color = (svg as any).__colorScale as d3.ScaleOrdinal<string, string>;
        if (!node || !color) return;
        node.transition().duration(300)
            .attr("fill", d => color(d.group.toString()))
            .attr("stroke", d => {
                if (d.highlighted) return "#ff9800";
                if (internalSelectedNodeIds.includes(d.id)) return 'black';
                if (rightSelectedNode && rightSelectedNode.id === d.id) return '#007bff';
                return "none";
            })
            .attr("stroke-width", d => {
                if (d.highlighted) return 5;
                if (internalSelectedNodeIds.includes(d.id)) return 3;
                if (rightSelectedNode && rightSelectedNode.id === d.id) return 3;
                return 0;
            })
            .attr("stroke-dasharray", d => {
                if (d.highlighted) return "2,2";
                if (rightSelectedNode && rightSelectedNode.id === d.id) return "6,3";
                return "0";
            });
        node.filter(d => internalSelectedNodeIds.includes(d.id))
            .attr("stroke-dasharray", "0");
    }, [internalSelectedNodeIds, rightSelectedNode]);

    return (
        <div
            style={{ position: "relative", width: "100%", height: "100%" }}
            onContextMenu={e => e.preventDefault()}
        >
            <svg
                ref={svgRef}
                width={width}
                height={height}
                style={{ 
                    width: "100%", 
                    height: "100%", 
                    display: "block",
                    border: dragOverPosition ? "2px dashed #007bff" : "1px solid transparent",
                    borderRadius: "8px",
                    transition: "border 0.3s ease"
                }}
            ></svg>
        </div>
    );
});

export default Graph;
                                