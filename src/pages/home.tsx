import { useState, useRef, useEffect } from 'react'
import Graph from '@/components/Graph'
import { getKnowledgeGraph, type GraphData as ApiGraphData } from '@/api/graph'
import AudioCard from '@/components/AudioCard'
import { chat } from '@/api/chat'

interface Data {
    nodes: {
        id: string;
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
    const [voiceType, setVoiceType] = useState('Fish Audio')
    const [energyLevel, setEnergyLevel] = useState('en-Energetic Male')
    const [friendliness, setFriendliness] = useState('en-Friendly Women')
    const [autoSetting, setAutoSetting] = useState('Auto')

    // 节点详情弹窗相关 state
    const [nodeDetail, setNodeDetail] = useState<any | null>(null)
    
    // 选中的节点状态
    const [selectedNodes, setSelectedNodes] = useState<any[]>([])
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

    // 图数据状态
    const [graphData, setGraphData] = useState<Data | null>(null)

    // 拖拽上传状态
    const [isDragOver, setIsDragOver] = useState(false)

    // 用于 dialog 的 ref
    const nodeDetailModalRef = useRef<HTMLDialogElement | null>(null);

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
        try {
            await chat(currentInput, (data: any) => {
                if (data.event === 'RunContent') {
                    setResponse(prev => prev + data.content);
                }else if (data.event === 'RunReferences') {
                    //todo:make references highlight
                }
            });
        } catch (error) {
            console.error('Failed to send chat:', error);
            setResponse('发送失败，请重试。');
        }
    }

    // 双击节点显示详情
    const handleNodeDoubleClick = (node: any) => {
        setNodeDetail(node);
        // 打开 modal
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
    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                const data = await getKnowledgeGraph();
                // 转换数据格式以匹配Graph组件
                const convertedData = {
                    nodes: data.nodes.map(node => ({
                        id: node.name,
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
        fetchGraphData();
    }, []);

    // 处理文件拖拽 - 现在只处理文件内容读取等逻辑
    const handleFileDropped = (file: File, position: { x: number; y: number }) => {
        console.log('File dropped:', file.name, 'at position:', position);
        
        // 如果需要读取文件内容，可以使用 FileReader
        if (file.type.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                console.log('File content:', content.substring(0, 200) + '...');
                // 可以将内容存储起来，比如显示在详情弹窗中
                setNodeDetail({
                    id: file.name,
                    group: 2,
                    content: content,
                    fileType: file.type,
                    fileSize: file.size
                });
            };
            reader.readAsText(file);
        } else {
            // 对于非文本文件，存储基本信息
            setNodeDetail({
                id: file.name,
                group: 2,
                fileType: file.type,
                fileSize: file.size,
                content: `文件类型: ${file.type}\n文件大小: ${(file.size / 1024).toFixed(2)} KB`
            });
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

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70 gap-5 pb-30">
            {/* Main Container */}
            <div className="hero min-h-100 px-20 transition-all duration-500 max-w-6xl">
                <div className="hero-content flex-col lg:flex-row">
                    <div className="h-96 w-150 border border-neutral/20 rounded-2xl overflow-hidden transition-all duration-500">
                        <Graph 
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
                        ) : activeTab === 'Chat' ? (
                            <div className="relative">
                                <textarea
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Enter your chat message..."
                                    rows={4}
                                    className="textarea w-full px-6 py-5 rounded-xl shadow-inner"
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-base-content/30">
                                    {chatMessage.length}/1000
                                </div>
                                {response && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-xl max-w-4xl">
                                        <div className="whitespace-pre-wrap">{response}</div>
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
                            {activeTab === 'Chat' ? (
                                <button
                                    onClick={handleCreatePodcast}
                                    disabled={!chatMessage.trim()}
                                    className="btn btn-lg btn-primary font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="flex items-center gap-2 text-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Send
                                    </span>
                                </button>
                            ) : activeTab === 'Upload File' ? null : (
                                <>
                                    {/* Create Button */}
                                    <button
                                        onClick={handleCreatePodcast}
                                        disabled={
                                            activeTab === 'Link' ? !linkUrl.trim() : 
                                            activeTab === 'Long Text' ? !longText.trim() : true
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
                                            activeTab === 'Link' ? !linkUrl.trim() : 
                                            activeTab === 'Long Text' ? !longText.trim() : true
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <section className="mt-10 text-center max-w-4xl">
                <h2 className="text-lg font-semibold mb-8">Share your thoughts and ideas with the world.</h2>
                <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:max-w-6xl md:mx-auto relative">
                    {/* Audio Cards */}
                    <AudioCard
                        href="/doc/vs962a7f-9461-4875-b7c7-2f5aca66126e"
                        title="Hacker News: Exploring Innovative Projects in Technology, Privacy, and Engineering"
                        status="Success"
                        date="2025/6/23"
                        duration="9m"
                    />
                    <AudioCard
                        href="/doc/vs789e71-b192-4374-93a2-8177f457ba5c"
                        title="Hacker News: From Mechanical Watches to Technological Innovation: Latest Developments and Challenges in Multiple Fields"
                        status="Success"
                        date="2025/6/23"
                        duration="5m"
                    />
                    <AudioCard
                        href="/doc/vsbed589-6493-4ac2-8217-64d82b1ecafa"
                        title="V2EX Hot List: Lychee Sales, Payment Methods, Operator Policies, and Car Rental Issues"
                        status="Success"
                        date="2025/6/22"
                        duration="5m"
                    />
                </div>
            </section>
            {/* 节点详情弹窗 */}
            <dialog id="node_detail_modal" className="modal" ref={nodeDetailModalRef}>
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg mb-2">文件详情</h3>
                    {nodeDetail ? (
                        <div className="text-left break-all">
                            “内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容”
                        </div>
                    ) : (
                        <div>暂无详情</div>
                    )}
                </div>
            </dialog>
        </div>
    )
}

export default Home
