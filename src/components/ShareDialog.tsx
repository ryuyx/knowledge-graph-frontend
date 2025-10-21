import React, { forwardRef, useState } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface ShareDialogProps {
  onShare: (userIds: string[], options: { generate_audio?: boolean; add_intro?: boolean; send_card?: boolean }) => void;
}

// Mock user data
const MOCK_USERS: User[] = [
  {
    id: 'C7C68DB3-611F-477B-947E-95F8A2797359',
    name: 'Liu Yuxuan',
    avatar: '👩‍💼'
  },
  {
    id: 'D453048D-66BE-4D20-BE16-D686ED431F1A', 
    name: 'Zhang Tiande',
    avatar: '👨‍💻'
  }
];

const ShareDialog = forwardRef<HTMLDialogElement, ShareDialogProps>(({ onShare }, ref) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [addIntro, setAddIntro] = useState(false);
  const [sendCard, setSendCard] = useState(true);

  const handleBgClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      (ref as any)?.current?.close?.();
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    
    onShare(selectedUserIds, {
      generate_audio: generateAudio,
      add_intro: addIntro,
      send_card: sendCard
    });
    
    // Reset state and close dialog
    setSelectedUserIds([]);
    setGenerateAudio(false);
    setAddIntro(false);
    setSendCard(true);
    (ref as any)?.current?.close?.();
  };

  const handleCancel = () => {
    // Reset state
    setSelectedUserIds([]);
    setGenerateAudio(false);
    setAddIntro(false);
    setSendCard(true);
    (ref as any)?.current?.close?.();
  };

  return (
    <dialog id="share_modal" className="modal" ref={ref as any} onClick={handleBgClick}>
      <div className="modal-box w-96 max-w-full">
        <form method="dialog">
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleCancel}
          >
            ✕
          </button>
        </form>
        
        <h3 className="font-bold text-lg mb-4">Share with</h3>
        
        {/* User selection area */}
        <div className="space-y-3 mb-6">
          {MOCK_USERS.map((user) => (
            <div 
              key={user.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedUserIds.includes(user.id) 
                  ? 'border-primary bg-primary/10' 
                  : 'border-base-300 hover:border-primary/50 hover:bg-base-100'
              }`}
              onClick={() => handleUserToggle(user.id)}
            >
              <div className="avatar">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 border border-base-300 rounded-full w-12 h-12 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-base-content/60">ID: {user.id}</div>
              </div>
              {selectedUserIds.includes(user.id) && (
                <div className="text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Share options */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-sm text-base-content/80">Options</h4>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary checkbox-sm"
              checked={generateAudio}
              onChange={(e) => setGenerateAudio(e.target.checked)}
            />
            <span className="text-sm">Podcast audio file</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary checkbox-sm"
              checked={addIntro}
              onChange={(e) => setAddIntro(e.target.checked)}
            />
            <span className="text-sm">Add introduction content</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary checkbox-sm"
              checked={sendCard}
              onChange={(e) => setSendCard(e.target.checked)}
            />
            <span className="text-sm">Send card notification</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button 
            className="btn btn-ghost"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleShare}
            disabled={selectedUserIds.length === 0}
          >
            Share ({selectedUserIds.length})
          </button>
        </div>
      </div>
    </dialog>
  );
});

ShareDialog.displayName = 'ShareDialog';

export default ShareDialog;