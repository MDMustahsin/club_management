const Events = {

    async init() {
        await this.loadEvents();
        
        // Load clubs for create event form if admin/club admin
        if (Auth.isAdmin() || Auth.isClubAdmin()) {
            await this.loadClubsForCreate();
        }
    },

    async loadEvents() {
        Utils.showLoading('events-grid');

        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.EVENTS);
            const data = await response.json();

            const events = data.results || data;

            if (!events.length) {
                Utils.showEmpty('events-grid', 'No events found.');
                return;
            }

            const container = document.getElementById('events-grid');

            container.innerHTML = events.map(event => `
                <div class="card">

                    <div class="card-body">
                        <h3>${event.title}</h3>
                        <p><strong>Club:</strong> ${event.club ? event.club.name : 'N/A'}</p>

                        <p>${Utils.truncate(event.description, 80)}</p>

                        <p>📅 ${Utils.formatDateTime(event.date)}</p>
                        <p>📍 ${event.location}</p>

                        ${Utils.getStatusBadge(event.is_active ? 'UPCOMING' : 'COMPLETED')}
                    </div>

                    <div class="card-footer">
                        <button onclick="Events.register(${event.id})"
                                class="btn btn-primary btn-sm">
                            Register
                        </button>
                    </div>

                </div>
            `).join('');

        } catch (error) {
            console.error(error);
            Utils.showError('events-grid', 'Failed to load events');
        }
    },

    async loadClubsForCreate() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const data = await response.json();
            let clubs = data.results || data;

            // If club admin, only show clubs they admin
            if (Auth.isClubAdmin()) {
                const user = Auth.getUser();
                clubs = clubs.filter(c => c.admin && c.admin.id === user.id);
            }

            const select = document.getElementById('event-club');
            if (select) {
                clubs.forEach(club => {
                    const option = document.createElement('option');
                    option.value = club.id;
                    option.textContent = club.name;
                    select.appendChild(option);
                });
                
                // Show create event section
                const createSection = document.getElementById('create-event-section');
                if (createSection) {
                    createSection.style.display = 'block';
                }
            }

        } catch (error) {
            console.error('Error loading clubs:', error);
        }
    },

    async register(eventId) {

        if (!Auth.requireLogin()) return;

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.EVENT_REGISTER,
                { event: eventId }
            );

            const data = await response.json();

            if (response.ok) {
                Utils.showToast('Registered successfully 🎉');
            } else {
                Utils.showToast(data.detail || 'Failed', 'error');
            }

        } catch (error) {
            Utils.showToast('Error registering', 'error');
        }
    },

    async createEvent(e) {
        e.preventDefault();

        if (!Auth.requireLogin()) return;

        // Check permission
        if (!Auth.isAdmin() && !Auth.isClubAdmin()) {
            Utils.showToast('You do not have permission to create events', 'error');
            return;
        }

        const clubId = document.getElementById('event-club').value;
        const data = {
            club: parseInt(clubId),
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            date: document.getElementById('event-date').value,
            location: document.getElementById('event-location').value,
            capacity: parseInt(document.getElementById('event-capacity').value)
        };

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.EVENT_CREATE,
                data
            );

            const res = await response.json();

            if (response.ok) {
                Utils.showToast('Event created successfully! 🎉');
                document.getElementById('create-event-form').reset();
                this.loadEvents();
            } else {
                Utils.showToast(res.detail || res.error || 'Failed to create event', 'error');
            }

        } catch (error) {
            Utils.showToast('Error creating event', 'error');
        }
    }
};

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Events.init();
    
    const form = document.getElementById('create-event-form');
    if (form) {
        form.addEventListener('submit', (e) => Events.createEvent(e));
    }
});
