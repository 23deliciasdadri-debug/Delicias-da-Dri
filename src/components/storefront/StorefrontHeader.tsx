import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, User, ChevronRight, Home, UtensilsCrossed, Cake, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useAuth } from '../../providers/AuthProvider';
import { useCart } from '../../providers/CartProvider';
import { cn } from '../../lib/utils';

/**
 * Header da vitrine pública.
 * Design mobile-first com menu elegante e animações suaves.
 */
const StorefrontHeader: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, profile, signOut } = useAuth();
    const { items } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const isStaff = profile?.role === 'employee' || profile?.role === 'admin';

    // Detectar scroll para mudar o fundo do header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: 'Início', icon: Home },
        { href: '/catalogo', label: 'Cardápio', icon: UtensilsCrossed },
        { href: '/faca-seu-bolo', label: 'Faça seu Bolo', icon: Cake },
    ];

    const handleSignOut = async () => {
        await signOut();
        setMobileMenuOpen(false);
        navigate('/');
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const isActiveLink = (href: string) => location.pathname === href;

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
                    isScrolled
                        ? 'bg-white/95 backdrop-blur-lg shadow-sm'
                        : 'bg-transparent'
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-storefront-primary to-storefront-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-lg sm:text-xl">🍰</span>
                            </div>
                            <span
                                className="text-lg sm:text-xl font-semibold text-storefront-primary hidden xs:inline"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                Delícias
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={cn(
                                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                                        isActiveLink(link.href)
                                            ? 'bg-storefront-primary/10 text-storefront-primary'
                                            : 'text-storefront-chocolate hover:text-storefront-primary hover:bg-storefront-cream/50'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right Side - Cart & User */}
                        <div className="flex items-center gap-2">
                            {/* Cart Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'relative w-10 h-10 rounded-full',
                                    isScrolled || location.pathname !== '/'
                                        ? 'text-storefront-chocolate hover:bg-storefront-cream/50'
                                        : 'text-storefront-chocolate hover:bg-white/20'
                                )}
                                onClick={() => navigate('/carrinho')}
                                aria-label="Carrinho"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-storefront-primary text-white text-[10px] flex items-center justify-center font-bold shadow-lg animate-in zoom-in">
                                        {cartItemCount > 9 ? '9+' : cartItemCount}
                                    </span>
                                )}
                            </Button>

                            {/* User Avatar/Login - Desktop */}
                            {session ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden sm:flex w-10 h-10 rounded-full"
                                    onClick={() => navigate('/perfil')}
                                >
                                    <Avatar className="h-8 w-8 ring-2 ring-storefront-primary/20">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-storefront-primary text-white text-xs font-medium">
                                            {getInitials(profile?.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="hidden sm:inline-flex rounded-full px-5 bg-storefront-primary hover:bg-storefront-primary/90 text-white shadow-lg"
                                    onClick={() => navigate('/cadastro')}
                                >
                                    Entrar
                                </Button>
                            )}

                            {/* Mobile Menu Button */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild className="md:hidden">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-10 h-10 rounded-full text-storefront-chocolate"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-full max-w-[320px] p-0 bg-white">
                                    {/* Mobile Menu Header */}
                                    <div className="p-6 pb-4 border-b border-gray-100">
                                        {session ? (
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-14 w-14 ring-4 ring-storefront-primary/10">
                                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-storefront-primary text-white text-lg font-medium">
                                                        {getInitials(profile?.full_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-storefront-chocolate">
                                                        {profile?.full_name || 'Usuário'}
                                                    </p>
                                                    <p className="text-sm text-storefront-chocolate/50">
                                                        Bem-vindo(a)! 👋
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-storefront-chocolate mb-1">
                                                    Bem-vindo(a)!
                                                </p>
                                                <p className="text-sm text-storefront-chocolate/60">
                                                    Entre ou cadastre-se
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Links */}
                                    <nav className="p-4 space-y-1">
                                        {navLinks.map((link) => {
                                            const Icon = link.icon;
                                            return (
                                                <Link
                                                    key={link.href}
                                                    to={link.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={cn(
                                                        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all',
                                                        isActiveLink(link.href)
                                                            ? 'bg-storefront-primary text-white'
                                                            : 'text-storefront-chocolate hover:bg-storefront-cream'
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium">{link.label}</span>
                                                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                                </Link>
                                            );
                                        })}

                                        {/* User Links */}
                                        {session && (
                                            <>
                                                <div className="h-px bg-gray-100 my-3" />
                                                <Link
                                                    to="/meus-pedidos"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-storefront-chocolate hover:bg-storefront-cream transition-all"
                                                >
                                                    <ShoppingBag className="w-5 h-5" />
                                                    <span className="font-medium">Meus Pedidos</span>
                                                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                                </Link>
                                                <Link
                                                    to="/perfil"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-storefront-chocolate hover:bg-storefront-cream transition-all"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                    <span className="font-medium">Meu Perfil</span>
                                                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                                </Link>
                                            </>
                                        )}

                                        {isStaff && (
                                            <>
                                                <div className="h-px bg-gray-100 my-3" />
                                                <Link
                                                    to="/admin/dashboard"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-storefront-chocolate text-white transition-all"
                                                >
                                                    <User className="w-5 h-5" />
                                                    <span className="font-medium">Painel Admin</span>
                                                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                                </Link>
                                            </>
                                        )}
                                    </nav>

                                    {/* Bottom Actions */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white">
                                        {session ? (
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-full h-12 border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={handleSignOut}
                                            >
                                                Sair da Conta
                                            </Button>
                                        ) : (
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-full h-12"
                                                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                                                >
                                                    Entrar
                                                </Button>
                                                <Button
                                                    className="flex-1 rounded-full h-12 bg-storefront-primary hover:bg-storefront-primary/90"
                                                    onClick={() => { navigate('/cadastro'); setMobileMenuOpen(false); }}
                                                >
                                                    Cadastrar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            {/* Bottom Navigation for Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {[
                        { href: '/', label: 'Início', icon: Home },
                        { href: '/catalogo', label: 'Cardápio', icon: UtensilsCrossed },
                        { href: '/faca-seu-bolo', label: 'Criar', icon: Cake },
                        { href: '/carrinho', label: 'Carrinho', icon: ShoppingBag, badge: cartItemCount },
                        { href: session ? '/perfil' : '/login', label: session ? 'Perfil' : 'Entrar', icon: User },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center w-16 h-full relative transition-colors',
                                    isActive ? 'text-storefront-primary' : 'text-storefront-chocolate/50'
                                )}
                            >
                                <div className="relative">
                                    <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                                    {item.badge && item.badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-storefront-primary text-white text-[9px] flex items-center justify-center font-bold">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                                {isActive && (
                                    <span className="absolute top-0 w-8 h-0.5 bg-storefront-primary rounded-b-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default StorefrontHeader;
