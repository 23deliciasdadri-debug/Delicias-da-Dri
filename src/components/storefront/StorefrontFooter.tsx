import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';

/**
 * Footer compacto da vitrine pública.
 * Apenas contato, redes sociais e link para área do funcionário.
 */
const StorefrontFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-storefront-chocolate text-white py-6">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Logo & Copyright */}
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-storefront-primary-light">
                            Delícias da Dri
                        </span>
                        <span className="text-white/40 text-sm">
                            © {currentYear}
                        </span>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        <a
                            href="https://wa.me/5500000000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                        <a
                            href="https://instagram.com/deliciasdadri"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                        >
                            <Instagram className="h-4 w-4" />
                            <span className="hidden sm:inline">@deliciasdadri</span>
                        </a>
                        <span className="text-white/30">|</span>
                        <Link
                            to="/admin"
                            className="text-white/40 hover:text-white/60 transition-colors text-xs"
                        >
                            Funcionários
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default StorefrontFooter;
