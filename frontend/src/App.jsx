import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';
import WhatsApp from './WhatsApp';

// 🌍 1. HYBRID TRANSLATION ENGINE (From your SRS)
const t = {
  en: {
    dial: "Dial *334#", phone: "Phone", menu: "M-PESA LINDA+", opt1: "1. Send Money", opt2: "2. Withdraw Cash", opt3: "3. Buy Airtime",
    catTitle: "Smart Spending", catSub: "Select Category:", cat1: "1. General", cat2: "2. Health & Bills", cat3: "3. Betting (Restricted)",
    enterNum: "Enter Phone no.", enterAmt: "Enter Amount", warnTitle: "FRAUD ALERT", warnSub: "Risk Score:",
    warn1: "1. Cancel (Safe)", warn2: "2. Proceed anyway", success: "Money Sent!", reply: "Reply:"
  },
  sw: {
    dial: "Piga *334#", phone: "Simu", menu: "M-PESA LINDA+", opt1: "1. Tuma Pesa", opt2: "2. Toa Pesa", opt3: "3. Nunua Salio",
    catTitle: "Matumizi Bora", catSub: "Chagua Aina:", cat1: "1. Kawaida", cat2: "2. Afya na Bili", cat3: "3. Kamari (Imezuiwa)",
    enterNum: "Weka namba ya simu", enterAmt: "Weka kiasi", warnTitle: "ILANI YA UTAPELI", warnSub: "Kiwango cha Hatari:",
    warn1: "1. Ghairi (Salama)", warn2: "2. Endelea", success: "Pesa Zimetumwa!", reply: "Jibu:"
  },
  ki: { // Kikuyu
    dial: "Hüra *334#", phone: "Thimũ", menu: "M-PESA LINDA+", opt1: "1. Tũma Mbeca", opt2: "2. Ruta Mbeca", opt3: "3. Gũra Airtime",
    catTitle: "Kũhũthĩra Mbeca", catSub: "Thuura gĩcunjĩ:", cat1: "1. Kawaida", cat2: "2. Ũgima wa mwĩrĩ", cat3: "3. Kamari",
    enterNum: "Andĩka namba", enterAmt: "Andĩka mbeca", warnTitle: "MŨRANGĨRI", warnSub: "Hatari:",
    warn1: "1. Tiga", warn2: "2. Thiĩ na mbere", success: "Mbeca nĩciathii!", reply: "Cokia:"
  },
  lu: { // Luo
    dial: "Goyo *334#", phone: "Simu", menu: "M-PESA LINDA+", opt1: "1. Oro Pesa", opt2: "2. Golo Pesa", opt3: "3. Nyiewo Airtime",
    catTitle: "Tiyo gi Pesa", catSub: "Yier:", cat1: "1. Pesa", cat2: "2. Ngima", cat3: "3. Tuke",
    enterNum: "Keto namba", enterAmt: "Keto pesa", warnTitle: "TANG' (Keth)", warnSub: "Rochruok:",
    warn1: "1. We", warn2: "2. Dhi nyime", success: "Pesa Oseketh!", reply: "Dwoko:"
  }
};

