/**
 * Utility functions used across all pages
 * OOP: Encapsulation — shared logic in one place
 */
const Utils = {

    /**
     * Make API requests with automatic token injection
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(
            `${CONFIG.API_BASE_URL}${endpoint}`,
            { ...options, headers }
        );
        return response;
    },

    /**
     * GET request shorthand
     */
    async get(endpoint) {
        return await this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request shorthand
     */
    async post(endpoint, data) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * PATCH request shorthand
     */
    async patch(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    /**
     * DELETE request shorthand
     */
    async delete(endpoint) {
        return await this.request(endpoint, { method: 'DELETE' });
    },

    /**
     * Format date to readable string
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    /**
     * Format datetime to readable string
     */
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Show loading spinner inside an element
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    },

    /**
     * Show error message inside an element
     */
    showError(containerId, message = 'Something went wrong.') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>⚠️ ${message}</p>
                </div>
            `;
        }
    },

    /**
     * Show empty state inside an element
     */
    showEmpty(containerId, message = 'No items found.') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📭 ${message}</p>
                </div>
            `;
        }
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const badges = {
            'PENDING':   '<span class="badge badge-warning">⏳ Pending</span>',
            'APPROVED':  '<span class="badge badge-success">✅ Approved</span>',
            'REJECTED':  '<span class="badge badge-danger">❌ Rejected</span>',
            'UPCOMING':  '<span class="badge badge-info">📅 Upcoming</span>',
            'ONGOING':   '<span class="badge badge-success">🔴 Live</span>',
            'COMPLETED': '<span class="badge badge-secondary">✔ Completed</span>',
            'CANCELLED': '<span class="badge badge-danger">✖ Cancelled</span>',
            'COMPLETED_PAY': '<span class="badge badge-success">💚 Completed</span>',
            'FAILED':    '<span class="badge badge-danger">❌ Failed</span>',
            'REFUNDED':  '<span class="badge badge-warning">↩ Refunded</span>',
            'ADMIN':     '<span class="badge badge-purple">👑 Admin</span>',
            'CLUB_ADMIN': '<span class="badge badge-info">🏛️ Club Admin</span>',
            'MEMBER':    '<span class="badge badge-info">👤 Member</span>',
            'STUDENT':   '<span class="badge badge-secondary">🎓 Student</span>',
        };
        return badges[status] || `<span class="badge">${status}</span>`;
    },

    /**
     * Truncate long text
     */
    truncate(text, maxLength = 100) {
        if (!text) return '';
        return text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;
    },

    /**
     * Redirect to a page
     */
    redirect(page) {
        window.location.href = page;
    },

    /**
     * Get query param from URL
     */
    getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    },
    /**
     * Render navbar HTML into the page
     */
    renderNavbar(activePage = '') {
        const navHTML = `
        <nav class="navbar">
            <div class="container">
                <a href="index.html" class="nav-brand">
                    🎓 Club<span>Hub</span>
                </a>
                <div class="nav-links">
                    <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
                    <a href="clubs.html" class="${activePage === 'clubs' ? 'active' : ''}">Clubs</a>
                    <a href="events.html" class="${activePage === 'events' ? 'active' : ''}">Events</a>
                    <a href="donate.html" class="${activePage === 'donate' ? 'active' : ''}">Donate</a>
                </div>
                <div class="nav-actions">
                    <div class="nav-auth" id="nav-auth">
                        <a href="login.html" class="btn btn-outline-white btn-sm">Login</a>
                        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
                    </div>
                    <div class="nav-user" id="nav-user">
                        <span class="nav-username" id="nav-username"></span>
                        <span id="nav-role"></span>
                        <a href="dashboard.html" class="btn btn-outline-white btn-sm">Dashboard</a>
                        ${Auth.isClubAdmin() ? '<a href="club-admin.html" class="btn btn-outline-white btn-sm">My Club</a>' : ''}
                        ${Auth.isAdmin() ? '<a href="admin.html" class="btn btn-outline-white btn-sm">Admin</a>' : ''}
                        <button onclick="Auth.logout()" class="btn btn-danger btn-sm">Logout</button>
                    </div>
                </div>
            </div>
        </nav>
        `;
        const navContainer = document.getElementById('navbar');
        if (navContainer) {
            navContainer.innerHTML = navHTML;
            Auth.updateNavbar();
        }
    },

    /**
     * Render footer HTML
     */
    renderFooter() {
        const footerHTML = `
        <footer class="footer">
            <p>© 2025 <span>ClubHub</span> — Club Management System. Built with Django REST Framework.</p>
        </footer>
        `;
        const footerContainer = document.getElementById('footer');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        }
    },
};