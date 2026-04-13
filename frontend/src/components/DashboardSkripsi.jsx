import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

const MODEL_DESCRIPTIONS = {
  'A': 'Full Data / Window Size 60 / Baseline',
  'B': 'Full Data / Window Size 60 / Proposed',
  'C': 'Full Data / Window Size 60 / Optimized',
  'D': 'Full Data / Window Size 60 / Vanilla LSTM',
  'E': 'Cut Data / Window Size 30 / Baseline',
  'F': 'Cut Data / Window Size 60 / Baseline',
  'G': 'Cut Data / Window Size 60 / Optimized',
  'H': 'Cut Data / Window Size 30 / Optimized',
  'I': 'Full Data / Window Size 30 / Baseline',
  'J': 'Full Data / Window Size 30 / Optimized'
};

// Helper function to calculate date backwards (trading days only)
const getTradingDate = (offsetFromEnd) => {
  const date = new Date(2024, 11, 31); // Dec 31, 2024
  let daysToSubtract = 0;
  let validDaysCounted = 0;
  
  while (validDaysCounted < offsetFromEnd) {
    daysToSubtract++;
    const tempDate = new Date(2024, 11, 31 - daysToSubtract);
    const dayOfWeek = tempDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      validDaysCounted++;
    }
  }
  
  date.setDate(date.getDate() - daysToSubtract);
  
  // English US Format: Dec 31, 2024
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DashboardSkripsi = ({ isDarkMode }) => {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://jackprex-thesis-stocks-nopeakbar.hf.space/api/models');
        const result = await response.json();
        setModelData(result.data);
        
        if (result.data['A_B_models'] && result.data['A_B_models']['results_with_indicators']) {
            setSelectedModels(['A_B_models///results_with_indicators']);
        } else {
            const firstFolder = Object.keys(result.data)[0];
            const firstFile = Object.keys(result.data[firstFolder])[0];
            setSelectedModels([`${firstFolder}///${firstFile}`]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAllAvailableModels = () => {
    if (!modelData) return [];
    const models = [];
    Object.keys(modelData).forEach(folder => {
      Object.keys(modelData[folder]).forEach(file => {
        let modelLetter = "";
        
        if (folder === 'A_B_models') {
          if (file.includes('without_indicators')) {
            modelLetter = "A";
          } else {
            modelLetter = "B";
          }
        } else {
          modelLetter = folder.split('_')[0];
        }
        
        const displayName = `Model ${modelLetter}`;
        const description = MODEL_DESCRIPTIONS[modelLetter] || 'Unknown configuration';
        
        models.push({
          id: `${folder}///${file}`,
          folder: folder,
          file: file,
          displayName: displayName,
          description: description,
          modelLetter: modelLetter
        });
      });
    });
    return models.sort((a, b) => a.modelLetter.localeCompare(b.modelLetter));
  };

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  const formatChartData = () => {
    const availableModels = getAllAvailableModels();
    if (!modelData || availableModels.length === 0) return [];

    const firstModel = availableModels[0];
    const actualPrices = modelData[firstModel.folder][firstModel.file].actual_prices || [];
    const chartData = [];
    const minLen = actualPrices.length;
    const startIndex = Math.max(0, minLen - 100);

    for (let i = startIndex; i < minLen; i++) {
      const offsetFromEnd = actualPrices.length - 1 - i;
      const formattedDate = getTradingDate(offsetFromEnd);
      
      let rowData = { date: formattedDate, Actual: actualPrices[i] };
      
      selectedModels.forEach(modelId => {
        const [folder, file] = modelId.split('///');
        const preds = modelData[folder][file].predicted_prices;
        const modelInfo = availableModels.find(m => m.id === modelId);

        if (preds) {
          const currentModelIndex = preds.length - 1 - offsetFromEnd;
          if (currentModelIndex >= 0 && currentModelIndex < preds.length) {
            let value = preds[currentModelIndex];
            if (Array.isArray(value)) value = value[0];
            rowData[modelInfo.id] = value;
          } else {
            rowData[modelInfo.id] = null;
          }
        }
      });
      chartData.push(rowData);
    }
    return chartData;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center w-full h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className={`text-sm font-medium animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loading Model Data...</p>
        </div>
      </div>
    );
  }

  const chartData = formatChartData();
  const availableModels = getAllAvailableModels();

  return (
    <div className={`p-3 md:p-4 font-sans w-full min-h-screen lg:h-screen flex flex-col overflow-x-hidden lg:overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-[#f8fafc] text-slate-800'}`}>
      
      {/* Header Section */}
      <div className={`mb-3 relative overflow-hidden rounded-xl p-4 transition-all duration-300 w-full flex-shrink-0 ${
        isDarkMode ? 'border border-indigo-500/20 bg-slate-800/30 backdrop-blur-md' : 'border border-indigo-200 bg-white shadow-sm'
      }`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-cyan-400"></div>
        <div className={`absolute -right-10 -top-10 w-40 h-40 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${
          isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-400/15'
        }`}></div>
        <h2 className={`text-xl md:text-2xl font-extrabold relative z-10 transition-colors duration-300 tracking-tight ${
          isDarkMode ? 'text-white' : 'text-slate-800'
        }`}>
          Impact Analysis of Technical Features on NVIDIA Stock Price Prediction Accuracy
        </h2>
        <p className={`text-xs mt-1 font-medium tracking-wide flex items-center gap-1.5 relative z-10 transition-colors duration-300 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Using Bidirectional LSTM (Bi-LSTM) Algorithm
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full flex-1 min-h-0">
        
        {/* LEFT COLUMN: Model Selection */}
        <div className="w-full lg:w-1/4 flex flex-col flex-shrink-0 min-h-0 max-h-[40vh] lg:max-h-none">
          <div className={`p-3 rounded-xl border flex flex-col h-full transition-all duration-300 ${
            isDarkMode ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5 flex-shrink-0 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
              Select Configuration
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 w-full overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {availableModels.map((model) => {
                const isSelected = selectedModels.includes(model.id);
                return (
                  <label 
                    key={model.id} 
                    className={`flex items-start space-x-2.5 p-2 px-2.5 w-full rounded-lg border cursor-pointer transition-all duration-200 ease-in-out select-none ${
                      isSelected 
                        ? (isDarkMode 
                            ? 'bg-indigo-500/10 border-indigo-500/50'
                            : 'bg-indigo-50 border-indigo-400 shadow-sm')
                        : (isDarkMode 
                            ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/60'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                    }`}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-indigo-500 border-indigo-500' 
                        : (isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300')
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => handleModelToggle(model.id)}
                    />
                    
                    <div className="flex flex-col overflow-hidden w-full">
                      <span className={`text-[13px] font-bold tracking-wide truncate leading-tight ${
                        isSelected 
                          ? (isDarkMode ? 'text-indigo-300' : 'text-indigo-800') 
                          : (isDarkMode ? 'text-slate-300' : 'text-slate-700')
                      }`}>
                        {model.displayName}
                      </span>
                      
                      <span className={`mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded border w-fit transition-colors leading-none ${
                        isSelected
                          ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' : 'bg-indigo-100 border-indigo-200 text-indigo-700')
                          : (isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-500')
                      }`}>
                        {model.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline Info & Chart */}
        <div className="w-full lg:w-3/4 flex flex-col flex-1 gap-3 min-h-0">
          
          <div className={`rounded-xl border p-3 flex-shrink-0 transition-all duration-300 w-full ${
            isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
              <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Testing Data (80:20 Split)
              </h4>
              
              <div className="flex flex-row flex-wrap gap-3 mt-2 xl:mt-0">
                <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-1 h-5 rounded-full bg-indigo-500"></div>
                  <div className="flex flex-col justify-center">
                    <div className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Full Data (2018-2024)</div>
                    <div className={`text-[11px] font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Oct 11, '23 — Dec 31, '24</div>
                  </div>
                </div>
                <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-1 h-5 rounded-full bg-pink-500"></div>
                  <div className="flex flex-col justify-center">
                    <div className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>Cut Data (2021-2024)</div>
                    <div className={`text-[11px] font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>May 07, '24 — Dec 31, '24</div>
                  </div>
                </div>
              </div>
            </div>
            <p className={`text-[10px] mt-2 flex items-start gap-1 leading-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              *The difference in testing start dates occurs because the 20% validation portion of the smaller "Cut Data" yields fewer total days compared to the "Full Data".
            </p>
          </div>

          <div className={`flex-1 min-h-[350px] lg:min-h-0 w-full p-2 lg:p-4 rounded-xl border flex flex-col transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {selectedModels.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700/50 rounded-lg">
                <svg className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select a model to view the chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.7} vertical={false} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                    axisLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1' }} 
                    tickLine={false} 
                    dy={10} 
                    minTickGap={25}
                  />
                  
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${value}`} />
                  
                  <Tooltip 
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: '12px'
                    }}
                  />
                  
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} iconType="circle" iconSize={8} />
                  
                  <Line type="monotone" dataKey="Actual" name="Actual Price" stroke={isDarkMode ? "#ffffff" : "#020617"} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} zIndex={10} />
                  {selectedModels.map((modelId, index) => {
                    const modelInfo = availableModels.find(m => m.id === modelId);
                    return (
                      <Line key={modelId} type="monotone" dataKey={modelId} name={modelInfo.displayName} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} opacity={0.85} />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <div className={`mt-2 flex-shrink-0 text-center text-[10px] transition-colors duration-300 ${
        isDarkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>
        This dashboard is part of a Bachelor's Thesis Research on Stock Price Prediction using Bi-LSTM. Developed by Noveanto Nur Akbar - UPN "Veteran" Yogyakarta.
      </div>
      
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}} />
    </div>
  );
};

export default DashboardSkripsi;