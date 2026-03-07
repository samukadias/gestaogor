import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fluxoApi } from '@/api/fluxoClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";

export default function ForcePasswordChangeModal() {
    const { user, login, logout } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Only show if the user is logged in AND has the must_change_password flag
    if (!user || user.must_change_password !== true) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (newPassword === '123' || newPassword === '1234') {
            toast.error("A nova senha não pode ser igual à senha padrão.");
            return;
        }

        setIsLoading(true);

        try {
            await fluxoApi.entities.User.update(user.id, {
                password: newPassword
            });

            toast.success("Senha alterada com sucesso! Bem-vindo(a).");

            // To properly clear the flag from context and local storage,
            // we simulate a clean re-login or manually mutate local storage & state.
            // The cleanest logic without complex state manipulation is to log out and ask to login again,
            // OR we can update the user object in localStorage and trigger a page reload.
            const storedUser = localStorage.getItem('fluxo_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.must_change_password = false;
                localStorage.setItem('fluxo_user', JSON.stringify(parsed));
                window.location.reload(); // Force full app reload to clear AuthContext state and remount ProtectedRoutes
            }

        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            toast.error("Erro ao alterar senha. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-amber-50 border-b border-amber-100 p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Atualização de Segurança</h2>
                    <p className="text-sm text-slate-600">
                        Detectamos que você está usando uma senha padrão. Por motivos de segurança, é necessário cadastrar uma nova senha para acessar o sistema.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirme a Nova Senha</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Repita a nova senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="pt-4 space-y-3 flex flex-col">
                        <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Atualizando...
                                </>
                            ) : (
                                "Salvar Nova Senha"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-700"
                            onClick={logout}
                            disabled={isLoading}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair do sistema
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
