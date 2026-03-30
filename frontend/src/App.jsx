import { useState } from 'react';

function App() {
  const [step, setStep] = useState('dial'); // dial, menu, number, amount, warning
  const [input, setInput] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [amount, setAmount] = useState('');

  const handleNext = () => {
    if (step === 'dial' && input === '*334#') {
      setStep('menu');
      setInput('');
    } else if (step === 'dial') {
      alert("Try dialing *334#");
    } else if (step === 'menu' && input === '1') {
      setStep('number');
      setInput('');
    } else if (step === 'number' && input.length >= 9) {
      setTargetNumber(input);
      setStep('amount');
      setInput('');
    } else if (step === 'amount' && input.length > 0) {
      setAmount(input);
      triggerFraudWarning();
    }
  };

  const triggerFraudWarning = () => {
    setStep('warning');
    
    // The "Magic" Voice Engine
    const msg = new SpeechSynthesisUtterance();
    msg.text = "Linda Plus Alert. Warning! The number you are sending money to has a high fraud risk. Press 1 to cancel, or 2 to proceed at your own risk.";
    msg.rate = 0.9; // Slightly slower for that serious "robotic AI" feel
    msg.lang = 'en-GB'; 
    window.speechSynthesis.speak(msg);
  };

  const resetSimulator = () => {
    window.speechSynthesis.cancel(); // Stop talking if they reset
    setStep('dial');
    setInput('');
    setTargetNumber('');
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Phone Container */}
      <div className="w-[350px] h-[700px] bg-black rounded-[50px] border-8 border-gray-800 shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Phone Speaker Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
          <div className="w-32 h-6 bg-gray-800 rounded-b-3xl"></div>
        </div>

        {/* Screen Area */}
        <div className="flex-1 mt-12 mb-4 mx-4 bg-gray-900 rounded-lg p-4 border border-gray-700 font-mono text-sm relative">
          
          {/* Header */}
          <div className="text-gray-400 text-xs flex justify-between mb-4 border-b border-gray-700 pb-2">
            <span>SAFARICOM</span>
            <span>LINDA+ ACTIVE 🛡️</span>
          </div>

          {/* Dynamic USSD Screens */}
          <div className="text-white space-y-4">
            {step === 'dial' && (
              <div>
                <p className="text-gray-400 mb-2">Phone</p>
                <p className="text-2xl text-center mt-10 text-safaricom-green">{input || 'Enter Number'}</p>
              </div>
            )}

            {step === 'menu' && (
              <div>
                <p>M-PESA LINDA+</p>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-gray-300">
                  <li>Send Money</li>
                  <li>Withdraw Cash</li>
                  <li>Buy Airtime</li>
                  <li>Linda+ Settings</li>
                </ol>
                <p className="mt-4 text-safaricom-green animate-pulse">Reply: {input}</p>
              </div>
            )}

            {step === 'number' && (
              <div>
                <p>Enter Phone no. (e.g. 0712345678)</p>
                <p className="mt-4 text-safaricom-green">Reply: {input}</p>
              </div>
            )}

            {step === 'amount' && (
              <div>
                <p>Enter Amount to send to {targetNumber}</p>
                <p className="mt-4 text-safaricom-green">Reply: {input}</p>
              </div>
            )}

            {step === 'warning' && (
              <div className="bg-red-900/50 p-3 rounded border border-red-500">
                <p className="text-red-400 font-bold flex items-center gap-2">
                  <span>⚠️</span> FRAUD WARNING
                </p>
                <p className="mt-2 text-red-200">
                  Sending Ksh {amount} to {targetNumber}.
                </p>
                <p className="mt-2 text-white">
                  This number is flagged in the Linda+ Network. 
                </p>
                <div className="mt-4 space-y-1 text-gray-300">
                  <p>1. Cancel (Safe)</p>
                  <p>2. Proceed anyway</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="h-64 bg-gray-900 p-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
            <button
              key={key}
              onClick={() => setInput(prev => prev + key)}
              className="bg-gray-800 text-white rounded-lg text-xl font-bold hover:bg-gray-700 active:bg-safaricom-green transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="h-20 bg-gray-900 px-4 flex gap-4 pb-6">
          <button 
            onClick={resetSimulator}
            className="flex-1 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
          >
            END
          </button>
          <button 
            onClick={handleNext}
            className="flex-1 bg-safaricom-green text-white rounded-full font-bold hover:bg-safaricom-dark"
          >
            {step === 'dial' ? 'CALL' : 'SEND'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;