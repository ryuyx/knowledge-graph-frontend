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

const Graph: React.FC<GraphProps> = ({ data, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, onNodeDoubleClick, onNodesSelect, selectedNodeIds = [], onFileDropped }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [internalSelectedNodeIds, setInternalSelectedNodeIds] = useState<string[]>([]);
    const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
    const [ghostScreenPosition, setGhostScreenPosition] = useState<{ x: number; y: number } | null>(null);
    
    // 存储仿真和节点数据的引用
    const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
    const nodesDataRef = useRef<Node[]>([]);
    const linksDataRef = useRef<Link[]>([]);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();
        
        // 重置选中状态
        setInternalSelectedNodeIds([]);
        
        // 通知父组件清空选中节点
        if (onNodesSelect) {
            onNodesSelect([]);
        }

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeSet3);

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        // 存储数据引用
        nodesDataRef.current = nodes;
        linksDataRef.current = links;

        // Use fixed width/height for layout and viewBox
        const w = typeof width === 'number' ? width : DEFAULT_WIDTH;
        const h = typeof height === 'number' ? height : DEFAULT_HEIGHT;

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(w / 2, h / 2))
            .on("tick", ticked);

        // 存储仿真引用
        simulationRef.current = simulation;

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

        // Add file drop functionality
        svg
            .on("dragover", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const [x, y] = d3.pointer(event, g.node());
                setDragOverPosition({ x, y });

                // 计算SVG坐标到屏幕坐标
                if (svgRef.current) {
                    const svgRect = svgRef.current.getBoundingClientRect();
                    // 获取当前zoom/pan变换
                    let transform = d3.zoomTransform(svgRef.current);
                    // 应用变换
                    const transformed = transform.apply([x, y]);
                    setGhostScreenPosition({
                        x: svgRect.left + transformed[0],
                        y: svgRect.top + transformed[1]
                    });
                }
            })
            .on("dragleave", (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverPosition(null);
                setGhostScreenPosition(null);
            })
            .on("drop", (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverPosition(null);
                setGhostScreenPosition(null);
                
                const files = event.dataTransfer?.files;
                if (files && files.length > 0) {
                    const [x, y] = d3.pointer(event, g.node());
                    const file = files[0];
                    // 创建新节点
                    const newNode: Node = {
                        id: file.name,
                        group: 2,
                        x: x,
                        y: y
                    };
                    // 直接添加到图形中
                    const addNodeFn = (svgRef.current as any).__addNodeDynamically;
                    if (addNodeFn) {
                        addNodeFn(newNode);
                    }
                    // 可选：调用回调函数通知父组件
                    if (onFileDropped) {
                        onFileDropped(file, { x, y });
                    }
                }
            });

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
            .attr("stroke-width", 1.5);

        const node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 15)
            .attr("fill", d => color(d.group.toString()))

            .style("cursor", "pointer")
            .on("click", (_, d) => {
                setInternalSelectedNodeIds((prev: string[]) => {
                    let newSelectedIds: string[];
                    if (prev.includes(d.id)) {
                        // 取消选择
                        newSelectedIds = prev.filter((id: string) => id !== d.id);
                    } else {
                        // 多选
                        newSelectedIds = [...prev, d.id];
                    }
                    
                    // 调用回调函数，传递选中的节点对象
                    if (onNodesSelect) {
                        const selectedNodes = nodes.filter(node => newSelectedIds.includes(node.id));
                        onNodesSelect(selectedNodes);
                    }
                    
                    return newSelectedIds;
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

            // 获取当前的节点和文本选择器（可能已经更新）
            const currentNode = (svgRef.current as any).__nodeSelection || node;
            const currentText = (svgRef.current as any).__textSelection || text;

            currentNode
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            currentText
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
        (svgRef.current as any).__textSelection = text;
        (svgRef.current as any).__gSelection = g;

        // 动态添加节点的函数
        const addNodeDynamically = (newNode: Node) => {
            // 添加到数据数组
            nodesDataRef.current.push(newNode);
            
            // 重新启动仿真以包含新节点
            simulation.nodes(nodesDataRef.current);
            simulation.alpha(0.3).restart();
            
            // 更新现有节点选择器的数据
            const updatedNodeSelection = node.data(nodesDataRef.current, d => d.id);
            
            // 添加新的circle元素
            const newNodeElements = updatedNodeSelection
                .enter()
                .append("circle")
                .attr("r", 15)
                .attr("fill", d => color(d.group.toString()))
                .attr("stroke", "none")
                .attr("stroke-width", 0)
                .style("cursor", "pointer")
                .on("click", (_, d) => {
                    setInternalSelectedNodeIds((prev: string[]) => {
                        let newSelectedIds: string[];
                        if (prev.includes(d.id)) {
                            newSelectedIds = prev.filter((id: string) => id !== d.id);
                        } else {
                            newSelectedIds = [...prev, d.id];
                        }
                        
                        if (onNodesSelect) {
                            const selectedNodes = nodesDataRef.current.filter(node => newSelectedIds.includes(node.id));
                            onNodesSelect(selectedNodes);
                        }
                        
                        return newSelectedIds;
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

            // 添加拖拽行为到新节点
            newNodeElements.call(d3.drag<SVGCircleElement, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

            // 添加title到新节点
            newNodeElements.append("title")
                .text((d: any) => d.id);

            // 合并新旧节点选择
            const allNodes = updatedNodeSelection.merge(newNodeElements);
            
            // 更新文本标签
            const updatedTextSelection = text.data(nodesDataRef.current, d => d.id);
            const newTextElements = updatedTextSelection
                .enter()
                .append("text")
                .attr("x", (d: any) => d.x || 0)
                .attr("y", (d: any) => d.y ? d.y + 25 : 25)
                .text((d: any) => d.id)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "gray");

            // 合并新旧文本选择
            const allText = updatedTextSelection.merge(newTextElements);
            
            // 更新存储的选择器
            (svgRef.current as any).__nodeSelection = allNodes;
            (svgRef.current as any).__textSelection = allText;
        };

        // 存储添加节点函数的引用
        (svgRef.current as any).__addNodeDynamically = addNodeDynamically;

        return () => {
            simulation.stop();
        };
    }, [data, width, height]);

    // 同步外部传入的选中节点ID
    useEffect(() => {
        setInternalSelectedNodeIds(selectedNodeIds);
    }, [selectedNodeIds]);

    // 多选高亮
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        const color = (svg as any).__colorScale as d3.ScaleOrdinal<string, string>;
        if (!node || !color) return;
        node.transition().duration(300)
            .attr("fill", d => color(d.group.toString()))
            .attr("stroke", d => internalSelectedNodeIds.includes(d.id) ? 'black' : "none")
            .attr("stroke-width", d => internalSelectedNodeIds.includes(d.id) ? 3 : 0)
            .attr("r", d => internalSelectedNodeIds.includes(d.id) ? 18 : 15);
    }, [internalSelectedNodeIds]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
            {ghostScreenPosition && (
                <div
                    style={{
                        position: "fixed",
                        left: ghostScreenPosition.x - 15,
                        top: ghostScreenPosition.y - 15,
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 123, 255, 0.3)",
                        border: "2px dashed #007bff",
                        pointerEvents: "none",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        color: "#007bff",
                        fontWeight: "bold"
                    }}
                >
                    +
                </div>
            )}
        </div>
    );
};

export default Graph;
