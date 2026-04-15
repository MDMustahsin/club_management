const Admin = {

    init() {
        if (!Auth.requireAdmin()) return;

        this.loadAll();
    },

    // 🔹 SWITCH SECTIONS
    showSection(sectionId) {

        document.querySelectorAll('.dashboard-section')
            .forEach(s => s.classList.remove('active'));

        document.getElementById(sectionId)
            .classList.add('active');

        document.querySelectorAll('.sidebar-link')
            .forEach(l => l.classList.remove('active'));

        event.target.classList.add('active');
    },

    // 🔹 LOAD ALL DATA
    async loadAll() {
        await this.loadStats();
        await this.loadMemberships();
        await this.loadClubs();
        await this.loadEvents();
        await this.loadDonations();
    },

    // 🔹 STATS
    async loadStats() {
        try {
            const users = await (await Utils.get(CONFIG.ENDPOINTS.USERS)).json();
            const clubs = await (await Utils.get(CONFIG.ENDPOINTS.CLUBS)).json();
            const donations = await (await Utils.get(CONFIG.ENDPOINTS.DONATION_ALL)).json();

            document.getElementById('stat-users').innerText =
                (users.results || users).length;

            document.getElementById('stat-clubs').innerText =
                (clubs.results || clubs).length;

            document.getElementById('stat-donations').innerText =
                (donations.results || donations).length;

        } catch {
            console.log('Stats error');
        }
    },

    // 🔹 MEMBERSHIPS
    async loadMemberships() {
        const res = await Utils.get(CONFIG.ENDPOINTS.MEMBERSHIP_PENDING);
        const data = await res.json();
        const list = data.results || data;

        const container = document.getElementById('pending-memberships');

        container.innerHTML = list.map(m => `
            <div class="card">
                <h4>${m.student.username}</h4>
                <p>${m.club.name}</p>

                <button onclick="Admin.updateStatus(${m.id}, 'APPROVED')" class="btn btn-success btn-sm">
                    Approve
                </button>

                <button onclick="Admin.updateStatus(${m.id}, 'REJECTED')" class="btn btn-danger btn-sm">
                    Reject
                </button>
            </div>
        `).join('');
    },

    async updateStatus(id, status) {
        const res = await Utils.patch(
            CONFIG.ENDPOINTS.MEMBERSHIP_STATUS(id),
            { status }
        );

        if (res.ok) {
            Utils.showToast('Updated');
            this.loadMemberships();
        }
    },

    // 🔹 CLUBS
    async loadClubs() {
        const res = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
        const data = await res.json();
        const clubs = data.results || data;

        const container = document.getElementById('clubs-list');

        container.innerHTML = clubs.map(c => `
            <div class="card">
                <h4>${c.name}</h4>

                <button onclick="Admin.deleteClub(${c.id})"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </div>
        `).join('');
    },

    async deleteClub(id) {
        const res = await Utils.delete(CONFIG.ENDPOINTS.CLUB_DELETE(id));

        if (res.ok) {
            Utils.showToast('Deleted');
            this.loadClubs();
        }
    },

    // 🔹 EVENTS
    async loadEvents() {
        const res = await Utils.get(CONFIG.ENDPOINTS.EVENTS);
        const data = await res.json();
        const events = data.results || data;

        const container = document.getElementById('events-list');

        container.innerHTML = events.map(e => `
            <div class="card">
                <h4>${e.title}</h4>

                <button onclick="Admin.deleteEvent(${e.id})"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </div>
        `).join('');
    },

    async deleteEvent(id) {
        const res = await Utils.delete(CONFIG.ENDPOINTS.EVENT_DELETE(id));

        if (res.ok) {
            Utils.showToast('Deleted');
            this.loadEvents();
        }
    },

    // 🔹 DONATIONS
    async loadDonations() {
        const res = await Utils.get(CONFIG.ENDPOINTS.DONATION_ALL);
        const data = await res.json();
        const donations = data.results || data;

        const container = document.getElementById('donations-list');

        container.innerHTML = donations.map(d => `
            <div class="card">
                <h4>${d.club.name}</h4>
                <p>💰 ${d.amount}</p>
                ${Utils.getStatusBadge(d.status)}
            </div>
        `).join('');
    }
};