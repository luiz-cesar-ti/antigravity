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
        // Synchronous check for admin session to prevent race conditions
        try {
            const adminSession = localStorage.getItem('admin_session');
            if (adminSession) {
                const admin = JSON.parse(adminSession);
                if (admin?.username) {
                    return {
                        user: admin as Admin,
                        role: (admin.role as UserRole) || 'admin',
                        isAuthenticated: true,
                        isLoading: false, // Start as loaded if we have admin
                    };
                }
            }
        } catch (e) {
            console.error('Auth Init Error', e);
            localStorage.removeItem('admin_session');
        }

        return {
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: true,
        };
    });

    // Refs to track current state for the persistent onAuthStateChange listener
    // avoiding stale closures without re-triggering the effect.
    const userRef = useRef<User | Admin | null>(null);
    const roleRef = useRef<string | null>(null);

    // Sync refs with state
    useEffect(() => {
        userRef.current = state.user;
        roleRef.current = state.role;
    }, [state.user, state.role]);

    // Helper to fetch and set profile
    const fetchUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Profile fetch error:', error);
                return null;
            }

            if (profile && profile.active === false) {
                await supabase.auth.signOut();
                return 'disabled';
            }

            return profile as User;
        } catch (err) {
            console.error('Exception in fetchUserProfile:', err);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        // FAIL-SAFE: If loading takes too long, force it to stop
        const loadingTimeout = setTimeout(() => {
            if (mounted) {
                setState(prev => {
                    if (prev.isLoading) {
                        console.warn('AuthContext: Loading timeout reached');
                        return { ...prev, isLoading: false };
                    }
                    return prev;
                });
            }
        }, 10000);

        const checkSession = async () => {
            if (!mounted) return;
            try {
                // 1. Admin Session (Local & Fast)
                const adminSession = localStorage.getItem('admin_session');
                if (adminSession) {
                    try {
                        const admin = JSON.parse(adminSession);
                        if (admin?.username) {
                            setState({
                                user: admin as Admin,
                                role: (admin.role as UserRole) || 'admin',
                                isAuthenticated: true,
                                isLoading: false,
                            });
                            return;
                        }
                    } catch (e) {
                        localStorage.removeItem('admin_session');
                    }
                }

                // 2. Supabase Session
                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    const profileData = await fetchUserProfile(session.user.id);

                    if (profileData === 'disabled') {
                        setState(prev => ({ ...prev, isLoading: false }));
                        return;
                    }

                    if (profileData && mounted) {
                        setState({
                            user: profileData,
                            role: 'teacher',
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } else {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else if (mounted) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Session check failed:', error);
                if (mounted) setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('Auth event:', event, !!session);

            if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
                setState(prev => {
                    if (prev.role === 'admin' || prev.role === 'super_admin') return { ...prev, isLoading: false };
                    if (prev.user === null && prev.isLoading === false) return prev;
                    return { user: null, role: null, isAuthenticated: false, isLoading: false };
                });
            } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
                // BAILOUT: If we are already authenticated as the same teacher, do nothing
                if (roleRef.current === 'teacher' && userRef.current?.id === session.user.id) {
                    setState(prev => {
                        if (prev.isAuthenticated === true && prev.isLoading === false) return prev;
                        return { ...prev, isAuthenticated: true, isLoading: false };
                    });
                    return;
                }

                // If it's an admin, we don't fetch teacher profile
                if (roleRef.current === 'admin') {
                    setState(prev => {
                        if (prev.isLoading === false) return prev;
                        return { ...prev, isLoading: false };
                    });
                    return;
                }

                const profileData = await fetchUserProfile(session.user.id);
                if (mounted) {
                    if (profileData === 'disabled') {
                        setState(prev => ({ ...prev, isLoading: false }));
                    } else if (profileData) {
                        setState(prev => {
                            // Identity check before update
                            if (prev.user?.id === profileData.id && JSON.stringify(prev.user) === JSON.stringify(profileData) && prev.isLoading === false) {
                                return prev;
                            }
                            return {
                                user: profileData,
                                role: 'teacher',
                                isAuthenticated: true,
                                isLoading: false,
                            };
                        });
                    } else {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            } else {
                if (mounted) {
                    setState(prev => {
                        if (prev.isLoading === false) return prev;
                        return { ...prev, isLoading: false };
                    });
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(loadingTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (inputIdentifier: string, password: string) => {
        const identifier = inputIdentifier.trim();

        try {
            // 1. Try Admin Login (Via Secure RPC)
            // Uses new secure function that handles session creation server-side
            const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_login_secure', {
                p_username: identifier,
                p_password: password
            });

            if (rpcError) {
                console.error('RPC Login Error:', rpcError);
                // Continue to teacher login if RPC fails
            }

            if (rpcResult && rpcResult.success) {
                const adminData = rpcResult.admin;
                const sessionToken = rpcResult.session_token;

                if (!sessionToken) {
                    return { error: 'Erro de protocolo: Token de sessão não recebido.' };
                }

                const adminUser = {
                    ...adminData,
                    role: (adminData.role as UserRole) || 'admin',
                    session_token: sessionToken
                };

                localStorage.setItem('admin_session', JSON.stringify(adminUser));
                setState({
                    user: adminUser,
                    role: adminUser.role,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return {};
            } else if (rpcResult && !rpcResult.success && rpcResult.message !== 'Usuário não encontrado') {
                return { error: 'Credenciais inválidas (Senha incorreta para Administrador)' };
            }

            // 2. Not an admin, try Teacher Login

            // Determine if identifier is likely an email
            const isEmail = identifier.includes('@');
            let emailToUse = identifier;

            // 3. If NOT email (TOTVS number), we MUST look it up first
            if (!isEmail) {
                const { data: userProfile, error: lookupError } = await supabase
                    .from('users')
                    .select('email, active')
                    .eq('totvs_number', identifier)
                    .single();

                if (lookupError || !userProfile) {
                    console.warn('TOTVS lookup failed:', lookupError);
                    return { error: 'Usuário não encontrado. Se você é um professor, verifique seu número TOTVS.' };
                }

                if (userProfile.active === false) {
                    return { error: 'Sua conta foi desativada. Entre em contato com a administração.' };
                }

                emailToUse = userProfile.email;
            }

            // 4. Perform Authentication
            setState(prev => ({ ...prev, isLoading: true }));

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (authError) {
                setState(prev => ({ ...prev, isLoading: false }));
                console.error('Supabase Auth error:', authError);
                if (authError.message === 'Invalid login credentials') {
                    return { error: 'Credenciais inválidas. Verifique sua senha.' };
                }
                if (authError.message.includes('Email not confirmed')) {
                    return { error: 'Email não confirmado. Verifique sua caixa de entrada.' };
                }
                return { error: authError.message };
            }

            // 5. Explicitly wait for profile and state update to prevent loop
            if (authData.user) {
                const profileData = await fetchUserProfile(authData.user.id);

                if (profileData === 'disabled') {
                    setState(prev => ({ ...prev, isLoading: false }));
                    return { error: 'Sua conta foi desativada. Entre em contato com a administração.' };
                }

                if (!profileData) {
                    setState(prev => ({ ...prev, isLoading: false }));
                    return { error: 'Perfil não encontrado na base de dados.' };
                }

                // Manually update state and clear loading before returning
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
            console.error('Login Exception:', error);
            return { error: error.message || 'Falha na autenticação' };
        }
    };

    const signOut = async () => {
        const adminSession = localStorage.getItem('admin_session');
        if (adminSession) {
            try {
                const admin = JSON.parse(adminSession);
                if (admin.session_token) {
                    // Remove session from DB
                    await supabase
                        .from('admin_sessions')
                        .delete()
                        .eq('token', admin.session_token);
                }
            } catch (e) {
                console.error('Error during admin logout session cleanup:', e);
            }
        }

        localStorage.removeItem('admin_session');
        await supabase.auth.signOut();
        setState({ user: null, role: null, isAuthenticated: false, isLoading: false });
    };

    const signUp = async (data: any) => {
        // Teacher registration
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (authError) return { error: authError.message };
        if (!authData.user) return { error: 'Erro ao criar usuário' };

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                totvs_number: data.totvs_number,
                full_name: data.full_name,
                email: data.email,
                units: data.units,
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
