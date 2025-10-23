import React, { useState } from 'react';
import { Link } from 'wouter';
import { Search, Calendar, User, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BlogPostCard from '@/components/blog/blog-post-card';
import { useQuery } from '@tanstack/react-query';

// Mock data for blog posts
const mockBlogPosts = [
  {
    id: 'top-10-films-2025',
    title: 'Top 10 des films à ne pas manquer en 2025',
    excerpt: 'Découvrez notre sélection des films les plus attendus de l\'année 2025, des blockbusters aux pépites indépendantes.',
    content: 'Contenu complet de l\'article...',
    author: 'Jean Dupont',
    date: '2025-10-15',
    image: '/placeholder-blog-1.jpg',
    tags: ['films', '2025', 'blockbusters'],
    readTime: 8
  },
  {
    id: 'guide-series-netflix',
    title: 'Guide des meilleures séries Netflix à regarder en 2025',
    excerpt: 'Notre sélection des séries Netflix qui vont marquer 2025, des nouveautés aux classiques à redécouvrir.',
    content: 'Contenu complet de l\'article...',
    author: 'Marie Lambert',
    date: '2025-10-10',
    image: '/placeholder-blog-2.jpg',
    tags: ['séries', 'Netflix', '2025'],
    readTime: 12
  },
  {
    id: 'critique-dune',
    title: 'Critique : Dune - Partie Deux, un chef-d\'œuvre cinématographique',
    excerpt: 'Analyse approfondie du dernier opus de Denis Villeneuve, entre spectacle visuel et profondeur narrative.',
    content: 'Contenu complet de l\'article...',
    author: 'Pierre Martin',
    date: '2025-10-05',
    image: '/placeholder-blog-3.jpg',
    tags: ['critique', 'Dune', 'cinéma'],
    readTime: 15
  },
  {
    id: 'tendances-streaming-2025',
    title: 'Les tendances du streaming en 2025 : ce qui change pour les spectateurs',
    excerpt: 'Zoom sur les évolutions du marché du streaming en 2025, des nouvelles plateformes aux contenus exclusifs.',
    content: 'Contenu complet de l\'article...',
    author: 'Sophie Bernard',
    date: '2025-09-28',
    image: '/placeholder-blog-4.jpg',
    tags: ['tendances', 'streaming', '2025'],
    readTime: 10
  },
  {
    id: 'interview-realisateur',
    title: 'Interview exclusive avec un réalisateur de science-fiction',
    excerpt: 'Rencontre avec un des talents montants du cinéma de science-fiction, à l\'occasion de la sortie de son dernier film.',
    content: 'Contenu complet de l\'article...',
    author: 'Thomas Petit',
    date: '2025-09-20',
    image: '/placeholder-blog-5.jpg',
    tags: ['interview', 'réalisateur', 'science-fiction'],
    readTime: 18
  },
  {
    id: 'films-famille-octobre',
    title: 'Les 5 films de famille parfaits pour octobre',
    excerpt: 'Notre sélection de films adaptés aux enfants et aux adultes pour des soirées cinéma en famille cet automne.',
    content: 'Contenu complet de l\'article...',
    author: 'Claire Moreau',
    date: '2025-09-15',
    image: '/placeholder-blog-6.jpg',
    tags: ['famille', 'films', 'octobre'],
    readTime: 6
  }
];

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(mockBlogPosts.flatMap(post => post.tags)));

  // Filter posts based on search and tag
  const filteredPosts = mockBlogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-secondary py-16 sm:py-24">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Blog StreamFlix
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
            Découvrez nos analyses, critiques et actualités sur les films et séries du moment
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher des articles..."
                className="pl-10 py-6 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tag Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                onClick={() => setSelectedTag(null)}
                className="rounded-full"
              >
                Tous
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  onClick={() => setSelectedTag(tag)}
                  className="rounded-full"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Aucun article trouvé</h2>
              <p className="text-muted-foreground mb-6">
                Aucun article ne correspond à vos critères de recherche.
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedTag(null);
              }}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <BlogPostCard key={post.id} {...post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Restez informé
          </h2>
          <p className="text-muted-foreground mb-8">
            Inscrivez-vous à notre newsletter pour recevoir les dernières actualités du cinéma et nos recommandations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Votre email" 
              className="flex-1 py-6"
            />
            <Button className="py-6 px-8">
              S'inscrire
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;