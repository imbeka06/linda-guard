import { useState } from 'react';

function App() {
  const [step, setStep] = useState('dial'); 
  const [input, setInput] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [amount, setAmount] = useState('');

  const handleNext = async () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu');
      setInput('');
    } else if (step === 'dial') {
      alert("Try dialing *334#");
      setInput('');
    } else if (step === 'menu' && input === '1') {
      setStep('number');
      setInput('');
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input);
      setStep('amount');
      setInput('');
    } else if (step === 'amount' && input.length > 0) {
      setAmount(input);
      setInput('');
      triggerFraudWarning();
    } else if (step === 'warning') {
      // THIS IS THE NEW LOGIC FOR THE WARNING SCREEN!
      if (input === '1') {
        alert("🛡️ Transaction Blocked! You are safe.");
        resetSimulator();
      } else if (input === '2') {
        setStep('processing');
        // Trigger the FastAPI Backend!
        try {
          await fetch('http://127.0.0.1:8001/api/mpesa/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: targetNumber,
              amount: parseInt(amount),
              category: "General"
            })
          });
        } catch (error) {
          console.error("Backend connection failed", error);
        }
      }
    }
  };

  const triggerFraudWarning = () => {
    setStep('warning');
    
    // The fixed Voice Engine
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clears any stuck audio
      const msg = new SpeechSynthesisUtterance("Linda Plus Alert. Warning! The number you are sending money to has a high fraud risk. Press 1 to cancel, or 2 to proceed.");
      window.speechSynthesis.speak(msg);
    }
  };

  const resetSimulator = () => {
    window.speechSynthesis.cancel();
    setStep('dial');
    setInput('');
    setTargetNumber('');
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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

            {step === 'number' && (
              <div>
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

            {step === 'warning' && (
              <div className="bg-red-950 p-3 rounded border border-red-500">
                <p className="text-red-500 font-bold flex items-center gap-2 text-lg">
                  <span>⚠️</span> FRAUD WARNING
                </p>
                <p className="mt-2 text-red-200">
                  Sending Ksh {amount} to {targetNumber}.
                </p>
                <p className="mt-2 text-white font-bold">
                  This number is flagged in the Linda+ Network!
                </p>
                <div className="mt-4 space-y-2 text-gray-300 border-t border-red-800 pt-2">
                  <p>1. Cancel (Safe)</p>
                  <p>2. Proceed anyway</p>
                </div>
                <p className="mt-4 text-red-400 font-bold animate-pulse">Reply: {input}</p>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center mt-20">
                <p className="text-green-500 font-bold animate-pulse text-lg">Pushing to M-PESA...</p>
                <p className="text-gray-400 mt-4">Check your phone screen.</p>
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
  );
}

export default App;