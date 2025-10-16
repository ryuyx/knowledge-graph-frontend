import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPodcastDetails, getPodcastAudioUrl, type PodcastDetails } from '@/api/podcast'
import { getKnowledgeItem } from '@/api/graph'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

function Doc() {
  const { id } = useParams()
  const [podcastDetails, setPodcastDetails] = useState<PodcastDetails | null>(null)
  const [knowledgeItem, setKnowledgeItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Extract UUID from id (in case it contains path prefix)
        const cleanId = id.includes('/') ? id.split('/').pop() || id : id;
        
        // 获取播客详情和知识项信息
        const [details, item] = await Promise.all([
          getPodcastDetails(cleanId),
          getKnowledgeItem(cleanId)
        ]);
        
        setPodcastDetails(details);
        setKnowledgeItem(item);
      } catch (err) {
        console.error('Failed to fetch podcast details:', err);
        setError('Failed to load podcast details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100/70 via-accent/10 to-primary/10 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !podcastDetails || !knowledgeItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100/70 via-accent/10 to-primary/10 flex items-center justify-center">
        <div className="text-error">{error || 'Podcast not found'}</div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-base-100/70 via-accent/10 to-primary/10 flex flex-col items-center py-8">
      {/* 顶部卡片区域 */}
  <div className="w-full max-w-3xl bg-base-100 rounded-xl shadow-lg p-6 flex flex-col gap-6 mb-6">
        <div className="flex gap-6 items-center">
          <img src="/vite.svg" alt="Podcast" className="w-32 h-32 object-cover rounded-xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-primary">{knowledgeItem.title || 'Untitled Podcast'}</h2>
            <p className="mb-2 text-base-content line-clamp-2">
              {knowledgeItem.description || knowledgeItem.source_content || 'No description available'}
            </p>
            {/* 音频播放器 */}
            {id && (
              <audio controls className="w-full mt-4">
                <source src={getPodcastAudioUrl(id.includes('/') ? id.split('/').pop() || id : id)} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        </div>
        {/* 分享按钮区 - 固定在卡片底部 */}
        <div className="flex gap-2 justify-end">
          <button className="btn btn-primary">Share</button>
        </div>
      </div>


        {/* 标签 Tab 区域 */}
          {/* 标签 Tab 区域 - 使用 radio 结构 */}
          <div className="w-full flex justify-start max-w-3xl mb-6">
            <div className="tabs tabs-lift w-full">
                {podcastDetails.mind_map && (
                  <>
                    <input type="radio" name="doc_tabs_group" className="tab" aria-label="Outline" />
                    <div className="tab-content border-base-300 bg-base-100 p-6">
                      {/* Mind Map Content - Rendered with Markdown */}
                      <div className="w-full prose prose-slate max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 text-primary" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-6 text-primary" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-2 mt-4" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-lg font-semibold mb-2 mt-3" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-3 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-3 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="text-base-content" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-base-content/80" {...props} />,
                            // @ts-ignore
                            code: ({node, inline, ...props}) => 
                              inline 
                                ? <code className="bg-base-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                : <code className="block bg-base-200 p-4 rounded-lg overflow-x-auto" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-base-200 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                            a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                            table: ({node, ...props}) => <table className="table table-zebra w-full my-4" {...props} />,
                            th: ({node, ...props}) => <th className="bg-base-200" {...props} />,
                            td: ({node, ...props}) => <td {...props} />,
                          }}
                        >
                          {podcastDetails.mind_map}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </>
                )}

                <input type="radio" name="doc_tabs_group" className="tab" aria-label="Script" defaultChecked />
                <div className="tab-content border-base-300 bg-base-100 p-6">
                  {/* 访谈内容区 - 优化布局 */}
                  <div className="w-full flex flex-col gap-4">
                    {podcastDetails.segments.map((segment, index) => {
                      // 根据person名称选择颜色和图标
                      const getPersonStyle = (person: string) => {
                        const lowerPerson = person.toLowerCase();
                        if (lowerPerson.includes('host') || lowerPerson.includes('james') || lowerPerson.includes('主持')) {
                          return {
                            color: 'text-primary',
                            icon: '🧑‍💼'
                          };
                        } else if (lowerPerson.includes('guest') || lowerPerson.includes('emily') || lowerPerson.includes('嘉宾')) {
                          return {
                            color: 'text-pink-600',
                            icon: '🧑‍🎓'
                          };
                        } else {
                          return {
                            color: 'text-secondary',
                            icon: '👤'
                          };
                        }
                      };

                      const style = getPersonStyle(segment.person);

                      return (
                        <div key={index} className="rounded-xl p-4 flex gap-4 items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
                            <span className={`${style.color} font-bold text-lg`}>{style.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <h4 className={`font-semibold ${style.color} text-base`}>{segment.person}</h4>
                              <span className="text-xs text-base-content/60">#{index + 1}</span>
                            </div>
                            <p className="text-base-content leading-relaxed">
                              {segment.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <input type="radio" name="doc_tabs_group" className="tab" aria-label="Source" />
                <div className="tab-content border-base-300 bg-base-100 p-6">
                  {/* 原始内容 */}
                  <article className="max-w-xl mx-auto py-6">
                    <h1 className="text-2xl font-bold mb-4">Source Content</h1>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-base-content/70 whitespace-pre-wrap">
                        {knowledgeItem.source_content || 'No source content available'}
                      </p>
                    </div>
                  </article>
                </div>
            </div>
          </div>
      </div>
  )
}

export default Doc