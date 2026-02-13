import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

import { supabase } from '../services/supabase';
import type { AuthState, User, Admin, UserRole } from '../types';

interface AuthContextType extends AuthState {
    signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    signUp: (data: any) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>(() => {
        // 1. Synchronous check for ADMIN session
        try {
            const adminSession = localStorage.getItem('admin_session');
            if (adminSession) {
                const admin = JSON.parse(adminSession);
                if (admin?.username) {
                    return {
                        user: admin as Admin,
                        role: (admin.role as UserRole) || 'admin',
                        isAuthenticated: true,
                        isLoading: false,
                    };
                }
            }
        } catch (e) {
            console.error('Auth Init Error (Admin)', e);
            localStorage.removeItem('admin_session');
        }

        // 2. Synchronous check for TEACHER session (Optimistic Persistence)
        // This solves the F5 Logout issue by instantly restoring visual state
        try {
            const teacherSession = localStorage.getItem('teacher_session');
            if (teacherSession) {
                const teacher = JSON.parse(teacherSession);
                if (teacher?.id && teacher?.email) {
                    // Start as authenticated based on local mirror
                    return {
                        user: teacher as User, // It's a User object snapshot
                        role: 'teacher',
                        isAuthenticated: true,
                        isLoading: false, // Immediate load!
                    };
                }
            }
        } catch (e) {
            console.error('Auth Init Error (Teacher)', e);
            localStorage.removeItem('teacher_session');
        }

        return {
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: true,
        };
    });

    const userRef = useRef<User | Admin | null>(null);
    const roleRef = useRef<string | null>(null);

