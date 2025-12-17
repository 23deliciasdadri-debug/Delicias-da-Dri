/**
 * SettingsPage - Página de Configurações
 * Permite gerenciar perfil do usuário e configurações do sistema
 */

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Camera, Save, Loader2, Key, Shield, Bell } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabaseClient';

const profileFormSchema = z.object({
    full_name: z.string().min(1, 'Informe seu nome completo'),
    phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    // Estado local para preferências de notificação
    const [notifications, setNotifications] = useState({
        notify_new_orders: profile?.notify_new_orders ?? true,
        notify_approved_quotes: profile?.notify_approved_quotes ?? true,
        notify_delivery_reminder: profile?.notify_delivery_reminder ?? true,
    });

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
        },
    });

    // Atualiza formulário quando profile muda
    const resetForm = useCallback(() => {
        form.reset({
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
        });
        // Atualiza notificações
        setNotifications({
            notify_new_orders: profile?.notify_new_orders ?? true,
            notify_approved_quotes: profile?.notify_approved_quotes ?? true,
            notify_delivery_reminder: profile?.notify_delivery_reminder ?? true,
        });
    }, [form, profile]);

    // Atualiza formulário quando profile muda
    useEffect(() => {
        if (profile) {
            form.reset({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
            });
            setNotifications({
                notify_new_orders: profile.notify_new_orders ?? true,
                notify_approved_quotes: profile.notify_approved_quotes ?? true,
                notify_delivery_reminder: profile.notify_delivery_reminder ?? true,
            });
        }
    }, [profile, form]);

    // Handler para salvar preferência de notificação
    const handleNotificationChange = async (
        key: 'notify_new_orders' | 'notify_approved_quotes' | 'notify_delivery_reminder',
        value: boolean
    ) => {
        if (!user?.id) return;

        // Atualiza estado local imediatamente
        setNotifications(prev => ({ ...prev, [key]: value }));
        setIsSavingNotifications(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ [key]: value })
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
        } catch (err) {
            // Reverte em caso de erro
            setNotifications(prev => ({ ...prev, [key]: !value }));
            toast({ title: 'Erro', description: 'Não foi possível salvar preferência', variant: 'destructive' });
        } finally {
            setIsSavingNotifications(false);
        }
    };

    const handleSaveProfile = form.handleSubmit(async (values) => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: values.full_name.trim(),
                    phone: values.phone?.trim() || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas com sucesso.' });
        } catch (err) {
            console.error('Erro ao salvar perfil:', err);
            const message = err instanceof Error ? err.message : 'Erro ao salvar perfil';
            toast({ title: 'Erro', description: message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    });

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        // Validações
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Erro', description: 'Selecione uma imagem válida', variant: 'destructive' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: 'Erro', description: 'A imagem deve ter no máximo 2MB', variant: 'destructive' });
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar.${fileExt}`;

            // Upload para storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Obter URL pública com timestamp para bust cache
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const avatarUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

            // Atualizar profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrlWithTimestamp })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            toast({ title: 'Avatar atualizado', description: 'Sua foto foi alterada com sucesso.' });
        } catch (err) {
            console.error('Erro ao fazer upload do avatar:', err);
            const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
            toast({ title: 'Erro', description: message, variant: 'destructive' });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const userInitials = profile?.full_name
        ?.split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U';

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground mt-1">Gerencie suas preferências e informações de perfil</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Segurança
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notificações
                    </TabsTrigger>
                </TabsList>

                {/* Tab Perfil */}
                <TabsContent value="profile" className="space-y-6">
                    {/* Card Avatar */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Foto de Perfil</CardTitle>
                            <CardDescription>Sua foto será exibida no menu e em outras áreas do sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                    disabled={isUploadingAvatar}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Clique no ícone da câmera para alterar sua foto
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card Informações */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Atualize suas informações de contato</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name" className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Nome Completo
                                        </Label>
                                        <Input
                                            id="full_name"
                                            {...form.register('full_name')}
                                            placeholder="Seu nome completo"
                                        />
                                        {form.formState.errors.full_name && (
                                            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            E-mail
                                        </Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Telefone
                                        </Label>
                                        <Input
                                            id="phone"
                                            {...form.register('phone')}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Segurança */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription>
                                Para alterar sua senha, utilize a opção de recuperação pelo e-mail
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (!user?.email) return;
                                    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                        redirectTo: `${window.location.origin}/auth/reset-password`,
                                    });
                                    if (error) {
                                        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
                                    } else {
                                        toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
                                    }
                                }}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar E-mail de Redefinição
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Notificações */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Preferências de Notificação
                            </CardTitle>
                            <CardDescription>
                                Configure quais notificações deseja receber
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Novos pedidos</p>
                                    <p className="text-sm text-muted-foreground">Receber alerta quando um novo pedido for criado</p>
                                </div>
                                <Switch
                                    checked={notifications.notify_new_orders}
                                    onCheckedChange={(v) => handleNotificationChange('notify_new_orders', v)}
                                    disabled={isSavingNotifications}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Orçamentos aprovados</p>
                                    <p className="text-sm text-muted-foreground">Receber alerta quando um orçamento for aprovado</p>
                                </div>
                                <Switch
                                    checked={notifications.notify_approved_quotes}
                                    onCheckedChange={(v) => handleNotificationChange('notify_approved_quotes', v)}
                                    disabled={isSavingNotifications}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Lembretes de entrega</p>
                                    <p className="text-sm text-muted-foreground">Receber lembrete no dia anterior à entrega</p>
                                </div>
                                <Switch
                                    checked={notifications.notify_delivery_reminder}
                                    onCheckedChange={(v) => handleNotificationChange('notify_delivery_reminder', v)}
                                    disabled={isSavingNotifications}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
