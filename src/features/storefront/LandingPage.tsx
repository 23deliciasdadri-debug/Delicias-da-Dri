import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cake, Heart, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';

/**
 * Landing Page da vitrine pública.
 * Hero com imagem de fundo em tela cheia, textos centralizados.
 */
const LandingPage: React.FC = () => {
    const [waveOffset, setWaveOffset] = useState(0);

    // Animar wave horizontalmente baseado no scroll
    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;

            // Move para direita ao rolar para baixo, esquerda ao rolar para cima
            setWaveOffset(prev => {
                const newOffset = prev + delta * 0.5;
                // Limitar o offset para não ir longe demais
                return Math.max(-100, Math.min(100, newOffset));
            });

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col">
            {/* Hero Section - Full Screen with Background Image */}
            <section
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                style={{
                    backgroundImage: 'url("/bg site.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-16 sm:pt-0">
                    {/* Title - Playfair Display */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold text-storefront-primary mb-1 sm:mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Delícias
                    </h1>

                    {/* Subtitle - Dancing Script (cursive) */}
                    <p
                        className="text-2xl sm:text-3xl md:text-5xl text-storefront-chocolate mb-6 sm:mb-8"
                        style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                        feitas com amor
                    </p>

                    {/* Description */}
                    <p className="text-sm sm:text-base md:text-lg text-storefront-chocolate/70 mb-8 sm:mb-10 max-w-md sm:max-w-xl mx-auto leading-relaxed">
                        Bolos e doces artesanais preparados com ingredientes selecionados e muito carinho.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="w-full sm:w-auto bg-storefront-primary hover:bg-storefront-primary/90 text-white h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-full shadow-xl btn-press"
                        >
                            <Link to="/faca-seu-bolo">
                                <Cake className="mr-2 h-5 w-5" />
                                Faça o Seu Bolo
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-storefront-chocolate/20 text-storefront-chocolate h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-full hover:bg-white btn-press"
                        >
                            <Link to="/catalogo">
                                Ver Cardápio
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Wave separator with horizontal scroll animation */}
                <div
                    className="absolute bottom-0 left-0 right-0 transition-transform duration-100 ease-out"
                    style={{ transform: `translateX(${waveOffset}px)` }}
                >
                    {/* Extended wave SVG for smooth horizontal movement */}
                    <svg
                        viewBox="0 0 2880 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-[200%] h-16 md:h-24 -ml-[50%]"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 100V40C240 80 480 0 720 40C960 80 1200 0 1440 40C1680 80 1920 0 2160 40C2400 80 2640 0 2880 40V100H0Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-storefront-chocolate mb-4">
                            Por que escolher a <span className="text-storefront-primary">Delícias da Dri</span>?
                        </h2>
                        <p className="text-storefront-chocolate/60 max-w-2xl mx-auto">
                            Cada doce é preparado com ingredientes selecionados e muito carinho
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center p-6 rounded-2xl bg-storefront-cream/50 hover:bg-storefront-cream transition-colors">
                            <div className="w-16 h-16 bg-storefront-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Heart className="h-8 w-8 text-storefront-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-storefront-chocolate mb-2">
                                Feito com Amor
                            </h3>
                            <p className="text-storefront-chocolate/60">
                                Cada receita é preparada com dedicação e os melhores ingredientes
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="text-center p-6 rounded-2xl bg-storefront-cream/50 hover:bg-storefront-cream transition-colors">
                            <div className="w-16 h-16 bg-storefront-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Cake className="h-8 w-8 text-storefront-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-storefront-chocolate mb-2">
                                100% Personalizado
                            </h3>
                            <p className="text-storefront-chocolate/60">
                                Criamos o bolo dos seus sonhos do jeitinho que você imaginou
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="text-center p-6 rounded-2xl bg-storefront-cream/50 hover:bg-storefront-cream transition-colors">
                            <div className="w-16 h-16 bg-storefront-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Gift className="h-8 w-8 text-storefront-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-storefront-chocolate mb-2">
                                Entrega Especial
                            </h3>
                            <p className="text-storefront-chocolate/60">
                                Embalagem cuidadosa e entrega no dia e horário combinados
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - Faça seu Bolo */}
            <section className="py-16 md:py-24 bg-gradient-to-r from-storefront-primary to-storefront-primary/80">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                            <Sparkles className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Crie o bolo dos seus sonhos!
                        </h2>
                        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                            Use nossa ferramenta interativa com inteligência artificial para
                            montar e visualizar seu bolo personalizado antes de encomendar.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            className="bg-white text-storefront-primary hover:bg-white/90 h-14 px-8 text-lg rounded-full shadow-lg"
                        >
                            <Link to="/faca-seu-bolo">
                                <Cake className="mr-2 h-5 w-5" />
                                Faça o Seu Bolo
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* TODO: Add more sections */}
            {/* - Produtos em Destaque */}
            {/* - Categorias */}
            {/* - Como Encomendar */}
            {/* - Sobre Nós */}
            {/* - Depoimentos */}
        </div>
    );
};

export default LandingPage;
