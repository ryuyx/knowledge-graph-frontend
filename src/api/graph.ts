import apiClient from './index';
import { createParser } from 'eventsource-parser';

export interface Node {
    id: string;
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
        const node: Node = { id: category.id, name: category.word, type: 'category' };
        nodes.push(node);
        nodeMap.set(category.word, node);
    });

    // Add topic nodes and links from category to topic
    data.big_hot_words_with_hot_words.forEach((category: any) => {
        const categoryName = category.word;
        category.hot_words.forEach((hotWord: any) => {
            const topic = hotWord.word;
            if (!nodeMap.has(topic)) {
                const node: Node = { id: hotWord.id, name: topic, type: 'topic' };
                nodes.push(node);
                nodeMap.set(topic, node);
            }
            links.push({
                source: category.id,
                target: hotWord.id,
                weight: 1
            });

            // Add knowledge items as nodes and link them to topics
            hotWord.knowledge_items?.forEach((item: any) => {
                const itemName = item.item_metadata.original_filename||item.title || item.source_content;
                const itemId = item.id;
                
                if (!nodeMap.has(itemId)) {
                    const node: Node = { 
                        id: itemId,
                        name: itemName, 
                        type: item.source_type 
                    };
                    nodes.push(node);
                    nodeMap.set(itemId, node);
                }
                
                // Link topic to knowledge item
                links.push({
                    source: hotWord.id,
                    target: itemId,
                    weight: 0.8
                });
            });
        });
    });

    // Add association links
    data.associations.forEach((assoc: any) => {
        links.push({
            source: assoc.word1_id,
            target: assoc.word2_id,
            weight: assoc.similarity_score
        });
    });

    return { nodes, links };
};

export const getKnowledgeItem = async (id: string): Promise<any> => {
    const response = await apiClient.get(`/knowledge/${id}`);
    return response.data;
}   

export const uploadKnowledgeItem = async (content: File | string, sourceType: string, onMessage: (data: any) => void) => {
    let response: Response;

    if (sourceType === 'FILE') {
        const formData = new FormData();
        formData.append('file', content as File);
        formData.append('source_type', sourceType);
        response = await fetch('/api/knowledge/collect', {
            method: 'POST',
            body: formData
        });
    } else if (sourceType === 'URL') {
        response = await fetch('/api/knowledge/collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source_type: sourceType, url: content as string })
        });
    } else {
        throw new Error('Invalid sourceType');
    }

    if (!response.body) {
        throw new Error('Response body is not available');
    }

    const parser = createParser({
        onEvent: (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        }
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
    }
};

export const getKnowledgeByTopic = async (id: string): Promise<any> => {
    const response = await apiClient.get(`/knowledge/by-hot-word/${id}`);
    return response.data;
};
