import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [selectedNumber, setSelectedNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState(0);
  const [fraudData, setFraudData] = useState(null);
  const [riskLevel, setRiskLevel] = useState('safe');

  // Sample fraud network data - shows how scammers reuse SIM cards
  const fraudNetwork = {
    nodes: [
      { id: '0722123456', name: 'Unknown Sender', risk: 95, cluster: 'Ring Leader' },
      { id: '0722234567', name: 'Reseller Account', risk: 88, cluster: 'Ring Leader' },
      { id: '0722345678', name: 'Agent Account', risk: 82, cluster: 'Ring Leader' },
      { id: '0711111111', name: 'Low Risk', risk: 5, cluster: 'Legitimate' },
      { id: '0755555555', name: 'Moderate Risk', risk: 45, cluster: 'Gray Zone' },
    ],
    edges: [
      { source: '0722123456', target: '0722234567', transactions: 2400 },
      { source: '0722123456', target: '0722345678', transactions: 1800 },
      { source: '0722234567', target: '0722345678', transactions: 950 },
    ],
  };

  const calculateSafetyScore = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setSafetyScore(0);
      setRiskLevel('safe');
      return;
    }

    // Find matching node based on the last 7 digits
    const node = fraudNetwork.nodes.find(n => n.id.includes(phoneNumber.slice(-7)));
    
    if (node) {
      const score = 100 - node.risk;
      setSafetyScore(score);
      
      if (node.risk > 80) setRiskLevel('critical');
      else if (node.risk > 60) setRiskLevel('high');
      else if (node.risk > 40) setRiskLevel('medium');
      else if (node.risk > 20) setRiskLevel('low');
      else setRiskLevel('safe');
      
      setFraudData(node);
    } else {
      // Unknown number - moderate caution
      setSafetyScore(60);
      setRiskLevel('medium');
      setFraudData({ id: phoneNumber, name: 'Unknown Number', risk: 40, cluster: 'Unverified' });
    }
  };

  const handleNumberCheck = (e) => {
    e.preventDefault();
    calculateSafetyScore(selectedNumber);
  };

  const getRiskColor = () => {
    switch(riskLevel) {
      case 'critical': return 'from-red-600 to-red-900';
      case 'high': return 'from-orange-500 to-orange-700';
      case 'medium': return 'from-yellow-500 to-yellow-700';
      case 'low': return 'from-blue-500 to-blue-700';
      default: return 'from-green-500 to-green-700';
    }
  };

  const getRiskIcon = () => {
    switch(riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⏱️';
      case 'low': return '✅';
      default: return '✅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 pt-24">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          🛡️ LINDA+ FRAUD NETWORK INTELLIGENCE
        </h1>
        <p className="text-gray-400">Real-time fraud detection & network analysis dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Safety Score & Search */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Safety Score Meter */}
          <div className={`bg-gradient-to-br ${getRiskColor()} rounded-2xl p-8 shadow-2xl transition-all duration-500`}>
            <div className="text-center">
              <div className="text-5xl mb-4">{getRiskIcon()}</div>
              <h3 className="text-sm uppercase tracking-widest text-gray-200 mb-4">Safety Score</h3>
              
              {/* Circular Progress */}
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                  {/* Progress circle */}
                  <circle 
                    cx="60" cy="60" r="54" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="8"
                    strokeDasharray={`${safetyScore * 3.39} 339`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{safetyScore}%</span>
                </div>
              </div>

              <p className="text-sm capitalize font-semibold">{riskLevel} Risk</p>
            </div>
          </div>

          {/* Check Number Form */}
          <form onSubmit={handleNumberCheck} className="bg-slate-700/50 rounded-xl p-6 border border-cyan-500/30 backdrop-blur">
            <label className="block text-sm font-semibold mb-3 text-cyan-300">Check Phone Number</label>
            <input
              type="text"
              placeholder="07xx xxxx xx"
              value={selectedNumber}
              onChange={(e) => setSelectedNumber(e.target.value)}
              className="w-full bg-slate-800 border border-cyan-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 font-bold py-2 px-4 rounded-lg transition-all"
            >
              Analyze
            </button>
          </form>

          {/* Details Card */}
          {fraudData && (
            <div className="bg-slate-700/50 rounded-xl p-6 border border-orange-500/30 backdrop-blur">
              <h4 className="font-bold text-orange-300 mb-3">📋 Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Number:</span> {fraudData.id}</p>
                <p><span className="text-gray-400">Risk Score:</span> <span className="font-bold text-red-400">{fraudData.risk}%</span></p>
                <p><span className="text-gray-400">Cluster:</span> {fraudData.cluster}</p>
                <p><span className="text-gray-400">Status:</span> <span className="font-bold">{fraudData.name}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE & RIGHT: Network Graph */}
        <div className="lg:col-span-2">
          <div className="bg-slate-700/30 rounded-2xl p-8 border border-cyan-500/20 backdrop-blur-xl h-full min-h-[600px]">
            <h3 className="text-lg font-bold mb-6 text-cyan-300">🕸️ Fraud Network Topology</h3>
            
            {/* Simple Network Visualization */}
            <svg width="100%" height="500" className="border border-cyan-500/30 rounded-xl bg-slate-900/50">
              {/* Edges (connections between fraudsters) */}
              {fraudNetwork.edges.map((edge, i) => {
                const sourceNode = fraudNetwork.nodes.find(n => n.id === edge.source);
                const targetNode = fraudNetwork.nodes.find(n => n.id === edge.target);
                const sourceIdx = fraudNetwork.nodes.indexOf(sourceNode);
                const targetIdx = fraudNetwork.nodes.indexOf(targetNode);
                
                const x1 = 100 + (sourceIdx % 3) * 150;
                const y1 = 100 + Math.floor(sourceIdx / 3) * 150;
                const x2 = 100 + (targetIdx % 3) * 150;
                const y2 = 100 + Math.floor(targetIdx / 3) * 150;
                
                return (
                  <line
                    key={`edge-${i}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Nodes (fraudsters) */}
              {fraudNetwork.nodes.map((node, i) => {
                const x = 100 + (i % 3) * 150;
                const y = 100 + Math.floor(i / 3) * 150;
                const color = node.risk > 80 ? '#ef4444' : node.risk > 60 ? '#f97316' : node.risk > 40 ? '#eab308' : '#22c55e';
                
                return (
                  <g key={node.id}>
                    <circle cx={x} cy={y} r="35" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
                    <circle cx={x} cy={y} r="30" fill={color} opacity="0.4" stroke={color} strokeWidth="1" strokeDasharray="5,5"/>
                    <text x={x} y={y-8} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      {node.id.slice(-4)}
                    </text>
                    <text x={x} y={y+6} textAnchor="middle" fill="white" fontSize="9">
                      {node.risk}% risk
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg">
                <span className="font-bold text-red-300">🔴 Critical:</span> {fraudNetwork.nodes.filter(n => n.risk > 80).length} nodes
              </div>
              <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
                <span className="font-bold text-green-300">🟢 Safe:</span> {fraudNetwork.nodes.filter(n => n.risk < 20).length} nodes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Legend */}
      <div className="mt-12 bg-slate-700/30 rounded-xl p-6 border border-cyan-500/20 backdrop-blur">
        <h4 className="font-bold text-cyan-300 mb-4">📌 Smart Rules Engine</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="font-bold text-red-300">Block Rule</p>
              {/* FIXED ERROR HERE: Added curly braces around the > symbol */}
              <p className="text-sm text-gray-400">Risk {" > "} 80%: Transaction blocked automatically</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-300">Alert Rule</p>
              <p className="text-sm text-gray-400">Risk 60-80%: Show warning, allow user choice</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-300">Approve Rule</p>
              {/* FIXED ERROR HERE: Added curly braces around the < symbol */}
              <p className="text-sm text-gray-400">Risk {" < "} 20%: Proceed instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}