export interface ToolbarConfig {
  // Filter
  nameFilter: string;
  typeFilter: number[]; // [1,2,3,4] corresponds to category, topic, FILE, URL
  levelFilter: 'all' | 'category' | 'topic' | 'file';
  minConnections: number; // minimum number of connections to show node, default 0
  
  // Visual adjustments
  nodeSize: number; // scale multiplier, default 1
  textSize: number; // scale multiplier, default 1
  nodeOpacity: number; // 0-1
  textLevelDisplay: number[]; // [1,2,3,4] which groups to show text for
  linkWidth: number; // link line width
  
  // Physics parameters
  centerForce: number; // center force strength, default 0.05
  linkDistance: number; // link distance multiplier, default 1
  chargeStrength: number; // repulsion force strength multiplier, default 1
}

export interface Node {
  id: string;
  name: string;
  group: number;
  type?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  highlighted?: boolean;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  weight?: number;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

