import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';
import WhatsApp from './WhatsApp';

// Securely pull the API key for Whisper AI Voice Recognition
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// 🌍 1. EXPANDED TRANSLATION ENGINE
const t = {
  en: { dial: "Dial *334#", phone: "Phone", menu: "M-PESA LINDA+", opt1: "1. Send Money", opt2: "2. Withdraw", opt3: "3. Airtime", opt4: "4. Finance Tips", catTitle: "Smart Spending", catSub: "Select Category:", cat1: "1. General", cat2: "2. Health", cat3: "3. Betting (Restricted)", enterNum: "Enter Phone no.", enterAmt: "Enter Amount", warnTitle: "FRAUD ALERT", warnSub: "Risk Score:", warn1: "1. Cancel (Safe)", warn2: "2. Ask Guardian", warn3: "3. Proceed anyway", success: "Money Sent!", reply: "Reply:" },
  sw: { dial: "Piga *334#", phone: "Simu", menu: "M-PESA LINDA+", opt1: "1. Tuma Pesa", opt2: "2. Toa Pesa", opt3: "3. Salio", opt4: "4. Ushauri", catTitle: "Matumizi Bora", catSub: "Chagua Aina:", cat1: "1. Kawaida", cat2: "2. Afya", cat3: "3. Kamari (Imezuiwa)", enterNum: "Weka namba ya simu", enterAmt: "Weka kiasi", warnTitle: "ILANI YA UTAPELI", warnSub: "Kiwango:", warn1: "1. Ghairi (Salama)", warn2: "2. Omba Ruhusa", warn3: "3. Endelea", success: "Pesa Zimetumwa!", reply: "Jibu:" },
  ki: { dial: "Hüra *334#", phone: "Thimũ", menu: "LINDA+", opt1: "1. Tũma Mbeca", opt2: "2. Ruta Mbeca", opt3: "3. Airtime", opt4: "4. Kũigithia", catTitle: "Mbeca", catSub: "Thuura:", cat1: "1. Kawaida", cat2: "2. Ũgima", cat3: "3. Kamari", enterNum: "Andĩka namba", enterAmt: "Andĩka mbeca", warnTitle: "MŨRANGĨRI", warnSub: "Hatari:", warn1: "1. Tiga", warn2: "2. Uria Mũciari", warn3: "3. Thiĩ na mbere", success: "Nĩciathii!", reply: "Cokia:" },
  lu: { dial: "Goyo *334#", phone: "Simu", menu: "LINDA+", opt1: "1. Oro Pesa", opt2: "2. Golo Pesa", opt3: "3. Airtime", opt4: "4. Puonj", catTitle: "Pesa", catSub: "Yier:", cat1: "1. Pesa", cat2: "2. Ngima", cat3: "3. Tuke", enterNum: "Keto namba", enterAmt: "Keto pesa", warnTitle: "TANG'", warnSub: "Rochruok:", warn1: "1. We", warn2: "2. Kwayo Jaduong", warn3: "3. Dhi nyime", success: "Oseketh!", reply: "Dwoko:" },
  kal: { dial: "Tui *334#", phone: "Simu", menu: "LINDA+ (Kalenjin)", opt1: "1. Send Money", opt2: "2. Withdraw", opt3: "3. Airtime", opt4: "4. Tips", catTitle: "Category", catSub: "Select:", cat1: "1. General", cat2: "2. Health", cat3: "3. Betting", enterNum: "Number", enterAmt: "Amount", warnTitle: "ALERT", warnSub: "Risk:", warn1: "1. Cancel", warn2: "2. Ask Guardian", warn3: "3. Proceed", success: "Sent!", reply: "Reply:" },
  kis: { dial: "Gera *334#", phone: "Simu", menu: "LINDA+ (Kisii)", opt1: "1. Send Money", opt2: "2. Withdraw", opt3: "3. Airtime", opt4: "4. Tips", catTitle: "Category", catSub: "Select:", cat1: "1. General", cat2: "2. Health", cat3: "3. Betting", enterNum: "Number", enterAmt: "Amount", warnTitle: "ALERT", warnSub: "Risk:", warn1: "1. Cancel", warn2: "2. Ask Guardian", warn3: "3. Proceed", success: "Sent!", reply: "Reply:" },
  som: { dial: "Garaac *334#", phone: "Telefoonka", menu: "LINDA+ (Somali)", opt1: "1. Dir Lacag", opt2: "2. Lacag bixis", opt3: "3. Airtime", opt4: "4. Talo", catTitle: "Qeybta", catSub: "Dooro:", cat1: "1. Guud", cat2: "2. Caafimaad", cat3: "3. Sharad", enterNum: "Numbarka", enterAmt: "Lacagta", warnTitle: "DIGNIIN", warnSub: "Khatar:", warn1: "1. Jooji", warn2: "2. Weydii Waalidka", warn3: "3. Sii wad", success: "Waa la diray!", reply: "Jawaab:" }
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
  
  // Audio State
  const [isListening, setIsListening] = useState(false); 
  const [isAudioThinking, setIsAudioThinking] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [parentRequests, setParentRequests] = useState([]);
  const [currentReqId, setCurrentReqId] = useState(null);

  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const speakMessage = (textEn, textSw = "", isAlert = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      setTimeout(() => {
        const msg = new SpeechSynthesisUtterance();
        msg.text = langRef.current === 'en' ? textEn : (textSw || textEn);
        const voices = window.speechSynthesis.getVoices();
        const kenyanVoice = voices.find(v => v.lang.includes('KE'));
        if (kenyanVoice) msg.voice = kenyanVoice;
        msg.lang = langRef.current === 'en' ? 'en-KE' : 'sw-KE'; 
        msg.rate = isAlert ? 0.85 : 1.0;
        msg.pitch = isAlert ? 0.8 : 1.0;
        window.speechSynthesis.speak(msg);
      }, 50); 
    }
  };

  // 🎙️ PROFESSIONAL OPENAI WHISPER INTEGRATION
  const toggleListening = async () => {
    // If currently recording, STOP and send to OpenAI
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsAudioThinking(true);
      return;
    }

    if (!OPENAI_API_KEY) {
      alert("Missing OpenAI API Key in .env file.");
      return;
    }

    // Start Recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', new File([audioBlob], 'audio.webm', { type: 'audio/webm' }));
        formData.append('model', 'whisper-1');

        try {
          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: formData
          });

          const data = await res.json();
          if (data.text) {
            processTranscript(data.text.toLowerCase());
          }
        } catch (error) {
          console.error("Whisper Error:", error);
          alert("Voice processing failed. Check network or API key.");
        } finally {
          setIsAudioThinking(false);
          stream.getTracks().forEach(track => track.stop()); // Turn off mic light
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      alert("Microphone access denied.");
    }
  };

  const processTranscript = (transcript) => {
    console.log("🎤 Whisper heard:", transcript);
    let t = transcript.replace(/star|asterisk/g, '*').replace(/hash|pound/g, '#');
    const numMap = { 'zero':'0', 'oh':'0', 'one':'1', 'moja':'1', 'two':'2', 'mbili':'2', 'three':'3', 'tatu':'3', 'four':'4', 'nne':'4' };
    for (let word in numMap) { t = t.split(word).join(numMap[word]); }
    
    const cleaned = t.replace(/[^0-9*#]/g, '');
    
    if (cleaned === '*334#') { setInput('*334#'); setTimeout(() => handleNext(), 500); }
    else if (cleaned.length === 1 && ['1','2','3','4'].includes(cleaned)) { setInput(cleaned); setTimeout(() => handleNext(), 500); }
    else if (t.includes('send') || t.includes('tuma') || t.includes('confirm')) { handleNext(); }
    else if (t.includes('cancel') || t.includes('ghairi')) { resetSimulator(); }
    else if (cleaned.length > 1) { setInput(cleaned); }
  };

  useEffect(() => {
    if (step === 'success_approval' && currentReqId) {
      const req = parentRequests.find(r => r.id === currentReqId);
      if (req && req.status === 'approved') {
        setStep('approval_received');
        setInput('');
        speakMessage("Your guardian has approved. Press 1 to confirm and send.", "Mdhamini amekubali. Bonyeza moja kuthibitisha.");
      } else if (req && req.status === 'rejected') {
        setStep('hard_block');
        speakMessage("Your guardian rejected the transaction.", "Mdhamini amekataa muamala.");
      }
    }
  }, [parentRequests, step, currentReqId]);

  const handleNext = async () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu'); setInput('');
      // 🔥 THE TTS MENU FIX
      speakMessage(
        "Menu. 1 Send Money, 2 Withdraw Cash, 3 Buy Airtime, 4 Financial Tips.", 
        "Menyu. Moja Tuma Pesa, Mbili Toa Pesa, Tatu Nunua Salio, Nne Ushauri."
      );
    } else if (step === 'menu' && input === '4') {
      setStep('tips'); setInput('');
      speakMessage("Linda Tip: Save 10 percent of your allowance. Press 0 to go back.", "Ushauri: Weka akiba asilimia kumi. Bonyeza sufuri kurudi.");
    } else if (step === 'tips' && input === '0') {
      setStep('menu'); setInput('');
    } else if (step === 'menu' && input === '1') {
      setStep('category'); setInput('');
      speakMessage("Select Category. 1 General, 3 Betting.", "Chagua Aina. Moja Kawaida. Tatu Kamari.");
    } else if (step === 'category') {
      const cats = { '1': 'General', '2': 'Health', '3': 'Betting' };
      setCategory(cats[input] || 'General');
      setStep('number'); setInput('');
      speakMessage("Enter phone number.", "Weka nambari.");
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input); setStep('amount'); setInput('');
      speakMessage("Enter amount.", "Weka kiasi.");
    } else if (step === 'amount' && input.length > 0) {
      const amt = parseInt(input);
      setAmount(amt); setInput('');
      
      if (amt > 1000) {
        setRiskData({ message: "Amount exceeds your KSH 1,000 minor limit." });
        setStep('limit_exceeded');
        speakMessage("Amount exceeds limit. Guardian approval required.", "Kiasi kimezidi kikomo. Ruhusa inahitajika.", true);
      } else {
        checkFraudRisk(amt);
      }
    } else if (step === 'warning') {
      if (input === '1') { speakMessage("Safe.", "Salama."); resetSimulator(); } 
      else if (input === '2') { sendParentRequest("Fraud Warning Bypass"); }
      else if (input === '3') { 
        speakMessage("Access Denied. Minors cannot bypass restricted categories.", "Kizuizi cha mtoto. Huwezi kuendelea.", true);
        setStep('hard_block');
      }
    } else if (step === 'limit_exceeded') {
      if (input === '1') { resetSimulator(); }
      else if (input === '2') { sendParentRequest("Limit Override"); }
    } 
    else if (step === 'approval_received') {
      if (input === '1') {
        triggerMpesaPush();
      } else {
        resetSimulator();
      }
    }
  };

  const sendParentRequest = (reason) => {
    const newReq = { id: Date.now(), child: "Imbeka (Minor)", amount: amount, category: category, target: targetNumber, reason: reason, status: 'pending' };
    setParentRequests(prev => [newReq, ...prev]);
    setCurrentReqId(newReq.id);
    setStep('success_approval');
    setInput('');
    speakMessage("Request sent to Guardian App.", "Ombi limetumwa kwa simu ya mzazi.");
  };

  const checkFraudRisk = async (finalAmount) => {
    setStep('processing');
    try {
      const response = await fetch('http://127.0.0.1:8001/api/fraud/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: targetNumber, amount: parseInt(finalAmount), category: category.toLowerCase() })
      });
      const data = await response.json();
      setRiskData(data); 

      if (data.action === 'block') {
        speakMessage("Danger! Blocked due to fraud.", "Hatari! Imezuiwa.", true);
        setStep('blocked');
      } else if (data.action === 'alert') {
        speakMessage("Warning! High fraud risk. Press 2 to ask Guardian.", "Onyo! Hatari. Bonyeza mbili kuomba ruhusa.", true);
        setStep('warning');
      } else { triggerMpesaPush(); }
    } catch (error) { triggerMpesaPush(); }
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
      console.error(error);
      alert("🔌 Failed to connect to Python backend.");
      resetSimulator(); 
    }
  };

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

  const resetSimulator = () => {
    window.speechSynthesis.cancel();
    setStep('dial'); setInput(''); setTargetNumber(''); setAmount(''); setCategory('General'); setRiskData(null); setCurrentReqId(null);
  };

  const getText = (key) => t[lang]?.[key] || t['en'][key];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-cyan-500/30 z-50 p-4 flex justify-between items-center px-4 lg:px-8 shadow-xl overflow-x-auto whitespace-nowrap">
        <div className="flex gap-2">
            <button onClick={() => setMode('ussd')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'ussd' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'bg-slate-700 text-gray-300'}`}>📱 USSD</button>
            <button onClick={() => setMode('dashboard')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'dashboard' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'bg-slate-700 text-gray-300'}`}>📊 Dashboard</button>
            <button onClick={() => setMode('whatsapp')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'whatsapp' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-slate-700 text-gray-300'}`}>💬 WhatsApp</button>
            <button onClick={() => setMode('parent')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${mode === 'parent' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-slate-700 text-gray-300'}`}>👨‍👩‍👧 Guardian App</button>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <select value={lang} onChange={(e) => { setLang(e.target.value); speakMessage("Language updated", "Lugha imebadilishwa"); }} className="bg-slate-700 text-white border border-slate-500 rounded p-1.5 text-sm outline-none cursor-pointer">
            <option value="en">🇬🇧 English</option>
            <option value="sw">🇰🇪 Kiswahili</option>
            <option value="ki">🛖 Kikuyu</option>
            <option value="lu">🐟 Luo</option>
            <option value="kal">🏃 Kalenjin</option>
            <option value="kis">🍌 Kisii</option>
            <option value="som">🐪 Somali</option>
          </select>
        </div>
      </div>

      {mode === 'dashboard' && <Dashboard />}
      {mode === 'whatsapp' && <WhatsApp />}

      {mode === 'parent' && (
        <div className="min-h-screen bg-slate-900 pt-24 p-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-purple-400 mb-2">🛡️ Guardian Control Center</h2>
            <p className="text-slate-400 mb-8">Manage minor spending limits and override requests.</p>
            
            <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700 flex gap-4 items-end shadow-lg">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-2 font-bold uppercase tracking-wider">Link Guardian Phone/Email (Live Demo)</label>
                <input type="text" placeholder="e.g. 0722... or judge@email.com" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500 transition-colors" />
              </div>
              <button onClick={() => alert("✅ Guardian Linked Successfully! Routing requests to this device.")} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded font-bold transition-colors">
                Link Device
              </button>
            </div>

            {parentRequests.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <p className="text-slate-400">No pending approval requests from your dependents.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parentRequests.map(req => (
                  <div key={req.id} className={`bg-slate-800 rounded-xl p-6 border ${req.status === 'pending' ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-slate-700'} transition-all`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg">{req.child} wants to send money.</h4>
                        <p className="text-orange-400 text-sm">Flag: {req.reason}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-orange-500/20 text-orange-400 animate-pulse' : req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div className="bg-slate-900 p-3 rounded text-slate-300"><span className="text-slate-500 block text-xs">Amount</span>KSH {req.amount}</div>
                      <div className="bg-slate-900 p-3 rounded text-slate-300"><span className="text-slate-500 block text-xs">Category</span>{req.category}</div>
                      <div className="bg-slate-900 p-3 rounded text-slate-300 col-span-2"><span className="text-slate-500 block text-xs">To</span>{req.target}</div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-4">
                        <button onClick={() => setParentRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'rejected'} : r))} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-colors">Reject</button>
                        <button onClick={() => setParentRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'approved'} : r))} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-colors shadow-lg">Approve Override</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'ussd' && (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 pt-24">
      <div className="w-[360px] h-[720px] bg-black rounded-[50px] border-[14px] border-slate-800 shadow-2xl relative flex flex-col">
        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-10"><div className="w-32 h-7 bg-slate-800 rounded-b-3xl"></div></div>

        <div className="flex-1 mt-10 mb-4 mx-4 bg-[#0a0f12] rounded-xl p-5 border border-slate-700 font-mono text-[15px] relative overflow-y-auto shadow-inner">
          <div className="text-slate-400 text-xs flex justify-between mb-5 border-b border-slate-700 pb-2 uppercase tracking-wider">
            <span>SAFARICOM</span><span className="text-cyan-400">LINDA+ 🛡️</span>
          </div>

          <div className="text-white space-y-4">
            {step === 'dial' && (<div><p className="text-slate-400">{getText('phone')}</p><p className="text-3xl text-center mt-12 text-cyan-400">{input || getText('dial')}</p></div>)}
            
            {step === 'menu' && (<div><p className="font-bold text-cyan-400 mb-2">{getText('menu')}</p>
              <div className="space-y-2 text-slate-200"><p>{getText('opt1')}</p><p>{getText('opt2')}</p><p>{getText('opt3')}</p><p className="text-purple-400">{getText('opt4')}</p></div>
              <p className="mt-6 text-green-400 font-bold">{getText('reply')} {input}</p>
            </div>)}

            {step === 'tips' && (<div>
              <p className="text-purple-400 font-bold mb-2">🎓 Linda+ Academy</p>
              <p className="text-slate-300 leading-relaxed mb-4">Did you know? Saving just 10% of your allowance builds a strong emergency fund.</p>
              <p className="text-slate-500 text-xs">0. Back</p>
              <p className="mt-4 text-green-400 font-bold">{getText('reply')} {input}</p>
            </div>)}
            
            {step === 'category' && (<div><p className="text-cyan-400 font-bold mb-2">{getText('catTitle')}</p><p className="mb-2 text-slate-300">{getText('catSub')}</p>
              <div className="space-y-2 text-slate-200"><p>{getText('cat1')}</p><p>{getText('cat2')}</p><p className="text-orange-400">{getText('cat3')}</p></div>
              <p className="mt-6 text-green-400 font-bold">{getText('reply')} {input}</p>
            </div>)}
            
            {step === 'number' && (<div><p className="text-xs text-cyan-500 mb-3 uppercase border border-cyan-900 inline-block px-2 py-1 rounded">{category}</p><p className="text-slate-200">{getText('enterNum')}</p><p className="mt-4 text-green-400 font-bold text-xl">{input}</p></div>)}
            
            {step === 'amount' && (<div><p className="text-slate-200">{getText('enterAmt')} ➜ <span className="text-cyan-400">{targetNumber}</span></p><p className="mt-4 text-green-400 font-bold text-xl">{input}</p></div>)}
            
            {step === 'limit_exceeded' && (
              <div className="bg-orange-950/50 p-4 rounded-lg border border-orange-500/50">
                <p className="text-orange-500 font-bold flex items-center gap-2 text-lg"><span>⚠️</span> LIMIT EXCEEDED</p>
                <p className="mt-2 text-orange-200 text-sm">Amount KSH {amount} exceeds your minor limit of KSH 1,000.</p>
                <div className="mt-4 space-y-2 text-slate-300 border-t border-orange-900/50 pt-3">
                  <p className="text-green-400">1. Cancel</p>
                  <p className="text-orange-400">2. Request Guardian Override</p>
                </div>
                <p className="mt-5 text-white font-bold">{getText('reply')} {input}</p>
              </div>
            )}

            {step === 'warning' && (
              <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/50">
                <p className="text-red-500 font-bold flex items-center gap-2 text-lg"><span>⚠️</span> {getText('warnTitle')}</p>
                <p className="mt-3 text-red-200">{getText('warnSub')} <span className="font-bold text-white text-xl ml-2">{riskData?.risk_score}%</span></p>
                <div className="mt-4 space-y-2 text-slate-300 border-t border-red-900/50 pt-3">
                  <p className="text-green-400">{getText('warn1')}</p>
                  <p className="text-orange-400">{getText('warn2')}</p>
                  <p className="text-red-400">{getText('warn3')}</p>
                </div>
                <p className="mt-5 text-white font-bold">{getText('reply')} {input}</p>
              </div>
            )}

            {step === 'hard_block' && (
              <div className="bg-red-900/80 p-6 rounded-lg border border-red-500 text-center mt-8">
                <p className="text-5xl mb-4">🚫</p>
                <p className="text-white font-bold text-xl tracking-wider mb-2">ACCESS DENIED</p>
                <p className="text-red-200 text-xs mb-4">Guardian rejected the request, or Minor Restriction Active.</p>
                <button onClick={resetSimulator} className="text-cyan-400 underline text-xs">Return</button>
              </div>
            )}

            {step === 'success_approval' && (
              <div className="text-center mt-16 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-pulse">
                  <span className="text-white text-2xl">⏳</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Request Pending</h2>
                <p className="text-slate-400 text-xs mb-8">Go to the "Guardian App" tab to approve this request.</p>
              </div>
            )}

            {step === 'approval_received' && (
              <div className="bg-green-900/40 p-6 rounded-lg border border-green-500 text-center mt-8">
                <p className="text-5xl mb-2">✅</p>
                <p className="text-green-400 font-bold text-lg mb-2 tracking-widest">APPROVED</p>
                <p className="text-slate-200 text-sm mb-4">Your Guardian has approved KSH {amount} for {category}.</p>
                <p className="text-white font-bold border-t border-green-700 pt-4">Press <span className="text-green-400">1</span> to Confirm & Send</p>
                <p className="mt-4 text-green-400 font-bold">{getText('reply')} {input}</p>
              </div>
            )}

            {step === 'processing' && (<div className="text-center mt-24"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-cyan-400 font-bold animate-pulse">Processing...</p></div>)}
            {step === 'success' && (<div className="text-center mt-16 animate-in zoom-in duration-300"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]"><span className="text-white text-4xl">✓</span></div><h2 className="text-2xl font-bold text-white">{getText('success')}</h2></div>)}
          </div>
        </div>

        {/* 🎙️ WHISPER AI MICROPHONE */}
        <div className="mx-4 mb-2 flex justify-center">
            <button 
              onClick={toggleListening}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all w-full justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : isAudioThinking ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
            >
              <span className="text-xl">🎙️</span> 
              {isListening ? "Recording... Click to Process" : isAudioThinking ? "Processing Voice..." : "Tap to Speak"}
            </button>
        </div>

        <div className="bg-slate-900 p-4 grid grid-cols-3 gap-3 rounded-b-[35px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button key={k} 
              onClick={() => {
                if(k === '0' && (step === 'dial' || step === 'menu')) toggleListening();
                else setInput(prev => prev + k);
              }} 
              className="bg-slate-800 text-slate-200 rounded-xl py-3 text-2xl font-bold hover:bg-slate-700 active:bg-cyan-600 active:scale-95 shadow-md">
              {k}
            </button>
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