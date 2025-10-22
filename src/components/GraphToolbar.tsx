import React, { useState, useEffect } from 'react';
import type { ToolbarConfig } from '@/types/graph';

interface GraphToolbarProps {
  config: ToolbarConfig;
  onConfigChange: (config: ToolbarConfig) => void;
  onReset: () => void;
}

const GraphToolbar: React.FC<GraphToolbarProps> = ({ config, onConfigChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Collapsible sections state
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [visualExpanded, setVisualExpanded] = useState(false);
  const [physicsExpanded, setPhysicsExpanded] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const updateConfig = (updates: Partial<ToolbarConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  if (!isExpanded) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
        }}
        className="bg-base-100/95 backdrop-blur-md rounded-lg shadow-2xl border border-base-300"
      >
        <div
          className="p-3 cursor-move flex items-center gap-2"
          onMouseDown={handleMouseDown}
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Expand toolbar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          </button>
          <span className="text-sm font-medium">Graph Controls</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        width: '280px',
        maxHeight: '70vh',
      }}
      className="bg-base-100/95 backdrop-blur-md rounded-lg shadow-2xl border border-base-300 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div
        className="p-3 cursor-move flex items-center justify-between border-b border-base-300 bg-base-200/50"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Graph Controls
        </h3>
        <div className="flex gap-1">
          <button
            onClick={onReset}
            className="btn btn-xs btn-ghost"
            title="Reset to defaults"
            aria-label="Reset configuration"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="btn btn-xs btn-ghost btn-circle"
            aria-label="Collapse toolbar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {/* Filter Section */}
        <div className="collapse collapse-arrow bg-base-200 rounded-lg">
          <input
            type="checkbox"
            checked={filterExpanded}
            onChange={() => setFilterExpanded(!filterExpanded)}
          />
          <div className="collapse-title text-sm font-medium">过滤器</div>
          <div className="collapse-content space-y-3">
            {/* Name Filter */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">名称搜索</span>
              </label>
              <input
                type="text"
                value={config.nameFilter}
                onChange={(e) => updateConfig({ nameFilter: e.target.value })}
                placeholder="搜索节点名称..."
                className="input input-sm input-bordered w-full"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">节点类型</span>
              </label>
              <div className="space-y-1">
                {[
                  { value: 1, label: 'Category', color: '#ef7234' },
                  { value: 2, label: 'Topic/Keyword', color: '#76b7b2' },
                  { value: 3, label: 'File', color: '#3c3c43' },
                  { value: 4, label: 'URL', color: '#1f77b4' },
                ].map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.typeFilter.includes(type.value)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...config.typeFilter, type.value]
                          : config.typeFilter.filter((t) => t !== type.value);
                        updateConfig({ typeFilter: newTypes });
                      }}
                      className="checkbox checkbox-xs"
                    />
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: type.color }}
                    ></span>
                    <span className="text-xs">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">显示层级</span>
              </label>
              <select
                value={config.levelFilter}
                onChange={(e) => updateConfig({ levelFilter: e.target.value as any })}
                className="select select-sm select-bordered w-full"
              >
                <option value="all">全部</option>
                <option value="category">仅大分类</option>
                <option value="topic">仅关键词</option>
                <option value="file">仅文件</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Adjustments Section */}
        <div className="collapse collapse-arrow bg-base-200 rounded-lg">
          <input
            type="checkbox"
            checked={visualExpanded}
            onChange={() => setVisualExpanded(!visualExpanded)}
          />
          <div className="collapse-title text-sm font-medium">视觉调整</div>
          <div className="collapse-content space-y-3">
            {/* Node Size */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">节点大小</span>
                <span className="label-text-alt text-xs">{config.nodeSize.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.nodeSize}
                onChange={(e) => updateConfig({ nodeSize: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>

            {/* Text Size */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">文字大小</span>
                <span className="label-text-alt text-xs">{config.textSize.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.textSize}
                onChange={(e) => updateConfig({ textSize: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>

            {/* Node Opacity */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">节点透明度</span>
                <span className="label-text-alt text-xs">{(config.nodeOpacity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.1"
                value={config.nodeOpacity}
                onChange={(e) => updateConfig({ nodeOpacity: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>

            {/* Text Level Display */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">文字显示层级</span>
              </label>
              <div className="space-y-1">
                {[
                  { value: 1, label: 'Category', color: '#ef7234' },
                  { value: 2, label: 'Topic/Keyword', color: '#76b7b2' },
                  { value: 3, label: 'File', color: '#3c3c43' },
                  { value: 4, label: 'URL', color: '#1f77b4' },
                ].map((level) => (
                  <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.textLevelDisplay.includes(level.value)}
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...config.textLevelDisplay, level.value]
                          : config.textLevelDisplay.filter((l) => l !== level.value);
                        updateConfig({ textLevelDisplay: newLevels });
                      }}
                      className="checkbox checkbox-xs"
                    />
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: level.color }}
                    ></span>
                    <span className="text-xs">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Link Width */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">连接线粗细</span>
                <span className="label-text-alt text-xs">{config.linkWidth.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={config.linkWidth}
                onChange={(e) => updateConfig({ linkWidth: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>
          </div>
        </div>

        {/* Physics Parameters Section */}
        <div className="collapse collapse-arrow bg-base-200 rounded-lg">
          <input
            type="checkbox"
            checked={physicsExpanded}
            onChange={() => setPhysicsExpanded(!physicsExpanded)}
          />
          <div className="collapse-title text-sm font-medium">物理参数</div>
          <div className="collapse-content space-y-3">
            {/* Center Force */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">向心力</span>
                <span className="label-text-alt text-xs">{config.centerForce.toFixed(3)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={config.centerForce}
                onChange={(e) => updateConfig({ centerForce: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>

            {/* Link Distance */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">连接距离</span>
                <span className="label-text-alt text-xs">{config.linkDistance.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.linkDistance}
                onChange={(e) => updateConfig({ linkDistance: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>

            {/* Charge Strength */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs">排斥力</span>
                <span className="label-text-alt text-xs">{config.chargeStrength.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.chargeStrength}
                onChange={(e) => updateConfig({ chargeStrength: parseFloat(e.target.value) })}
                className="range range-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphToolbar;

