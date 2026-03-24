// src/js/auth.js
import { supabase } from './supabase.js';

let isSignUpMode = false;
let userProfile = null; // Cache the current user's profile

const authForm = document.getElementById('auth-form');
const toggleModeBtn = document.getElementById('toggle-mode');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');

if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        confirmPasswordGroup.classList.toggle('hidden');
        btnText.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        btnIcon.textContent = isSignUpMode ? 'person_add' : 'login';
        toggleModeBtn.textContent = isSignUpMode 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Sign Up";
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        const submitBtn = document.getElementById('submit-btn');

        if (isSignUpMode && password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match.';
            errorMessage.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> ${isSignUpMode ? 'Starting...' : 'Signing in...'}`;
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        try {
            let result;
            if (isSignUpMode) {
                result = await supabase.auth.signUp({ email, password });
            } else {
                result = await supabase.auth.signInWithPassword({ email, password });
            }

            const { data, error } = result;
            if (error) throw error;

            if (isSignUpMode) {
                successMessage.classList.remove('hidden');
                authForm.reset();
            } else {
                // Fetch profile to determine redirect
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (!profile || !profile.role) {
                    await supabase.auth.signOut();
                    throw new Error('Access Denied: No role assigned. Contact Admin.');
                }
                
                window.location.href = getRedirectPage(profile);
            }
        } catch (err) {
            console.error('Auth error:', err.message);
            errorMessage.textContent = err.message || 'Authentication failed.';
            errorMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
        }
    });
}

// Session Guard for protected pages
export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // 1. Basic Session Guard: If no session and not on login page, redirect
    if (!session) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }
    
    // 2. Fetch/Check Role
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error || !profile || !profile.role) {
        console.error('RBAC Error: No role found for user.');
        if (!window.location.pathname.includes('login.html')) {
            alert('Access Denied: Your account has no assigned role. Please contact the administrator.');
            await signOut();
        }
        return null;
    }

    userProfile = profile; // Cache locally
    
    // 3. Login Page Guard: If session and on login page, redirect based on role
    if (window.location.pathname.includes('login.html')) {
        window.location.href = getRedirectPage(profile);
        return session;
    }

    // 4. RBAC Enforcement: Restrict pages based on role
    const adminPages = ['owner_dashboard.html', 'items_management.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (profile.role !== 'admin' && adminPages.includes(currentPage)) {
        console.warn('Access denied: Redirecting to driver workspace.');
        window.location.href = 'stores_management.html';
        return session;
    }

    // 5. UI Polish: Hide admin navigation elements for drivers
    if (profile.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.remove());
    }
    
    return session;
}

// Auto-run guard on import (except for login page logic)
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    window.location.href = 'login.html';
}

export function getRedirectPage(profile) {
    if (!profile || !profile.role) return 'login.html';
    return profile.role === 'admin' ? 'owner_dashboard.html' : 'stores_management.html';
}
