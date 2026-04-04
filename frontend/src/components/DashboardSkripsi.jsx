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
        console.error("Gagal nge-fetch data:", error);
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
        const description = MODEL_DESCRIPTIONS[modelLetter] || 'Konfigurasi tidak diketahui';
        
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
      let rowData = { day: `Day ${i + 1}`, Actual: actualPrices[i] };
      selectedModels.forEach(modelId => {
        const [folder, file] = modelId.split('///');
        const preds = modelData[folder][file].predicted_prices;
        const modelInfo = availableModels.find(m => m.id === modelId);

        if (preds) {
          const offsetDariBelakang = actualPrices.length - 1 - i;
          const indexModelIni = preds.length - 1 - offsetDariBelakang;
          if (indexModelIni >= 0 && indexModelIni < preds.length) {
            let value = preds[indexModelIni];
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
      <div className={`flex flex-1 items-center justify-center w-full h-full min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className={`font-medium animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memuat Data Model Bi-LSTM...</p>
        </div>
      </div>
    );
  }

  const chartData = formatChartData();
  const availableModels = getAllAvailableModels();

  return (
    <div className={`pt-8 px-6 md:px-8 pb-6 font-sans w-full h-full min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-[#f8fafc] text-slate-800'}`}>
      
      {/* Header Section */}
      <div className={`mb-8 relative overflow-hidden rounded-2xl p-6 transition-all duration-300 w-full ${
        isDarkMode ? 'border border-indigo-500/20 bg-slate-800/30 backdrop-blur-md' : 'border border-indigo-200 bg-white shadow-sm'
      }`}>
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-cyan-400"></div>
        <div className={`absolute -right-20 -top-20 w-64 h-64 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${
          isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-400/15'
        }`}></div>
        <h2 className={`text-2xl md:text-3xl font-extrabold relative z-10 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-slate-800'
        }`}>
          Analisis Pengaruh Fitur Teknikal Terhadap Akurasi Prediksi Harga Saham NVIDIA
        </h2>
        <p className={`text-sm md:text-base mt-2 font-medium tracking-wide flex items-center gap-2 relative z-10 transition-colors duration-300 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Menggunakan Algoritma Bidirectional LSTM (Bi-LSTM)
        </p>
      </div>

      {/* Model Selection Section */}
      <div className="mb-6 z-10 w-full">
        <h3 className={`text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
          isDarkMode ? 'text-slate-500' : 'text-slate-600'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          Pilih Model Konfigurasi
        </h3>
        
        {/* PERUBAHAN UTAMA: Menggunakan CSS Grid agar responsif dan rata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 w-full">
          {availableModels.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            return (
              <label 
                key={model.id} 
                className={`flex items-start space-x-3 p-3 pr-4 w-full rounded-xl border cursor-pointer transition-all duration-300 ease-in-out select-none ${
                  isSelected 
                    ? (isDarkMode 
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] scale-[1.02]'
                        : 'bg-indigo-50 border-indigo-400 shadow-sm scale-[1.02]')
                    : (isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300')
                }`}
              >
                <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                  isSelected 
                    ? 'bg-indigo-500 border-indigo-500' 
                    : (isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300')
                }`}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <span className={`text-sm font-bold tracking-wide truncate ${
                    isSelected 
                      ? (isDarkMode ? 'text-indigo-300' : 'text-indigo-800') 
                      : (isDarkMode ? 'text-slate-300' : 'text-slate-700')
                  }`}>
                    {model.displayName}
                  </span>
                  
                  <span className={`mt-1.5 text-[11px] font-medium px-2 py-1 rounded-md border w-fit transition-colors ${
                    isSelected
                      ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' : 'bg-indigo-100 border-indigo-200 text-indigo-700')
                      : (isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')
                  }`}>
                    {model.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Chart Section */}
      {selectedModels.length === 0 ? (
        <div className={`flex-1 min-h-[300px] w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-800/20 border-slate-700/50' : 'bg-slate-100 border-slate-300'
        }`}>
          <svg className={`w-16 h-16 mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Centang minimal satu model di atas untuk merender grafik prediksi.</p>
        </div>
      ) : (
        <div className={`flex-1 min-h-[400px] w-full mt-4 p-4 md:p-6 transition-all duration-300 rounded-2xl ${
          isDarkMode ? 'bg-slate-900/40 border border-slate-800/60' : 'bg-white border border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
        }`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? "#334155" : "#e2e8f0"} 
                opacity={0.7} 
                vertical={false} 
              />
              <XAxis 
                dataKey="day" 
                tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                axisLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1' }}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                  borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                  borderRadius: '12px',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ fontWeight: 500 }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }}
                iconType="circle"
              />
              
              <Line 
                type="monotone" 
                dataKey="Actual" 
                name="Harga Asli (Actual)"
                stroke={isDarkMode ? "#ffffff" : "#020617"} 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ 
                  r: 6, 
                  fill: isDarkMode ? '#ffffff' : '#020617', 
                  stroke: isDarkMode ? '#0f172a' : '#ffffff', 
                  strokeWidth: 2 
                }}
                zIndex={10}
              />
              
              {selectedModels.map((modelId, index) => {
                const modelInfo = availableModels.find(m => m.id === modelId);
                return (
                  <Line 
                    key={modelId}
                    type="monotone" 
                    dataKey={modelId} 
                    name={modelInfo.displayName} 
                    stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                    strokeWidth={2.5} 
                    dot={false} 
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    opacity={0.85}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DashboardSkripsi;