const ClubDetail = {

    clubId: null,

    init() {
        this.clubId = Utils.getQueryParam('id');

        if (!this.clubId) {
            Utils.showError('club-detail', 'Club not found');
            return;
        }

        this.loadClub();
        this.loadMembers();
        this.loadEvents();
    },

    // 🔹 Load club info
    async loadClub() {
        Utils.showLoading('club-detail');

        try {
            const response = await Utils.get(
                CONFIG.ENDPOINTS.CLUB_DETAIL(this.clubId)
            );
            const club = await response.json();

            const container = document.getElementById('club-detail');

            container.innerHTML = `
            <div class="card">

                <div class="card-body">
                    <div class="club-card-image">🏛️</div>

                    <h2>${club.name}</h2>
                    <p><strong>Club ID:</strong> ${club.id}</p>

                    <p>${club.description}</p>

                    <div class="club-card-meta">
                        <span>👥 ${club.member_count || 0} members</span>
                        <span>📅 ${club.upcoming_events_count || 0} events</span>
                    </div>
                </div>

                <div class="card-footer">
                    ${this.renderApplyButton(club)}
                </div>

            </div>
        `;

        } catch (error) {
            console.error(error);
            Utils.showError('club-detail', 'Failed to load club');
        }
    },

    // 🔹 Apply button
    renderApplyButton(club) {

        if (!Auth.isLoggedIn()) {
            return `
                <button onclick="ClubDetail.apply()">
                    Apply
                </button>
            `;
        }

        if (club.is_member) {
            return `<span class="badge badge-success">Member</span>`;
        }

        return `
            <button onclick="ClubDetail.apply()">
                Apply
            </button>
        `;
    },

    // 🔹 Apply action
    async apply() {

        if (!Auth.requireLogin()) return;

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.MEMBERSHIP_APPLY,
                { club: this.clubId }
            );

            const data = await response.json();

            if (response.ok) {
                Utils.showToast('Applied successfully 🎉');
                this.loadClub(); // refresh UI
            } else {
                Utils.showToast(data.detail || 'Already applied', 'error');
            }

        } catch (error) {
            console.error(error);
            Utils.showToast('Error applying', 'error');
        }
    },

    // 🔹 Load members
    async loadMembers() {
        try {
            const response = await Utils.get(
                CONFIG.ENDPOINTS.CLUB_MEMBERS(this.clubId)
            );

            const data = await response.json();
            const members = data.results || data;

            const container = document.getElementById('members-list');

            if (!members.length) {
                Utils.showEmpty('members-list', 'No members yet.');
                return;
            }

            container.innerHTML = members.map(m => `
            <div class="card">
                <div class="card-body">
                    <h4>${m.student.username}</h4>
                    ${Utils.getStatusBadge(m.status)}
                </div>
            </div>
            `).join('');

        } catch (error) {
            console.error(error);
            Utils.showError('members-list', 'Failed to load members');
        }
    },

    // 🔹 Load events
    async loadEvents() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.EVENTS);
            const data = await response.json();

            const events = (data.results || data)
                .filter(e => e.club === parseInt(this.clubId));

            const container = document.getElementById('events-list');

            if (!events.length) {
                Utils.showEmpty('events-list', 'No events available.');
                return;
            }

            container.innerHTML = events.map(event => `
            <div class="card">
                <div class="card-body">
                    <h4>${event.title}</h4>
                    <p>${Utils.formatDateTime(event.date)}</p>
                    <p>📍 ${event.location}</p>
                </div>
            </div>
            `).join('');

        } catch (error) {
            console.error(error);
            Utils.showError('events-list', 'Failed to load events');
        }
    }
};