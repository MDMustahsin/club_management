/**
 * Global API Configuration
 * OOP: Single source of truth for all API settings
 * Automatically detects environment (local vs production)
 */
const CONFIG = {
    // Detect if running locally or on production
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'
        : 'https://club-management-api.onrender.com/api', // 🔥 UPDATE THIS WITH YOUR RENDER URL
    ENDPOINTS: {
        // Auth
        REGISTER: '/auth/register/',
        LOGIN: '/auth/login/',
        LOGOUT: '/auth/logout/',
        PROFILE: '/auth/profile/',
        USERS: '/auth/users/',

        // Clubs
        CLUBS: '/clubs/',
        CLUB_CREATE: '/clubs/create/',
        CLUB_DETAIL: (id) => `/clubs/${id}/`,
        CLUB_UPDATE: (id) => `/clubs/${id}/update/`,
        CLUB_DELETE: (id) => `/clubs/${id}/delete/`,
        CLUB_RESTORE: (id) => `/clubs/${id}/restore/`,
        CLUB_PROMOTE: (id) => `/clubs/${id}/promote/`,
        CLUB_MEMBERS: (id) => `/memberships/club/${id}/members/`,

        // Memberships
        MEMBERSHIP_APPLY: '/memberships/apply/',
        MEMBERSHIP_MY: '/memberships/my/',
        MEMBERSHIP_PENDING: '/memberships/pending/',
        MEMBERSHIP_ALL: '/memberships/all/',
        MEMBERSHIP_STATUS: (id) => `/memberships/${id}/status/`,
        MEMBERSHIP_CANCEL: (id) => `/memberships/${id}/cancel/`,
        CLUB_MEMBERS: (id) => `/memberships/club/${id}/members/`,

        // Events
        EVENTS: '/events/',
        EVENT_CREATE: '/events/create/',
        EVENT_DETAIL: (id) => `/events/${id}/`,
        EVENT_UPDATE: (id) => `/events/${id}/update/`,
        EVENT_DELETE: (id) => `/events/${id}/delete/`,
        EVENT_REGISTER: '/events/register/',
        EVENT_MY_REGISTRATIONS: '/events/my/',
        EVENT_PARTICIPANTS: (id) => `/events/${id}/participants/`,
        EVENT_CANCEL_REGISTRATION: (id) => `/events/registration/${id}/cancel/`,

        // Donations
        DONATION_CREATE: '/donations/create/',
        DONATION_GUEST: '/donations/guest/',
        DONATION_MY: '/donations/my/',
        DONATION_ALL: '/donations/all/',
        DONATION_CLUB: (id) => `/donations/club/${id}/`,
        DONATION_PAYMENT_STATUS: (id) => `/donations/${id}/payment-status/`,
        DONATION_SUMMARY: '/donations/summary/',
    }
};