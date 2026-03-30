import { useState, useEffect, useRef } from 'react';

export default function WhatsApp() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '👋 Karibu! I am your Linda+ Financial Guardian. Please upload your latest payment receipt for verification.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isScanning]);

  const handleSimulateUpload = () => {
    // 1. User sends the "image"
    const newMsg = { id: Date.now(), sender: 'user', isImage: true };
    setMessages(prev => [...prev, newMsg]);
    
    // 2. Bot starts typing/scanning
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setIsScanning(true);
      
      // 3. Bot finishes scanning and replies
      setTimeout(() => {
        setIsScanning(false);
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 1, 
            sender: 'bot', 
            text: '✅ Receipt Processed Successfully!\n\nExtracted Data:\n🧾 Vendor: Naivas Supermarket\n💰 Amount: Ksh 4,500\n🏷️ Category: Groceries\n\n🔒 Match: This matches your M-Pesa transaction ID SAMX892M perfectly.'
          },
          {
            id: Date.now() + 2,
            sender: 'bot',
            text: '📊 Linda+ Insight: You spent 15% less on groceries this week compared to last week. Great job staying within your smart limits! Keep it up. 🚀'
          }
        ]);
      }, 3000); // 3 seconds of "scanning"
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-10 flex justify-center items-center p-4">
      {/* WhatsApp Phone Container */}
      <div className="w-[400px] h-[750px] bg-[#ece5dd] rounded-[40px] border-[12px] border-gray-800 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white p-4 flex items-center gap-3 z-10 shadow-md">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Linda+ Guardian AI</h3>
            <p className="text-xs text-green-200">bot • online</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover space-y-4">
          
          <div className="flex justify-center mb-4">
            <span className="bg-[#e1f3fb] text-gray-600 text-xs py-1 px-3 rounded-lg shadow-sm">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${
                msg.sender === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
              }`}>
                {msg.isImage ? (
                  <div className="relative">
                    <div className="w-48 h-64 bg-slate-200 rounded flex items-center justify-center border border-gray-300">
                       <span className="text-4xl">🧾</span>
                       <p className="absolute bottom-2 text-xs text-gray-500 font-bold bg-white/80 px-2 rounded">supermarket_receipt.jpg</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm whitespace-pre-line">{msg.text}</p>
                )}
                <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {msg.sender === 'user' && <span className="text-blue-500 ml-1">✓✓</span>}
                </span>
              </div>
            </div>
          ))}

          {isScanning && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm border border-cyan-300">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    <span className="text-xl">🧾</span>
                    <div className="absolute inset-0 border-b-2 border-cyan-500 animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-xs text-cyan-600 font-bold animate-pulse">Linda+ Vision OCR extracting data...</p>
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm w-16 flex justify-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f0f0] p-3 flex items-center gap-2 z-10">
          <button className="text-gray-500 text-2xl hover:text-gray-700 transition-colors">
            😊
          </button>
          <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400 border border-gray-300">
            Type a message
          </div>
          <button 
            onClick={handleSimulateUpload}
            disabled={isScanning || isTyping || messages.length > 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
              messages.length > 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#128c7e] hover:bg-[#075e54] active:scale-95'
            }`}
          >
            📸
          </button>
        </div>

      </div>
    </div>
  );
}