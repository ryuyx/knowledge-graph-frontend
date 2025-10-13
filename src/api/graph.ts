import apiClient from './index';

export interface Node {
    name: string;
    type: string;
}

export interface Link {
    source: string;
    target: string;
    weight: number;
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export const getKnowledgeGraph  = async (): Promise<GraphData> => {
    const response = await apiClient.post('/knowledge/cluster');
    const data = response.data;

    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // Add category nodes
    Object.keys(data.big_hot_word_wtih_hot_words).forEach(key => {
        const node: Node = { name: key, type: 'category' };
        nodes.push(node);
        nodeMap.set(key, node);
    });

    // Add topic nodes and links from category to topic
    Object.entries(data.big_hot_word_wtih_hot_words).forEach(([category, topics]: [string, any]) => {
        topics.forEach((topic: string) => {
            if (!nodeMap.has(topic)) {
                const node: Node = { name: topic, type: 'topic' };
                nodes.push(node);
                nodeMap.set(topic, node);
            }
            links.push({
                source: category,
                target: topic,
                weight: 1
            });
        });
    });

    // Add association links
    data.associations.forEach((assoc: any) => {
        links.push({
            source: assoc.word1,
            target: assoc.word2,
            weight: assoc.similarity_score
        });
    });

    return { nodes, links };
};


