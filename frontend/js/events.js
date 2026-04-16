const Events = {

    async init() {
        await this.loadEvents();
        
        // Load clubs for create event form if admin/club admin
        if (Auth.isAdmin() || Auth.isClubAdmin()) {
            await this.loadClubsForCreate();
            const control = document.getElementById('create-event-control');
            if (control) {
                control.style.display = 'block';
            }
            const button = document.getElementById('show-create-event-btn');
            if (button) {
                button.addEventListener('click', () => this.showCreateEventForm());
            }
        }
    },

    showCreateEventForm() {
        const control = document.getElementById('create-event-control');
        const section = document.getElementById('create-event-section');
        if (control) control.style.display = 'none';
        if (section) section.style.display = 'block';
    },

    async loadEvents() {
        Utils.showLoading('events-grid');

        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.EVENTS);
            if (!response.ok) {
                const error = await response.text();
                console.error('Event load failed:', response.status, error);
                Utils.showError('events-grid', 'Failed to load events.');
                return;
            }

            const data = await response.json();
            const events = data.results || data;
            this.events = events;
            const user = Auth.getUser();

            if (!events.length) {
                Utils.showEmpty('events-grid', 'No events found.');
                return;
            }

            const container = document.getElementById('events-grid');

            container.innerHTML = events.map(event => {
                const canManage = Auth.isAdmin() || (
                    Auth.isClubAdmin() && event.club?.admin?.id === user.id
                );

                return `
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
                        ${canManage ? `
                            <button onclick="Events.editEvent(${event.id})" class="btn btn-outline-primary btn-sm">Edit</button>
                            <button onclick="Events.deleteEvent(${event.id})" class="btn btn-danger btn-sm">Delete</button>
                        ` : `
                            <button onclick="Events.register(${event.id})" class="btn btn-primary btn-sm">Register</button>
                        `}
                    </div>

                </div>
            `;
            }).join('');

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

    async editEvent(eventId) {
        const event = this.events?.find(item => item.id === eventId);
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
            const response = await Utils.patch(CONFIG.ENDPOINTS.EVENT_UPDATE(eventId), payload);
            const result = await response.json();
            if (!response.ok) {
                Utils.showToast(result.detail || result.error || 'Update failed', 'error');
                return;
            }

            Utils.showToast('Event updated successfully');
            this.loadEvents();
        } catch (error) {
            console.error('Edit event error:', error);
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
            Utils.showToast('Event deleted successfully');
            this.loadEvents();
        } catch (error) {
            console.error('Delete event error:', error);
            Utils.showToast('Failed to delete event', 'error');
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
        
        // Format date for Django (YYYY-MM-DDTHH:MM)
        let dateValue = document.getElementById('event-date').value;
        if (dateValue) {
            // Convert from datetime-local format to Django expected format
            dateValue = dateValue.replace('T', ' ') + ':00';
        }
        
        const clubValue = parseInt(clubId, 10);
        const capacityValue = parseInt(document.getElementById('event-capacity').value, 10);

        if (!clubValue || Number.isNaN(clubValue)) {
            Utils.showToast('Please select a club', 'error');
            return;
        }
        if (!capacityValue || Number.isNaN(capacityValue) || capacityValue <= 0) {
            Utils.showToast('Please enter a valid capacity greater than 0', 'error');
            return;
        }

        const data = {
            club: clubValue,
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            date: dateValue,
            location: document.getElementById('event-location').value,
            capacity: capacityValue
        };

        try {
            console.log('Creating event with data:', data);
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

            console.log('Response status:', response.status);
            const text = await response.text();
            console.log('Response text:', text);
            
            if (!response.ok) {
                try {
                    const res = JSON.parse(text);
                    Utils.showToast(res.detail || res.error || JSON.stringify(res) || 'Failed to create event', 'error');
                } catch(e) {
                    Utils.showToast('Error: Server returned ' + response.status, 'error');
                }
                return;
            }
            
            const res = JSON.parse(text);
            console.log('Response data:', res);

            Utils.showToast('Event created successfully! 🎉');
            document.getElementById('create-event-form').reset();
            this.loadEvents();

        } catch (error) {
            console.error('Error creating event:', error);
            Utils.showToast('Error creating event: ' + error.message, 'error');
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
