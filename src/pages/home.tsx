import { useState, useRef, useEffect } from 'react'
import Markdown from '@/components/Markdown';
import NodeDetailDialog from '@/components/NodeDetailDialog';
import Graph from '@/components/Graph'
import { useToolbarStore } from '@/store/graphToolbarStore';
import { getKnowledgeGraph, uploadKnowledgeItem, type GraphData as ApiGraphData } from '@/api/graph'
import AudioCard from '@/components/AudioCard'
import { getKnowledgeItem } from '@/api/graph';
import { chat } from '@/api/chat'
import { getAllPodcasts, type PodcastItem } from '@/api/podcast'

interface Data {
    nodes: {
        id: string;
        name: string;
        group: number;
        x?: number;
        y?: number;
        fx?: number | null;
        fy?: number | null;
    }[];
    links: {
        source: string | any;
        target: string | any;
        weight?: number;
    }[];
}

function Home() {
    // Toolbar configuration from Zustand store
    const { config: toolbarConfig, setConfig: setToolbarConfig, resetConfig: resetToolbarConfig } = useToolbarStore();

    // Import API helpers lazily at top of component scope to avoid SSR issues
    // (real import is added at file top via patch below)
    // Tag click handler: highlight node in graph
    const handleTagClick = (chunkNumber: string) => {
        const index = parseInt(chunkNumber) - 1;
        // Find the last assistant message with references
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.references);
        const ref = lastAssistantMsg?.references?.[index];
        const highlightId = ref?.meta_data?.knowledge_item_id || chunkNumber;
        if (graphData && graphRef.current && typeof graphRef.current.setNodesHighlighted === 'function') {
            // Find node by id
            const node = graphData.nodes.find(
                n => n.id === highlightId
            );
            if (node) {
                graphRef.current.setNodesHighlighted([node.id], true);
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const [chatMessage, setChatMessage] = useState('')
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string, references?: any[] }>>([
        {
            role: 'system',
            content: 'guide'
        }
    ])
    const [currentResponse, setCurrentResponse] = useState('')
    // Chat textarea ref for auto-focus
    const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null)
    // Messages container ref for auto-scroll
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)

    // 节点详情弹窗相关 state
    const [nodeDetail, setNodeDetail] = useState<any | null>(null)
    const nodeDetailModalRef = useRef<HTMLDialogElement | null>(null);

    // 选中的节点状态
    const [selectedNodes, setSelectedNodes] = useState<any[]>([])
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

    // 图数据状态
    const [graphData, setGraphData] = useState<Data | null>(null)
    // Graph组件ref
    const graphRef = useRef<any>(null);

