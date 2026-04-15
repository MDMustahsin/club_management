/**
 * Clubs Module
 * OOP: Encapsulation — all club logic in one object
 */

const Clubs = {

    /**
     * Load all clubs
     */
    async loadClubs(containerId = 'clubs-grid') {
        Utils.showLoading(containerId);

        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const data = await response.json();

            // Handle DRF pagination
            const clubs = data.results || data;

            if (!clubs.length) {
                Utils.showEmpty(containerId, 'No clubs found.');
                return;
            }

            const container = document.getElementById(containerId);

            container.innerHTML = clubs.map(club => `
                <div class="card club-card">

                    <div class="club-card-image">🏛️</div>

                    <div class="card-body">
                        <h3>${club.name}</h3>

                        <p>${Utils.truncate(club.description, 80)}</p>

                        <div class="club-card-meta">
                            <span>👥 ${club.member_count || 0} members</span>
                            <span>📅 ${club.upcoming_events_count || 0} events</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <a href="club-detail.html?id=${club.id}" 
                        class="btn btn-dark btn-sm">
                            View
                        </a>

                        <button onclick="Clubs.apply(${club.id})"
                                class="btn btn-primary btn-sm">
                            Apply
                        </button>
                    </div>

                </div>
            `).join('');

        } catch (error) {
            console.error(error);
            Utils.showError(containerId, 'Failed to load clubs.');
        }
    },

    /**
     * Render Apply button dynamically
     */
    renderApplyButton(club) {

        // If user not logged in → show apply
        if (!Auth.isLoggedIn()) {
            return `
                <button onclick="Clubs.apply(${club.id})"
                        class="btn btn-primary btn-sm">
                    Apply
                </button>
            `;
        }

        // Future improvement: if backend sends membership status
        if (club.is_member) {
            return `<span class="badge badge-success">Member</span>`;
        }

        return `
            <button onclick="Clubs.apply(${club.id})"
                    class="btn btn-primary btn-sm">
                Apply
            </button>
        `;
    },

    /**
     * Apply for club membership
     */
    async apply(clubId) {

        // 🔐 Require login
        if (!Auth.requireLogin()) return;

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.MEMBERSHIP_APPLY,
                { club: clubId }
            );

            const data = await response.json();

            if (response.ok) {
                Utils.showToast('Application submitted 🎉');

            } else {
                Utils.showToast(
                    data.detail || 'Already applied',
                    'error'
                );
            }

        } catch (error) {
            console.error(error);
            Utils.showToast('Something went wrong', 'error');
        }
    },

    /**
     * Redirect to club detail page
     */
    viewDetails(clubId) {
        Utils.redirect(`club-detail.html?id=${clubId}`);
    }
};