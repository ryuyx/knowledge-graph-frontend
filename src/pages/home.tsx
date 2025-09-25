import { useState } from 'react'
import Graph from '@/components/Graph'
import data from '@/assets/data.json'

function Home() {
    const [activeTab, setActiveTab] = useState('Chat')
    const [chat, setChat] = useState('')
    const [voiceType, setVoiceType] = useState('Fish Audio')
    const [energyLevel, setEnergyLevel] = useState('en-Energetic Male')
    const [friendliness, setFriendliness] = useState('en-Friendly Women')
    const [autoSetting, setAutoSetting] = useState('Auto')

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
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70 gap-5">
            {/* Main Container */}
            <div className="hero max-w-6xl min-h-100 px-20">
                <div className="hero-content flex-col lg:flex-row">
                    <div className="h-96 w-150 border border-neutral/20 rounded-2xl overflow-hidden">
                        <Graph data={data} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold">Build Your Graph!</h1>
                        <p className="py-6">
                            Provident cupiditate voluptatum et in. Quaerat fugiat ut assumenda excepturi exercitationem
                            quasi. In deleniti eaque aut repudiandae et a id nisi.
                        </p>
                        <button className="btn btn-primary">Get Started</button>
                    </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Voice Engine */}
                            <div className="flex items-center gap-2">
                                <select
                                    aria-label="Voice Engine"
                                    className="select h-10 w-44"
                                    value={voiceType}
                                    onChange={(e) => setVoiceType(e.target.value)}
                                >
                                    <option value="Fish Audio">🐟 Fish Audio</option>
                                    <option value="OpenAI">🤖 OpenAI</option>
                                    <option value="ElevenLabs">🔬 ElevenLabs</option>
                                </select>
                            </div>

                            {/* Male Voice */}
                            <div className="flex items-center gap-2">
                                <select
                                    aria-label="Male Voice"
                                    className="select h-10 w-44"
                                    value={energyLevel}
                                    onChange={(e) => setEnergyLevel(e.target.value)}
                                >
                                    <option value="en-Energetic Male">⚡ Energetic</option>
                                    <option value="en-Calm Male">😌 Calm</option>
                                    <option value="en-Professional Male">👔 Professional</option>
                                </select>
                            </div>

                            {/* Female Voice */}
                            <div className="flex items-center gap-2">
                                <select
                                    aria-label="Female Voice"
                                    className="select h-10 w-44"
                                    value={friendliness}
                                    onChange={(e) => setFriendliness(e.target.value)}
                                >
                                    <option value="en-Friendly Women">😊 Friendly</option>
                                    <option value="en-Professional Women">💼 Professional</option>
                                    <option value="en-Warm Women">🤗 Warm</option>
                                </select>
                            </div>

                            {/* Mode */}
                            <div className="flex items-center gap-2">
                                <select
                                    aria-label="Mode"
                                    className="select h-10 w-36"
                                    value={autoSetting}
                                    onChange={(e) => setAutoSetting(e.target.value)}
                                >
                                    <option value="Auto">🔄 Auto</option>
                                    <option value="Manual">✋ Manual</option>
                                </select>
                            </div>
                        </div>

                        {/* Inline actions: Create button + external link */}
                        <div className="flex items-center gap-4">
                            {/* Create Button */}
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
        </div>
    )
}

export default Home
