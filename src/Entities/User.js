import { fluxoApi } from '@/api/fluxoClient';

export class User {
    static STORAGE_KEY = "users_v1";

    // Mapear campos do banco para o formato da aplicação
    static mapFromDB(dbUser) {
        if (!dbUser) return null;
        return {
            id: dbUser.id,
            email: dbUser.email,
            password: dbUser.password,
            full_name: dbUser.full_name || dbUser.name,
            // Mantendo compatibilidade com código novo e antigo
            role: dbUser.role || 'user',
            perfil: dbUser.perfil || (dbUser.role ? dbUser.role.toUpperCase() : 'USER'),
            department: dbUser.department,
            profile_type: dbUser.profile_type,
            allowed_modules: dbUser.allowed_modules || [],

            nome_cliente: dbUser.nome_cliente,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
        };
    }

    // Mapear campos da aplicação para o banco
    static mapToDB(user) {
        return {
            email: user.email,
            password: user.password,
            name: user.full_name || user.name, // Garante que name seja preenchido
            role: user.role || (user.perfil ? user.perfil.toLowerCase() : 'user'),
            department: user.department,
            profile_type: user.profile_type,
            allowed_modules: user.allowed_modules,
        };
    }

    static async list() {
        try {
            const data = await fluxoApi.entities.User.list();
            return (data || []).map(o => this.mapFromDB(o));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw error;
        }
    }

    static async get(id) {
        try {
            const data = await fluxoApi.entities.User.get(id);
            return this.mapFromDB(data);
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            throw error;
        }
    }

    static async getByEmail(email) {
        try {
            // Usa list com filtro pois a API genérica não tem getByEmail direto
            const users = await fluxoApi.entities.User.list({ email });
            if (users && users.length > 0) {
                return this.mapFromDB(users[0]);
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            throw error;
        }
    }

    static async create(userData) {
        try {
            const dbData = this.mapToDB(userData);
            const data = await fluxoApi.entities.User.create(dbData);
            return this.mapFromDB(data);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    static async update(id, updates) {
        try {
            const dbData = this.mapToDB(updates);
            const data = await fluxoApi.entities.User.update(id, dbData);
            return this.mapFromDB(data);
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await fluxoApi.entities.User.delete(id);
            return true;
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            throw error;
        }
    }

    // Get current authenticated user data via JWT
    static async me() {
        try {
            const data = await fluxoApi.auth.me();
            return this.mapFromDB(data);
        } catch (error) {
            console.error('Erro ao buscar usuário atual:', error);
            return null;
        }
    }

    // Método de compatibilidade
    static async clear() {
        // Não implementado por segurança
        return true;
    }
}
