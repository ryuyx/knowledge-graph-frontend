import { useState, useRef, useEffect } from 'react'
import Markdown from '@/components/Markdown';
import NodeDetailDialog from '@/components/NodeDetailDialog';
import Graph from '@/components/Graph'
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
    const [activeTab, setActiveTab] = useState('Chat')
    // 分离不同tab的输入内容
    const [chatMessage, setChatMessage] = useState('')
    const [linkUrl, setLinkUrl] = useState('')
    const [longText, setLongText] = useState('')
    const [response, setResponse] = useState('')
    // Chat textarea ref for auto-focus
    const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null)

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

    // 拖拽上传状态
    const [isDragOver, setIsDragOver] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    // 上传进度状态
    interface UploadStage {
        name: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        icon: string;
        message?: string;
    }
    
    const [uploadStages, setUploadStages] = useState<UploadStage[]>([
        { name: 'TEXT_EXTRACTION', status: 'pending', icon: '📄', message: 'Extracting text...' },
        { name: 'HOT_WORD_GENERATION', status: 'pending', icon: '🔤', message: 'Generating keywords...' },
        { name: 'EMBEDDING_GENERATION', status: 'pending', icon: '🧠', message: 'Creating embeddings...' },
        { name: 'HOT_WORD_ASSOCIATION_GENERATION', status: 'pending', icon: '🔗', message: 'Building associations...' },
    ]);
    const [currentFileName, setCurrentFileName] = useState<string>('');
    
    // 播客列表状态
    const [podcasts, setPodcasts] = useState<PodcastItem[]>([])
    const [podcastsLoading, setPodcastsLoading] = useState(false)

    const tabs = [
        { name: 'Chat', icon: '💭' },
        { name: 'Link', icon: '🔗' },
        { name: 'Upload File', icon: '📁' },
        { name: 'Long Text', icon: '📄' }
    ]

    const handleCreatePodcast = async () => {
        let currentInput = '';
        switch(activeTab) {
            case 'Chat':
                currentInput = chatMessage;
                break;
            case 'Link':
                currentInput = linkUrl;
                break;
            case 'Long Text':
                currentInput = longText;
                break;
            default:
                currentInput = '';
        }
        if (!currentInput.trim()) return;
        setResponse('');
        setIsLoading(true);
        try {
            await chat(currentInput, (data: any) => {
                if (data.event === 'RunContent') {
                    setResponse(prev => prev + data.content);
                } else if (data.event === 'RunReferences') {
                    if (Array.isArray(data.references)) {
                        const highlightIds = data.references.map((item: any) => item.meta_data?.knowledge_item_id).filter(Boolean);
                        if (graphRef.current && typeof graphRef.current.setNodesHighlighted === 'function') {
                            graphRef.current.setNodesHighlighted(highlightIds, true);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to send chat:', error);
            setResponse('发送失败，请重试。');
        } finally {
            setIsLoading(false);
        }
    }

    // Auto-focus chat textarea when Chat tab is active
    useEffect(() => {
        if (activeTab === 'Chat' && chatTextareaRef.current) {
            chatTextareaRef.current.focus();
        }
    }, [activeTab]);

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
        } else if (node && (node.type === 'FILE' || node.type === 'LINK')) {
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
                            : node.type === 'LINK' ? 4
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

    // 重置上传进度状态
    const resetUploadStages = () => {
        setUploadStages([
            { name: 'TEXT_EXTRACTION', status: 'pending', icon: '📄', message: 'Extracting text...' },
            { name: 'HOT_WORD_GENERATION', status: 'pending', icon: '🔤', message: 'Generating keywords...' },
            { name: 'EMBEDDING_GENERATION', status: 'pending', icon: '🧠', message: 'Creating embeddings...' },
            { name: 'HOT_WORD_ASSOCIATION_GENERATION', status: 'pending', icon: '🔗', message: 'Building associations...' },
        ]);
        setCurrentFileName('');
    };

    // 更新特定阶段的状态
    const updateStageStatus = (stageName: string, status: 'processing' | 'completed' | 'failed', detail?: string) => {
        console.log('🔄 Updating stage:', stageName, 'to', status, detail);
        setUploadStages(prev => {
            const updated = prev.map(stage => 
                stage.name === stageName 
                    ? { ...stage, status, message: detail || stage.message }
                    : stage
            );
            console.log('📊 Updated stages:', updated);
            return updated;
        });
    };

    // 处理文件拖拽 - 调用uploadKnowledgeItem上传文件
    const handleFileDropped = async (file: File, position: { x: number; y: number }) => {
        console.log('File dropped:', file.name, 'at position:', position);
        setResponse('');
        setIsLoading(true);
        setCurrentFileName(file.name);
        
        // 重置并开始第一个阶段
        setUploadStages([
            { name: 'TEXT_EXTRACTION', status: 'processing', icon: '📄', message: 'Extracting text...' },
            { name: 'HOT_WORD_GENERATION', status: 'pending', icon: '🔤', message: 'Generating keywords...' },
            { name: 'EMBEDDING_GENERATION', status: 'pending', icon: '🧠', message: 'Creating embeddings...' },
            { name: 'HOT_WORD_ASSOCIATION_GENERATION', status: 'pending', icon: '🔗', message: 'Building associations...' },
        ]);
        
        let newKnowledgeItemId: string | null = null;
        try {
            await uploadKnowledgeItem(file, 'FILE', (data: any) => {
                console.log('📨 SSE Event received:', data);
                const eventType = data.type;
                
                if (eventType === 'TEXT_EXTRACTION') {
                    updateStageStatus('TEXT_EXTRACTION', 'completed', 'Text extracted successfully');
                    if (data.data.knowledge_item_id) {
                        newKnowledgeItemId = data.data.knowledge_item_id;
                    }
                    // 开始下一阶段
                    updateStageStatus('HOT_WORD_GENERATION', 'processing');
                } else if (eventType === 'HOT_WORD_GENERATION') {
                    updateStageStatus('HOT_WORD_GENERATION', 'completed', `Generated ${data.data?.length || 0} keywords`);
                    updateStageStatus('EMBEDDING_GENERATION', 'processing');
                } else if (eventType === 'EMBEDDING_GENERATION') {
                    updateStageStatus('EMBEDDING_GENERATION', 'completed', 'Embeddings created');
                    updateStageStatus('HOT_WORD_ASSOCIATION_GENERATION', 'processing');
                } else if (eventType === 'HOT_WORD_ASSOCIATION_GENERATION') {
                    updateStageStatus('HOT_WORD_ASSOCIATION_GENERATION', 'completed', 'Associations built');
                }else if (eventType === 'FAILED') {
                    // 找到当前处理中的阶段并标记为失败
                    const currentStage = uploadStages.find(s => s.status === 'processing');
                    if (currentStage) {
                        updateStageStatus(currentStage.name, 'failed', data.data?.error || 'Processing failed');
                    }
                }
            });
            
            // 上传完成后刷新图数据
            await fetchGraphData();
            setResponse('✅ Knowledge item successfully processed and added to graph!');
        } catch (error) {
            console.error('Failed to upload file:', error);
            setResponse('❌ Upload failed. Please try again.');
            // 标记所有处理中的阶段为失败
            setUploadStages(prev => prev.map(stage => 
                stage.status === 'processing' ? { ...stage, status: 'failed' as const } : stage
            ));
        } finally {
            setIsLoading(false);
            // 3秒后重置进度显示
            setTimeout(() => {
                if (!isLoading) {
                    resetUploadStages();
                }
            }, 5000);
        }
    };

    // 拖拽事件处理
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            handleFileDropped(file, { x: 0, y: 0 });
        }
    };

    // Handle Ctrl+Enter to send chat
    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (activeTab === 'Chat' && e.key === 'Enter') {
            e.preventDefault();
            if (chatMessage.trim() && !isLoading) {
                handleCreatePodcast();
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70 gap-5 pb-30">
            {/* Main Container */}
            <div className="hero min-h-100 px-20 transition-all duration-500 max-w-6xl">
                <div className="hero-content flex-col lg:flex-row">
                    <div className="h-96 w-150 border border-neutral/20 rounded-2xl overflow-hidden transition-all duration-500">
                        <Graph 
                            ref={graphRef}
                            data={graphData || { nodes: [], links: [] }} 
                            key="init" 
                            width={500} 
                            height={200} 
                            onNodeDoubleClick={handleNodeDoubleClick} 
                            onNodesSelect={handleNodesSelect}
                            selectedNodeIds={selectedNodeIds}
                            onFileDropped={handleFileDropped}
                        />
                    </div>
                    <div className='pl-5'>
                        <h1 className="text-4xl font-bold">Build Your Knowledge!</h1>
                        <p className="py-6">
                            Find something you're interested in and share it.<br /><br />
                            <span className="text-base-content/50">1. Select to ask something about it.</span><br />
                            <span className="text-base-content/50">2. Double-click to show the details.</span><br />
                            <span className="text-base-content/50">3. Choose to create and share a podcast.</span><br />
                            <span className="text-base-content/50">4. Right click to connect nodes.</span><br />
                            <span className="text-base-content/50">5. Drag and drop files into the graph to add new nodes.</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="rounded-lg p-5 bg-base-100 shadow">
                {/* Tab Navigation */}
                <div role="tablist" className="tabs tabs-box w-full">
                    {tabs.map((tab) => (
                        <a
                            key={tab.name}
                            role="tab"
                            className={`tab flex-1 ${activeTab === tab.name ? ' tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.name)}
                            tabIndex={0}
                        >
                            <span className={`mr-2`}>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.name}</span>
                        </a>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="my-5">
                    <div className="relative group">
                        {/* Chat Attachments/Context Bar */}
                        <div className="mb-2 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedNodes.map((node) => (
                                    <div
                                        key={node.id}
                                        className="flex items-center gap-2 px-2 py-1 bg-base-200 rounded cursor-pointer text-xs shadow border border-base-300 hover:bg-base-300 transition"
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Selected node: ${node.id}`}
                                        draggable="true"
                                    >
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>{node.id}</span>
                                        <button
                                            type="button"
                                            className="ml-1 p-0.5 rounded hover:bg-base-100 text-base-content/50 hover:text-error transition"
                                            tabIndex={-1}
                                            aria-label="Remove from context"
                                            onClick={() => removeSelectedNode(node.id)}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {activeTab === 'Upload File' ? (
                            <>
                                {console.log('✅ Rendering Upload File tab content')}
                                <div 
                                    className={`flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
                                        isDragOver 
                                            ? 'border-primary bg-primary/10 scale-[1.02]' 
                                            : 'border-base-300 hover:border-primary/50 hover:bg-base-50'
                                    }`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {isDragOver ? (
                                        <>
                                            <svg className="w-16 h-16 text-primary mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <div className="text-lg font-semibold text-primary mb-2">松开鼠标上传文件</div>
                                            <div className="text-sm text-base-content/70">支持拖拽或点击上传文件</div>
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="file-upload" className="btn btn-primary mb-4 cursor-pointer">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
                                                </svg>
                                                选择文件上传
                                            </label>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                className="file-input file-input-bordered w-full max-w-xs mb-4"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileDropped(file, { x: 0, y: 0 });
                                                    }
                                                }}
                                            />
                                            <div className="text-center">
                                                <div className="text-base-content/70 mb-1">或者将文件拖拽到此处</div>
                                                <div className="text-xs text-base-content/50">支持所有文件类型</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {/* Upload Progress Display */}
                                {(() => {
                                    console.log('🖼️ Render check:', { isLoading, currentFileName, stagesCount: uploadStages.length, stages: uploadStages });
                                    return null;
                                })()}
                                {(isLoading || currentFileName) && (
                                    <div className="mt-6 p-6 bg-gradient-to-br from-base-200 to-base-100 rounded-2xl shadow-lg border border-base-300">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">Processing Knowledge Item</h3>
                                                <p className="text-sm text-base-content/60 truncate">{currentFileName}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {uploadStages.map((stage) => (
                                                <div 
                                                    key={stage.name}
                                                    className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                                                        stage.status === 'processing' ? 'bg-primary/10 shadow-sm scale-[1.02]' :
                                                        stage.status === 'completed' ? 'bg-success/10' :
                                                        stage.status === 'failed' ? 'bg-error/10' :
                                                        'bg-base-100/50'
                                                    }`}
                                                >
                                                    <div className="text-2xl">{stage.icon}</div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium text-sm ${
                                                                stage.status === 'processing' ? 'text-primary' :
                                                                stage.status === 'completed' ? 'text-success' :
                                                                stage.status === 'failed' ? 'text-error' :
                                                                'text-base-content/40'
                                                            }`}>
                                                                {stage.message}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {stage.status === 'processing' && (
                                                            <span className="loading loading-spinner loading-sm text-primary"></span>
                                                        )}
                                                        {stage.status === 'completed' && (
                                                            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {stage.status === 'failed' && (
                                                            <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                        {stage.status === 'pending' && (
                                                            <div className="w-5 h-5 rounded-full border-2 border-base-300"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {response && !isLoading && (
                                    <div className={`mt-4 p-4 rounded-xl ${
                                        response.includes('✅') ? 'bg-success/10 border border-success/20' : 
                                        response.includes('❌') ? 'bg-error/10 border border-error/20' : 
                                        'bg-base-200'
                                    }`}>
                                        <div className="whitespace-pre-wrap">{response}</div>
                                    </div>
                                )}
                            </>
                        ) : activeTab === 'Chat' ? (
                            <div className="relative w-full">
                                <div className="relative">
                                    <textarea
                                        ref={chatTextareaRef}
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyDown={handleChatKeyDown}
                                        placeholder="Enter your chat message..."
                                        rows={4}
                                        className="textarea w-full px-6 py-5 rounded-xl shadow-inner pr-32"
                                        maxLength={1000}
                                        aria-label="Chat message input"
                                    />
                                    <button
                                        onClick={handleCreatePodcast}
                                        disabled={!chatMessage.trim() || isLoading}
                                        className="btn btn-soft btn-primary btn-circle absolute bottom-4 right-4 z-10 flex items-center justify-center disabled:cursor-not-allowed"
                                        style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px' }}
                                        aria-label="发送"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 10h12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                            <path d="M10 6l6 4-6 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <div className="text-xs text-base-content/30">{chatMessage.length}/1000</div>
                                    <span className="text-xs text-base-content/40">Enter to send</span>
                                </div>
                                {response && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-xl max-w-4xl">
                                        <Markdown content={response} />
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'Link' ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="input w-full px-6 py-5 rounded-xl shadow-inner text-lg"
                                    />
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-base-content/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-sm text-base-content/70 px-2">
                                    支持网页链接、视频链接、文档链接等各种URL
                                </div>
                                {response && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-xl max-w-4xl">
                                        <h4 className="font-semibold mb-2">解析结果：</h4>
                                        <div className="whitespace-pre-wrap">{response}</div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'Long Text' ? (
                            <div className="relative">
                                <textarea
                                    value={longText}
                                    onChange={(e) => setLongText(e.target.value)}
                                    placeholder="Paste your long text content here..."
                                    rows={8}
                                    className="textarea w-full px-6 py-5 rounded-xl shadow-inner"
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-base-content/30">
                                    {longText.length} characters
                                </div>
                                <div className="mt-2 text-sm text-base-content/70 px-2">
                                    支持文章、论文、报告等长文本内容
                                </div>
                                {response && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-xl max-w-4xl">
                                        <h4 className="font-semibold mb-2">分析结果：</h4>
                                        <div className="whitespace-pre-wrap">{response}</div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-10">
                    {/* Combined row: selects + Create button + external link */}
                    <div className="flex flex-col min-w-4xl sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-wrap gap-3 items-center">

                        </div>


                        {/* Inline actions: Create button + external link */}
                        <div className="flex items-center gap-4">
                            {activeTab === 'Upload File' ? null : (
                                <>
                                    {/* Create Button */}
                                    {activeTab === 'Link' || activeTab === 'Long Text' ? (
                                        <>
                                            <button
                                                onClick={handleCreatePodcast}
                                                disabled={
                                                    activeTab === 'Link' ? !linkUrl.trim() || isLoading : 
                                                    activeTab === 'Long Text' ? !longText.trim() || isLoading : true
                                                }
                                                className="btn btn-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                <span className="flex items-center gap-2 text-sm">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                    {activeTab === 'Link' ? 'Parse Link' : 'Analyze Text'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={handleCreatePodcast}
                                                disabled={
                                                    activeTab === 'Link' ? !linkUrl.trim() || isLoading : 
                                                    activeTab === 'Long Text' ? !longText.trim() || isLoading : true
                                                }
                                                className="btn btn-lg btn-primary font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                <span className="flex items-center gap-2 text-sm">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                    Create Podcast
                                                </span>
                                            </button>
                                        </>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
            {/* 节点详情弹窗 */}
            <NodeDetailDialog nodeDetail={nodeDetail} ref={nodeDetailModalRef} />
        </div>
    )
}

export default Home
