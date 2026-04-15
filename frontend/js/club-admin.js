const ClubAdmin = {

    myClubs: [],

    init() {
        if (!Auth.requireLogin()) return;
        
        // Only allow admins and club admins
        if (!Auth.isAdmin() && !Auth.isClubAdmin()) {
            Utils.redirect('dashboard.html');
            return;
        }

        this.loadMyClubs();
    },

    // 🔹 SECTION SWITCHING
    showSection(sectionId) {
        document.querySelectorAll('.dashboard-section')
            .forEach(s => s.classList.remove('active'));

        document.getElementById(sectionId)
            .classList.add('active');

        document.querySelectorAll('.sidebar-link')
            .forEach(l => l.classList.remove('active'));

        event.target.classList.add('active');
    },

    // 🔹 Load clubs user is admin of
    async loadMyClubs() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const data = await response.json();
            const clubs = data.results || data;
            
            const user = Auth.getUser();
            
            // Filter to clubs where user is admin
            this.myClubs = clubs.filter(c => c.admin && c.admin.id === user.id);
            
            const container = document.getElementById('my-clubs-list');
            
            if (!this.myClubs.length) {
                if (Auth.isAdmin()) {
                    container.innerHTML = '<p>You are a global admin. Use the admin dashboard to manage all clubs.</p>';
                } else {
                    container.innerHTML = '<p>You are not the admin of any club yet.</p>';
                }
                return;
            }

            container.innerHTML = this.myClubs.map(c => `
                <div class="card">
                    <div class="card-body">
                        <h4>${c.name}</h4>
                        <p>${Utils.truncate(c.description, 60)}</p>
                        <p>👥 ${c.member_count || 0} members</p>
                    </div>
                    <div class="card-footer">
                        <button onclick="ClubAdmin.selectClub(${c.id})" class="btn btn-primary btn-sm">
                            Manage
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading clubs:', error);
        }
    },

    // 🔹 Select a club to manage
    selectClub(clubId) {
        // Store selected club
        this.selectedClubId = clubId;
        this.loadPendingApplications();
        this.loadClubMembers();
        this.loadClubEvents();
        
        // Switch to pending section
        this.showSection('pending');
    },

    // 🔹 Load pending applications
    async loadPendingApplications() {
        if (!this.selectedClubId) return;

        try {
            const response = await Utils.get(
                `/memberships/club/${this.selectedClubId}/pending/`
            );
            const data = await response.json();
            const list = data.results || data;

            const container = document.getElementById('pending-list');

            if (!list.length) {
                container.innerHTML = '<p>No pending applications.</p>';
                return;
            }

            container.innerHTML = list.map(m => `
                <div class="card">
                    <div class="card-body">
                        <h4>${m.student.username}</h4>
                        <p>Email: ${m.student.email}</p>
                        <p>Applied: ${Utils.formatDateTime(m.created_at)}</p>
                    </div>
                    <div class="card-footer">
                        <button onclick="ClubAdmin.updateMembership(${m.id}, 'APPROVED')" class="btn btn-success btn-sm">
                            Approve
                        </button>
                        <button onclick="ClubAdmin.updateMembership(${m.id}, 'REJECTED')" class="btn btn-danger btn-sm">
                            Reject
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading pending applications:', error);
        }
    },

    // 🔹 Update membership status
    async updateMembership(membershipId, status) {
        let data = { status };
        
        if (status === 'REJECTED') {
            const reason = prompt('Please provide a reason for rejection:');
            if (!reason) {
                Utils.showToast('Rejection reason is required', 'error');
                return;
            }
            data.rejection_reason = reason;
        }

        try {
            const response = await Utils.patch(
                CONFIG.ENDPOINTS.MEMBERSHIP_STATUS(membershipId),
                data
            );

            if (response.ok) {
                Utils.showToast('Membership updated!');
                this.loadPendingApplications();
                this.loadClubMembers();
            } else {
                const error = await response.json();
                Utils.showToast(error.detail || 'Error updating membership', 'error');
            }
        } catch (error) {
            Utils.showToast('Error updating membership', 'error');
        }
    },

    // 🔹 Load club members
    async loadClubMembers() {
        if (!this.selectedClubId) return;

        try {
            const response = await Utils.get(
                CONFIG.ENDPOINTS.CLUB_MEMBERS(this.selectedClubId)
            );
            const data = await response.json();
            const members = data.results || data;

            const container = document.getElementById('members-list');

            if (!members.length) {
                container.innerHTML = '<p>No approved members yet.</p>';
                return;
            }

            const user = Auth.getUser();
            const isClubAdminOfThisClub = this.myClubs.some(c => c.id === this.selectedClubId);

            container.innerHTML = members.map(m => `
                <div class="card">
                    <div class="card-body">
                        <h4>${m.student.username}</h4>
                        <p>Email: ${m.student.email}</p>
                        <p>Joined: ${Utils.formatDateTime(m.updated_at)}</p>
                    </div>
                    ${isClubAdminOfThisClub && m.student.id !== user.id ? `
                    <div class="card-footer">
                        <button onclick="ClubAdmin.promoteMember(${this.selectedClubId}, ${m.student.id}, '${m.student.username}')" class="btn btn-primary btn-sm">
                            Promote to Club Admin
                        </button>
                    </div>
                    ` : ''}
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading members:', error);
        }
    },

    // 🔹 Promote member to club admin
    async promoteMember(clubId, userId, username) {
        if (!confirm(`Are you sure you want to promote ${username} to be the admin of this club?`)) {
            return;
        }

        try {
            const res = await Utils.post(CONFIG.ENDPOINTS.CLUB_PROMOTE(clubId), {
                user_id: userId
            });

            if (res.ok) {
                Utils.showToast(`${username} is now the club admin! 🎉`);
                this.loadClubMembers();
            } else {
                const error = await res.json();
                Utils.showToast(error.error || 'Error promoting user', 'error');
            }
        } catch (err) {
            Utils.showToast('Something went wrong', 'error');
        }
    },

    // 🔹 Load club events
    async loadClubEvents() {
        if (!this.selectedClubId) return;

        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.EVENTS);
            const data = await response.json();
            const events = (data.results || data).filter(e => e.club && e.club.id === this.selectedClubId);

            const container = document.getElementById('club-events-list');

            if (!events.length) {
                container.innerHTML = '<p>No events for this club.</p>';
                return;
            }

            const isClubAdminOfThisClub = this.myClubs.some(c => c.id === this.selectedClubId);

            container.innerHTML = events.map(e => `
                <div class="card">
                    <div class="card-body">
                        <h4>${e.title}</h4>
                        <p>📅 ${Utils.formatDateTime(e.date)}</p>
                        <p>📍 ${e.location}</p>
                        ${Utils.getStatusBadge(e.is_active ? 'UPCOMING' : 'COMPLETED')}
                    </div>
                    ${isClubAdminOfThisClub ? `
                    <div class="card-footer">
                        <button onclick="ClubAdmin.deleteEvent(${e.id})" class="btn btn-danger btn-sm">
                            Delete Event
                        </button>
                    </div>
                    ` : ''}
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading events:', error);
        }
    },

    // 🔹 Delete event
    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const res = await Utils.delete(CONFIG.ENDPOINTS.EVENT_DELETE(eventId));

            if (res.ok) {
                Utils.showToast('Event deleted! 🎉');
                this.loadClubEvents();
            } else {
                const error = await res.json();
                Utils.showToast(error.error || 'Error deleting event', 'error');
            }
        } catch (err) {
            Utils.showToast('Something went wrong', 'error');
        }
    },

    // 🔹 Create event
    async createEvent(e) {
        e.preventDefault();

        const clubId = this.selectedClubId;
        
        let dateValue = document.getElementById('event-date').value;
        if (dateValue) {
            dateValue = dateValue.replace('T', ' ') + ':00';
        }
        
        const data = {
            club: parseInt(clubId),
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            date: dateValue,
            location: document.getElementById('event-location').value,
            capacity: parseInt(document.getElementById('event-capacity').value)
        };

        try {
            const response = await fetch(
                CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.EVENT_CREATE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                Utils.showToast('Event created successfully! 🎉');
                document.getElementById('create-event-form').reset();
                this.loadClubEvents();
            } else {
                const error = await response.json();
                Utils.showToast(error.detail || error.error || 'Error creating event', 'error');
            }
        } catch (error) {
            Utils.showToast('Error creating event: ' + error.message, 'error');
        }
    }
};