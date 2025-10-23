import React from 'react';
import { Link } from 'wouter';
import { Calendar, User, Tag } from 'lucide-react';
import OptimizedImage from '@/components/ui/optimized-image';

interface BlogPostCardProps {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image?: string;
  tags: string[];
  readTime: number;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ 
  id, 
  title, 
  excerpt, 
  author, 
  date, 
  image,
  tags,
  readTime
}) => {
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <article className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <OptimizedImage
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <time dateTime={date}>{formattedDate}</time>
          </div>
          
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{author}</span>
          </div>
          
          <span>{readTime} min de lecture</span>
        </div>
        
        <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2">
          <Link href={`/blog/${id}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </h2>
        
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {excerpt}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        
        <Link 
          href={`/blog/${id}`}
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
        >
          Lire l'article
          <svg 
            className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export default BlogPostCard;