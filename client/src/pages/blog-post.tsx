import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Calendar, User, Tag, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedImage from '@/components/ui/optimized-image';

// Mock data for blog posts
const mockBlogPosts = [
  {
    id: 'top-10-films-2025',
    title: 'Top 10 des films à ne pas manquer en 2025',
    excerpt: 'Découvrez notre sélection des films les plus attendus de l\'année 2025, des blockbusters aux pépites indépendantes.',
    content: `<p>L'année 2025 s'annonce particulièrement riche en sorties cinématographiques exceptionnelles. Des suites très attendues aux nouveaux talents, le cinéma continuera de nous surprendre tout au long de cette année.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">1. Avatar 3 : L'Origine</h2>
    <p>James Cameron revient avec la suite tant attendue de son univers pandoran. Après le triomphe mondial d'Avatar : La Voie de l'Eau, les attentes sont à leur comble pour ce troisième volet.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">2. Deadpool 3</h2>
    <p>L'irrévérencieux mercenaire rouge fait son entrée dans l'univers Marvel avec Ryan Reynolds toujours aussi drôle et déjanté. Cette fois, il pourrait même croiser un certain docteur mutant...</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">3. Furiosa : Une Saga Mad Max</h2>
    <p>Le spin-off de Mad Max : Fury Road nous emmène dans le passé de Furiosa avec Anya Taylor-Joy dans le rôle titre. George Miller continue d'explorer son univers post-apocalyptique avec brio.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">4. Captain America : Brave New World</h2>
    <p>Sam Wilson poursuit son évolution en tant que Captain America dans ce quatrième volet de la saga. Le film aborde des thèmes politiques contemporains avec une approche audacieuse.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">5. Dune : Partie Deux</h2>
    <p>Denis Villeneuve poursuit son adaptation épique du roman de Frank Herbert. Timothée Chalamet et Zendaya reviennent pour cette suite très attendue.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">6. Gladiator 2</h2>
    <p>Ridley Scott retourne dans l'arène avec ce digne successeur de son film culte. Paul Mescal incarne un nouveau héros dans ce récit de vengeance et d'honneur.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">7. Le Cinquième Élément 2</h2>
    <p>Luc Besson revisite son chef-d'œuvre culte des années 90 avec une suite ambitieuse. Bruce Willis pourrait bien retrouver son rôle emblématique dans cette aventure intergalactique.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">8. Mission : Impossible 8</h2>
    <p>Tom Cruise continue de défier la gravité et nos limites avec le huitième volet de la franchise. Des cascades spectaculaires et une intrigue haletante nous attendent.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">9. Jurassic World 4</h2>
    <p>Le parc à dinosaures rouvre ses portes pour une nouvelle aventure paléontologique. De nouvelles espèces et de nouveaux dangers menacent l'équilibre fragile entre homme et bête.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">10. Les Gardiens de la Galaxie Vol. 3</h2>
    <p>Le troisième volet de l'équipe spatiale la plus drôle de l'univers Marvel promet des émotions fortes et des adieux mémorables à certains personnages.</p>`,
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
    content: `<p>Netflix continue de dominer le paysage des séries télévisées avec un catalogue toujours plus impressionnant. En 2025, la plateforme dévoile plusieurs pépites qui promettent de captiver les spectateurs du monde entier.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">The Witcher : Saison 4</h2>
    <p>Geralt de Riv continue ses aventures dans cet univers fantastique basé sur les romans de Andrzej Sapkowski. La saison 4 promet de nouvelles quêtes et de nouveaux monstres à affronter.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">Stranger Things : Saison 5</h2>
    <p>La fin approche pour le groupe d'adolescents de Hawkins. Cette saison finale promet de répondre à toutes les questions restées en suspens depuis le début de la série.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">The Crown : Saison 7</h2>
    <p>Le règne d'Elizabeth II continue avec cette septième saison qui explore les années 90. Les tensions familiales et les événements politiques marquent cette période charnière.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">Ozark : Nouvelle Série Spin-off</h2>
    <p>Un an après la fin de la série originale, Netflix dévoile une série dérivée qui explore l'univers sombre des Byrde à travers une nouvelle histoire originale.</p>
    
    <h2 className="text-2xl font-bold mt-8 mb-4">La Casa de Papel : Saison 6</h2>
    <p>Le professeur et son équipe reviennent pour une nouvelle aventure criminelle. Cette saison explore les conséquences des actions passées des personnages emblématiques.</p>`,
    author: 'Marie Lambert',
    date: '2025-10-10',
    image: '/placeholder-blog-2.jpg',
    tags: ['séries', 'Netflix', '2025'],
    readTime: 12
  }
];

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Find the blog post by ID
  const post = mockBlogPosts.find(post => post.id === id);
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article non trouvé</h1>
          <Link href="/blog">
            <Button>Retour au blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/blog" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour au blog</span>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>{formattedDate}</time>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min de lecture</span>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            {post.title}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {post.excerpt}
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {post.tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
              >
                <Tag className="w-4 h-4" />
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="relative mb-12 rounded-xl overflow-hidden">
            <OptimizedImage
              src={post.image}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div 
          className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-em:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {/* Article Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{post.author}</p>
                <p className="text-sm text-muted-foreground">Auteur StreamFlix</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager l'article
            </Button>
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
            Articles similaires
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBlogPosts
              .filter(p => p.id !== post.id)
              .slice(0, 3)
              .map(relatedPost => (
                <div key={relatedPost.id} className="bg-background rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  {relatedPost.image && (
                    <div className="relative h-48 overflow-hidden">
                      <OptimizedImage
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      <Link href={`/blog/${relatedPost.id}`} className="hover:text-primary transition-colors">
                        {relatedPost.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {relatedPost.excerpt}
                    </p>
                    <Link 
                      href={`/blog/${relatedPost.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Lire l'article
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPostPage;