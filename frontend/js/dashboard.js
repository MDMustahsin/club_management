const Dashboard = {

    init() {
        if (!Auth.requireLogin()) return;

        this.loadAll();
    },

    isManager() {
        return Auth.isAdmin() || Auth.isClubAdmin();
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
            const endpoint = this.isManager()
                ? CONFIG.ENDPOINTS.EVENTS
                : CONFIG.ENDPOINTS.EVENT_MY_REGISTRATIONS;
            const response = await Utils.get(endpoint);
            const data = await response.json();
            let events = data.results || data;

            const user = Auth.getUser();
            if (Auth.isClubAdmin()) {
                events = events.filter(event => event.club?.admin?.id === user.id);
            }

            document.getElementById('stat-events').innerText = events.length;
            document.querySelector('#events h2').textContent = this.isManager() ? 'Manage Events' : 'My Events';

            const container = document.getElementById('events-list');

            if (!events.length) {
                Utils.showEmpty('events-list', 'No events found.');
                return;
            }

            this.events = events;

            container.innerHTML = events.map(event => {
                const canManage = Auth.isAdmin() || (
                    Auth.isClubAdmin() && event.club?.admin?.id === user.id
                );

                return `
                <div class="card">
                    <div class="card-body">
                        <h4>${event.title}</h4>
                        <p>${Utils.formatDateTime(event.date)}</p>
                        <p>📍 ${event.location}</p>
                        <p>🏛️ ${event.club?.name || 'N/A'}</p>
                        ${Utils.getStatusBadge(event.is_active ? 'UPCOMING' : 'COMPLETED')}
                    </div>
                    <div class="card-footer">
                        ${canManage ? `
                            <button onclick="Dashboard.editEvent(${event.id})" class="btn btn-outline-primary btn-sm">Edit</button>
                            <button onclick="Dashboard.deleteEvent(${event.id})" class="btn btn-danger btn-sm">Delete</button>
                        ` : `
                            <button onclick="Dashboard.cancelEvent(${event.id})" class="btn btn-primary btn-sm">Cancel</button>
                        `}
                    </div>
                </div>
            `;
            }).join('');

        } catch (error) {
            console.error('Dashboard events load error:', error);
            Utils.showError('events-list', 'Failed to load events.');
        }
    },

    async editEvent(eventId) {
        const event = this.events?.find(e => e.id === eventId);
        if (!event) {
            Utils.showToast('Event not found', 'error');
            return;
        }

        const title = prompt('Title', event.title);
        if (title === null) return;

        const description = prompt('Description', event.description);
        if (description === null) return;

        const date = prompt('Date & time (YYYY-MM-DDTHH:MM)', event.date ? event.date.replace(' ', 'T').slice(0, 16) : '');
        if (date === null) return;

        const location = prompt('Location', event.location);
        if (location === null) return;

        const capacityRaw = prompt('Capacity', event.capacity);
        if (capacityRaw === null) return;
        const capacity = parseInt(capacityRaw, 10);
        if (Number.isNaN(capacity) || capacity <= 0) {
            Utils.showToast('Invalid capacity', 'error');
            return;
        }

        const payload = {
            title,
            description,
            date: date.replace('T', ' '),
            location,
            capacity
        };

        try {
            const response = await Utils.patch(
                CONFIG.ENDPOINTS.EVENT_UPDATE(eventId),
                payload
            );
            const result = await response.json();
            if (!response.ok) {
                Utils.showToast(result.detail || result.error || 'Update failed', 'error');
                return;
            }
            Utils.showToast('Event updated successfully');
            this.loadEvents();
        } catch (error) {
            console.error('Update event error:', error);
            Utils.showToast('Failed to update event', 'error');
        }
    },

    async deleteEvent(eventId) {
        if (!confirm('Delete this event?')) return;

        try {
            const response = await Utils.delete(CONFIG.ENDPOINTS.EVENT_DELETE(eventId));
            const result = await response.json();
            if (!response.ok) {
                Utils.showToast(result.detail || result.error || 'Delete failed', 'error');
                return;
            }
            Utils.showToast(result.message || 'Event deleted');
            this.loadEvents();
        } catch (error) {
            console.error('Delete event error:', error);
            Utils.showToast('Failed to delete event', 'error');
        }
    },

    // 🔹 DONATIONS
    async loadDonations() {
        try {
            const endpoint = this.isManager()
                ? CONFIG.ENDPOINTS.DONATION_ALL
                : CONFIG.ENDPOINTS.DONATION_MY;
            const response = await Utils.get(endpoint);
            const data = await response.json();
            const donations = data.results || data;

            document.getElementById('stat-donations').innerText = donations.length;
            document.querySelector('#donations h2').textContent = this.isManager() ? 'Donations' : 'My Donations';

            const container = document.getElementById('donations-list');

            if (!donations.length) {
                Utils.showEmpty('donations-list', 'No donations found.');
                return;
            }

            container.innerHTML = donations.map(d => `
                <div class="card">
                    <div class="card-body">
                        <h4>${d.club.name}</h4>
                        <p>💰 ${d.amount}</p>
                        ${donorBadge(d.donor)}
                        ${Utils.getStatusBadge(d.status)}
                    </div>
                </div>
            `).join('');

            function donorBadge(donor) {
                if (!donor) return '<p><em>Anonymous donor</em></p>';
                return `<p>Donor: ${donor.username || donor.email}</p>`;
            }

        } catch (error) {
            console.error('Dashboard donations load error:', error);
            Utils.showError('donations-list', 'Failed to load donations.');
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