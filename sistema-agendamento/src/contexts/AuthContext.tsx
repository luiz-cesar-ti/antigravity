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

    useEffect(() => {
        let mounted = true;

        // Check active sessions
        const checkSession = async () => {
            try {
                // 1. Check Supabase Auth (Teachers)
                // Add a timeout to prevent hanging indefinitely
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000));

                const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
                const session = result.data?.session;

                if (session && mounted) {
                    // Fetch user profile
                    const { data: profile, error: profileError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        // If we can't get the profile, we might still be authenticated as a user but technically not a full "teacher" in our app logic
                        // Decide if we should sign them out or let them proceed. Safety: sign out if critical data missing.
                    }

                    if (profile) {
                        // Check if user is active
                        if (profile.active === false) {
                            await supabase.auth.signOut();
                            if (mounted) setState(prev => ({ ...prev, isLoading: false }));
                            return;
                        }
                        if (mounted) {
                            setState({
                                user: profile as User,
                                role: 'teacher',
                                isAuthenticated: true,
                                isLoading: false,
                            });
                        }
                        return;
                    }
                }

                // 2. Check Admin "Session" (stored in localStorage)
                const adminSession = localStorage.getItem('admin_session');
                if (adminSession) {
                    try {
                        const admin = JSON.parse(adminSession);
                        if (admin && admin.username && mounted) { // Basic validation
                            setState({
                                user: admin as Admin,
                                role: 'admin',
                                isAuthenticated: true,
                                isLoading: false,
                            });
                            return;
                        }
                    } catch (e) {
                        console.error('Corrupt admin session, clearing:', e);
                        localStorage.removeItem('admin_session');
                    }
                }

            } catch (error) {
                console.error('Session check failed:', error);
                // On critical failure, ensure we don't block the UI forever
            } finally {
                if (mounted) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setState({ user: null, role: null, isAuthenticated: false, isLoading: false });
                localStorage.removeItem('admin_session');
            } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                // Avoid setting loading to true here to prevent flickering, just update data
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    if (profile.active === false) {
                        await supabase.auth.signOut();
                        if (mounted) setState({ user: null, role: null, isAuthenticated: false, isLoading: false });
                        return;
                    }
                    if (mounted) {
                        setState({
                            user: profile as User,
                            role: 'teacher',
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    }
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
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (authError) {
                console.error('Supabase Auth error:', authError);
                if (authError.message === 'Invalid login credentials') {
                    return { error: 'Credenciais inválidas. Verifique sua senha.' };
                }
                if (authError.message.includes('Email not confirmed')) {
                    return { error: 'Email não confirmado. Verifique sua caixa de entrada.' };
                }
                throw authError; // Return verify generic error
            }

            // 5. Post-Auth Check: Verify 'active' status and profile existence
            if (authData.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('active')
                    .eq('id', authData.user.id)
                    .single();

                if (profile && profile.active === false) {
                    await supabase.auth.signOut();
                    return { error: 'Sua conta foi desativada. Entre em contato com a administração.' };
                }
            }

            return {};

        } catch (error: any) {
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
