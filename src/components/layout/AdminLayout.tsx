import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ShoppingBag,
    Users,
    Package,
    LogOut,
    Menu,
    X,
    Bell,
    Archive
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MobileNavBar } from './MobileNavBar';
import { GlobalFab } from './GlobalFab';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Orçamentos', path: '/budgets' },
        { icon: ShoppingBag, label: 'Pedidos', path: '/orders' },
        { icon: Package, label: 'Produtos', path: '/products' },
        { icon: Archive, label: 'Estoque', path: '/inventory' },
        { icon: Users, label: 'Clientes', path: '/customers' },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-4 border-b border-slate-100">
                        <div className="w-11 h-11 mr-3 flex items-center justify-center">
                            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">Delícias da Dri</span>
                        <button
                            className="ml-auto lg:hidden text-slate-400"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon size={18} className={`mr-3 ${isActive(item.path) ? 'text-rose-600' : 'text-slate-400'}`} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Bottom Actions */}
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={18} className="mr-3" />
                            Sair do Sistema
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-10">
                    <button
                        className="lg:hidden p-2 -ml-2 text-slate-600"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center ml-auto space-x-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 pb-24 lg:pb-8 relative">
                    <div className="max-w-7xl mx-auto w-full h-full">
                        {children}
                    </div>
                    <GlobalFab />
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNavBar items={menuItems} />
            </div>
        </div>
    );
};

export default AdminLayout;
