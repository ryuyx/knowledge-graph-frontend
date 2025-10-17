import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CitationTooltip from './CitationTooltip';
import '@/style/markdown.css';

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

interface MarkdownProps {
  content: string;
  className?: string;
  references?: Reference[];
}

const Markdown: React.FC<MarkdownProps> = ({ content, className = "", references = [] }) => {
    // Create a map of citation number to reference
    const citationMap = new Map<number, Reference>();
    
    // Replace citations with placeholder that won't be parsed as markdown
    const citationRegex = /\[\^(\d+)\^\]/g;
    
    const CITATION_PREFIX = '〖CITE:';
    const CITATION_SUFFIX = '〗';
    const processedContent = content.replace(citationRegex, (match, num) => {
        const citationNum = parseInt(num, 10);
        // Citation numbers start from 1, array indices start from 0
        const referenceIndex = citationNum - 1;
        if (references[referenceIndex]) {
            citationMap.set(citationNum, references[referenceIndex]);
        }
        return `${CITATION_PREFIX}${num}${CITATION_SUFFIX}`;
    });

    const extractTextContent = (element: React.ReactNode): string => {
        if (typeof element === 'string') {
            return element;
        }
        if (Array.isArray(element)) {
            return element.map(extractTextContent).join('');
        }
        if (element && typeof element === 'object' && 'props' in element && (element as any).props && 'children' in (element as any).props) {
            return extractTextContent((element as any).props.children);
        }
        return '';
    };

    // Render text with citations
    const renderTextWithCitations = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        const regex = /〖CITE:(\d+)〗/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Add text before citation
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            // Add citation
            const citationNum = parseInt(match[1], 10);
            const reference = citationMap.get(citationNum);
            parts.push(
                <CitationTooltip
                    key={`citation-${citationNum}-${match.index}`}
                    citationNumber={citationNum}
                    reference={reference}
                >
                    [{citationNum}]
                </CitationTooltip>
            );

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    const processChildren = (children: React.ReactNode): React.ReactNode => {
        return React.Children.map(children, (child) => {
            if (typeof child === 'string') {
                return renderTextWithCitations(child);
            }
            // @ts-ignore
            if (React.isValidElement(child) && (child as any).props.children) {
                return React.cloneElement(child, {
                    ...(child as any).props,
                    children: processChildren((child as any).props.children)
                } as any);
            }
            return child;
        });
    };

    const components: any = {
        // Handle math expressions specially
        math: ({ value }: { value: string }) => {
            return <span className="katex-math">{value}</span>;
        },
        inlineMath: ({ value }: { value: string }) => {
            return <span className="katex-inline-math">{value}</span>;
        },
        code: ({ node, inline, className, children, ...props }: any) => {
            if (inline || !className) {
                return (
                    <code className="inline-code" {...props}>
                        {children}
                    </code>
                );
            }
            const match = /language-(\w+)/.exec(className || '');
            return (
                <div className="relative group">
                    <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                        {match && (
                            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                                {match[1]}
                            </span>
                        )}
                    </div>
                    <code className={className} {...props}>
                        {children}
                    </code>
                </div>
            );
        },
        p: ({ children }: { children?: React.ReactNode }) => {
            // Check if the paragraph contains special formatting characters like tree structures
            const childrenAsString = React.Children.toArray(children).join('');
            const hasSpecialChars = /[│└─┐┌┘└┬┴├┤┼]/.test(childrenAsString) || 
                                  /[　│└─]/.test(childrenAsString) ||
                                  /^\s*[０-９　１-９]+.*[─│└┐┌┘┬┴├┤┼]/.test(childrenAsString);
            
            if (hasSpecialChars) {
                return (
                    <pre className="my-3 text-gray-700 leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto text-sm bg-gray-50 p-3 rounded border">
                        {processChildren(children)}
                    </pre>
                );
            }
            
            return (
                <p className="my-3 text-gray-700 leading-relaxed">
                    {processChildren(children)}
                </p>
            );
        },
        table: ({ children }: { children?: React.ReactNode }) => (
            <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300">
                    {children}
                </table>
            </div>
        ),
        th: ({ children }: { children?: React.ReactNode }) => (
            <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-sm">
                {processChildren(children)}
            </th>
        ),
        td: ({ children }: { children?: React.ReactNode }) => (
            <td className="border border-gray-300 px-3 py-2 text-sm">
                {processChildren(children)}
            </td>
        ),
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a 
                href={href} 
                className="text-blue-600 hover:text-blue-800 underline" 
                target="_blank" 
                rel="noopener noreferrer"
            >
                {processChildren(children)}
            </a>
        ),
        h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2">
                {processChildren(children)}
            </h1>
        ),
        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3">
                {processChildren(children)}
            </h2>
        ),
        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                {processChildren(children)}
            </h3>
        ),
        h4: ({ children }: { children?: React.ReactNode }) => (
            <h4 className="text-base font-semibold text-gray-900 mt-3 mb-2">
                {processChildren(children)}
            </h4>
        ),
        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="list-disc list-inside my-3 space-y-1 text-gray-700">
                {children}
            </ul>
        ),
        li: ({ children }: { children?: React.ReactNode }) => (
            <li>
                {processChildren(children)}
            </li>
        ),
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50 text-gray-600 italic">
                {processChildren(children)}
            </blockquote>
        )
    };

    return (
        <div className={`prose prose-sm max-w-none markdown-content overflow-hidden ${className}`}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                    rehypeKatex, 
                    [rehypeHighlight, { 
                        detect: false,
                        ignoreMissing: true,
                        subset: false
                    }]
                ]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default Markdown;