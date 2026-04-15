const Dashboard = {

    init() {
        if (!Auth.requireLogin()) return;

        this.loadAll();
    },

    // 🔹 SECTION SWITCHING
    showSection(sectionId) {

        document.querySelectorAll('.dashboard-section')
            .forEach(sec => sec.classList.remove('active'));

        document.getElementById(sectionId)
            .classList.add('active');

        document.querySelectorAll('.sidebar-link')
            .forEach(link => link.classList.remove('active'));

        event.target.classList.add('active');
    },

    // 🔹 LOAD EVERYTHING
    async loadAll() {
        await this.loadMemberships();
        await this.loadEvents();
        await this.loadDonations();
    },

    // 🔹 MEMBERSHIPS
    async loadMemberships() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.MEMBERSHIP_MY);
            const data = await response.json();
            const memberships = data.results || data;

            document.getElementById('stat-memberships').innerText = memberships.length;

            const container = document.getElementById('memberships-list');

            if (!memberships.length) {
                Utils.showEmpty('memberships-list');
                return;
            }

            container.innerHTML = memberships.map(m => `
                <div class="card">
                    <div class="card-body">
                        <h4>${m.club.name}</h4>
                        ${Utils.getStatusBadge(m.status)}
                    </div>

                    <div class="card-footer">
                        ${m.status === 'PENDING' ? `
                            <button onclick="Dashboard.cancelMembership(${m.id})"
                                    class="btn btn-danger btn-sm">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            Utils.showError('memberships-list');
        }
    },

    // 🔹 EVENTS
    async loadEvents() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.EVENT_MY_REGISTRATIONS);
            const data = await response.json();
            const events = data.results || data;

            document.getElementById('stat-events').innerText = events.length;

            const container = document.getElementById('events-list');

            if (!events.length) {
                Utils.showEmpty('events-list');
                return;
            }

            container.innerHTML = events.map(e => `
                <div class="card">
                    <div class="card-body">
                        <h4>${e.event.title}</h4>
                        <p>${Utils.formatDateTime(e.event.date)}</p>
                    </div>

                    <div class="card-footer">
                        <button onclick="Dashboard.cancelEvent(${e.id})"
                                class="btn btn-danger btn-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            `).join('');

        } catch {
            Utils.showError('events-list');
        }
    },

    // 🔹 DONATIONS
    async loadDonations() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.DONATION_MY);
            const data = await response.json();
            const donations = data.results || data;

            document.getElementById('stat-donations').innerText = donations.length;

            const container = document.getElementById('donations-list');

            if (!donations.length) {
                Utils.showEmpty('donations-list');
                return;
            }

            container.innerHTML = donations.map(d => `
                <div class="card">
                    <div class="card-body">
                        <h4>${d.club.name}</h4>
                        <p>💰 ${d.amount}</p>
                        ${Utils.getStatusBadge(d.status)}
                    </div>
                </div>
            `).join('');

        } catch {
            Utils.showError('donations-list');
        }
    },

    // 🔹 CANCEL MEMBERSHIP
    async cancelMembership(id) {
        const response = await Utils.delete(
            CONFIG.ENDPOINTS.MEMBERSHIP_CANCEL(id)
        );

        if (response.ok) {
            Utils.showToast('Cancelled');
            this.loadMemberships();
        }
    },

    // 🔹 CANCEL EVENT
    async cancelEvent(id) {
        const response = await Utils.post(
            CONFIG.ENDPOINTS.EVENT_CANCEL_REGISTRATION(id)
        );

        if (response.ok) {
            Utils.showToast('Cancelled');
            this.loadEvents();
        }
    }
};