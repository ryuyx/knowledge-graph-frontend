import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKnowledgeGraph } from '../src/api/graph';
import apiClient from '../src/api/index';

// Mock the apiClient
vi.mock('../src/api/index', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('getKnowledgeGraph', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return correct graph data for valid API response', async () => {
        const mockResponse = {
            data: {
                "big_hot_word_wtih_hot_words": {
                    "Advanced Search and Development Tools": [
                        "Vector Search",
                        "Hybrid Search",
                        "VSCode 扩展",
                        "Keyword Search",
                        "Codex"
                    ],
                    "Spring Framework Security": [
                        "Spring Boot",
                        "Spring Security"
                    ],
                    "Gradle构建与依赖管理": [
                        "Gradle",
                        "Gradle依赖管理"
                    ],
                    "现代身份认证与系统安全": [
                        "认证授权",
                        "安全性配置",
                        "OAuth2.0",
                        "身份验证",
                        "单点登录",
                        "反向代理",
                        "レガシーシステム更新"
                    ],
                    "现代Web架构与负载均衡技术": [
                        "负载均衡",
                        "Nginx",
                        "云架构",
                        "Solid框架开发",
                        "YNA-G3アーキテクチャ"
                    ],
                    "数据库运维与迁移": [
                        "数据库配置与连接",
                        "数据库管理",
                        "数据迁移"
                    ],
                    "AI智能客服与生成式AI应用": [
                        "AI智能客服",
                        "生成式AI应用",
                        "自然语言处理",
                        "DBeaver",
                        "生成AI"
                    ],
                    "低代码敏捷开发平台": [
                        "低代码开发平台",
                        "敏捷开发",
                        "敏捷开发"
                    ],
                    "AgentKit and Apps SDK Integration": [
                        "AgentKit",
                        "Apps SDK"
                    ]
                },
                "associations": [
                    {
                        "word1": "Advanced Search and Development Tools",
                        "word2": "Gradle构建与依赖管理",
                        "similarity_score": 0.5018639420520107
                    },
                    {
                        "word1": "Advanced Search and Development Tools",
                        "word2": "数据库运维与迁移",
                        "similarity_score": 0.5098349122986192
                    },
                    {
                        "word1": "Advanced Search and Development Tools",
                        "word2": "AI智能客服与生成式AI应用",
                        "similarity_score": 0.5289642432886793
                    },
                    {
                        "word1": "Advanced Search and Development Tools",
                        "word2": "低代码敏捷开发平台",
                        "similarity_score": 0.5354648825070248
                    },
                    {
                        "word1": "Advanced Search and Development Tools",
                        "word2": "AgentKit and Apps SDK Integration",
                        "similarity_score": 0.5017219614064863
                    },
                    {
                        "word1": "Spring Framework Security",
                        "word2": "现代身份认证与系统安全",
                        "similarity_score": 0.5540253983663468
                    },
                    {
                        "word1": "Spring Framework Security",
                        "word2": "低代码敏捷开发平台",
                        "similarity_score": 0.5044286693176268
                    },
                    {
                        "word1": "Gradle构建与依赖管理",
                        "word2": "现代Web架构与负载均衡技术",
                        "similarity_score": 0.5093990020545592
                    },
                    {
                        "word1": "Gradle构建与依赖管理",
                        "word2": "数据库运维与迁移",
                        "similarity_score": 0.5129134161477903
                    },
                    {
                        "word1": "Gradle构建与依赖管理",
                        "word2": "AI智能客服与生成式AI应用",
                        "similarity_score": 0.5075819609307826
                    },
                    {
                        "word1": "现代身份认证与系统安全",
                        "word2": "现代Web架构与负载均衡技术",
                        "similarity_score": 0.6075198893687034
                    },
                    {
                        "word1": "现代Web架构与负载均衡技术",
                        "word2": "数据库运维与迁移",
                        "similarity_score": 0.5332046745630167
                    },
                    {
                        "word1": "现代Web架构与负载均衡技术",
                        "word2": "低代码敏捷开发平台",
                        "similarity_score": 0.5018311400339965
                    },
                    {
                        "word1": "AI智能客服与生成式AI应用",
                        "word2": "AgentKit and Apps SDK Integration",
                        "similarity_score": 0.5096763648997632
                    }
                ]
            }
        };

        (apiClient.post as any).mockResolvedValue(mockResponse);

        const result = await getKnowledgeGraph();

        expect(result).toHaveProperty('nodes');
        expect(result).toHaveProperty('links');
        expect(Array.isArray(result.nodes)).toBe(true);
        expect(Array.isArray(result.links)).toBe(true);
        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.links.length).toBeGreaterThan(0);
        expect(result.nodes.every(node => node.name && node.type)).toBe(true);
        expect(result.links.every(link => link.source && link.target && typeof link.weight === 'number')).toBe(true);

        expect(apiClient.post).toHaveBeenCalledWith('/knowledge/cluster');
    });

    it('should handle empty data', async () => {
        const mockResponse = {
            data: {
                big_hot_word_wtih_hot_words: {},
                associations: []
            }
        };

        (apiClient.post as any).mockResolvedValue(mockResponse);

        const result = await getKnowledgeGraph();

        expect(result).toEqual({
            nodes: [],
            links: []
        });
    });

    it('should handle API error', async () => {
        (apiClient.post as any).mockRejectedValue(new Error('API Error'));

        await expect(getKnowledgeGraph()).rejects.toThrow('API Error');
    });
});