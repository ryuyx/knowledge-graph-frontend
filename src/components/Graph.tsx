import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as d3 from 'd3';
import GraphToolbar from './GraphToolbar';
import { useToolbarStore } from '@/store/graphToolbarStore';
import type { Node as NodeType, Link as LinkType, GraphData, ToolbarConfig } from '@/types/graph';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalSelectedNodeIds, setInternalSelectedNodeIds] = useState<string[]>([]);
    const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
    const [rightSelectedNode, setRightSelectedNode] = useState<Node | null>(null);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
    const [relatedNodeIds, setRelatedNodeIds] = useState<string[]>([]); // For click-to-highlight related nodes
    const [relatedLinkIds, setRelatedLinkIds] = useState<string[]>([]); // For highlighting related links
    const [isFullscreen, setIsFullscreen] = useState(false);
    const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
    const nodesDataRef = useRef<Node[]>([]);
    const linksDataRef = useRef<Link[]>([]);
    
    // Toolbar configuration from Zustand store
    const { config: toolbarConfig, setConfig, resetConfig } = useToolbarStore();


    // Consolidated event handlers with useCallback
    const handleNodeClick = React.useCallback((d: Node) => {
        console.log('节点信息:', d);
        
        setInternalSelectedNodeIds((prev: string[]) => {
            const isDeselecting = prev.includes(d.id);
            const newSelectedIds = isDeselecting
                ? prev.filter((id: string) => id !== d.id)
                : [...prev, d.id];
            
            if (isDeselecting) {
                // Clear related highlights when deselecting
                setRelatedNodeIds([]);
                setRelatedLinkIds([]);
            } else {
                // Find all related nodes and links
                const relatedNodes: string[] = [];
                const relatedLinks: string[] = [];
                
                linksDataRef.current.forEach(link => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    
                    if (sourceId === d.id) {
                        relatedNodes.push(targetId);
                        relatedLinks.push(`${sourceId}-${targetId}`);
                    } else if (targetId === d.id) {
                        relatedNodes.push(sourceId);
                        relatedLinks.push(`${sourceId}-${targetId}`);
                    }
                });
                
                // Include the clicked node itself
                relatedNodes.push(d.id);
                
                // Set related nodes and links for highlighting
                setRelatedNodeIds(relatedNodes);
                setRelatedLinkIds(relatedLinks);
            }
            
            if (onNodesSelect) {
                const selectedNodes = nodesDataRef.current.filter(node => newSelectedIds.includes(node.id));
                onNodesSelect(selectedNodes);
            }
            return newSelectedIds;
        });
    }, [onNodesSelect]);

    const createLink = React.useCallback((source: Node, target: Node) => {
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
            simulationRef.current?.force("link", d3.forceLink(linksDataRef.current).id((d: any) => d.id));
            simulationRef.current?.alpha(0.3).restart();
        }
    }, []);

    const handleNodeRightClick = React.useCallback((event: MouseEvent, d: Node) => {
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
    }, [createLink]);

    const handleNodeDoubleClick = React.useCallback((d: Node) => {
        if (typeof (window as any).onNodeDoubleClick === 'function') {
            (window as any).onNodeDoubleClick(d);
        }
        onNodeDoubleClick?.(d);
    }, [onNodeDoubleClick]);

    const setNodesHighlighted = (ids: string[], highlighted: boolean) => {
        nodesDataRef.current.forEach(node => {
            node.highlighted = false;
        });
        if (highlighted) {
            nodesDataRef.current.forEach(node => {
                if (ids.includes(node.id)) {
                    node.highlighted = true;
                }
            });
        }
        setHighlightedNodeIds(highlighted ? ids : []);
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
                
                const newTransform = d3.zoomIdentity
                    .translate(svgW / 2, svgH / 2)
                    .scale(scale)
                    .translate(-centerX, -centerY);
                
                const svgEl = svg;
                const gEl = d3.select(svgEl).select('g');
                gEl.transition().duration(500)
                    .attr('transform', newTransform.toString())
                    .on('end', () => {
                        // Ensure we have a stored zoom behavior and its transform method before calling
                        const svgSelection = d3.select(svgEl);
                        const storedZoom = (svgRef.current as any)?.__zoom;
                        if (storedZoom && typeof storedZoom.transform === 'function') {
                            // Prefer calling the zoom behavior's transform via svg.call
                            svgSelection.call((storedZoom as any).transform, newTransform);
                        } else {
                            // Fallback: directly set the group transform if zoom behavior isn't present
                            svgSelection.select('g').attr('transform', newTransform.toString());
                        }
                    });
            }
        }
    };

    useImperativeHandle(ref, () => ({
        setNodesHighlighted
    }));

    // Fullscreen functionality
    const toggleFullscreen = React.useCallback(async () => {
        if (!containerRef.current) return;
        
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Failed to toggle fullscreen:', error);
        }
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Calculate connection count for a node
    const getNodeConnectionCount = React.useCallback((nodeId: string) => {
        let count = 0;
        linksDataRef.current.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (sourceId === nodeId || targetId === nodeId) {
                count++;
            }
        });
        return count;
    }, []);

    // Check if a node should be visible based on filter configuration
    const isNodeVisible = React.useCallback((node: Node) => {
        // Name filter
        if (toolbarConfig.nameFilter && !node.name.toLowerCase().includes(toolbarConfig.nameFilter.toLowerCase())) {
            return false;
        }
        
        // Type filter
        if (!toolbarConfig.typeFilter.includes(node.group)) {
            return false;
        }
        
        // Level filter
        if (toolbarConfig.levelFilter !== 'all') {
            if (toolbarConfig.levelFilter === 'category' && node.group !== 1) return false;
            if (toolbarConfig.levelFilter === 'topic' && node.group !== 2) return false;
            if (toolbarConfig.levelFilter === 'file' && (node.group !== 3 && node.group !== 4)) return false;
        }
        
        // Connection count filter
        if (toolbarConfig.minConnections > 0) {
            const connectionCount = getNodeConnectionCount(node.id);
            if (connectionCount < toolbarConfig.minConnections) {
                return false;
            }
        }
        
        return true;
    }, [toolbarConfig.nameFilter, toolbarConfig.typeFilter, toolbarConfig.levelFilter, toolbarConfig.minConnections, getNodeConnectionCount]);

    useEffect(() => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll('*').remove();
        setInternalSelectedNodeIds([]);
        onNodesSelect?.([]);

        // Define per-group visual styles so different node kinds render consistently.
        const groupStyles: Record<number, { fill: string; stroke?: string; r: number; textSize?: string; textOffset?: number }> = {
            1: { fill: "#ef7234", stroke: "none", r: 14, textSize: "12px", textOffset: 34 }, // category
            2: { fill: "#76b7b2", stroke: "none", r: 10, textSize: "10px", textOffset: 28 }, // topic
            3: { fill: "#3c3c43", stroke: "none", r: 8, textSize: "8px", textOffset: 24 }, // FILE
            4: { fill: "#1f77b4", stroke: "none", r: 8, textSize: "8px", textOffset: 24 }, // URL
        };
        // Backwards-compatible color accessor for places that previously used a d3 scale
        const color = (g: any) => groupStyles[Number(g)]?.fill ?? d3.schemeSet3[0];
        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        nodesDataRef.current = nodes;
        linksDataRef.current = links;

        const w = typeof width === 'number' ? width : DEFAULT_WIDTH;
        const h = typeof height === 'number' ? height : DEFAULT_HEIGHT;

        const chargeForce = d3.forceManyBody()
            .strength(d => {
                const baseStrength = (d as Node).group === 1 ? -300 : -100;
                return baseStrength * toolbarConfig.chargeStrength;
            });

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                .id((d: any) => d.id)
                .distance((l: any) => {
                    const getGroup = (n: any) => typeof n === 'object' ? n.group : nodes.find(nd => nd.id === n)?.group;
                    const sourceGroup = getGroup(l.source);
                    const targetGroup = getGroup(l.target);
                    let baseDistance = 120;
                    if ((sourceGroup === 2 && targetGroup === 3) || (sourceGroup === 3 && targetGroup === 2)) {
                        baseDistance = 40;
                    } else if (
                        (sourceGroup === 1 && targetGroup === 2) ||
                        (sourceGroup === 2 && targetGroup === 1) ||
                        (sourceGroup === 2 && targetGroup === 2)
                    ) {
                        baseDistance = 80;
                    }
                    return baseDistance * toolbarConfig.linkDistance;
                })
            )
            .force("charge", chargeForce)
            .force("x", d3.forceX(w / 2).strength(toolbarConfig.centerForce))
            .force("y", d3.forceY(h / 2).strength(toolbarConfig.centerForce))
            // adjust collision radius based on node radius for each group
            .force("collision", d3.forceCollide().radius((d: any) => ((groupStyles[d.group]?.r ?? 10) * toolbarConfig.nodeSize + 6)))
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

        const g = svg.append("g");

        svg.call(zoom).on("dblclick.zoom", null);
        
        // 保存 zoom 实例以便后续使用
        (svgRef.current as any).__zoom = zoom;
        
        const initialTransform = d3.zoomIdentity;
        svg.call(zoom.transform, initialTransform);

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

        const link = g.append("g")
            .attr("stroke", "#999")
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", toolbarConfig.linkWidth)
            .attr("data-link-id", (l: any) => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                return `${sourceId}-${targetId}`;
            })
            .style("opacity", (l: any) => {
                const source = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
                const target = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
                return (source && target && isNodeVisible(source) && isNodeVisible(target)) ? 0.6 : 0;
            })
            .style("pointer-events", (l: any) => {
                const source = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
                const target = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
                return (source && target && isNodeVisible(source) && isNodeVisible(target)) ? "auto" : "none";
            });

        const node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", d => (groupStyles[d.group]?.r ?? 10) * toolbarConfig.nodeSize)
            .attr("fill", d => (groupStyles[d.group]?.fill ?? "#ddd"))
            .style("opacity", d => isNodeVisible(d) ? toolbarConfig.nodeOpacity : 0)
            .style("pointer-events", d => isNodeVisible(d) ? "auto" : "none")
            .attr("stroke", d => (groupStyles[d.group]?.stroke ?? "none"))
            .attr("stroke-width", d => (groupStyles[d.group]?.stroke ? 2 : 0))
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
            .attr("y", (d: any) => (d.y ?? 0) + (groupStyles[d.group]?.textOffset ?? 25) * toolbarConfig.textSize)
            .text((d: any) => d.name || d.id)
            .attr("text-anchor", "middle")
            .attr("font-size", (d: any) => {
                const baseSize = parseInt(groupStyles[d.group]?.textSize ?? "8px");
                return `${baseSize * toolbarConfig.textSize}px`;
            })
            .attr("fill", "gray")
            .style("opacity", d => isNodeVisible(d) ? 1 : 0)
            .style("display", (d: any) => {
                return toolbarConfig.textLevelDisplay.includes(d.group) ? 'block' : 'none';
            });

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
            if (!event.active) simulation.alphaTarget(0.5).restart(); // 拖拽结束后重启仿真
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
    // store groupStyles so other parts can reference consistent styling
    (svgRef.current as any).__colorScale = groupStyles;
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
                .attr("r", d => (groupStyles[d.group]?.r ?? 10) * toolbarConfig.nodeSize)
                .attr("fill", d => (groupStyles[d.group]?.fill ?? "#ddd"))
                .style("opacity", d => isNodeVisible(d) ? toolbarConfig.nodeOpacity : 0)
                .style("pointer-events", d => isNodeVisible(d) ? "auto" : "none")
                .attr("stroke", d => (groupStyles[d.group]?.stroke ?? "none"))
                .attr("stroke-width", d => (groupStyles[d.group]?.stroke ? 2 : 0))
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
                .attr("y", (d: any) => (d.y ? d.y + (groupStyles[d.group]?.textOffset ?? 25) * toolbarConfig.textSize : (groupStyles[d.group]?.textOffset ?? 25) * toolbarConfig.textSize))
                .text((d: any) => d.name || d.id)
                .attr("text-anchor", "middle")
                .attr("font-size", (d: any) => {
                    const baseSize = parseInt(groupStyles[d.group]?.textSize ?? "8px");
                    return `${baseSize * toolbarConfig.textSize}px`;
                })
                .attr("fill", "gray")
                .style("opacity", d => isNodeVisible(d) ? 1 : 0)
                .style("display", (d: any) => {
                    return toolbarConfig.textLevelDisplay.includes(d.group) ? 'block' : 'none';
                });

            (svgRef.current as any).__nodeSelection = updatedNodeSelection.merge(newNodeElements);
            (svgRef.current as any).__textSelection = updatedTextSelection.merge(newTextElements);
        };

        (svgRef.current as any).__addNodeDynamically = addNodeDynamically;

        return () => {
            simulation.stop();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        data, 
        width, 
        height
    ]);

    useEffect(() => {
        setInternalSelectedNodeIds(selectedNodeIds);
    }, [selectedNodeIds]);

    // Apply filters by dynamically showing/hiding nodes without re-rendering
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, any, any, any>;
        const text = (svg as any).__textSelection as d3.Selection<SVGTextElement, any, any, any>;
        const linkGroup = d3.select(svg).select('g').select('g');
        
        if (!node || !text) return;
        
        // Update node visibility with transition
        node.transition().duration(200)
            .style("opacity", (d: any) => isNodeVisible(d) ? toolbarConfig.nodeOpacity : 0)
            .style("pointer-events", (d: any) => isNodeVisible(d) ? "auto" : "none");
        
        // Update text visibility
        text.transition().duration(200)
            .style("opacity", (d: any) => isNodeVisible(d) ? 1 : 0);
        
        // Update link visibility - only show links where both ends are visible
        if (linkGroup) {
            linkGroup.selectAll('line')
                .transition().duration(200)
                .style("opacity", (l: any) => {
                    const source = typeof l.source === 'object' ? l.source : nodesDataRef.current.find(n => n.id === l.source);
                    const target = typeof l.target === 'object' ? l.target : nodesDataRef.current.find(n => n.id === l.target);
                    return (source && target && isNodeVisible(source) && isNodeVisible(target)) ? 0.6 : 0;
                })
                .style("pointer-events", (l: any) => {
                    const source = typeof l.source === 'object' ? l.source : nodesDataRef.current.find(n => n.id === l.source);
                    const target = typeof l.target === 'object' ? l.target : nodesDataRef.current.find(n => n.id === l.target);
                    return (source && target && isNodeVisible(source) && isNodeVisible(target)) ? "auto" : "none";
                });
        }
    }, [toolbarConfig.nameFilter, toolbarConfig.typeFilter, toolbarConfig.levelFilter, toolbarConfig.nodeOpacity, isNodeVisible]);

    // Update physics parameters without re-rendering the entire graph
    useEffect(() => {
        if (!simulationRef.current) return;
        
        const simulation = simulationRef.current;
        const w = typeof width === 'number' ? width : DEFAULT_WIDTH;
        const h = typeof height === 'number' ? height : DEFAULT_HEIGHT;
        
        // Update forces
        simulation
            .force("x", d3.forceX(w / 2).strength(toolbarConfig.centerForce))
            .force("y", d3.forceY(h / 2).strength(toolbarConfig.centerForce))
            .force("charge", d3.forceManyBody().strength(d => {
                const baseStrength = (d as any).group === 1 ? -300 : -100;
                return baseStrength * toolbarConfig.chargeStrength;
            }))
            .force("collision", d3.forceCollide().radius((d: any) => {
                const svg = svgRef.current;
                const groupStyles = (svg as any)?.__colorScale;
                return ((groupStyles?.[d.group]?.r ?? 10) * toolbarConfig.nodeSize + 6);
            }));
        
        // Update link distances
        const linkForce = simulation.force("link") as d3.ForceLink<any, any>;
        if (linkForce) {
            linkForce.distance((l: any) => {
                const nodes = nodesDataRef.current;
                const getGroup = (n: any) => typeof n === 'object' ? n.group : nodes.find(nd => nd.id === n)?.group;
                const sourceGroup = getGroup(l.source);
                const targetGroup = getGroup(l.target);
                let baseDistance = 120;
                if ((sourceGroup === 2 && targetGroup === 3) || (sourceGroup === 3 && targetGroup === 2)) {
                    baseDistance = 40;
                } else if (
                    (sourceGroup === 1 && targetGroup === 2) ||
                    (sourceGroup === 2 && targetGroup === 1) ||
                    (sourceGroup === 2 && targetGroup === 2)
                ) {
                    baseDistance = 80;
                }
                return baseDistance * toolbarConfig.linkDistance;
            });
        }
        
        // Restart simulation with lower alpha to avoid too much movement
        simulation.alpha(0.1).restart();
    }, [toolbarConfig.centerForce, toolbarConfig.chargeStrength, toolbarConfig.linkDistance, toolbarConfig.nodeSize, width, height]);

    // Update visual properties without re-rendering the entire graph
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, any, any, any>;
        const text = (svg as any).__textSelection as d3.Selection<SVGTextElement, any, any, any>;
        const groupStyles = (svg as any).__colorScale;
        const linkGroup = d3.select(svg).select('g').select('g');
        
        if (node) {
            node.transition().duration(200)
                .attr("r", d => (groupStyles?.[d.group]?.r ?? 10) * toolbarConfig.nodeSize);
            
            // Apply opacity separately to respect filter state
            node.each(function(_d: any) {
                const currentOpacity = parseFloat(d3.select(this).style("opacity"));
                if (currentOpacity > 0) { // Only update if node is visible
                    d3.select(this).transition().duration(200)
                        .style("opacity", toolbarConfig.nodeOpacity);
                }
            });
        }
        
        if (text) {
            text.transition().duration(200)
                .attr("font-size", (d: any) => {
                    const baseSize = parseInt(groupStyles?.[d.group]?.textSize ?? "8px");
                    return `${baseSize * toolbarConfig.textSize}px`;
                })
                .attr("y", (d: any) => d.y + (groupStyles?.[d.group]?.textOffset ?? 25) * toolbarConfig.textSize)
                .style("display", (d: any) => {
                    return toolbarConfig.textLevelDisplay.includes(d.group) ? 'block' : 'none';
                });
        }
        
        if (linkGroup) {
            linkGroup.selectAll('line')
                .transition().duration(200)
                .attr("stroke-width", toolbarConfig.linkWidth);
        }
    }, [
        toolbarConfig.nodeSize, 
        toolbarConfig.textSize, 
        toolbarConfig.nodeOpacity, 
        toolbarConfig.textLevelDisplay, 
        toolbarConfig.linkWidth
    ]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        const colorOrStyles = (svg as any).__colorScale;
        if (!node || !colorOrStyles) return;

        node.transition().duration(300)
            .attr("fill", d => {
                // support either a d3 scale function or our groupStyles object
                if (typeof colorOrStyles === 'function') {
                    try { return colorOrStyles(d.group.toString()); } catch { /* fallthrough */ }
                }
                if (typeof colorOrStyles === 'object') {
                    return colorOrStyles[d.group]?.fill ?? "#ddd";
                }
                return "#ddd";
            })
            .attr("stroke", d => {
                if (d.highlighted) return "#ff9800";
                if (internalSelectedNodeIds.includes(d.id)) return 'black';
                if (rightSelectedNode && rightSelectedNode.id === d.id) return '#007bff';
                // fallback to groupStyles stroke if available
                if (typeof colorOrStyles === 'object') {
                    return colorOrStyles[d.group]?.stroke ?? "none";
                }
                return "none";
            })
            .attr("stroke-width", d => {
                if (d.highlighted) return 5;
                if (internalSelectedNodeIds.includes(d.id)) return 3;
                if (rightSelectedNode && rightSelectedNode.id === d.id) return 3;
                if (typeof colorOrStyles === 'object') {
                    return colorOrStyles[d.group]?.stroke ? 2 : 0;
                }
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

    // Handle related nodes and links highlighting
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        
        const node = (svg as any).__nodeSelection as d3.Selection<SVGCircleElement, Node, any, any>;
        const linkGroup = d3.select(svg).select('g').select('g');
        
        if (!node) return;
        
        // Update node opacity based on related nodes
        if (relatedNodeIds.length > 0) {
            node.transition().duration(300)
                .style("opacity", (d: any) => {
                    if (!isNodeVisible(d)) return 0;
                    // Highlight related nodes, dim others
                    return relatedNodeIds.includes(d.id) ? toolbarConfig.nodeOpacity : toolbarConfig.nodeOpacity * 0.2;
                });
        } else {
            // Reset to normal opacity
            node.transition().duration(300)
                .style("opacity", (d: any) => isNodeVisible(d) ? toolbarConfig.nodeOpacity : 0);
        }
        
        // Update link highlighting
        if (linkGroup && relatedLinkIds.length > 0) {
            linkGroup.selectAll('line')
                .transition().duration(300)
                .attr("stroke", (l: any) => {
                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                    const linkId = `${sourceId}-${targetId}`;
                    return relatedLinkIds.includes(linkId) ? "#ff6b35" : "#999";
                })
                .attr("stroke-width", (l: any) => {
                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                    const linkId = `${sourceId}-${targetId}`;
                    return relatedLinkIds.includes(linkId) ? toolbarConfig.linkWidth * 2 : toolbarConfig.linkWidth;
                })
                .style("opacity", (l: any) => {
                    const source = typeof l.source === 'object' ? l.source : nodesDataRef.current.find(n => n.id === l.source);
                    const target = typeof l.target === 'object' ? l.target : nodesDataRef.current.find(n => n.id === l.target);
                    if (!source || !target || !isNodeVisible(source) || !isNodeVisible(target)) return 0;
                    
                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                    const linkId = `${sourceId}-${targetId}`;
                    return relatedLinkIds.includes(linkId) ? 1 : 0.2;
                });
        } else if (linkGroup) {
            // Reset links to normal
            linkGroup.selectAll('line')
                .transition().duration(300)
                .attr("stroke", "#999")
                .attr("stroke-width", toolbarConfig.linkWidth)
                .style("opacity", (l: any) => {
                    const source = typeof l.source === 'object' ? l.source : nodesDataRef.current.find(n => n.id === l.source);
                    const target = typeof l.target === 'object' ? l.target : nodesDataRef.current.find(n => n.id === l.target);
                    return (source && target && isNodeVisible(source) && isNodeVisible(target)) ? 0.6 : 0;
                });
        }
    }, [relatedNodeIds, relatedLinkIds, toolbarConfig.nodeOpacity, toolbarConfig.linkWidth, isNodeVisible]);

    return (
        <div
            ref={containerRef}
            style={{ 
                position: "relative", 
                width: "100%", 
                height: "100%",
                backgroundColor: isFullscreen ? "#fff" : "transparent"
            }}
            onContextMenu={e => e.preventDefault()}
        >
            {/* Fullscreen Button */}
            <button
                onClick={toggleFullscreen}
                className="btn btn-circle btn-sm absolute top-2 right-2 z-50 shadow-lg hover:scale-110 transition-transform"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                )}
            </button>

            {/* Graph Toolbar */}
            <GraphToolbar
                config={toolbarConfig}
                onConfigChange={(newConfig) => {
                    setConfig(newConfig);
                }}
                onReset={() => {
                    resetConfig();
                }}
            />
            
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
                                