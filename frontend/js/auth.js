/**
 * Authentication Manager
 * OOP: Encapsulation — all auth logic in one object
 */
const Auth = {

    /**
     * Save tokens and user data after login
     */
    saveSession(tokens, user) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Clear all session data on logout
     */
    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!localStorage.getItem('access_token');
    },

    /**
     * Get current user object
     */
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Get user role
     */
    getRole() {
        const user = this.getUser();
        return user ? user.role : null;
    },

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.getRole() === 'ADMIN';
    },

    /**
     * Check if current user is club admin
     */
    isClubAdmin() {
        return this.getRole() === 'CLUB_ADMIN';
    },

    /**
     * Redirect to login if not logged in
     */
    requireLogin() {
        if (!this.isLoggedIn()) {
            Utils.redirect('login.html');
            return false;
        }
        return true;
    },

    /**
     * Redirect to login if not admin
     */
    requireAdmin() {
        if (!this.isLoggedIn()) {
            Utils.redirect('login.html');
            return false;
        }
        if (!this.isAdmin()) {
            Utils.redirect('dashboard.html');
            return false;
        }
        return true;
    },

    /**
     * Register new user
     */
    async register(data) {
        return await Utils.post(
            CONFIG.ENDPOINTS.REGISTER,
            {
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirm_password
            }
        );
    },

    /**
     * Login user
     */
    async login(email, password) {
        const response = await Utils.post(
            CONFIG.ENDPOINTS.LOGIN,
            { email, password }
        );
        if (response.ok) {
            const data = await response.json();
            this.saveSession(data.tokens, data.user);
            return { success: true, user: data.user };
        }
        const error = await response.json();
        return { success: false, error };
    },

    /**
     * Logout user
     */
    async logout() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await Utils.post(CONFIG.ENDPOINTS.LOGOUT, {
                refresh: refreshToken
            });
        }
        this.clearSession();
        Utils.redirect('login.html');
    },

    /**
     * Update navbar based on auth state
     */
    updateNavbar() {
        const user = this.getUser();
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');

        if (!navAuth || !navUser) return;

        if (user) {
            navAuth.style.display = 'none';
            navUser.style.display = 'flex';
            const nameEl = document.getElementById('nav-username');
            const roleEl = document.getElementById('nav-role');
            if (nameEl) nameEl.textContent = user.username;
            if (roleEl) roleEl.innerHTML = Utils.getStatusBadge(user.role);
        } else {
            navAuth.style.display = 'flex';
            navUser.style.display = 'none';
        }
    },
};