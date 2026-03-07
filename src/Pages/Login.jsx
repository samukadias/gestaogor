import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import logo from '../assets/logo.svg';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError("Por favor, preencha todos os campos.");
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (!success) {
                setError("Email ou senha incorretos.");
            }
            // Context handles navigation on success
        } catch (error) {
            console.error(error);
            setError("Erro ao conectar ao servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-700/20 z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20" />

                <div className="relative z-20 text-white p-12 max-w-lg">
                    <img src={logo} alt="GOR Logo" className="h-16 w-auto mb-8 animate-fade-in" />
                    <h1 className="text-4xl font-bold mb-6 text-white tracking-tight">
                        Gestão GOR <br />
                        <span className="text-indigo-400">Simples e Eficiente.</span>
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Otimize o fluxo de trabalho da sua equipe com nossa plataforma integrada de gestão de contratos e demandas.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start lg:hidden mb-6">
                            <img src={logo} alt="GOR Logo" className="h-12 w-auto" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Entre com suas credenciais para acessar sua conta.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome@empresa.com"
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    Esqueceu a senha?
                                </a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                <span className="flex items-center justify-center">
                                    Entrar na Plataforma <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="pt-6 text-center text-xs text-slate-400 border-t border-slate-100">
                        &copy; {new Date().getFullYear()} GOR. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
}
