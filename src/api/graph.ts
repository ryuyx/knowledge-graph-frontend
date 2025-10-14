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
    const response = await apiClient.get('/knowledge/cluster');
    const data = response.data;

    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // Add category nodes
    data.big_hot_words_with_hot_words.forEach((category: any) => {
        const categoryName = category.word;
        const node: Node = { name: categoryName, type: 'category' };
        nodes.push(node);
        nodeMap.set(categoryName, node);
    });

    // Add topic nodes and links from category to topic
    data.big_hot_words_with_hot_words.forEach((category: any) => {
        const categoryName = category.word;
        category.hot_words.forEach((hotWord: any) => {
            const topic = hotWord.word;
            if (!nodeMap.has(topic)) {
                const node: Node = { name: topic, type: 'topic' };
                nodes.push(node);
                nodeMap.set(topic, node);
            }
            links.push({
                source: categoryName,
                target: topic,
                weight: 1
            });

            // Add knowledge items as nodes and link them to topics
            hotWord.knowledge_items?.forEach((item: any) => {
                const itemName = item.item_metadata.original_filename||item.title || item.source_content;
                const itemId = item.id;
                
                if (!nodeMap.has(itemId)) {
                    const node: Node = { 
                        name: itemName, 
                        type: item.source_type 
                    };
                    nodes.push(node);
                    nodeMap.set(itemId, node);
                }
                
                // Link topic to knowledge item
                links.push({
                    source: topic,
                    target: itemName,
                    weight: 0.8
                });
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