    useEffect(() => {
        userRef.current = state.user;
        roleRef.current = state.role;
    }, [state.user, state.role]);

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) return null;
            if (profile && profile.active === false) {
                await supabase.auth.signOut();
                return 'disabled';
            }
            return profile as User;
        } catch (err) {
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            if (!mounted) return;

            // Admin is already handled by initial state synchronously.
            // Teacher is also "handled" optimistically, but we MUST validate with Supabase.

            // Only check Supabase if not Admin
            const isAdmin = localStorage.getItem('admin_session');
            if (isAdmin) return;

            try {
                // Get Supabase Session to validate the "Optimistic Teacher Session"
                const { data: { session } } = await supabase.auth.getSession();

                // If we have a cached teacher session but Supabase says NO session...
                const cachedTeacher = localStorage.getItem('teacher_session');

                if (!session) {
                    if (cachedTeacher) {
                        console.warn('Auth: Sessão espelhada inválida (Supabase recusou). Deslogando...');
                        localStorage.removeItem('teacher_session');
                        if (mounted) setState({ user: null, role: null, isAuthenticated: false, isLoading: false });
                    } else {
                        if (mounted) setState(prev => ({ ...prev, isLoading: false }));
                    }
                    return;
                }

                // If session exists, sync profile
                if (session && mounted) {
                    const profileData = await fetchUserProfile(session.user.id);

                    if (profileData === 'disabled') {
                        localStorage.removeItem('teacher_session'); // Clear mirror
                        if (mounted) setState(prev => ({ ...prev, isLoading: false }));
                        return;
                    }

                    if (profileData) {
                        // Valid session confirmed. Update state and mirror if needed.
                        if (mounted) {
                            setState({
                                user: profileData,
                                role: 'teacher',
                                isAuthenticated: true,
                                isLoading: false,
                            });
                            // Refresh mirror
                            localStorage.setItem('teacher_session', JSON.stringify(profileData));
                        }
                    }
                }
            } catch (err) {
                console.error('Auth Exception:', err);
                if (mounted) setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            if (event === 'INITIAL_SESSION') return;

            if (event === 'SIGNED_OUT') {
                setState(prev => {
                    if (prev.role === 'admin' || prev.role === 'super_admin') return prev;
                    // If supabase signs out, we must respect it and clear mirror
                    localStorage.removeItem('teacher_session');
                    return { user: null, role: null, isAuthenticated: false, isLoading: false };
                });
            } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                const userId = session.user.id;
                if (roleRef.current === 'admin' || roleRef.current === 'super_admin') return;

                if (roleRef.current === 'teacher' && userRef.current?.id === userId) {
                    // Just update mirror silently just in case
                    return;
                }

                const profileData = await fetchUserProfile(userId);
                if (mounted && profileData && profileData !== 'disabled') {
                    setState({
                        user: profileData,
                        role: 'teacher',
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    // Create Mirror on Auto-Login/Refresh
                    localStorage.setItem('teacher_session', JSON.stringify(profileData));
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (inputIdentifier: string, password: string) => {
        const identifier = inputIdentifier.trim();

        try {
            // 1. Admin Login
            const { data: rpcResult } = await supabase.rpc('handle_new_user', {
                p_username: identifier,
                p_password: password
            });

            if (rpcResult && rpcResult.success) {
                const adminData = rpcResult.admin;
                const sessionToken = rpcResult.session_token;
                const adminUser = {
                    ...adminData,
                    role: (adminData.role as UserRole) || 'admin',
                    session_token: sessionToken
                };
                localStorage.setItem('admin_session', JSON.stringify(adminUser));
                // Ensure teacher session is cleared if any
                localStorage.removeItem('teacher_session');

                setState({
                    user: adminUser,
                    role: adminUser.role,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return {};
            } else if (rpcResult && !rpcResult.success && rpcResult.message !== 'Usuário não encontrado') {
                return { error: rpcResult.message };
            }

            // 2. Teacher Login
            const isEmail = identifier.includes('@');
            let emailToUse = identifier;

            if (!isEmail) {
                const { data: userProfile, error: lookupError } = await supabase
                    .rpc('get_user_email_by_totvs', { p_totvs_number: identifier })
                    .single() as { data: { email: string; active: boolean } | null, error: any };

                if (lookupError || !userProfile) {
                    return { error: 'Usuário não encontrado. Se você é um professor, verifique seu número TOTVS.' };
                }
                if (userProfile.active === false) {
                    return { error: 'Sua conta foi desativada.' };
                }
                emailToUse = userProfile.email;
            }

            setState(prev => ({ ...prev, isLoading: true }));

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (authError) {
                setState(prev => ({ ...prev, isLoading: false }));
                return { error: authError.message === 'Invalid login credentials' ? 'Senha incorreta.' : authError.message };
            }

            if (authData.user) {
                const profileData = await fetchUserProfile(authData.user.id);

                if (!profileData || profileData === 'disabled') {
                    setState(prev => ({ ...prev, isLoading: false }));
                    return { error: 'Erro ao carregar perfil ou conta desativada.' };
                }

                // SUCCESS! Update State AND Create Local Mirror
                localStorage.setItem('teacher_session', JSON.stringify(profileData));

                setState({
                    user: profileData,
                    role: 'teacher',
                    isAuthenticated: true,
                    isLoading: false,
                });
            }

            return {};

        } catch (error: any) {
            setState(prev => ({ ...prev, isLoading: false }));
            return { error: error.message || 'Falha na autenticação' };
        }
    };

    const signOut = async () => {
        // Clear EVERYTHING
        localStorage.removeItem('admin_session');
        localStorage.removeItem('teacher_session'); // Remove mirror

        // Remove admin session from DB if needed
        if (state.role === 'admin' && state.user && 'session_token' in state.user) {
            supabase.from('admin_sessions').delete().eq('token', state.user.session_token).then(() => { });
        }

        await supabase.auth.signOut();
        setState({ user: null, role: null, isAuthenticated: false, isLoading: false });
    };

    // SignUp unchanged...
    const signUp = async (data: any) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (authError) return { error: authError.message };
        if (!authData.user) return { error: 'Erro ao criar usuário' };

        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                totvs_number: data.totvs_number,
                full_name: data.full_name,
                email: data.email,
                units: data.units,
                job_title: data.job_title,
                terms_accepted: data.terms_accepted,
                terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
                terms_version: data.terms_version || 'v1.0'
            });

        if (profileError) return { error: profileError.message };
        return {};
    };

    return (
        <AuthContext.Provider value={{ ...state, signIn, signOut, signUp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
