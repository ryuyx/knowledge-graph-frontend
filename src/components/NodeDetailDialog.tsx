import React, { forwardRef } from 'react';
import Markdown from './Markdown';

interface NodeDetailDialogProps {
    nodeDetail: any | null;
}

const NodeDetailDialog = forwardRef<HTMLDialogElement, NodeDetailDialogProps>(({ nodeDetail }, ref) => {
    const handleBgClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === e.currentTarget) {
            (ref as any)?.current?.close?.();
        }
    };
    return (
        <dialog id="node_detail_modal" className="modal" ref={ref as any} onClick={handleBgClick}>
            <div className="modal-box w-[700px] max-w-full h-[600px]">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 className="font-bold text-lg mb-2">节点详情</h3>
                {nodeDetail ? (
                    nodeDetail.error ? (
                        <div className="text-red-500">{nodeDetail.error}</div>
                    ) : nodeDetail.extracted_text ? (
                        <div className="text-left break-all whitespace-pre-wrap h-[90%] overflow-auto">
                            <div className="mb-2 font-semibold">{nodeDetail.title || nodeDetail.metadata?.original_filename || nodeDetail.name}</div>
                            <div className="mb-2 text-xs text-gray-400">ID: {nodeDetail.id}</div>
                            <div className="mb-2 text-xs text-gray-400">类型: {nodeDetail.source_type}</div>
                            <div className="mb-2 text-xs text-gray-400">状态: {nodeDetail.status}</div>
                            <div className="mb-2 text-xs text-gray-400">创建时间: {nodeDetail.created_at}</div>
                            <div className="mb-2 text-xs text-gray-400">文件名: {nodeDetail.metadata?.original_filename}</div>
                            <div className="mb-2 text-xs text-gray-400">文件大小: {nodeDetail.metadata?.file_size} 字节</div>
                            <div className="mb-2 text-xs text-gray-400">内容类型: {nodeDetail.metadata?.content_type}</div>
                            <div className="mt-4 text-sm">
                                <Markdown content={nodeDetail.extracted_text} />
                            </div>
                        </div>
                    ) : nodeDetail.big_hot_word_id && nodeDetail.hot_words ? (
                        <div className="text-left break-all h-[90%] overflow-auto">
                            <div className="mb-2 font-semibold text-xl">类别：{nodeDetail.big_hot_word_name}</div>
                            <div className="mb-2 text-xs text-gray-400">ID: {nodeDetail.big_hot_word_id}</div>
                            <div className="mb-2 text-xs text-gray-400">热词数量: {nodeDetail.hot_words.length}</div>
                            <div className="mt-4">
                                <div className="space-y-4">
                                    {nodeDetail.hot_words.map((hotWord: any) => (
                                        <div key={hotWord.hot_word_id} className="border border-base-300 rounded-lg p-3">
                                            <div className="font-semibold mb-2">主题：{hotWord.hot_word_name}</div>
                                            <div className="text-xs text-gray-400 mb-2">ID: {hotWord.hot_word_id}</div>
                                            <div className="text-xs text-gray-400 mb-2">知识条目数: {hotWord.total_count}</div>
                                            {hotWord.knowledge_items && hotWord.knowledge_items.length > 0 && (
                                                <div className="mt-2">
                                                    <table className="table w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-base-200">
                                                                <th>标题</th>
                                                                <th>类型</th>
                                                                <th>状态</th>
                                                                <th>创建时间</th>
                                                                <th>文件名</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {hotWord.knowledge_items.map((item: any) => (
                                                                <tr key={item.id} className="hover:bg-base-100">
                                                                    <td>{item.title || item.metadata?.original_filename || item.id}</td>
                                                                    <td>{item.source_type}</td>
                                                                    <td>{item.status}</td>
                                                                    <td>{item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : ''}</td>
                                                                    <td>{item.metadata?.original_filename}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : nodeDetail.hot_word_id && nodeDetail.knowledge_items ? (
                        <div className="text-left break-all h-[90%] overflow-auto">
                            <div className="mb-2 font-semibold text-xl">主题：{nodeDetail.hot_word_name}</div>
                            <div className="mb-2 text-xs text-gray-400">ID: {nodeDetail.hot_word_id}</div>
                            <div className="mb-2 text-xs text-gray-400">知识条目数: {nodeDetail.total_count}</div>
                            <div className="mt-4">
                                <table className="table w-full text-xs">
                                    <thead>
                                        <tr className="bg-base-200">
                                            <th>标题</th>
                                            <th>类型</th>
                                            <th>状态</th>
                                            <th>创建时间</th>
                                            <th>文件名</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nodeDetail.knowledge_items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-base-100">
                                                <td>{item.title || item.metadata?.original_filename || item.id}</td>
                                                <td>{item.source_type}</td>
                                                <td>{item.status}</td>
                                                <td>{item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : ''}</td>
                                                <td>{item.metadata?.original_filename}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-left break-all">
                            {nodeDetail.title || nodeDetail.name || '暂无详情'}
                        </div>
                    )
                ) : (
                    <div>暂无详情</div>
                )}
            </div>
        </dialog>
    );
});

export default NodeDetailDialog;
