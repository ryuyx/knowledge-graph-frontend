import React, { forwardRef } from 'react';

interface NodeDetailDialogProps {
    nodeDetail: any | null;
}

const NodeDetailDialog = forwardRef<HTMLDialogElement, NodeDetailDialogProps>(({ nodeDetail }, ref) => (
    <dialog id="node_detail_modal" className="modal" ref={ref as any}>
        <div className="modal-box">
            <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg mb-2">节点详情</h3>
            {nodeDetail ? (
                nodeDetail.error ? (
                    <div className="text-red-500">{nodeDetail.error}</div>
                ) : nodeDetail.extracted_text ? (
                    <div className="text-left break-all whitespace-pre-wrap max-h-96 overflow-auto">
                        <div className="mb-2 font-semibold">{nodeDetail.title || nodeDetail.metadata?.original_filename || nodeDetail.name}</div>
                        <div className="mb-2 text-xs text-gray-400">ID: {nodeDetail.id}</div>
                        <div className="mb-2 text-xs text-gray-400">类型: {nodeDetail.source_type}</div>
                        <div className="mb-2 text-xs text-gray-400">状态: {nodeDetail.status}</div>
                        <div className="mb-2 text-xs text-gray-400">创建时间: {nodeDetail.created_at}</div>
                        <div className="mb-2 text-xs text-gray-400">文件名: {nodeDetail.metadata?.original_filename}</div>
                        <div className="mb-2 text-xs text-gray-400">文件大小: {nodeDetail.metadata?.file_size} 字节</div>
                        <div className="mb-2 text-xs text-gray-400">内容类型: {nodeDetail.metadata?.content_type}</div>
                        <div className="mt-4 text-sm whitespace-pre-wrap">{nodeDetail.extracted_text}</div>
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
));

export default NodeDetailDialog;