function App() {
  const [mode, setMode] = useState('ussd'); 
  const [step, setStep] = useState('dial'); 
  const [input, setInput] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General'); 
  const [lang, setLang] = useState('en'); 
  const [riskData, setRiskData] = useState(null); 
  const [isListening, setIsListening] = useState(false); 

  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // 🗣️ 2. KENYAN-TARGETED TEXT TO SPEECH
  const speakMessage = (textEn, textSw = "", isAlert = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      setTimeout(() => {
        const msg = new SpeechSynthesisUtterance();
        const currentLang = langRef.current;
        
        msg.text = currentLang === 'en' ? textEn : (textSw || textEn);
        
        const voices = window.speechSynthesis.getVoices();
        const kenyanVoice = voices.find(v => v.lang.includes('KE'));
        if (kenyanVoice) msg.voice = kenyanVoice;

        msg.lang = currentLang === 'en' ? 'en-KE' : 'sw-KE'; 
        msg.rate = isAlert ? 0.85 : 1.0;
        msg.pitch = isAlert ? 0.8 : 1.0;
        
        window.speechSynthesis.speak(msg);
      }, 50); 
    }
  };

  // 🎙️ 3. TWO-WAY VOICE ACCESSIBILITY (SPEECH TO TEXT)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-KE' : 'sw-KE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("🎤 User said:", transcript);
      
      if (transcript.includes('one') || transcript.includes('moja') || transcript.includes('1')) {
        setInput('1');
        setTimeout(() => handleNext(), 300); 
      }
      else if (transcript.includes('two') || transcript.includes('mbili') || transcript.includes('2')) {
        setInput('2');
        setTimeout(() => handleNext(), 300);
      }
      else if (transcript.includes('three') || transcript.includes('tatu') || transcript.includes('3')) {
        setInput('3');
        setTimeout(() => handleNext(), 300);
      }
      else if (transcript.includes('send') || transcript.includes('tuma')) {
        handleNext(); 
      }
      else if (transcript.includes('cancel') || transcript.includes('ghairi')) { 
        resetSimulator(); 
      }
      else {
        const numbers = transcript.match(/\d+/g);
        if (numbers) setInput(prev => prev + numbers.join(''));
      }
    };

    recognition.start();
  };

  // Setup WebSockets
  useEffect(() => {
    speakMessage("Welcome to Linda Plus.", "Karibu Linda Plus.");
    const socket = new WebSocket('ws://127.0.0.1:8001/ws/mpesa');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'completed') {
        setStep('success');
        speakMessage("Transaction successful.", "Muamala umekamilika.");
        setTimeout(() => resetSimulator(), 5000);
      } else if (data.status === 'failed') {
        speakMessage("Transaction failed.", "Muamala umefeli.");
        resetSimulator();
      }
    };
    return () => socket.close();
  }, []);

  const handleNext = async () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu'); setInput('');
      speakMessage("Press 1 to Send Money, 2 to Withdraw.", "Bonyeza moja kutuma pesa, mbili kutoa.");
    } else if (step === 'menu' && input === '1') {
      setStep('category'); setInput('');
      speakMessage("Select Category. 1 for General, 3 for Betting.", "Chagua Aina. Moja kwa Kawaida. Tatu kwa Kamari.");
    } else if (step === 'category') {
      const cats = { '1': 'general', '2': 'health', '3': 'betting' };
      setCategory(cats[input] || 'general');
      setStep('number'); setInput('');
      speakMessage("Enter the phone number.", "Weka nambari ya simu.");
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input); setStep('amount'); setInput('');
      speakMessage("Enter the amount.", "Weka kiasi.");
    } else if (step === 'amount' && input.length > 0) {
      setAmount(input); setInput('');
      checkFraudRisk(input);
    } else if (step === 'warning') {
      // FULLY FIXED FR-04 LOGIC HERE
      if (input === '1') { 
        speakMessage("Blocked. You are safe.", "Umezuia. Uko salama."); 
        resetSimulator(); 
      } 
      else if (input === '2') { 
        speakMessage("Approval request sent to sponsor.", "Ombi limetumwa kwa mdhamini.");
        setStep('success_approval');
        setInput('');
      }
      else if (input === '3') { 
        triggerMpesaPush(); 
      }
    }
  };

  const checkFraudRisk = async (finalAmount) => {
    setStep('processing');
    try {
      const response = await fetch('http://127.0.0.1:8001/api/fraud/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: targetNumber, amount: parseInt(finalAmount), category: category })
      });
      const data = await response.json();
      setRiskData(data); 

      if (data.action === 'block') {
        speakMessage("Danger! Blocked due to fraud.", "Hatari! Imezuiwa kwa sababu ya utapeli.", true);
        setStep('blocked');
      } else if (data.action === 'alert') {
        speakMessage("Warning! High fraud risk. Press 1 to cancel, 2 for approval, 3 to proceed.", "Onyo! Hatari ya utapeli. Bonyeza moja kufuta, mbili kwa ombi, tatu kuendelea.", true);
        setStep('warning');
      } else { triggerMpesaPush(); }
    } catch (error) { triggerMpesaPush(); }
  };

  const triggerMpesaPush = async () => {
    setStep('processing');
    try {
      await fetch('http://127.0.0.1:8001/api/mpesa/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: targetNumber, amount: parseInt(amount) || 1, category: category })
      });
    } catch (error) { resetSimulator(); }
  };

  const resetSimulator = () => {
    window.speechSynthesis.cancel();
    setStep('dial'); setInput(''); setTargetNumber(''); setAmount(''); setCategory('General'); setRiskData(null);
  };

  const getText = (key) => t[lang]?.[key] || t['en'][key];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-cyan-500/30 z-50 p-4 flex justify-between items-center px-4 lg:px-8 shadow-xl">
        <div className="flex gap-2">
            <button onClick={() => setMode('ussd')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'ussd' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'bg-slate-700 text-gray-300'}`}>📱 Simulator</button>
            <button onClick={() => setMode('dashboard')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'dashboard' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'bg-slate-700 text-gray-300'}`}>📊 Dashboard</button>
            <button onClick={() => setMode('whatsapp')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'whatsapp' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-slate-700 text-gray-300'}`}>💬 WhatsApp</button>
        </div>
        
        <div className="flex items-center gap-2">
          <select value={lang} onChange={(e) => { setLang(e.target.value); speakMessage("Language updated", "Lugha imebadilishwa"); }} className="bg-slate-700 text-white border border-slate-500 rounded p-1.5 text-sm outline-none cursor-pointer">
            <option value="en">🇬🇧 English</option>
            <option value="sw">🇰🇪 Kiswahili</option>
            <option value="ki">🛖 Kikuyu</option>
            <option value="lu">🐟 Luo</option>
          </select>
        </div>
      </div>

      {mode === 'dashboard' && <Dashboard />}
      {mode === 'whatsapp' && <WhatsApp />}

      {mode === 'ussd' && (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 pt-24">
      
      {/* Phone Body */}
      <div className="w-[360px] h-[720px] bg-black rounded-[50px] border-[14px] border-slate-800 shadow-2xl relative flex flex-col">
        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-10"><div className="w-32 h-7 bg-slate-800 rounded-b-3xl"></div></div>

        {/* Dynamic Screen */}
        <div className="flex-1 mt-10 mb-4 mx-4 bg-[#0a0f12] rounded-xl p-5 border border-slate-700 font-mono text-[15px] relative overflow-y-auto shadow-inner">
          <div className="text-slate-400 text-xs flex justify-between mb-5 border-b border-slate-700 pb-2 uppercase tracking-wider">
            <span>SAFARICOM</span><span className="text-cyan-400">LINDA+ 🛡️</span>
          </div>

          <div className="text-white space-y-4">
            {step === 'dial' && (<div><p className="text-slate-400">{getText('phone')}</p><p className="text-3xl text-center mt-12 text-cyan-400">{input || getText('dial')}</p></div>)}
            
            {step === 'menu' && (<div><p className="font-bold text-cyan-400 mb-2">{getText('menu')}</p>
              <div className="space-y-2 text-slate-200"><p>{getText('opt1')}</p><p>{getText('opt2')}</p><p>{getText('opt3')}</p></div>
              <p className="mt-6 text-green-400 font-bold">{getText('reply')} {input}</p>
            </div>)}
            
            {step === 'category' && (<div><p className="text-cyan-400 font-bold mb-2">{getText('catTitle')}</p><p className="mb-2 text-slate-300">{getText('catSub')}</p>
              <div className="space-y-2 text-slate-200"><p>{getText('cat1')}</p><p>{getText('cat2')}</p><p className="text-orange-400">{getText('cat3')}</p></div>
              <p className="mt-6 text-green-400 font-bold">{getText('reply')} {input}</p>
            </div>)}
            
            {step === 'number' && (<div><p className="text-xs text-cyan-500 mb-3 uppercase border border-cyan-900 inline-block px-2 py-1 rounded">{category}</p><p className="text-slate-200">{getText('enterNum')}</p><p className="mt-4 text-green-400 font-bold text-xl">{input}</p></div>)}
            
            {step === 'amount' && (<div><p className="text-slate-200">{getText('enterAmt')} ➜ <span className="text-cyan-400">{targetNumber}</span></p><p className="mt-4 text-green-400 font-bold text-xl">{input}</p></div>)}
            
            {step === 'warning' && (
              <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/50">
                <p className="text-red-500 font-bold flex items-center gap-2 text-lg"><span>⚠️</span> {getText('warnTitle')}</p>
                <p className="mt-3 text-red-200">{getText('warnSub')} <span className="font-bold text-white text-xl ml-2">{riskData?.risk_score}%</span></p>
                <div className="mt-4 space-y-2 text-slate-300 border-t border-red-900/50 pt-3">
                  <p className="text-green-400">1. Cancel (Safe)</p>
                  <p className="text-orange-400">2. Request Sponsor Approval</p>
                  <p className="text-red-400">3. Proceed anyway</p>
                </div>
                <p className="mt-5 text-white font-bold">{getText('reply')} {input}</p>
              </div>
            )}

            {step === 'blocked' && (
              <div className="bg-red-900/80 p-6 rounded-lg border border-red-500 text-center mt-8">
                <p className="text-5xl mb-4">🚫</p>
                <p className="text-white font-bold text-xl tracking-wider mb-2">BLOCKED</p>
                <p className="text-red-200 text-xs mb-4">Category restricted by Sponsor.</p>
                <button onClick={() => {
                  speakMessage("Approval request sent to sponsor.", "Ombi limetumwa kwa mdhamini.");
                  setStep('success_approval');
                }} className="bg-orange-500 text-white px-4 py-2 rounded font-bold text-sm w-full animate-pulse hover:bg-orange-600 transition-colors">
                  Request Override
                </button>
              </div>
            )}

            {step === 'success_approval' && (
              <div className="text-center mt-16 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <span className="text-white text-3xl">⏳</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Request Sent!</h2>
                <p className="text-slate-400 text-sm">Waiting for sponsor to approve KSH {amount} for {category}.</p>
                <button onClick={resetSimulator} className="mt-8 text-cyan-500 hover:text-cyan-400 transition-colors underline text-sm">Return to Home</button>
              </div>
            )}

            {step === 'processing' && (<div className="text-center mt-24"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-cyan-400 font-bold animate-pulse">Processing...</p></div>)}
            {step === 'success' && (<div className="text-center mt-16 animate-in zoom-in duration-300"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]"><span className="text-white text-4xl">✓</span></div><h2 className="text-2xl font-bold text-white">{getText('success')}</h2></div>)}
          </div>
        </div>

        {/* 🎙️ ACCESSIBILITY BAR: MICROPHONE */}
        <div className="mx-4 mb-2 flex justify-center">
            <button 
              onClick={toggleListening}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all w-full justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
            >
              <span className="text-xl">🎙️</span> 
              {isListening ? "Listening... Speak Now" : "Tap to Speak (Accessibility)"}
            </button>
        </div>

        {/* Keypad */}
        <div className="bg-slate-900 p-4 grid grid-cols-3 gap-3 rounded-b-[35px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button key={k} onClick={() => setInput(prev => prev + k)} className="bg-slate-800 text-slate-200 rounded-xl py-3 text-2xl font-bold hover:bg-slate-700 active:bg-cyan-600 active:scale-95 transition-all shadow-md">{k}</button>
          ))}
          <button onClick={resetSimulator} className="bg-red-900/80 text-red-200 rounded-xl py-3 font-bold uppercase tracking-wider hover:bg-red-800 active:scale-95 mt-2 col-span-1 border border-red-700/50">End</button>
          <button onClick={handleNext} className="bg-green-700 text-green-100 rounded-xl py-3 font-bold uppercase tracking-wider hover:bg-green-600 active:scale-95 mt-2 col-span-2 shadow-[0_0_10px_rgba(21,128,61,0.4)]">Send</button>
        </div>

      </div>
    </div>
      )}
    </>
  );
}

export default App;