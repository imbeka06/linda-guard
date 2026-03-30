import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';
import WhatsApp from './WhatsApp'; // NEW IMPORT

function App() {
  const [mode, setMode] = useState('ussd'); // 'ussd', 'dashboard', or 'whatsapp'
  const [step, setStep] = useState('dial'); 
  const [input, setInput] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General'); 
  const [lang, setLang] = useState('en'); 
  const [riskData, setRiskData] = useState(null); 

  // We use a ref to always get the freshest language state without causing render loops
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Robust Bilingual/Multilingual Voice Engine
  const speakMessage = (textEn, textLocal = "", isAlert = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear stuck audio
      
      setTimeout(() => {
        const msg = new SpeechSynthesisUtterance();
        const currentLang = langRef.current;
        
        // If English is selected
        if (currentLang === 'en') {
            msg.text = textEn;
            msg.lang = 'en-GB';
        } 
        // If any local language is selected (using Swahili as the hackathon fallback audio)
        else {
            msg.text = textLocal || textEn; // Fallback to English if no local text provided
            msg.lang = 'sw-KE'; 
        }

        if (isAlert) {
          msg.rate = 0.85;
          msg.pitch = 0.8;
        } else {
          msg.rate = 1.0;
          msg.pitch = 1.0;
        }
        
        window.speechSynthesis.speak(msg);
      }, 50); // Tiny delay prevents browser voice engine crashes
    }
  };

  useEffect(() => {
    speakMessage(
        "Welcome to Linda Plus. Dial star three three four hash to start.",
        "Karibu Linda Plus. Piga nyota tatu tatu nne reli kuanza."
    );
    
    const socket = new WebSocket('ws://127.0.0.1:8001/ws/mpesa');
    
    socket.onopen = () => console.log('✅ WebSocket connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'completed') {
        setStep('success');
        speakMessage(
            "Transaction successful. Your money has been sent. Thank you.",
            "Muamala umekamilika. Pesa zako zimetumwa salama. Asante."
        );
        setTimeout(() => resetSimulator(), 5000);
      } else if (data.status === 'failed') {
        speakMessage("Transaction failed. " + data.message, "Muamala umefeli.");
        alert("❌ Transaction failed: " + data.message);
        resetSimulator();
      }
    };
    return () => socket.close();
  }, []);

  const handleNext = async () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu'); setInput('');
      speakMessage(
          "M-Pesa Linda Plus menu. Press 1 to Send Money, 2 to Withdraw, 3 to Buy Airtime.",
          "Menyu ya M-Pesa Linda Plus. Bonyeza moja kutuma pesa, mbili kutoa, tatu kununua salio."
      );
    } else if (step === 'dial') {
      alert("Try dialing *334#"); setInput('');
    } else if (step === 'menu' && input === '1') {
      setStep('category'); setInput('');
      speakMessage(
          "Select Payment Category. 1 for General. 2 for Health. 3 for Betting.",
          "Chagua Aina ya Malipo. Moja kwa Kawaida. Mbili kwa Afya. Tatu kwa Kamari."
      );
    } else if (step === 'category') {
      const cats = { '1': 'general', '2': 'health', '3': 'betting' };
      setCategory(cats[input] || 'general');
      setStep('number'); setInput('');
      speakMessage(
          "Please enter the phone number you want to send money to.",
          "Tafadhali weka nambari ya simu unayotaka kutuma pesa."
      );
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input); setStep('amount'); setInput('');
      speakMessage("Enter the amount to send.", "Weka kiasi cha kutuma.");
    } else if (step === 'amount' && input.length > 0) {
      setAmount(input); setInput('');
      checkFraudRisk(input);
    } else if (step === 'warning') {
      if (input === '1') {
        speakMessage("Transaction blocked. You are safe.", "Muamala umezuiwa. Uko salama.");
        resetSimulator();
      } else if (input === '2') {
        triggerMpesaPush();
      }
    }
  };

  const checkFraudRisk = async (finalAmount) => {
    setStep('processing');
    try {
      const response = await fetch('http://127.0.0.1:8001/api/fraud/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: targetNumber,
          amount: parseInt(finalAmount),
          category: category
        })
      });
      const data = await response.json();
      setRiskData(data); 

      if (data.action === 'block') {
        speakMessage(
            "Danger! This transaction is blocked due to extreme fraud risk.",
            "Hatari! Muamala huu umezuiwa kwa sababu ya hatari kubwa ya utapeli.",
            true
        );
        setStep('blocked');
      } else if (data.action === 'alert') {
        speakMessage(
            `Linda Plus Alert. Warning! The recipient has a high fraud risk. Press 1 to cancel, or 2 to proceed.`,
            `Ilani ya Linda Plus. Onyo! Mpokeaji ana hatari kubwa ya utapeli. Bonyeza moja kufuta, au mbili kuendelea.`,
            true
        );
        setStep('warning');
      } else {
        triggerMpesaPush();
      }
    } catch (error) {
      triggerMpesaPush(); 
    }
  };

  const triggerMpesaPush = async () => {
    setStep('processing');
    try {
      await fetch('http://127.0.0.1:8001/api/mpesa/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: targetNumber, amount: parseInt(amount) || 1, category: category })
      });
    } catch (error) {
      alert("🔌 Connection failed."); resetSimulator();
    }
  };

  const resetSimulator = () => {
    window.speechSynthesis.cancel();
    setStep('dial'); setInput(''); setTargetNumber(''); setAmount(''); setCategory('General'); setRiskData(null);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-cyan-500/50 z-50 p-4 flex justify-between items-center px-8">
        
        {/* ENHANCED NAVIGATION TABS */}
        <div className="flex gap-2 lg:gap-4">
            <button onClick={() => setMode('ussd')} className={`px-4 lg:px-6 py-2 rounded-lg font-bold transition-all text-sm lg:text-base ${mode === 'ussd' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            📱 USSD Simulator
            </button>
            <button onClick={() => setMode('dashboard')} className={`px-4 lg:px-6 py-2 rounded-lg font-bold transition-all text-sm lg:text-base ${mode === 'dashboard' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            📊 Fraud Dashboard
            </button>
            <button onClick={() => setMode('whatsapp')} className={`px-4 lg:px-6 py-2 rounded-lg font-bold transition-all text-sm lg:text-base ${mode === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            💬 WhatsApp AI
            </button>
        </div>
        
        {/* ENHANCED: Language Dropdown as per SRS */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm hidden sm:inline">🌐 Language:</span>
          <select 
            value={lang} 
            onChange={(e) => {
                setLang(e.target.value);
                speakMessage("Language changed.", "Lugha imebadilishwa.");
            }}
            className="bg-slate-700 text-white border border-cyan-500/50 rounded p-1 text-sm outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
            <option value="ki">Kikuyu (Hybrid)</option>
            <option value="lu">Luo (Hybrid)</option>
            <option value="ka">Kamba (Hybrid)</option>
          </select>
        </div>
      </div>

      {/* RENDER THE SELECTED VIEW */}
      {mode === 'dashboard' && <Dashboard />}
      {mode === 'whatsapp' && <WhatsApp />}

      {mode === 'ussd' && (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 pt-24">
      {/* Phone Container */}
      <div className="w-[350px] h-[700px] bg-black rounded-[50px] border-[12px] border-gray-800 shadow-2xl overflow-hidden relative flex flex-col">
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10"><div className="w-32 h-6 bg-gray-800 rounded-b-3xl"></div></div>

        {/* Screen Area */}
        <div className="flex-1 mt-10 mb-4 mx-4 bg-[#111] rounded-lg p-4 border border-gray-700 font-mono text-sm relative overflow-y-auto">
          <div className="text-gray-400 text-xs flex justify-between mb-4 border-b border-gray-700 pb-2">
            <span>SAFARICOM</span><span className="text-blue-400">LINDA+ ACTIVE 🛡️</span>
          </div>

          <div className="text-white space-y-4">
            {step === 'dial' && (<div><p className="text-gray-400 mb-2">Phone</p><p className="text-3xl text-center mt-10 text-green-500">{input || '...'}</p></div>)}
            {step === 'menu' && (<div><p>M-PESA LINDA+</p><ol className="list-decimal pl-4 mt-2 space-y-2 text-gray-300"><li>Send Money</li><li>Withdraw Cash</li><li>Buy Airtime</li></ol><p className="mt-6 text-green-500 font-bold animate-pulse">Reply: {input}</p></div>)}
            {step === 'category' && (<div><p className="text-cyan-400 font-bold mb-2">Smart Spending</p><p>Select Category:</p><ol className="list-decimal pl-4 mt-2 space-y-2 text-gray-300"><li>General</li><li>Health & Bills</li><li className="text-orange-400">Betting (Restricted)</li></ol><p className="mt-6 text-green-500 font-bold animate-pulse">Reply: {input}</p></div>)}
            {step === 'number' && (<div><p className="text-xs text-cyan-500 mb-2">Category: {category.toUpperCase()}</p><p>Enter Phone no.</p><p className="mt-4 text-green-500 font-bold">Reply: {input}</p></div>)}
            {step === 'amount' && (<div><p>Enter Amount to send to {targetNumber}</p><p className="mt-4 text-green-500 font-bold">Reply: {input}</p></div>)}
            
            {step === 'warning' && (
              <div className="bg-red-950 p-3 rounded border border-red-500">
                <p className="text-red-500 font-bold flex items-center gap-2 text-lg"><span>⚠️</span> FRAUD ALERT</p>
                <p className="mt-2 text-red-200">Risk Score: <span className="font-bold text-white text-lg">{riskData?.risk_score}%</span></p>
                <p className="mt-1 text-xs text-orange-300">Reason: {riskData?.message.split(':')[1]}</p>
                <div className="mt-4 space-y-2 text-gray-300 border-t border-red-800 pt-2"><p>1. Cancel (Safe)</p><p>2. Proceed anyway</p></div>
                <p className="mt-4 text-red-400 font-bold animate-pulse">Reply: {input}</p>
              </div>
            )}

            {step === 'blocked' && (
              <div className="bg-red-900 p-4 rounded border-2 border-red-500 text-center mt-10">
                <p className="text-4xl mb-2">🚫</p><p className="text-white font-bold text-lg">BLOCKED</p>
                <p className="text-red-200 mt-2 text-xs">LINDA+ Security has intercepted this transaction.</p>
              </div>
            )}

            {step === 'processing' && (<div className="text-center mt-20"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-green-500 font-bold">Connecting AI...</p></div>)}
            {step === 'success' && (<div className="text-center mt-10"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-white text-4xl">✓</span></div><h2 className="text-2xl font-bold text-white mb-2">Money Sent!</h2></div>)}
          </div>
        </div>

        {/* Keypad */}
        <div className="h-[280px] bg-gray-900 p-4 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button key={k} onClick={() => setInput(prev => prev + k)} className="bg-gray-800 text-white rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-green-600 shadow-sm">{k}</button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="h-20 bg-gray-900 px-4 flex gap-4 pb-6">
          <button onClick={resetSimulator} className="flex-1 bg-red-600/80 text-white rounded-xl font-bold tracking-widest hover:bg-red-600">END</button>
          <button onClick={handleNext} className="flex-1 bg-green-600 text-white rounded-xl font-bold tracking-widest hover:bg-green-500">SEND</button>
        </div>
      </div>
    </div>
      )}
    </>
  );
}

export default App;