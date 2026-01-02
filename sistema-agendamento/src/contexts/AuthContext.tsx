import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { AuthState, User, Admin } from '../types';

interface AuthContextType extends AuthState {
    signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    signUp: (data: any) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: true,
    });

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
                                role: 'admin',
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
                    if (prev.role === 'admin') return { ...prev, isLoading: false };
                    return { user: null, role: null, isAuthenticated: false, isLoading: false };
                });
            } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
                // If we are already authenticated as the same user, just clear loading
                if (state.user?.id === session.user.id) {
                    setState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }));
                    return;
                }

                const profileData = await fetchUserProfile(session.user.id);
                if (mounted) {
                    if (profileData === 'disabled') {
                        // Signed out inside fetchUserProfile
                        setState(prev => ({ ...prev, isLoading: false }));
                    } else if (profileData) {
                        setState({
                            user: profileData,
                            role: 'teacher',
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } else {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            } else {
                if (mounted) setState(prev => ({ ...prev, isLoading: false }));
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
        console.log('SignIn attempt:', identifier);

        try {
            // 1. Try Admin Login (Direct Table Lookup)
            // Use query returning array to avoid errors if 0 results
            const { data: adminList, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('username', identifier)
                .limit(1);

            if (adminError) {
                console.error('Admin lookup error:', adminError);
            }

            if (adminList && adminList.length > 0) {
                const adminData = adminList[0];
                console.log('Admin user found, verifying password...');

                if (adminData.password_hash === password) {
                    console.log('Admin password match!');
                    const adminUser = adminData as Admin;
                    localStorage.setItem('admin_session', JSON.stringify(adminUser));
                    setState({
                        user: adminUser,
                        role: 'admin',
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return {};
                } else {
                    console.warn('Admin password mismatch');
                    // Return valid credential error if it's an admin username but wrong password
                    // DO NOT fall through to teacher login if we found an admin username
                    return { error: 'Credenciais inválidas (Senha incorreta para Administrador)' };
                }
            }

            // 2. Not an admin, try Teacher Login
            console.log('Not an admin, attempting teacher login...');

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
            // Set loading state to prevent interaction
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
                units: data.units
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
