const Admin = {

    init() {
        if (!Auth.requireAdmin()) return;

        this.loadAll();
        this.loadEventCreateClubs();
    },

    // 🔹 SWITCH SECTIONS
    showSection(event, sectionId) {
        document.querySelectorAll('.dashboard-section')
            .forEach(s => s.classList.remove('active'));

        document.getElementById(sectionId)
            .classList.add('active');

        document.querySelectorAll('.sidebar-link')
            .forEach(l => l.classList.remove('active'));

        if (event && event.target) {
            event.target.classList.add('active');
        }
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
            const usersRes = await Utils.get(CONFIG.ENDPOINTS.USERS);
            const clubsRes = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const donationsRes = await Utils.get(CONFIG.ENDPOINTS.DONATION_ALL);
            
            if (usersRes.ok) {
                const users = await usersRes.json();
                document.getElementById('stat-users').innerText = (users.results || users).length;
            }
            
            if (clubsRes.ok) {
                const clubs = await clubsRes.json();
                document.getElementById('stat-clubs').innerText = (clubs.results || clubs).length;
            }
            
            if (donationsRes.ok) {
                const donations = await donationsRes.json();
                document.getElementById('stat-donations').innerText = (donations.results || donations).length;
            }

        } catch (error) {
            console.error('Stats error:', error);
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

    async loadEventCreateClubs() {
        try {
            const res = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const data = await res.json();
            const clubs = data.results || data;
            const select = document.getElementById('admin-event-club');
            if (!select) return;

            select.innerHTML = '<option value="">Select a club...</option>' +
                clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch (err) {
            console.error('Error loading clubs for event creation:', err);
        }
    },

    async createEvent(e) {
        e.preventDefault();

        const clubId = parseInt(document.getElementById('admin-event-club').value, 10);
        const title = document.getElementById('admin-event-title').value.trim();
        const description = document.getElementById('admin-event-description').value.trim();
        let dateValue = document.getElementById('admin-event-date').value;
        const location = document.getElementById('admin-event-location').value.trim();
        const capacity = parseInt(document.getElementById('admin-event-capacity').value, 10);

        if (!clubId || Number.isNaN(clubId)) {
            Utils.showToast('Please select a club for the event.', 'error');
            return;
        }

        if (!title || !description || !dateValue || !location || Number.isNaN(capacity) || capacity <= 0) {
            Utils.showToast('Please complete all event fields correctly.', 'error');
            return;
        }

        dateValue = dateValue.replace('T', ' ') + ':00';

        try {
            const response = await Utils.post(CONFIG.ENDPOINTS.EVENT_CREATE, {
                club: clubId,
                title,
                description,
                date: dateValue,
                location,
                capacity
            });

            if (response.ok) {
                Utils.showToast('Event created successfully! 🎉');
                document.getElementById('admin-create-event-form').reset();
                this.loadEvents();
            } else {
                const error = await response.json();
                const message = error.detail || error.error || JSON.stringify(error);
                Utils.showToast(message || 'Error creating event', 'error');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            Utils.showToast('Error creating event', 'error');
        }
    },

    async showClubMembers(clubId, clubName) {
        try {
            const res = await Utils.get(CONFIG.ENDPOINTS.CLUB_MEMBERS(clubId));
            const data = await res.json();
            const members = data.results || data;

            const memberList = members.length ? members.map(m => `
                <div class="card">
                    <div class="card-body">
                        <h4>${m.student.username}</h4>
                        <p>Email: ${m.student.email}</p>
                        <p>Joined: ${Utils.formatDateTime(m.updated_at)}</p>
                    </div>
                    <div class="card-footer">
                        <button onclick="Admin.promoteToClubAdmin(${clubId}, ${m.student.id}, '${m.student.username}')"
                                class="btn btn-primary btn-sm">
                            Promote to Club Admin
                        </button>
                    </div>
                </div>
            `).join('') : '<p>No approved members yet.</p>';

            const modal = document.getElementById('club-members-modal');
            const listContainer = document.getElementById('club-members-list');
            if (listContainer) {
                listContainer.innerHTML = memberList;
            }
            if (modal) {
                modal.style.display = 'flex';
            }
        } catch (err) {
            Utils.showToast('Error loading members', 'error');
        }
    },

    closeClubMembersModal() {
        const modal = document.getElementById('club-members-modal');
        if (modal) {
            modal.style.display = 'none';
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
        try {
            const res = await Utils.get(CONFIG.ENDPOINTS.DONATION_ALL);
            
            if (!res.ok) {
                console.error('API Error:', res.status, res.statusText);
                Utils.showError('donations-list', `Failed to load donations. (${res.status})`);
                document.getElementById('stat-donations').innerText = '0';
                return;
            }
            
            const data = await res.json();
            const donations = data.results || data;

            document.getElementById('stat-donations').innerText = donations.length;
            const container = document.getElementById('donations-list');

            if (!donations.length) {
                Utils.showEmpty('donations-list', 'No donations found.');
                return;
            }

            container.innerHTML = donations.map(d => {
                let donorBadgeHTML = '';
                if (d.donor) {
                    donorBadgeHTML = `<p>Donor: ${d.donor.username || d.donor.email}</p>`;
                } else if (d.guest_name) {
                    donorBadgeHTML = `<p>Guest: ${d.guest_name} (${d.guest_email})</p>`;
                } else {
                    donorBadgeHTML = '<p><em>Anonymous donor</em></p>';
                }

                return `
                    <div class="card">
                        <div class="card-body">
                            <h4>${d.club.name}</h4>
                            <p>💰 ${d.amount}</p>
                            <p>🔢 Transaction ID: ${d.transaction_id}</p>
                            ${donorBadgeHTML}
                            ${Utils.getStatusBadge(d.status)}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Admin donations load error:', error);
            Utils.showError('donations-list', 'Failed to load donations.');
            document.getElementById('stat-donations').innerText = '0';
        }
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

    const eventForm = document.getElementById('admin-create-event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            Admin.createEvent(e);
        });
    }
});
