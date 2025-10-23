import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mt-8 sm:mt-16 pb-24 sm:pb-8" data-testid="footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4 flex items-center" data-testid="footer-logo">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              StreamFlix
            </div>
            <p className="text-muted-foreground text-sm sm:text-base" data-testid="footer-description">
              Votre plateforme de streaming préférée pour films et séries en haute qualité.
            </p>
          </div>
          
          {/* Navigation Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-3 sm:mb-4 text-sm sm:text-base" data-testid="footer-navigation-title">Navigation</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-home">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/category/28" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-films">
                  Films
                </Link>
              </li>
              <li>
                <Link href="/category/10770" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-series">
                  Séries
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-list">
                  Ma Liste
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-3 sm:mb-4 text-sm sm:text-base" data-testid="footer-support-title">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-help">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-terms">
                  Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors duration-200 text-sm sm:text-base" data-testid="footer-link-privacy">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social Media */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-foreground font-semibold mb-3 sm:mb-4 text-sm sm:text-base" data-testid="footer-social-title">Suivez-nous</h3>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200" data-testid="social-link-facebook">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200" data-testid="social-link-twitter">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200" data-testid="social-link-instagram">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.596-3.205-1.534l1.658-1.375c.462.608 1.189 1.001 2.022 1.001.815 0 1.566-.421 2.022-1.136l1.658 1.375c-.757.938-1.908 1.669-3.155 1.669zm7.138 0c-1.247 0-2.398-.731-3.155-1.669l1.658-1.375c.456.715 1.207 1.136 2.022 1.136.833 0 1.56-.393 2.022-1.001l1.658 1.375c-.757.938-1.908 1.534-3.205 1.534zM12 14c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200" data-testid="social-link-youtube">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <hr className="border-border my-6 sm:my-8" />

        <div className="text-center text-muted-foreground" data-testid="footer-copyright">
          <p className="text-xs sm:text-sm">&copy; 2025 StreamFlix. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}