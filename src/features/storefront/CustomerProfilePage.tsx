import React, { useState, useEffect } from 'react';
import { User, Lock, MapPin, Save, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Página de perfil do cliente.
 * Permite editar dados pessoais, senha e endereço.
 */
const CustomerProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, clientProfile, signOut, refreshProfile } = useAuth();

    // Dados pessoais
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Endereço
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Carregar dados do cliente
    useEffect(() => {
        if (clientProfile) {
            setName(clientProfile.name || '');
            setPhone(clientProfile.phone || '');
            setEmail(clientProfile.email || user?.email || '');
        }

        // Carregar endereço se existir
        loadAddress();
    }, [clientProfile, user]);

    const loadAddress = async () => {
        if (!clientProfile?.id) return;

        const { data } = await supabase
            .from('clients')
            .select('address, city, neighborhood, zip_code')
            .eq('id', clientProfile.id)
            .single();

        if (data) {
            setAddress(data.address || '');
            setCity(data.city || '');
            setNeighborhood(data.neighborhood || '');
            setZipCode(data.zip_code || '');
        }
    };

    const handleSaveProfile = async () => {
        if (!clientProfile?.id) return;

        setIsSavingProfile(true);

        const { error } = await supabase
            .from('clients')
            .update({
                name,
                phone,
                email,
                updated_at: new Date().toISOString(),
            })
            .eq('id', clientProfile.id);

        if (error) {
            toast.error('Erro ao salvar dados');
        } else {
            toast.success('Dados atualizados!');
            refreshProfile();
        }

        setIsSavingProfile(false);
    };

    const handleSaveAddress = async () => {
        if (!clientProfile?.id) return;

        setIsSavingAddress(true);

        const { error } = await supabase
            .from('clients')
            .update({
                address,
                city,
                neighborhood,
                zip_code: zipCode,
                updated_at: new Date().toISOString(),
            })
            .eq('id', clientProfile.id);

        if (error) {
            toast.error('Erro ao salvar endereço');
        } else {
            toast.success('Endereço atualizado!');
        }

        setIsSavingAddress(false);
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Preencha todos os campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsSavingPassword(true);

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            toast.error('Erro ao alterar senha');
        } else {
            toast.success('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }

        setIsSavingPassword(false);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1
                        className="text-3xl md:text-4xl font-semibold text-storefront-primary mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Meu Perfil
                    </h1>
                    <p className="text-storefront-chocolate/60">
                        Gerencie suas informações pessoais
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Dados Pessoais */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-storefront-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-storefront-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                                    <CardDescription>Suas informações de contato</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome completo</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="bg-storefront-primary hover:bg-storefront-primary/90"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSavingProfile ? 'Salvando...' : 'Salvar Dados'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-storefront-primary/10 rounded-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-storefront-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Endereço</CardTitle>
                                    <CardDescription>Para entregas e retiradas</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">CEP</Label>
                                    <Input
                                        id="zipCode"
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        placeholder="00000-000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Sua cidade"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={neighborhood}
                                    onChange={(e) => setNeighborhood(e.target.value)}
                                    placeholder="Seu bairro"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço completo</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Rua, número, complemento"
                                />
                            </div>
                            <Button
                                onClick={handleSaveAddress}
                                disabled={isSavingAddress}
                                className="bg-storefront-primary hover:bg-storefront-primary/90"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSavingAddress ? 'Salvando...' : 'Salvar Endereço'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Alterar Senha */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-storefront-primary/10 rounded-full flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-storefront-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Alterar Senha</CardTitle>
                                    <CardDescription>Atualize sua senha de acesso</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova senha</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Digite novamente"
                                />
                            </div>
                            <Button
                                onClick={handleChangePassword}
                                disabled={isSavingPassword}
                                variant="outline"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                {isSavingPassword ? 'Alterando...' : 'Alterar Senha'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Logout */}
                    <Card className="border-destructive/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Sair da conta</p>
                                    <p className="text-sm text-muted-foreground">
                                        Encerrar sessão neste dispositivo
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfilePage;
