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
        let data = { status };
        
        // If rejecting, ask for reason
        if (status === 'REJECTED') {
            const reason = prompt('Please provide a reason for rejection:');
            if (!reason) {
                Utils.showToast('Rejection reason is required', 'error');
                return;
            }
            data.rejection_reason = reason;
        }

        const res = await Utils.patch(
            CONFIG.ENDPOINTS.MEMBERSHIP_STATUS(id),
            data
        );

        if (res.ok) {
            Utils.showToast('Updated');
            this.loadMemberships();
        } else {
            const error = await res.json();
            Utils.showToast(error.detail || 'Error updating status', 'error');
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
                <p>${Utils.truncate(c.description, 60)}</p>
                <p>👤 Admin: ${c.admin ? c.admin.username : 'None'}</p>
                <p>👥 Members: ${c.member_count || 0}</p>
                
                <button onclick="Admin.showClubMembers(${c.id}, '${c.name}')"
                        class="btn btn-info btn-sm">
                    View Members
                </button>

                <button onclick="Admin.deleteClub(${c.id})"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </div>
        `).join('');
    },

    async showClubMembers(clubId, clubName) {
        try {
            const res = await Utils.get(CONFIG.ENDPOINTS.CLUB_MEMBERS(clubId));
            const data = await res.json();
            const members = data.results || data;

            const memberList = members.map(m => `
                <div class="card">
                    <h4>${m.student.username}</h4>
                    <p>Email: ${m.student.email}</p>
                    <button onclick="Admin.promoteToClubAdmin(${clubId}, ${m.student.id}, '${m.student.username}')"
                            class="btn btn-primary btn-sm">
                        Promote to Club Admin
                    </button>
                </div>
            `).join('') || '<p>No approved members yet.</p>';

            alert(`Members of ${clubName}:\n\n` + members.map(m => `- ${m.student.username}`).join('\n') || 'No members');
        } catch (err) {
            Utils.showToast('Error loading members', 'error');
        }
    },

    async promoteToClubAdmin(clubId, userId, username) {
        if (!confirm(`Are you sure you want to promote ${username} to be the admin of this club?`)) {
            return;
        }

        try {
            const res = await Utils.post(CONFIG.ENDPOINTS.CLUB_PROMOTE(clubId), {
                user_id: userId
            });

            if (res.ok) {
                Utils.showToast(`${username} is now the club admin! 🎉`);
                this.loadClubs();
            } else {
                const error = await res.json();
                Utils.showToast(error.error || 'Error promoting user', 'error');
            }
        } catch (err) {
            Utils.showToast('Something went wrong', 'error');
        }
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
    },

    // 🔹 CREATE CLUB MODAL
    showCreateClubModal() {
        document.getElementById('create-club-modal').style.display = 'flex';
    },

    closeCreateClubModal() {
        document.getElementById('create-club-modal').style.display = 'none';
        document.getElementById('create-club-form').reset();
    },

    async createClub(e) {
        e.preventDefault();

        const name = document.getElementById('club-name').value;
        const description = document.getElementById('club-description').value;

        try {
            const res = await Utils.post(CONFIG.ENDPOINTS.CLUB_CREATE, {
                name,
                description,
                max_members: 100  // Default max members
            });

            if (res.ok) {
                Utils.showToast('Club created successfully! 🎉');
                this.closeCreateClubModal();
                this.loadClubs();
                this.loadStats();
            } else {
                const error = await res.json();
                const errorMsg = error.detail || Object.values(error).flat().join(', ') || 'Error creating club';
                Utils.showToast(errorMsg, 'error');
            }
        } catch (err) {
            Utils.showToast('Something went wrong', 'error');
        }
    }
};

// Set up form handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('create-club-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            Admin.createClub(e);
        });
    }
});
