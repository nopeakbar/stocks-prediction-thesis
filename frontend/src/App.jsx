import { useState } from 'react';
import DashboardSkripsi from './components/DashboardSkripsi'; // Sesuaikan path

function App() {
  // Default kita set ke Dark Mode (true)
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    // Background utama ngikutin state isDarkMode
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
      
      {/* Tombol Toggle Floating */}
      <div className="absolute top-6 right-6 md:right-8 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2.5 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 ${
            isDarkMode
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-black/50'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-slate-200/50'
          }`}
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? (
            // Icon Matahari buat ganti ke Light Mode
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 3.22a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-3.22 4.22a1 1 0 010 1.415l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.415 0zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.22-3.22a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm3.22-4.22a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.415 0zM10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" /></svg>
          ) : (
            // Icon Bulan buat ganti ke Dark Mode
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </div>

      {/* Lempar state isDarkMode ke komponen dashboard */}
      <DashboardSkripsi isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;