import { useState, useEffect, useRef } from 'react';

// Securely pull the API key from the Vite environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function WhatsApp() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '👋 Karibu! I am LINDA+, your financial Guardian. Ask me anything about your limits, fraud, or M-Pesa.', audioUrl: null }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    
    if (!input.trim()) return;
    
    if (!OPENAI_API_KEY) {
      alert("API Key is missing! Please check your .env file and restart the Vite server.");
      return;
    }

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setIsTyping(true);

    try {
      // 1. Get Text Response from OpenAI (GPT-4o-mini for speed)
      const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "You are LINDA+, an AI financial guardian in Kenya. Keep responses short (1-2 sentences max). If the user speaks Swahili, reply in fluent Kenyan Swahili. If they speak English, reply in English. Help users understand their finances, fraud protection, or how to use the app." 
            },
            { role: "user", content: userText }
          ]
        })
      });
      
      const chatData = await chatRes.json();
      const botReply = chatData.choices[0].message.content;

      // 2. Generate High-Quality Audio (OpenAI TTS)
      const audioRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "shimmer", // 'shimmer' is excellent for clear, empathetic responses
          input: botReply
        })
      });

      const audioBlob = await audioRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio automatically for accessibility
      const audio = new Audio(audioUrl);
      audio.play();

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply, audioUrl }]);
    } catch (error) {
      console.error("OpenAI Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Samahani, mtandao wangu una shida. (Sorry, I am offline right now.)" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = (url) => {
    if (url) new Audio(url).play();
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-10 flex justify-center items-center p-4">
      <div className="w-[400px] h-[750px] bg-[#ece5dd] rounded-[40px] border-[12px] border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#075e54] text-white p-4 flex items-center gap-3 z-10 shadow-md">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-inner">🛡️</div>
          <div>
            <h3 className="font-bold text-lg leading-tight">LINDA+ AI Assistant</h3>
            <p className="text-xs text-green-200">Voice-enabled • Online</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 shadow-sm relative ${msg.sender === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none border border-gray-100'}`}>
                <p className="text-slate-800 text-[15px] whitespace-pre-line leading-snug">{msg.text}</p>
                
                {/* Play Button for Voice Accessibility */}
                {msg.audioUrl && (
                  <button 
                    onClick={() => playAudio(msg.audioUrl)} 
                    className="mt-3 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-green-100 transition-colors border border-green-200 shadow-sm"
                  >
                    🔊 Play Audio
                  </button>
                )}
                <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {msg.sender === 'user' && <span className="text-blue-500 ml-1">✓✓</span>}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm w-16 flex justify-center gap-1.5 border border-gray-100">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="bg-[#f0f0f0] p-3 flex items-center gap-2 z-10 border-t border-gray-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or ask a question..."
            className="flex-1 bg-white rounded-full px-5 py-3 text-[15px] text-slate-800 border border-gray-300 focus:outline-none focus:border-green-500 shadow-inner"
          />
          <button type="submit" className="w-12 h-12 rounded-full bg-[#128c7e] flex items-center justify-center text-white hover:bg-[#075e54] active:scale-95 shadow-md transition-transform">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}