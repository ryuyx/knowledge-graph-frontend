import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('Topic')
  const [topic, setTopic] = useState('')
  const [voiceType, setVoiceType] = useState('Fish Audio')
  const [energyLevel, setEnergyLevel] = useState('en-Energetic Male')
  const [friendliness, setFriendliness] = useState('en-Friendly Women')
  const [autoSetting, setAutoSetting] = useState('Auto')

  const tabs = [
    { name: 'Topic', icon: '🧠' },
    { name: 'Link', icon: '🔗'},
    { name: 'Upload File', icon: '📁' },
    { name: 'Long Text', icon: '📄' },
    { name: 'Front Page', icon: '🌐' }
  ]

  const handleCreatePodcast = () => {
    console.log('Creating podcast...', { topic, voiceType, energyLevel, friendliness, autoSetting })
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      {/* Main Container */}
      <div className="rounded-lg p-5 bg-base-100">
        {/* Tab Navigation */}
        <div role="tablist" className="tabs tabs-boxed">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              role="tab"
              className={`tab ${activeTab === tab.name
                ? ' tab-active'
                : ''
                }`}
              onClick={() => setActiveTab(tab.name)}
            >
              <span className={`mr-2`}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
            </a>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-purple-50/40 to-pink-50/40 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter the topic you're interested in..."
              rows={4}
              className="w-full px-6 py-5 text-base leading-relaxed bg-white/90 backdrop-blur-lg border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800 placeholder-gray-500 resize-none transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-400 z-20 bg-white/80 px-2 py-1 rounded-md">
              {topic.length}/500
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
                <label className="sr-only">Voice Engine</label>
                <select
                  aria-label="Voice Engine"
                  className="select select-sm select-bordered h-10 w-44 bg-white/90 border-gray-300/50 text-sm"
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
                <label className="sr-only">Male Voice</label>
                <select
                  aria-label="Male Voice"
                  className="select select-sm select-bordered h-10 w-44 bg-white/90 border-gray-300/50 text-sm"
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
                <label className="sr-only">Female Voice</label>
                <select
                  aria-label="Female Voice"
                  className="select select-sm select-bordered h-10 w-44 bg-white/90 border-gray-300/50 text-sm"
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
                <label className="sr-only">Mode</label>
                <select
                  aria-label="Mode"
                  className="select select-sm select-bordered h-10 w-36 bg-white/90 border-gray-300/50 text-sm"
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
                disabled={!topic.trim()}
                className="btn btn-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 border-0 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="flex items-center gap-2 relative z-10 text-sm">
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

export default App
