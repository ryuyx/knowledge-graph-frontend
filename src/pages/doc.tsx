import { useParams } from 'react-router-dom'

function Doc() {
  const { id } = useParams()
  return (
  <div className="min-h-screen bg-gradient-to-br from-base-100/70 via-accent/10 to-primary/10 flex flex-col items-center py-8">
      {/* 顶部卡片区域 */}
  <div className="w-full max-w-3xl bg-base-100 rounded-xl shadow-lg p-6 flex flex-col gap-6 mb-6">
        <div className="flex gap-6 items-center">
          <img src="/vite.svg" alt="Tesla" className="w-32 h-32 object-cover rounded-xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-primary">(Example) Elon Musk on the Future- Sustainability, Innovation, and...</h2>
            <p className="mb-2 text-base-content">In this insightful interview at Tesla's Texas Gigafactory, Elon Musk discusses the urgent need for a transition to sustainable energy, the electric vehicle revolution, and advancements in...</p>
            <button className="btn btn-link text-primary">More <span className="ml-1">&rarr;</span></button>
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
                <input type="radio" name="doc_tabs_group" className="tab" aria-label="Outline" />
                <div className="tab-content border-base-300 bg-base-100 p-6">
                  {/* 访谈内容大纲 - 优化样式 */}
                  <div className="w-full flex flex-col gap-4">
                    {/* Outline Card 1 */}
                    <div className="rounded-xl p-4 flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-bold">📋</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2">开场与主题介绍</h4>
                        <ul className="list-disc ml-6 space-y-1 text-base-content/70">
                          <li>主持人 James 欢迎观众，介绍访谈主题：清洁能源、电动汽车、太空探索</li>
                        </ul>
                      </div>
                    </div>
                    {/* Outline Card 2 */}
                    <div className="rounded-xl p-4 flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-bold">🌱</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2">清洁能源与可持续发展</h4>
                        <ul className="list-disc ml-6 space-y-1 text-base-content/70">
                          <li>Elon Musk 强调全球能源现状，99% 仍依赖化石能源</li>
                          <li>Tesla 的使命：推动世界向可持续能源转型</li>
                          <li>太阳能、风能与电池储能的协同作用</li>
                        </ul>
                      </div>
                    </div>
                    {/* Outline Card 3 */}
                    <div className="rounded-xl p-4 flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-bold">🔧</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2">转型路径与挑战</h4>
                        <ul className="list-disc ml-6 space-y-1 text-base-content/70">
                          <li>Emily 提问：如何实现能源转型？</li>
                          <li>James 解释：需要基础设施和投资，强调规模经济</li>
                          <li>Gigafactory 的作用：大规模生产降低成本</li>
                        </ul>
                      </div>
                    </div>
                    {/* Outline Card 4 */}
                    <div className="rounded-xl p-4 flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-bold">🚗</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2">电动汽车的普及与优势</h4>
                        <ul className="list-disc ml-6 space-y-1 text-base-content/70">
                          <li>Emily 追问：电动汽车与传统汽车的区别</li>
                          <li>James 说明：批量生产带来的成本优势</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <input type="radio" name="doc_tabs_group" className="tab" aria-label="Script" defaultChecked />
                <div className="tab-content border-base-300 bg-base-100 p-6">
                  {/* 访谈内容区 - 优化布局 */}
                  <div className="w-full flex flex-col gap-4">
                    {/* James 第一段 */}
                    <div className="rounded-xl p-4 flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">🧑‍💼</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4 className="font-semibold text-primary text-base">James</h4>
                          <span className="text-xs text-base-content/60">#1</span>
                        </div>
                        <p className="text-base-content leading-relaxed">
                          Welcome back, everyone! Today, we’re diving into some truly electrifying topics, and I mean that literally! We’re going to explore the future of clean energy, electric vehicles, and even the cosmos! So, buckle up as we take a ride through the mind of one of the most innovative thinkers of our time—Elon Musk. You know, he recently had an interview at Tesla’s Texas Gigafactory, and wow, did he cover a lot of ground! First off, let’s talk about clean energy and sustainability. Musk pointed out that a staggering 99% of the energy we use still comes from fossil fuels. Can you believe that? It’s like we’re living in a time capsule! He emphasized that Tesla’s mission is to accelerate the world’s transition to sustainable energy. Think about it—solar power, wind energy, and battery storage are the trifecta we need to make this happen. It’s like a superhero team for our planet!
                        </p>
                      </div>
                    </div>
                    {/* Emily 第一段 */}
                    <div className="rounded-xl p-4 flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
                        <span className="text-pink-600 font-bold text-lg">🧑‍🎓</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4 className="font-semibold text-pink-600 text-base">Emily</h4>
                          <span className="text-xs text-base-content/60">#2</span>
                        </div>
                        <p className="text-base-content leading-relaxed">
                          Umm, wow, that’s a huge percentage! So, like, what’s the plan? Are we just going to wake up one day and everything will be solar-powered? I mean, that sounds amazing, but… hmmm, how do we even get there?
                        </p>
                      </div>
                    </div>
                    {/* James 第二段 */}
                    <div className="rounded-xl p-4 flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">🧑‍💼</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4 className="font-semibold text-primary text-base">James</h4>
                          <span className="text-xs text-base-content/60">#3</span>
                        </div>
                        <p className="text-base-content leading-relaxed">
                          Great question! It’s not going to happen overnight, but Musk believes that with the right infrastructure and investment, we can make significant strides. For instance, he talked about the importance of economies of scale. The more we produce electric vehicles, the cheaper they become, which is why building massive production facilities like the Texas Gigafactory is crucial. It’s like baking a cake—if you only make one, it’s expensive, but if you make a hundred, the cost per cake goes down!
                        </p>
                      </div>
                    </div>
                    {/* Emily 第二段 */}
                    <div className="rounded-xl p-4 flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
                        <span className="text-pink-600 font-bold text-lg">🧑‍🎓</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4 className="font-semibold text-pink-600 text-base">Emily</h4>
                          <span className="text-xs text-base-content/60">#4</span>
                        </div>
                        <p className="text-base-content leading-relaxed">
                          Oh, I get that! So, it’s like when you buy in bulk at Costco? You save money on, like, everything! But, umm, what about the electric vehicles themselves? Are they really that different from regular cars?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <input type="radio" name="doc_tabs_group" className="tab" aria-label="Content" />
                <div className="tab-content border-base-300 bg-base-100 p-6">
                  {/* 原始文章内容 - Elon Musk 专题文章 */}
                  <article className="max-w-xl mx-auto py-12">
                    <h1 className="text-3xl font-bold text-center mb-4">
                      Elon Musk on the Future: Sustainability, Innovation, and Electric Vehicles
                    </h1>
                    <h2 className="text-lg font-medium text-left mb-6">
                      专访特斯拉德州超级工厂：清洁能源与电动汽车的未来
                    </h2>
                    <p className="text-base text-left mb-6">
                      在特斯拉德州超级工厂的一场专访中，Elon Musk 深入探讨了清洁能源、电动汽车以及人类未来的可持续发展。他指出，当前全球约 99% 的能源仍依赖化石燃料，这一现状亟需改变。特斯拉的使命正是推动世界向可持续能源转型，通过太阳能、风能与电池储能的协同作用，为人类创造更清洁的未来。
                    </p>
                    <p className="text-base text-left mb-6">
                      Musk 强调，能源转型并非一蹴而就，需要基础设施的完善和大量投资。规模经济在其中发挥着关键作用——随着电动汽车产量的提升，成本将大幅下降。德州超级工厂等大型生产基地的建设，正是为了实现这一目标。
                    </p>
                    <p className="text-base text-left mb-6">
                      电动汽车的普及是实现可持续发展的重要一步。与传统汽车相比，电动汽车不仅能显著降低碳排放，还能通过批量生产进一步降低制造成本。Musk 认为，未来随着技术进步和市场扩展，电动汽车将成为主流交通工具，助力全球绿色转型。
                    </p>
                    <ul className="list-disc text-base text-left space-y-2 pl-5">
                      <li>开场与主题介绍：清洁能源、电动汽车、太空探索</li>
                      <li>清洁能源与可持续发展：全球能源现状与特斯拉使命</li>
                      <li>转型路径与挑战：基础设施、投资与规模经济</li>
                      <li>电动汽车的普及与优势：技术进步与成本优势</li>
                    </ul>
                  </article>
                </div>
            </div>
          </div>
      </div>
  )
}

export default Doc