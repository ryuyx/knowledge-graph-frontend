import { useState, useRef, useEffect } from 'react';

interface Reference {
    id: string;
    score: number;
    document: string;
    meta_data: {
        source_type?: string;
        page?: number;
        chunk?: number;
        created_at?: string;
        name?: string;
        content_id?: string;
        hot_words?: string;
        chunk_size?: number;
        knowledge_item_id?: string;
        content_hash?: string;
    };
    distance: number;
    similarity: number;
}

interface CitationTooltipProps {
    citationNumber: number;
    reference?: Reference;
    children: React.ReactNode;
}

export default function CitationTooltip({ citationNumber, reference, children }: CitationTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const hideTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            
            // Calculate position to show tooltip above the citation
            let top = triggerRect.top - tooltipRect.height - 10;
            let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
            
            // Adjust if tooltip goes off screen
            if (top < 0) {
                top = triggerRect.bottom + 10;
            }
            if (left < 10) {
                left = 10;
            }
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }
            
            setPosition({ top, left });
        }
    }, [isVisible]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        // Delay hiding by 500ms
        hideTimeoutRef.current = window.setTimeout(() => {
            setIsVisible(false);
        }, 500);
    };

    const handleTooltipMouseEnter = () => {
        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const handleTooltipMouseLeave = () => {
        // Delay hiding by 300ms when leaving tooltip
        hideTimeoutRef.current = window.setTimeout(() => {
            setIsVisible(false);
        }, 300);
    };

    if (!reference) {
        return <>{children}</>;
    }

    const confidencePercent = Math.round(reference.similarity * 100);
    const confidenceColor = 
        confidencePercent >= 70 ? 'text-green-600' :
        confidencePercent >= 50 ? 'text-yellow-600' :
        'text-red-600';

    // Parse hot words from JSON string
    let hotWords: string[] = [];
    if (reference.meta_data.hot_words) {
        try {
            const parsed = JSON.parse(reference.meta_data.hot_words);
            if (Array.isArray(parsed)) {
                hotWords = parsed;
            }
        } catch (e) {
            // If not valid JSON, treat as comma-separated string
            hotWords = reference.meta_data.hot_words.split(',').map(w => w.trim()).filter(Boolean);
        }
    }

    return (
        <>
            <span
                ref={triggerRef}
                className="citation-link inline-flex items-center justify-center relative cursor-pointer text-blue-600 hover:text-blue-800 font-medium transition-colors"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ 
                    fontSize: '0.75em',
                    verticalAlign: 'super',
                    lineHeight: '0',
                    textDecoration: 'none',
                    padding: '0 0.2em'
                }}
            >
                {children}
            </span>
            
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 pointer-events-none citation-tooltip"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                >
                    <div 
                        className="bg-white shadow-2xl rounded-xl border border-gray-300 p-4 max-w-md w-96 pointer-events-auto"
                        onMouseEnter={handleTooltipMouseEnter}
                        onMouseLeave={handleTooltipMouseLeave}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-blue-600">Reference [{citationNumber}]</span>
                                {reference.meta_data.source_type && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded border border-gray-300">
                                        {reference.meta_data.source_type}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-semibold ${confidenceColor}`}>
                                    Confidence: {confidencePercent}%
                                </span>
                            </div>
                        </div>

                        {/* Document name */}
                        {reference.meta_data.name && (
                            <div className="mb-2">
                                <div className="text-xs text-gray-500 mb-1">Document</div>
                                <div className="text-sm font-medium text-gray-800">{reference.meta_data.name}</div>
                            </div>
                        )}

                        {/* Content preview */}
                        <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Content</div>
                            <div className="text-sm bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto text-gray-700">
                                {reference.document.length > 300 
                                    ? `${reference.document.substring(0, 300)}...` 
                                    : reference.document}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {reference.meta_data.page !== undefined && (
                                <div>
                                    <span className="text-gray-500">Page:</span>
                                    <span className="ml-1 font-medium text-gray-800">{reference.meta_data.page}</span>
                                </div>
                            )}
                            {reference.meta_data.chunk !== undefined && (
                                <div>
                                    <span className="text-gray-500">Chunk:</span>
                                    <span className="ml-1 font-medium text-gray-800">{reference.meta_data.chunk}</span>
                                </div>
                            )}
                            {reference.meta_data.chunk_size !== undefined && (
                                <div>
                                    <span className="text-gray-500">Size:</span>
                                    <span className="ml-1 font-medium text-gray-800">{reference.meta_data.chunk_size} chars</span>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500">Similarity:</span>
                                <span className="ml-1 font-medium text-gray-800">{reference.similarity.toFixed(3)}</span>
                            </div>
                        </div>

                        {/* Hot words if available */}
                        {hotWords.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-2">Keywords</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {hotWords.map((word, index) => (
                                        <span 
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