// 上传进度状态类型
interface UploadStage {
    name: 'TEXT_EXTRACTION' | 'HOT_WORD_GENERATION' | 'EMBEDDING_GENERATION' | 'HOT_WORD_ASSOCIATION_GENERATION';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    icon: string;
    message?: string;
}
    const [isLoading, setIsLoading] = useState(false)
    const uploadProgressMsgIndexRef = useRef<number | null>(null)
    // Keep all timeline message indices so they remain visible after completion
    const uploadTimelineMessageIndicesRef = useRef<Set<number>>(new Set())
    const [uploadStages, setUploadStages] = useState<UploadStage[]>([
        { name: 'TEXT_EXTRACTION', status: 'pending', icon: '📄', message: 'Extracting text...' },
        { name: 'HOT_WORD_GENERATION', status: 'pending', icon: '🔤', message: 'Generating keywords...' },
        { name: 'EMBEDDING_GENERATION', status: 'pending', icon: '🧠', message: 'Creating embeddings...' },
        { name: 'HOT_WORD_ASSOCIATION_GENERATION', status: 'pending', icon: '🔗', message: 'Building associations...' },
    ])
    const [currentFileName, setCurrentFileName] = useState<string>('')

    // 播客列表状态
    const [podcasts, setPodcasts] = useState<PodcastItem[]>([])
    const [podcastsLoading, setPodcastsLoading] = useState(false)

    const handleSendChat = async () => {
        if (!chatMessage.trim()) return;
        
        // Add user message to history
        setMessages(prev => [...prev, { role: 'user', content: chatMessage }]);
        const userMessage = chatMessage;
        setChatMessage(''); // Clear the message input
        setCurrentResponse('');
        setIsLoading(true);

        try {
            let assistantMessage = '';
            let messageReferences: any[] = [];
            
            await chat(userMessage, (data: any) => {
                if (data.event === 'RunContent') {
                    assistantMessage += data.content;
                    setCurrentResponse(assistantMessage);
                } else if (data.event === 'RunReferences') {
                    if (Array.isArray(data.references)) {
                        messageReferences = data.references;
                        const highlightIds = data.references.map((item: any) => item.meta_data?.knowledge_item_id).filter(Boolean);
                        if (graphRef.current && typeof graphRef.current.setNodesHighlighted === 'function') {
                            graphRef.current.setNodesHighlighted(highlightIds, true);
                        }
                    }
                }
            });
            
            // Add complete assistant message to history
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: assistantMessage,
                references: messageReferences 
            }]);
            setCurrentResponse('');
        } catch (error) {
            console.error('Failed to send chat:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: '处理失败，请重试。' }]);
            setCurrentResponse('');
        } finally {
            setIsLoading(false);
        }
    }

    // Auto-focus chat textarea when component mounts
    useEffect(() => {
        if (chatTextareaRef.current) {
            chatTextareaRef.current.focus();
        }
    }, []);

    // Auto-scroll to bottom when messages or currentResponse changes
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, currentResponse]);

    // 双击节点显示详情（异步获取）
    const handleNodeDoubleClick = async (node: any) => {
        setNodeDetail(null);
        if (node && node.type === 'category') {
            try {
                const detail = await import('@/api/graph').then(mod => mod.getKnowledgeByCategory(node.id));
                setNodeDetail(detail);
            } catch (error) {
                setNodeDetail({ error: '获取 category 详情失败' });
            }
        } else if (node && node.type === 'topic') {
            try {
                const detail = await import('@/api/graph').then(mod => mod.getKnowledgeByTopic(node.id));
                setNodeDetail(detail);
            } catch (error) {
                setNodeDetail({ error: '获取 topic 详情失败' });
            }
        } else if (node && (node.type === 'FILE' || node.type === 'URL' || node.type === 'TEXT')) {
            try {
                const detail = await getKnowledgeItem(node.id);
                setNodeDetail(detail);
            } catch (error) {
                setNodeDetail({ error: '获取详情失败' });
            }
        } else {
            setNodeDetail(node);
        }
        setTimeout(() => {
            if (nodeDetailModalRef.current) nodeDetailModalRef.current.showModal();
        }, 0);
    };

    // 处理节点选择
    const handleNodesSelect = (nodes: any[]) => {
        setSelectedNodes(nodes);
        setSelectedNodeIds(nodes.map(node => node.id));
    };

    // 移除选中的节点
    const removeSelectedNode = (nodeId: string) => {
        setSelectedNodes(prev => prev.filter(node => node.id !== nodeId));
        setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
    };

    // 获取图数据
    const fetchGraphData = async () => {
        try {
            const data = await getKnowledgeGraph();
            // 转换数据格式以匹配Graph组件
            const convertedData = {
                nodes: data.nodes.map(node => ({
                    group: node.type === 'category' ? 1
                        : node.type === 'topic' ? 2
                            : node.type === 'FILE' ? 3
                                : node.type === 'URL' ? 4
                                    : 0,
                    ...node
                })),
                links: data.links
            };
            setGraphData(convertedData);
        } catch (error) {
            console.error('Failed to fetch graph data:', error);
        }
    };

    // 获取播客列表
    const fetchPodcasts = async () => {
        setPodcastsLoading(true);
        try {
            const data = await getAllPodcasts();
            setPodcasts(data.podcasts);
        } catch (error) {
            console.error('Failed to fetch podcasts:', error);
        } finally {
            setPodcastsLoading(false);
        }
    };

    // 初始化时获取图数据和播客列表
    useEffect(() => {
        fetchGraphData();
        fetchPodcasts();
    }, []);

    // Build markdown content for 4-stage progress
    const buildUploadProgressMarkdownFromStages = (filename: string, stages: UploadStage[]) => {
        const header = filename ? `开始处理：${filename}` : '开始处理';
        const statusIcon = (s: UploadStage['status']) => (
            s === 'completed' ? '✅' : s === 'processing' ? '🔄' : s === 'failed' ? '❌' : '⏳'
        );
        const lines = stages.map(s => `- ${statusIcon(s.status)} ${s.icon} ${s.name}${s.message ? ` · ${s.message}` : ''}`);
        return `${header}\n\n${lines.join('\n')}`;
    };

    const updateProgressMessageFromStages = (stages: UploadStage[], filename: string, extraNote?: string) => {
        const idx = uploadProgressMsgIndexRef.current;
        if (idx == null) return;
        const content = buildUploadProgressMarkdownFromStages(filename, stages) + (extraNote ? `\n\n${extraNote}` : '');
        setMessages(prev => {
            if (!prev[idx]) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], content };
            return updated;
        });
    };

    const resetUploadStagesForStart = (filename: string) => {
        const initial: UploadStage[] = [
            { name: 'TEXT_EXTRACTION', status: 'processing', icon: '📄', message: 'Extracting text...' },
            { name: 'HOT_WORD_GENERATION', status: 'pending', icon: '🔤', message: 'Generating keywords...' },
            { name: 'EMBEDDING_GENERATION', status: 'pending', icon: '🧠', message: 'Creating embeddings...' },
            { name: 'HOT_WORD_ASSOCIATION_GENERATION', status: 'pending', icon: '🔗', message: 'Building associations...' },
        ];
        setUploadStages(initial);
        setCurrentFileName(filename);
        const initialContent = buildUploadProgressMarkdownFromStages(filename, initial);
        setMessages(prev => {
            const next = [...prev, { role: 'assistant' as const, content: initialContent }];
            const idx = next.length - 1;
            uploadProgressMsgIndexRef.current = idx;
            uploadTimelineMessageIndicesRef.current.add(idx);
            return next;
        });
    };

    const updateStageStatus = (name: UploadStage['name'], status: UploadStage['status'], message?: string) => {
        setUploadStages(prev => {
            const next = prev.map(s => s.name === name ? { ...s, status, message: message ?? s.message } : s);
            updateProgressMessageFromStages(next, currentFileName);
            return next;
        });
    };

    // File dropped handler: stream 4-stage progress into chat
    const handleFileDropped = async (file: File) => {
        resetUploadStagesForStart(file.name);

        try {
            await uploadKnowledgeItem(file, 'FILE', (data: any) => {
                const eventType: string = (data?.type || data?.event || data?.status || '').toString();
                const msg: string | undefined = data?.message || data?.detail;

                if (eventType === 'TEXT_EXTRACTION') {
                    updateStageStatus('TEXT_EXTRACTION', 'completed', 'Text extracted');
                    updateStageStatus('HOT_WORD_GENERATION', 'processing');
                    // Keep original filename instead of replacing with knowledge_item_id
                    // if (data?.data?.knowledge_item_id) {
                    //     setCurrentFileName(String(data.data.knowledge_item_id));
                    // }
                } else if (eventType === 'HOT_WORD_GENERATION') {
                    const count = Array.isArray(data?.data) ? data.data.length : (data?.data?.length ?? undefined);
                    updateStageStatus('HOT_WORD_GENERATION', 'completed', typeof count === 'number' ? `Generated ${count} keywords` : 'Keywords generated');
                    updateStageStatus('EMBEDDING_GENERATION', 'processing');
                } else if (eventType === 'EMBEDDING_GENERATION') {
                    updateStageStatus('EMBEDDING_GENERATION', 'completed', 'Embeddings created');
                    updateStageStatus('HOT_WORD_ASSOCIATION_GENERATION', 'processing');
                } else if (eventType === 'HOT_WORD_ASSOCIATION_GENERATION') {
                    updateStageStatus('HOT_WORD_ASSOCIATION_GENERATION', 'completed', 'Associations built');
                } else if (eventType === 'FAILED') {
                    setUploadStages(prev => {
                        const idx = prev.findIndex(s => s.status === 'processing');
                        if (idx !== -1) {
                            const next = prev.slice() as UploadStage[];
                            next[idx] = { ...next[idx], status: 'failed' as const, message: msg || 'Processing failed' };
                            updateProgressMessageFromStages(next, currentFileName, '❌ 上传或处理失败');
                            return next;
                        }
                        const next = prev.map(s => s) as UploadStage[];
                        updateProgressMessageFromStages(next, currentFileName, '❌ 上传或处理失败');
                        return next;
                    });
                }
            });

            setUploadStages(prev => {
                const hasFailure = prev.some(s => s.status === 'failed');
                const next: UploadStage[] = hasFailure 
                    ? prev 
                    : prev.map(s => (s.status === 'pending' || s.status === 'processing') 
                        ? { ...s, status: 'completed' as const } 
                        : s);
                updateProgressMessageFromStages(next, currentFileName, hasFailure ? undefined : '✅ 已添加到知识图谱');
                return next;
            });

            await fetchGraphData();
        } catch (err) {
            console.error('Upload failed:', err);
            setUploadStages(prev => {
                const next: UploadStage[] = prev.map(s => s.status === 'completed' 
                    ? s 
                    : { ...s, status: 'failed' as const, message: s.message });
                updateProgressMessageFromStages(next, currentFileName, '❌ 上传或处理失败，请重试。');
                return next;
            });
        } finally {
            uploadProgressMsgIndexRef.current = null;
        }
    };

    // Handle Enter to send chat
    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (chatMessage.trim() && !isLoading) {
                handleSendChat();
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70 gap-5 pb-30">
            {/* Main Container */}
            <section className="hero min-h-100 py-10 transition-all duration-500 w-full">
                <div className="hero-content flex-col lg:flex-row gap-5 w-full items-start p-0">
                    {/* Graph Section */}
                    <div className="h-[60vh] lg:h-[700px] flex-1 border border-neutral/20 rounded-2xl overflow-hidden transition-all duration-500">
                        <Graph
                            ref={graphRef}
                            data={graphData || { nodes: [], links: [] }}
                            key="init"
                            width={500}
                            height={200}
                            onNodeDoubleClick={handleNodeDoubleClick}
                            onNodesSelect={handleNodesSelect}
                            selectedNodeIds={selectedNodeIds}
                            onFileDropped={(file) => handleFileDropped(file)}
                            toolbarConfig={toolbarConfig}
                            onToolbarConfigChange={setToolbarConfig}
                            onToolbarReset={resetToolbarConfig}
                        />
                    </div>

                    {/* Chat Section */}
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        <div className="rounded-lg p-3 bg-base-100 shadow h-[60vh] lg:h-[700px] flex flex-col">
                            {/* Main Content Area */}
                            <div className="relative w-full h-full flex flex-col">
                                {/* Messages Container */}
                                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-4 px-2">
                                    {messages.map((msg, index) => {
                                        if (msg.role === 'system' && msg.content === 'guide') {
                                            return (
                                                <div key={index} className="mb-4 p-4 bg-base-200/50 rounded-xl text-sm text-base-content/70">
                                                    <h3 className="font-bold text-base mb-3">💡 Usage Guide</h3>
                                                    {/* Legend for node styles */}
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span aria-hidden className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#ef7234' }}></span>
                                                            <span className="text-base-content/80">category</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span aria-hidden className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#76b7b2' }}></span>
                                                            <span className="text-base-content/80">keyword / topic</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span aria-hidden className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#3c3c43' }}></span>
                                                            <span className="text-base-content/80">file</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span aria-hidden className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#1f77b4' }}></span>
                                                            <span className="text-base-content/80">url</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>1. Ask something about document.</div>
                                                        <div>2. Double-click to show the details.</div>
                                                        <div>3. Drag and drop files into the graph to build.</div>
                                                        <div>4. Click <span className="inline-flex items-center mx-1 px-1.5 py-0.5 text-xs font-medium bg-primary-content text-primary rounded-full">1</span> to focus the reference.</div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        if (msg.role === 'user') {
                                            return (
                                                <div key={index} className="chat chat-end mb-4">
                                                    <div className="chat-bubble">{msg.content}</div>
                                                </div>
                                            );
                                        }
                                        
                                        if (msg.role === 'assistant') {
                                            // If this assistant message is one of the upload progress messages, render a timeline
                                            if (uploadTimelineMessageIndicesRef.current.has(index)) {
                                                const titleMap: Record<UploadStage['name'], string> = {
                                                    TEXT_EXTRACTION: '文本抽取',
                                                    HOT_WORD_GENERATION: '关键词生成',
                                                    EMBEDDING_GENERATION: '向量嵌入',
                                                    HOT_WORD_ASSOCIATION_GENERATION: '关联构建',
                                                };
                                                return (
                                                    <div key={index} className="mb-4 p-3 rounded-xl bg-base-200/40">
                                                        <div className="mb-2 text-xs opacity-70 truncate" title={currentFileName}>{currentFileName ? `上传 ${currentFileName} 文件` : '处理中…'}</div>
                                                        <ul className="timeline timeline-vertical timeline-compact">
                                                            {uploadStages.map((stage, i) => {
                                                                const isCompleted = stage.status === 'completed';
                                                                const isProcessing = stage.status === 'processing';
                                                                const isFailed = stage.status === 'failed';
                                                                const prev = i > 0 ? uploadStages[i - 1] : undefined;
                                                                const prevFailed = prev?.status === 'failed';
                                                                const prevDone = prev && (prev.status === 'completed' || prev.status === 'processing') && !prevFailed;
                                                                const topHrClass = i > 0 ? (prevFailed ? 'bg-error' : prevDone ? 'bg-primary' : '') : '';
                                                                const bottomHrClass = isFailed ? 'bg-error' : (isCompleted || isProcessing) ? 'bg-primary' : '';
                                                                const iconClass = `${isFailed ? 'text-error' : (isCompleted || isProcessing) ? 'text-primary' : 'text-base-300'} h-4 w-4`;
                                                                return (
                                                                    <li key={stage.name}>
                                                                        {i > 0 && <hr className={topHrClass} />}
                                                                        <div className="timeline-middle">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={iconClass}>
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="timeline-end timeline-box max-w-full">
                                                                            <div className="text-sm font-medium truncate">{titleMap[stage.name]}</div>
                                                                            {stage.message && <div className="text-xs opacity-70 mt-0.5 truncate">{stage.message}</div>}
                                                                        </div>
                                                                        {i < uploadStages.length - 1 && <hr className={bottomHrClass} />}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={index} className="mb-4 p-4 rounded-xl">
                                                    <Markdown content={msg.content} onTagClick={handleTagClick} />
                                                </div>
                                            );
                                        }
                                        
                                        return null;
                                    })}

                                    {/* Current streaming response */}
                                    {currentResponse && (
                                        <div className="mb-4 p-4 rounded-xl">
                                            <Markdown content={currentResponse} onTagClick={handleTagClick} />
                                        </div>
                                    )}
                                </div>

                                {/* Input area at bottom */}
                                <div className="mt-auto">
                                    <textarea
                                        ref={chatTextareaRef}
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyDown={handleChatKeyDown}
                                        placeholder="Enter your chat message..."
                                        rows={2}
                                        className="textarea w-full px-6 py-4 rounded-xl shadow-inner pr-14 resize-none"
                                        maxLength={1000}
                                        aria-label="Chat message input"
                                    />
                                    <button
                                        onClick={() => handleSendChat()}
                                        disabled={!chatMessage.trim() || isLoading}
                                        className="btn btn-soft btn-primary btn-circle absolute bottom-3 right-3 z-10 flex items-center justify-center disabled:cursor-not-allowed"
                                        style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
                                        aria-label="发送"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 10h12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                            <path d="M10 6l6 4-6 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mt-10 text-center max-w-4xl">
                <h2 className="text-lg font-semibold mb-8">Share your thoughts and ideas with the world.</h2>
                {podcastsLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : podcasts.length > 0 ? (
                    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:max-w-6xl md:mx-auto relative">
                        {podcasts.map((podcast) => {
                            const date = new Date(podcast.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                            });
                            const duration = podcast.estimated_duration
                                ? `${Math.floor(podcast.estimated_duration / 60)}m`
                                : 'N/A';

                            // Extract UUID from knowledge_item_id (remove path prefix if exists)
                            const cleanId = podcast.knowledge_item_id.includes('/')
                                ? podcast.knowledge_item_id.split('/').pop() || podcast.knowledge_item_id
                                : podcast.knowledge_item_id;

                            return (
                                <AudioCard
                                    key={podcast.podcast_id}
                                    href={`/doc/${cleanId}`}
                                    title={podcast.knowledge_title || 'Untitled Podcast'}
                                    status={podcast.generation_status}
                                    date={date}
                                    duration={duration}
                                    progress={podcast.progress_percentage}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-base-content/50">
                        No podcasts available yet. Create your first one!
                    </div>
                )}
            </section>
            <NodeDetailDialog nodeDetail={nodeDetail} ref={nodeDetailModalRef} />
        </div>
    )
}

export default Home
