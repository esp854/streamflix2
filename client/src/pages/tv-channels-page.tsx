import React from 'react';
import TVChannels from '@/components/tv-channels';
import { useAuthCheck } from '@/hooks/useAuthCheck';

const TVChannelsPage: React.FC = () => {
  const { shouldShowAds } = useAuthCheck();

  return (
    <div className="min-h-screen bg-gray-900">
      <TVChannels />
      
      {/* Section publicitaire (si nécessaire) */}
      {shouldShowAds && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">Espace publicitaire</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVChannelsPage;