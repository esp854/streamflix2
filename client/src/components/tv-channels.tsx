import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Home, Play, Pause, Volume2, Maximize, Star, StarOff, Tv, Search, Filter, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TVChannel {
  id: string;
  name: string;
  url: string;
  logo: string;
  category: string;
  language: string;
  isFavorite: boolean;
  country: string;
}

const TVChannels: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [channels, setChannels] = useState<TVChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<TVChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Liste des catégories de chaînes
  const categories = [
    'all',
    'general',
    'news',
    'sports',
    'movies',
    'music',
    'kids',
    'documentary',
    'entertainment',
    'français',
    'international'
  ];

  // Liste des langues
  const languages = [
    'all',
    'français',
    'english',
    'español',
    'deutsch',
    'italiano'
  ];

  // Charger les chaînes depuis l'API Frembed
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        // Exemple d'appel API Frembed pour les chaînes TV
        // Note: L'URL exacte dépend de l'API Frembed - à ajuster selon la documentation
        // const response = await fetch('https://frembed.fun/api/live-channels');
        
        // if (!response.ok) {
        //   throw new Error('Failed to fetch TV channels');
        // }
        
        // const data = await response.json();
        
        // Transformer les données selon notre interface
        // const transformedChannels: TVChannel[] = data.map((channel: any) => ({
        //   id: channel.id,
        //   name: channel.name,
        //   url: channel.stream_url || `https://frembed.fun/live/${channel.id}`,
        //   logo: channel.logo || '/placeholder-channel.png',
        //   category: channel.category || 'general',
        //   language: channel.language || 'français',
        //   country: channel.country || 'FR',
        //   isFavorite: false
        // }));
        
        // setChannels(transformedChannels);
        // setFilteredChannels(transformedChannels);
        // setLoading(false);
        
        // En attendant que l'API fonctionne, utilisons des données de secours
        throw new Error('API Frembed non disponible');
      } catch (err) {
        console.error('Error fetching TV channels:', err);
        setError('Impossible de charger les chaînes TV. Veuillez réessayer plus tard.');
        setLoading(false);
        
        // Données de secours avec des chaînes populaires françaises
        const fallbackChannels: TVChannel[] = [
          {
            id: 'tf1',
            name: 'TF1',
            url: 'https://directfr.sbs/player/player.php?id=27',
            logo: 'https://example.com/tf1-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'france2',
            name: 'France 2',
            url: 'https://directfr.sbs/player/player.php?id=95',
            logo: 'https://example.com/france2-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: true
          },
          {
            id: 'fr3',
            name: 'France 3',
            url: 'https://directfr.sbs/player/player.php?id=96',
            logo: 'https://example.com/fr3-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'arte',
            name: 'ARTE',
            url: 'https://directfr.sbs/player/player.php?id=108',
            logo: 'https://example.com/arte-logo.png',
            category: 'documentary',
            language: 'français',
            country: 'FR',
            isFavorite: true
          },
          {
            id: 'm6',
            name: 'M6',
            url: 'https://directfr.sbs/player/player.php?id=39',
            logo: 'https://example.com/m6-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'c8',
            name: 'C8',
            url: 'https://directfr.sbs/player/player.php?id=104',
            logo: 'https://example.com/c8-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'w9',
            name: 'W9',
            url: 'https://directfr.sbs/player/player.php?id=105',
            logo: 'https://example.com/w9-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'tmc',
            name: 'TMC',
            url: 'https://directfr.sbs/player/player.php?id=106',
            logo: 'https://example.com/tmc-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'tfx',
            name: 'TFX',
            url: 'https://directfr.sbs/player/player.php?id=107',
            logo: 'https://example.com/tfx-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'nrj12',
            name: 'NRJ 12',
            url: 'https://directfr.sbs/player/player.php?id=109',
            logo: 'https://example.com/nrj12-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'france4',
            name: 'France 4',
            url: 'https://directfr.sbs/player/player.php?id=97',
            logo: 'https://example.com/france4-logo.png',
            category: 'general',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'bfm',
            name: 'BFM TV',
            url: 'https://directfr.sbs/player/player.php?id=98',
            logo: 'https://example.com/bfm-logo.png',
            category: 'news',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'cnews',
            name: 'CNews',
            url: 'https://directfr.sbs/player/player.php?id=99',
            logo: 'https://example.com/cnews-logo.png',
            category: 'news',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'lci',
            name: 'LCI',
            url: 'https://directfr.sbs/player/player.php?id=100',
            logo: 'https://example.com/lci-logo.png',
            category: 'news',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'boomerang',
            name: 'Boomerang',
            url: 'https://directfr.sbs/player/player.php?id=94',
            logo: 'https://example.com/boomerang-logo.png',
            category: 'kids',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'cartoonnetwork',
            name: 'Cartoon Network',
            url: 'https://directfr.sbs/player/player.php?id=28',
            logo: 'https://example.com/cartoonnetwork-logo.png',
            category: 'kids',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'syfy',
            name: 'Syfy',
            url: 'https://directfr.sbs/player/player.php?id=29',
            logo: 'https://example.com/syfy-logo.png',
            category: 'entertainment',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'gameone',
            name: 'Game One',
            url: 'https://directfr.sbs/player/player.php?id=10',
            logo: 'https://example.com/gameone-logo.png',
            category: 'entertainment',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'mangas',
            name: 'Mangas',
            url: 'https://directfr.sbs/player/player.php?id=7',
            logo: 'https://example.com/mangas-logo.png',
            category: 'anime',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'tcm',
            name: 'TCM Cinéma',
            url: 'https://directfr.sbs/player/player.php?id=33',
            logo: 'https://example.com/tcm-logo.png',
            category: 'movies',
            language: 'français',
            country: 'FR',
            isFavorite: false
          },
          {
            id: 'ocscity',
            name: 'OCS City',
            url: 'https://directfr.sbs/player/player.php?id=23',
            logo: 'https://example.com/ocscity-logo.png',
            category: 'movies',
            language: 'français',
            country: 'FR',
            isFavorite: false
          }
        ];
        
        setChannels(fallbackChannels);
        setFilteredChannels(fallbackChannels);
      }
    };

    fetchChannels();
  }, []);

  // Filtrer les chaînes selon les critères
  useEffect(() => {
    let result = channels;
    
    // Filtrer par recherche
    if (searchTerm) {
      result = result.filter(channel => 
        channel.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      result = result.filter(channel => 
        channel.category === selectedCategory
      );
    }
    
    // Filtrer par langue
    if (selectedLanguage !== 'all') {
      result = result.filter(channel => 
        channel.language === selectedLanguage
      );
    }
    
    // Filtrer par favoris
    if (favoritesOnly) {
      result = result.filter(channel => channel.isFavorite);
    }
    
    setFilteredChannels(result);
  }, [searchTerm, selectedCategory, selectedLanguage, favoritesOnly, channels]);

  // Basculer le statut favori d'une chaîne
  const toggleFavorite = (channelId: string) => {
    setChannels(prevChannels => 
      prevChannels.map(channel => 
        channel.id === channelId 
          ? { ...channel, isFavorite: !channel.isFavorite } 
          : channel
      )
    );
  };

  // Sélectionner une chaîne
  const selectChannel = (channel: TVChannel) => {
    setSelectedChannel(channel);
    setIsPlaying(true);
  };

  // Gérer le volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  // Basculer la lecture/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Chargement des chaînes TV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erreur de chargement</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* En-tête */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Button>
            <div className="flex items-center gap-2">
              <Tv className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">Chaînes TV en Direct</h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une chaîne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Toutes les catégories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(language => (
                  <option key={language} value={language}>
                    {language === 'all' ? 'Toutes les langues' : language}
                  </option>
                ))}
              </select>
              
              <Button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                variant={favoritesOnly ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {favoritesOnly ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Favoris</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {selectedChannel ? (
          // Lecteur de chaîne sélectionnée
          <div className="mb-8">
            <div className="bg-black rounded-lg overflow-hidden shadow-xl">
              {/* Lecteur vidéo */}
              <div className="relative w-full h-0 pb-[56.25%]"> {/* 16:9 aspect ratio */}
                <iframe
                  src={selectedChannel.url}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={`${selectedChannel.name} - Streaming en direct`}
                  onError={(e) => {
                    console.error('Error loading iframe:', e);
                    setError('Impossible de charger le flux de cette chaîne.');
                  }}
                />
              </div>
              
              {/* Contrôles */}
              <div className="bg-gray-800 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={togglePlayPause}
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="w-24 accent-blue-500"
                    />
                    <span className="text-sm w-10">{volume}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={selectedChannel.logo} 
                      alt={selectedChannel.name} 
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <span className="font-semibold">{selectedChannel.name}</span>
                  </div>
                  
                  <Button
                    onClick={() => toggleFavorite(selectedChannel.id)}
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 ${selectedChannel.isFavorite ? 'text-yellow-400' : ''}`}
                  >
                    {selectedChannel.isFavorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">Favori</span>
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedChannel(null)}
                    variant="outline"
                    size="sm"
                  >
                    <Maximize className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Quitter le plein écran</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Liste des chaînes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold">
              {favoritesOnly ? 'Chaînes favorites' : 'Toutes les chaînes'} 
              <span className="text-gray-400 text-sm ml-2">({filteredChannels.length} chaînes)</span>
            </h2>
          </div>
          
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune chaîne trouvée</p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLanguage('all');
                  setFavoritesOnly(false);
                }}
                variant="outline"
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredChannels.map(channel => (
                <div 
                  key={channel.id}
                  className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105 ${
                    selectedChannel?.id === channel.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => selectChannel(channel)}
                >
                  <div className="aspect-video bg-gray-700 relative">
                    <img 
                      src={channel.logo} 
                      alt={channel.name} 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(channel.id);
                        }}
                        className={`text-lg ${channel.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
                        aria-label={channel.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {channel.isFavorite ? <Star className="w-5 h-5" /> : <StarOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{channel.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                        {channel.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {channel.language}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {channel.country}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVChannels;