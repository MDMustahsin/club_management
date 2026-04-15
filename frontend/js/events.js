const Events = {

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
    }
};