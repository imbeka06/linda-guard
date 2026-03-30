import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';

function App() {
  const [mode, setMode] = useState('ussd'); // 'ussd' or 'dashboard'
  const [step, setStep] = useState('dial'); 
  const [input, setInput] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General'); // NEW: For Smart Rules
  const [lang, setLang] = useState('en'); // NEW: 'en' or 'sw' for Voice Inclusion
  const [riskData, setRiskData] = useState(null); // NEW: To hold backend risk score

  // NEW: Bilingual Voice Engine
  const speakMessage = (textEn, textSw = "", isAlert = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance();
      
      // Select language text
      if (lang === 'sw' && textSw !== "") {
          msg.text = textSw;
          msg.lang = 'sw-KE'; // Kenyan Swahili
      } else {
          msg.text = textEn;
          msg.lang = 'en-GB';
      }

      // Add urgency if it's a fraud alert
      if (isAlert) {
        msg.rate = 0.9;
        msg.pitch = 0.8;
      } else {
        msg.rate = 1.0;
        msg.pitch = 1.0;
      }
      
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    // Welcome message on first load (Bilingual)
    speakMessage(
        "Welcome to Linda Plus. Dial star three three four hash to start.",
        "Karibu Linda Plus. Piga nyota tatu tatu nne reli kuanza."
    );
    
    const socket = new WebSocket('ws://127.0.0.1:8001/ws/mpesa');
    
    socket.onopen = () => console.log('✅ WebSocket connected to backend');
    socket.onerror = (error) => console.error('❌ WebSocket error:', error);
    socket.onclose = () => console.log('🔌 WebSocket closed');
    
    socket.onmessage = (event) => {
      console.log('📨 Message from backend:', event.data);
      const data = JSON.parse(event.data);
      
      // We only care about M-Pesa callbacks here, Dashboard handles FRAUD_UPDATE
      if (data.status === 'completed') {
        setStep('success');
        speakMessage(
            "Transaction successful. Your money has been sent. Thank you for using Linda Plus.",
            "Muamala umekamilika. Pesa zako zimetumwa salama. Asante kwa kutumia Linda Plus."
        );
        setTimeout(() => resetSimulator(), 5000);
      } else if (data.status === 'failed') {
        speakMessage("Transaction failed. " + data.message, "Muamala umefeli.");
        alert("❌ Transaction failed: " + data.message);
        resetSimulator();
      }
    };

    return () => socket.close();
  }, [lang]); // Re-run if language changes so greeting plays in new lang

  const handleNext = async () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu');
      setInput('');
      speakMessage(
          "M-Pesa Linda Plus menu. Press 1 to Send Money, Press 2 to Withdraw Cash, Press 3 to Buy Airtime, Press 4 for Linda Plus Settings.",
          "Menyu ya M-Pesa Linda Plus. Bonyeza moja kutuma pesa, mbili kutoa pesa, tatu kununua salio."
      );
    } else if (step === 'dial') {
      alert("Try dialing *334#");
      setInput('');
    } else if (step === 'menu' && input === '1') {
      // NEW STEP: Category Selection for Smart Rules Engine
      setStep('category');
      setInput('');
      speakMessage(
          "Select Payment Category. 1 for General. 2 for Health. 3 for Betting.",
          "Chagua Aina ya Malipo. Moja kwa Kawaida. Mbili kwa Afya. Tatu kwa Kamari."
      );
    } else if (step === 'category') {
      const cats = { '1': 'general', '2': 'health', '3': 'betting' };
      setCategory(cats[input] || 'general');
      setStep('number');
      setInput('');
      speakMessage(
          "Please enter the phone number you want to send money to.",
          "Tafadhali weka nambari ya simu unayotaka kutuma pesa."
      );
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input);
      setStep('amount');
      setInput('');
      speakMessage("Enter the amount to send.", "Weka kiasi cha kutuma.");
    } else if (step === 'amount' && input.length > 0) {
      setAmount(input);
      setInput('');
      // Trigger backend check instead of direct warning
      checkFraudRisk(input);
    } else if (step === 'warning') {
      if (input === '1') {
        speakMessage("Transaction blocked. You are safe.", "Muamala umezuiwa. Uko salama.");
        alert("🛡️ Transaction Blocked! You are safe.");
        resetSimulator();
      } else if (input === '2') {
        triggerMpesaPush();
      }
    }
  };

  // NEW: Live connection to backend rules engine
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
      setRiskData(data); // Save data to show on screen

      if (data.action === 'block') {
        speakMessage(
            "Danger! This transaction is blocked due to extreme fraud risk.",
            "Hatari! Muamala huu umezuiwa kwa sababu ya hatari kubwa ya utapeli.",
            true
        );
        setStep('blocked'); // Show a hard block screen
      } else if (data.action === 'alert') {
        speakMessage(
            `Linda Plus Alert. Warning! The recipient has a high fraud risk. Press 1 to cancel, or 2 to proceed.`,
            `Ilani ya Linda Plus. Onyo! Mpokeaji ana hatari kubwa ya utapeli. Bonyeza moja kufuta, au mbili kuendelea.`,
            true
        );
        setStep('warning');
      } else {
        triggerMpesaPush(); // Safe, proceed immediately
      }
    } catch (error) {
      console.error("Fraud Check Failed:", error);
      triggerMpesaPush(); // Fallback to M-Pesa if AI is offline
    }
  };

  const triggerMpesaPush = async () => {
    setStep('processing');
    try {
      await fetch('http://127.0.0.1:8001/api/mpesa/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: targetNumber,
          amount: parseInt(amount) || 1,
          category: category
        })
      });
      // Wait for WebSocket success
    } catch (error) {
      alert("🔌 Connection failed.");
      resetSimulator();
    }
  };

  const resetSimulator = () => {
    window.speechSynthesis.cancel();
    setStep('dial');
    setInput('');
    setTargetNumber('');
    setAmount('');
    setCategory('General');
    setRiskData(null);
  };

  return (
    <>
      {/* Mode Switcher Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-cyan-500/50 z-50 p-4 flex justify-center items-center gap-4">
        <button
          onClick={() => setMode('ussd')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${
            mode === 'ussd' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📱 USSD Simulator
        </button>
        <button
          onClick={() => setMode('dashboard')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${
            mode === 'dashboard' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📊 Fraud Dashboard
        </button>
        
        {/* NEW: Voice Language Toggle */}
        <div className="ml-8 flex items-center gap-2 border border-slate-600 rounded-lg p-1 bg-slate-800">
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded text-sm font-bold ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            English
          </button>
          <button 
            onClick={() => setLang('sw')}
            className={`px-3 py-1 rounded text-sm font-bold ${lang === 'sw' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {mode === 'dashboard' && <Dashboard />}

      {/* USSD Simulator View */}
      {mode === 'ussd' && (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 pt-24">
      {/* Phone Container */}
      <div className="w-[350px] h-[700px] bg-black rounded-[50px] border-[12px] border-gray-800 shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Phone Speaker Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10">
          <div className="w-32 h-6 bg-gray-800 rounded-b-3xl"></div>
        </div>

        {/* Screen Area */}
        <div className="flex-1 mt-10 mb-4 mx-4 bg-[#111] rounded-lg p-4 border border-gray-700 font-mono text-sm relative overflow-y-auto">
          
          {/* Header */}
          <div className="text-gray-400 text-xs flex justify-between mb-4 border-b border-gray-700 pb-2">
            <span>SAFARICOM</span>
            <span className="text-blue-400">LINDA+ ACTIVE 🛡️</span>
          </div>

          {/* Dynamic USSD Screens */}
          <div className="text-white space-y-4">
            {step === 'dial' && (
              <div>
                <p className="text-gray-400 mb-2">Phone</p>
                <p className="text-3xl text-center mt-10 text-green-500">{input || '...'}</p>
              </div>
            )}

            {step === 'menu' && (
              <div>
                <p>M-PESA LINDA+</p>
                <ol className="list-decimal pl-4 mt-2 space-y-2 text-gray-300">
                  <li>Send Money</li>
                  <li>Withdraw Cash</li>
                  <li>Buy Airtime</li>
                  <li>Linda+ Settings</li>
                </ol>
                <p className="mt-6 text-green-500 font-bold animate-pulse">Reply: {input}</p>
              </div>
            )}

            {/* NEW: Category Screen */}
            {step === 'category' && (
              <div>
                <p className="text-cyan-400 font-bold mb-2">Linda+ Smart Spending</p>
                <p>Select Payment Category:</p>
                <ol className="list-decimal pl-4 mt-2 space-y-2 text-gray-300">
                  <li>General</li>
                  <li>Health & Bills</li>
                  <li className="text-orange-400">Betting (Restricted)</li>
                </ol>
                <p className="mt-6 text-green-500 font-bold animate-pulse">Reply: {input}</p>
              </div>
            )}

            {step === 'number' && (
              <div>
                <p className="text-xs text-cyan-500 mb-2">Category: {category.toUpperCase()}</p>
                <p>Enter Phone no.</p>
                <p className="mt-4 text-green-500 font-bold">Reply: {input}</p>
              </div>
            )}

            {step === 'amount' && (
              <div>
                <p>Enter Amount to send to {targetNumber}</p>
                <p className="mt-4 text-green-500 font-bold">Reply: {input}</p>
              </div>
            )}

            {/* UPDATED: Dynamic Warning Screen */}
            {step === 'warning' && (
              <div className="bg-red-950 p-3 rounded border border-red-500">
                <p className="text-red-500 font-bold flex items-center gap-2 text-lg">
                  <span>⚠️</span> FRAUD ALERT
                </p>
                <p className="mt-2 text-red-200">
                  Risk Score: <span className="font-bold text-white text-lg">{riskData?.risk_score}%</span>
                </p>
                <p className="mt-1 text-xs text-orange-300">
                  Reason: {riskData?.message.split(':')[1]}
                </p>
                <div className="mt-4 space-y-2 text-gray-300 border-t border-red-800 pt-2">
                  <p>1. Cancel (Safe)</p>
                  <p>2. Proceed anyway</p>
                </div>
                <p className="mt-4 text-red-400 font-bold animate-pulse">Reply: {input}</p>
              </div>
            )}

            {/* NEW: Hard Block Screen */}
            {step === 'blocked' && (
              <div className="bg-red-900 p-4 rounded border-2 border-red-500 text-center mt-10">
                <p className="text-4xl mb-2">🚫</p>
                <p className="text-white font-bold text-lg">BLOCKED</p>
                <p className="text-red-200 mt-2 text-xs">
                  LINDA+ Security has intercepted this transaction to protect your funds.
                </p>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center mt-20">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-green-500 font-bold">Connecting AI & M-PESA...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center mt-10 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
                  <span className="text-white text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Money Sent!</h2>
                <p className="text-gray-400">Ksh {amount} successfully sent to</p>
                <p className="text-green-500 font-bold text-lg">{targetNumber}</p>
                <p className="text-gray-500 text-xs mt-10 italic">Returning to home in 5s...</p>
              </div>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="h-[280px] bg-gray-900 p-4 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
            <button
              key={key}
              onClick={() => setInput(prev => prev + key)}
              className="bg-gray-800 text-white rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-green-600 transition-colors shadow-sm"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="h-20 bg-gray-900 px-4 flex gap-4 pb-6">
          <button 
            onClick={resetSimulator}
            className="flex-1 bg-red-600/80 text-white rounded-xl font-bold tracking-widest hover:bg-red-600 active:scale-95 transition-transform"
          >
            END
          </button>
          <button 
            onClick={handleNext}
            className="flex-1 bg-green-600 text-white rounded-xl font-bold tracking-widest hover:bg-green-500 active:scale-95 transition-transform"
          >
            SEND
          </button>
        </div>

      </div>
    </div>
      )}
    </>
  );
}

export default App;