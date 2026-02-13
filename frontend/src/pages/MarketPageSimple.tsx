import { useNavigate } from 'react-router-dom';

export const MarketPageSimple = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button 
        onClick={() => navigate('/home')}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        ← Back to Home
      </button>
      <h1 className="text-3xl font-bold">Market Prices</h1>
      <p className="mt-4">This is a simple test version of the market page.</p>
      <p className="mt-2">If you see this, the route is working!</p>
    </div>
  );
};
