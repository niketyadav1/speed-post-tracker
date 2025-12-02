import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [savedTracking, setSavedTracking] = useState([]);

  // Load saved tracking from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedTracking')) || [];
    setSavedTracking(saved);
  }, []);

  const handleTrack = async (e) => {
    e. preventDefault();
    if (!trackingId. trim()) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/track/${trackingId}`);
      if (!response.ok) throw new Error('Tracking ID not found');
      
      const result = await response.json();
      setTrackingData(result. data);

      // Fetch history
      const historyResponse = await fetch(`http://localhost:5000/api/track/${trackingId}/history`);
      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        setHistory(historyResult.history);
      }

      // Save to localStorage
      const updated = savedTracking.filter(t => t.trackingId !== trackingId);
      updated.unshift({ trackingId, timestamp: new Date() });
      setSavedTracking(updated. slice(0, 10));
      localStorage.setItem('savedTracking', JSON.stringify(updated. slice(0, 10)));
    } catch (err) {
      setError(err.message);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const quickTrack = (id) => {
    setTrackingId(id);
    setTimeout(() => {
      document.getElementById('trackForm').dispatchEvent(new Event('submit'));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">🚚 India Speed Post Tracker</h1>
          <p className="text-orange-100 mt-2">Track your parcels in real-time with better UX</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form id="trackForm" onSubmit={handleTrack} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter your tracking ID (e.g., XX123456789IN)"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Tracking...' : 'Track'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              ❌ {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Tracking Status */}
            {trackingData && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📍 Current Status</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tracking ID</p>
                      <p className="text-xl font-bold text-gray-900">{trackingData.trackingId}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current Status</p>
                    <p className="text-2xl font-bold text-orange-600">{trackingData. status}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">📍 Location</p>
                      <p className="text-lg font-semibold text-gray-900">{trackingData. location}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">🕒 Last Updated</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(trackingData.lastUpdated).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Tracking History</h2>
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        {idx !== history.length - 1 && <div className="w-1 h-16 bg-gray-300"></div>}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-gray-900">{item.status}</p>
                        <p className="text-sm text-gray-600">{item.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.date).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Tracking */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📌 Recent Tracking</h3>
              <div className="space-y-2">
                {savedTracking. length > 0 ? (
                  savedTracking.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => quickTrack(track.trackingId)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition text-sm text-gray-700 hover:text-orange-600 font-medium"
                    >
                      {track.trackingId}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent tracking</p>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-3">❓ How to Track</h3>
              <ul className="text-sm space-y-2">
                <li>✓ Enter your tracking ID</li>
                <li>✓ Click the Track button</li>
                <li>✓ View real-time status</li>
                <li>✓ Check delivery history</li>
              </ul>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">✨ Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>⚡ Real-time tracking</li>
                <li>💾 Save tracking history</li>
                <li>📱 Mobile responsive</li>
                <li>🔄 Auto-refresh support</li>
                <li>📊 Delivery timeline</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2025 India Speed Post Tracker | Better UX for Indian Postal Services</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
