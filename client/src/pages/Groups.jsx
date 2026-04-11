import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { socket } from '../utils/socket';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Groups() {
  const { user, token } = useAuth();
  const [availableGroups, setAvailableGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const fileInputRef = useRef(null);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    socket.connect();
    
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socket.on('group_notification', (data) => {
       const { groupId } = data;
       // Only increment if it's NOT the currently selected group
       setUnreadCounts(prev => {
         // If we are already looking at this group, don't increment
         if (window.activeGroupId === groupId) return prev;
         return {
           ...prev,
           [groupId]: (prev[groupId] || 0) + 1
         };
       });
    });

    return () => {
      socket.off('receive_message');
      socket.off('group_notification');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      window.activeGroupId = selectedGroup._id;
      fetchMessages(selectedGroup._id);
      socket.emit('join_group', selectedGroup._id);
      
      // Mark as read
      socket.emit('mark_group_read', { userId: user.id, groupId: selectedGroup._id });
      setUnreadCounts(prev => ({ ...prev, [selectedGroup._id]: 0 }));
    }
    return () => {
      window.activeGroupId = null;
    };
  }, [selectedGroup]);

  useEffect(() => {
    // Handle switching groups when a notification is clicked
    const handlePendingSelect = () => {
      const pendingId = localStorage.getItem('pendingGroupSelect');
      if (pendingId) {
        const group = joinedGroups.find(g => g._id === pendingId);
        if (group) {
          setSelectedGroup(group);
          localStorage.removeItem('pendingGroupSelect');
        }
      }
    };

    window.addEventListener('pendingGroupSelectChange', handlePendingSelect);
    // Also check on mount in case we navigated from another page
    handlePendingSelect();

    return () => {
      window.removeEventListener('pendingGroupSelectChange', handlePendingSelect);
    };
  }, [joinedGroups]);

  const fetchGroups = async () => {
    try {
      const [allRes, joinedRes] = await Promise.all([
        axios.get(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/groups/joined`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAvailableGroups(allRes.data);
      setJoinedGroups(joinedRes.data);
      
      // Initialize unread counts
      const counts = {};
      joinedRes.data.forEach(g => {
        counts[g._id] = g.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching groups', err);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const res = await axios.get(`${API_URL}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    // Group name validation: subjectname_number(subject code)
    const nameRegex = /^[a-zA-Z0-9\s]+_[0-9]+\([a-zA-Z0-9]+\)$/;
    if (!nameRegex.test(newGroupName)) {
      toast.error('Invalid format! Use: SubjectName_Number(SubjectCode)', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/groups`, 
        { name: newGroupName, description: newGroupDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Community Created Successfully!');
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreating(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post(`${API_URL}/groups/${groupId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Joined Community!');
      fetchGroups();
    } catch (err) {
      toast.error('Error joining group');
    }
  };

  const performLeave = async (groupToLeave) => {
    try {
      await axios.post(`${API_URL}/groups/${groupToLeave._id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Successfully left "${groupToLeave.name}"`, { icon: '👋' });
      if (selectedGroup?._id === groupToLeave._id) {
        setSelectedGroup(null);
      }
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error leaving group');
    }
  };

  const handleLeaveGroup = async (groupToLeave) => {
    const isOwner = groupToLeave.owner._id === user.id || groupToLeave.owner === user.id;

    toast((t) => (
      <div className="p-1">
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-0.5">
            {isOwner ? '⚠️' : '🚪'}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">
              {isOwner ? 'Owner Access Warning' : 'Leave Group?'}
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {isOwner 
                ? "You are the owner. If you leave, you lose access until you join back, but you will still be the owner. Proceed?"
                : `Are you sure you want to leave "${groupToLeave.name}"?`}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  performLeave(groupToLeave);
                }}
                className={`px-3 py-1 text-[10px] font-bold text-white rounded-md transition-all ${isOwner ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
      style: {
        minWidth: '320px',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !replyTo) return;

    const messageData = {
      group: selectedGroup._id,
      sender: user.id,
      content: newMessage,
      replyTo: replyTo?._id
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });

      const messageData = {
        group: selectedGroup._id,
        sender: user.id,
        content: '',
        fileUrl: res.data.fileUrl,
        fileType: res.data.fileType
      };

      socket.emit('send_message', messageData);
      toast.success('File shared successfully');
    } catch (err) {
      console.error('Error uploading file', err);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 overflow-hidden font-sans">
      {/* Top Section: Available Groups */}
      <section className="p-4 bg-white border-b shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Explore Learning Communities</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            + Create New Group
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {availableGroups.filter(g => !joinedGroups.some(jg => jg._id === g._id)).map(group => (
            <div key={group._id} className="min-w-[280px] bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-indigo-700">{group.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{group.description}</p>
              </div>
              <button 
                onClick={() => handleJoinGroup(group._id)}
                className="mt-3 w-full bg-indigo-50 text-indigo-700 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition"
              >
                Join Community
              </button>
            </div>
          ))}
          {availableGroups.filter(g => !joinedGroups.some(jg => jg._id === g._id)).length === 0 && (
            <p className="text-gray-500 text-sm italic">You've explored all available groups!</p>
          )}
        </div>
      </section>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Joined Groups */}
        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b font-semibold bg-gray-50 text-gray-700">My Learning Spaces</div>
          <div className="flex-1 overflow-y-auto">
            {joinedGroups.map(group => (
              <div 
                key={group._id} 
                onClick={() => setSelectedGroup(group)}
                className={`p-4 cursor-pointer hover:bg-indigo-50 transition border-b flex items-center gap-3 ${selectedGroup?._id === group._id ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 truncate">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-800 truncate">{group.name}</div>
                    {unreadCounts[group._id] > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-pulse">
                        {unreadCounts[group._id]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{group.description}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-slate-100 relative">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedGroup.name}</h2>
                  <p className="text-xs text-gray-500 italic">{selectedGroup.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:text-indigo-600"><i className="fas fa-search"></i></button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender._id === user.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-600">{msg.sender.username}</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative group ${msg.sender._id === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                      {msg.replyTo && (
                        <div className={`mb-2 p-2 rounded text-xs border-l-4 ${msg.sender._id === user.id ? 'bg-indigo-700 border-white text-indigo-100' : 'bg-gray-100 border-indigo-400 text-gray-600'}`}>
                           <p className="font-bold">@{msg.replyTo.sender?.username}</p>
                           <p className="truncate">{msg.replyTo.content}</p>
                        </div>
                      )}
                      
                      {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                      {msg.fileUrl && (
                        <div className="mt-2">
                          {msg.fileType?.startsWith('image/') ? (
                            <img src={msg.fileUrl} alt="uploaded" className="max-w-full rounded-lg shadow-sm" style={{ maxHeight: '250px' }} />
                          ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-black/10 rounded text-xs flex items-center gap-2 underline">
                              📄 {msg.fileUrl.split('/').pop()}
                            </a>
                          )}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setReplyTo(msg)}
                        className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition"
                      >
                         ↩️
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Leave Community Button - Bottom Center */}
              <div className="flex justify-center pb-2">
                <button 
                  onClick={() => handleLeaveGroup(selectedGroup)}
                  className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-1 rounded-full transition-all flex items-center gap-1.5 border border-red-100 bg-white/80 shadow-sm"
                >
                  <i className="fas fa-sign-out-alt text-[10px]"></i> Leave this Community
                </button>
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t">
                {replyTo && (
                  <div className="mb-2 p-2 bg-indigo-50 rounded-lg flex justify-between items-center border-l-4 border-indigo-400">
                    <div className="text-xs truncate">
                      Replying to <span className="font-bold">@{replyTo.sender.username}</span>: "{replyTo.content}"
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                )}
                 <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button" 
                    className="text-gray-500 hover:text-indigo-600"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? '⌛' : '📎'}
                  </button>
                  <input 
                    type="text" 
                    placeholder="Type a message or share resources..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition">
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text- indigo-400 text-3xl">
                💬
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Group to Start Collaborating</h3>
              <p className="max-w-md text-sm">Join a learning community to share study materials, participate in discussion forums, and develop your skills with peers.</p>
            </div>
          )}
        </main>
      </div>

      {/* Create Group Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
              <h2 className="text-2xl font-bold">Launch New Community</h2>
              <p className="text-indigo-100 text-sm mt-1">Start a space for collaborative learning</p>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                   Group name (Required format: <span className="text-indigo-600 font-mono">Subject_Number(Code)</span>)
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    🏷️
                  </span>
                  <input 
                    type="text" 
                    required
                    className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Mathematics_101(CS101)"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 italic">
                  Example: DataStructures_2(IT2030) or Biology_101(BIO1)
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <div className="relative group">
                  <span className="absolute left-3 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    📝
                  </span>
                  <textarea 
                    required
                    rows="3"
                    className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Briefly describe what this community is about..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="flex-1 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all border-2 border-transparent hover:border-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-200"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
