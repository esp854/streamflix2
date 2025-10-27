import { Link } from "wouter";
import { Sparkles, TrendingUp } from "lucide-react";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  isPopular?: boolean;
}

const categories: Category[] = [
  { id: 28, name: "Action", icon: "🎬", color: "from-red-500 to-orange-500", description: "Films d'action palpitants", isPopular: true },
  { id: 35, name: "Comédie", icon: "😄", color: "from-yellow-500 to-orange-400", description: "Rires et bonne humeur" },
  { id: 18, name: "Drame", icon: "🎭", color: "from-purple-500 to-pink-500", description: "Histoires émouvantes" },
  { id: 27, name: "Horreur", icon: "👻", color: "from-gray-700 to-gray-900", description: "Frissons garantis", isPopular: true },
  { id: 878, name: "Sci-Fi", icon: "🚀", color: "from-blue-500 to-cyan-500", description: "Futur et technologies" },
  { id: 10749, name: "Romance", icon: "💖", color: "from-pink-500 to-rose-400", description: "Histoires d'amour" },
  { id: 16, name: "Animation", icon: "🎨", color: "from-green-500 to-teal-500", description: "Dessins animés créatifs" },
  { id: 14, name: "Fantastique", icon: "🧙", color: "from-indigo-500 to-purple-600", description: "Magie et aventures" },
  { id: 53, name: "Thriller", icon: "😨", color: "from-red-600 to-pink-600", description: "Suspense intense" },
  { id: 80, name: "Crime", icon: "🔍", color: "from-gray-600 to-slate-700", description: "Enquêtes policières" },
  { id: 12, name: "Aventure", icon: "🗺️", color: "from-emerald-500 to-green-600", description: "Explorations épiques" },
  { id: 10752, name: "Guerre", icon: "⚔️", color: "from-amber-600 to-orange-700", description: "Conflits historiques" },
];

export default function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background/95 to-muted/10 relative overflow-hidden" data-testid="category-grid">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground) / 0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header with staggered animations */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-primary/20 animate-pulse">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Découvrez</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-foreground" data-testid="category-grid-title">
            Parcourir par{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Genre
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10" />
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0 mb-6">
            Explorez notre vaste collection organisée par genres pour trouver exactement ce que vous cherchez
          </p>
          
          {/* Additional SEO content */}
          <div className="max-w-4xl mx-auto text-center mt-8 sm:mt-10">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Notre plateforme de streaming vous offre un accès illimité à une bibliothèque en constante 
              expansion de films et séries. Chaque genre est soigneusement sélectionné pour répondre aux 
              goûts les plus divers, des blockbusters aux pépites méconnues.
            </p>
          </div>
        </div>
        
        {/* Enhanced Grid with improved animations */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6" data-testid="category-grid-container">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:border-primary/40 transition-all duration-700 hover:scale-105 hover:rotate-1 hover:shadow-2xl hover:shadow-primary/10"
              data-testid={`category-card-${category.id}`}
              style={{
                animationDelay: `${index * 150}ms`,
                minHeight: '120px',
                animation: 'fadeInUp 0.6s ease-out both'
              }}
            >
              {/* Popular badge with enhanced styling */}
              {category.isPopular && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20 bg-gradient-to-r from-primary to-accent text-primary-foreground px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg" style={{
                  animation: 'bounce 2s ease-in-out infinite'
                }}>
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">HOT</span>
                </div>
              )}

              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-15 transition-all duration-700 scale-110 group-hover:scale-100`} />

              {/* Content with enhanced layout */}
              <div className="relative p-3 sm:p-4 md:p-6 h-full flex flex-col items-center justify-center text-center space-y-1 sm:space-y-2 md:space-y-3">
                {/* Icon with complex animations */}
                <div className="relative">
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl group-hover:scale-125 transition-all duration-700 group-hover:rotate-12 filter group-hover:drop-shadow-2xl relative z-10">
                    {category.icon}
                  </div>
                  {/* Icon glow effect */}
                  <div className={`absolute inset-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-xl scale-150`} style={{
                    background: `linear-gradient(to right, ${category.color.split(' ')[1]}, ${category.color.split(' ')[3]})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    {category.icon}
                  </div>
                </div>

                {/* Title with gradient hover effect */}
                <h3 className="text-foreground font-bold text-sm sm:text-base md:text-lg group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500" data-testid={`category-name-${category.id}`}>
                  {category.name}
                </h3>

                {/* Description with smooth reveal */}
                <p className="text-muted-foreground text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-3 group-hover:translate-y-0 max-w-24 sm:max-w-32 leading-tight">
                  {category.description}
                </p>

                {/* Multiple border effects */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-transparent group-hover:border-primary/40 transition-all duration-700" />
                <div className="absolute inset-1 sm:inset-2 rounded-lg sm:rounded-xl border border-transparent group-hover:border-primary/20 transition-all duration-700" style={{ transitionDelay: '100ms' }} />

                {/* Enhanced shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:animate-shine" style={{
                    transform: 'translateX(-150%) skewX(-12deg)',
                    transition: 'transform 1.2s ease-out'
                  }} />
                </div>

                {/* Pulsing effect on hover */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
              </div>
            </Link>
          ))}
        </div>
        
        {/* Enhanced call to action */}
        <div className="text-center mt-8 sm:mt-12 md:mt-16">
          <div className="inline-block p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/50 mx-4 sm:mx-0">
            <p className="text-muted-foreground mb-4 sm:mb-6 text-base sm:text-lg">
              Vous ne trouvez pas ce que vous cherchez ?
            </p>
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-105 hover:-translate-y-1 text-sm sm:text-base"
            >
              <span className="text-lg sm:text-xl group-hover:animate-pulse">🔍</span>
              <span>Utiliser la recherche avancée</span>
              <div className="w-0 group-hover:w-2 h-2 bg-white/50 rounded-full transition-all duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
