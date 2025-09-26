import { useState } from 'react'
import Graph from '@/components/Graph'
import data from '@/assets/data.json'
import AudioCard from '@/components/AudioCard'

function Home() {
    const [activeTab, setActiveTab] = useState('Chat')
    const [chat, setChat] = useState('')
    const [voiceType, setVoiceType] = useState('Fish Audio')
    const [energyLevel, setEnergyLevel] = useState('en-Energetic Male')
    const [friendliness, setFriendliness] = useState('en-Friendly Women')
    const [autoSetting, setAutoSetting] = useState('Auto')
    const [started, setStarted] = useState(false)

    const tabs = [
        { name: 'Chat', icon: '💭' },
        { name: 'Link', icon: '🔗' },
        { name: 'Upload File', icon: '📁' },
        { name: 'Long Text', icon: '📄' }
    ]

    const handleCreatePodcast = () => {
        console.log('Creating podcast...', { chat, voiceType, energyLevel, friendliness, autoSetting })
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70 gap-5 pb-30">
            {/* Main Container */}
            <div className={`hero min-h-100 px-20 transition-all duration-500 ${started ? 'w-full' : 'max-w-6xl'}`}>
                <div className={`hero-content flex-col lg:flex-row ${started ? 'w-full p-0 justify-center items-center' : ''}`}>
                    <div className={`${started ? 'w-full max-w-4xl border-0 mx-auto bg-base-300/50' : 'h-96 w-150 border border-neutral/20'} rounded-2xl overflow-hidden transition-all duration-500`}
                        style={started ? { width: 1000, height: 400 } : {}}>
                        <Graph data={data} key={started ? 'started' : 'init'} width={500} height={200} />
                    </div>
                    {!started && (
                        <div>
                            <h1 className="text-5xl font-bold">Build Your Knowledge!</h1>
                            <p className="py-6">
                                Provident cupiditate voluptatum et in. Quaerat fugiat ut assumenda excepturi exercitationem
                                quasi. In deleniti eaque aut repudiandae et a id nisi.
                            </p>
                            <button className="btn btn-primary" onClick={() => setStarted(true)}>Get Started</button>
                        </div>
                    )}
                </div>
            </div>
                <div className="rounded-lg p-5 bg-base-100 shadow">
                    {/* Tab Navigation */}
                    <div role="tablist" className="tabs tabs-box w-full">
                        {tabs.map((tab) => (
                            <a
                                key={tab.name}
                                role="tab"
                                className={`tab flex-1 ${activeTab === tab.name ? ' tab-active' : ''}`}
                                onClick={() => setActiveTab(tab.name)}
                            >
                                <span className={`mr-2`}>{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.name}</span>
                            </a>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="my-12">
                        <div className="relative group">
                            <textarea
                                value={chat}
                                onChange={(e) => setChat(e.target.value)}
                                placeholder="Enter your chat message..."
                                rows={4}
                                className="textarea w-full px-6 py-5 rounded-xl shadow-inner relative"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-base-content/30">
                                {chat.length}/500
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-10">
                        {/* Combined row: selects + Create button + external link */}
                        <div className="flex flex-col min-w-4xl sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex flex-wrap gap-3 items-center">

                            </div>


                            {/* Inline actions: Create button + external link */}
                            <div className="flex items-center gap-4">
                                {/* Create Button */}
                                <button
                                    onClick={handleCreatePodcast}
                                    disabled={!chat.trim()}
                                    className="btn btn-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="flex items-center gap-2 text-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        Struct
                                    </span>
                                </button>

                                <button
                                    onClick={handleCreatePodcast}
                                    disabled={!chat.trim()}
                                    className="btn btn-lg btn-primary font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="flex items-center gap-2 text-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Create Podcast
                                    </span>
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
                <section className="mt-10 text-center max-w-4xl">
                    <h2 className="text-lg font-semibold mb-8">Share your thoughts and ideas with the world.</h2>
                    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:max-w-6xl md:mx-auto relative">
                        {/* Audio Cards */}
                        <AudioCard
                            href="/podcast/vs962a7f-9461-4875-b7c7-2f5aca66126e"
                            title="Hacker News: Exploring Innovative Projects in Technology, Privacy, and Engineering"
                            status="Success"
                            date="2025/6/23"
                            duration="9m"
                        />
                        <AudioCard
                            href="/podcast/vs789e71-b192-4374-93a2-8177f457ba5c"
                            title="Hacker News: From Mechanical Watches to Technological Innovation: Latest Developments and Challenges in Multiple Fields"
                            status="Success"
                            date="2025/6/23"
                            duration="5m"
                        />
                        <AudioCard
                            href="/podcast/vsbed589-6493-4ac2-8217-64d82b1ecafa"
                            title="V2EX Hot List: Lychee Sales, Payment Methods, Operator Policies, and Car Rental Issues"
                            status="Success"
                            date="2025/6/22"
                            duration="5m"
                        />
                    </div>
                </section>
        </div>
    )
}

export default Home
