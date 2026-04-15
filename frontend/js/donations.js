const Donations = {

    async init() {
        await this.loadClubs();
        
        document.getElementById('donationForm')
            .addEventListener('submit', (e) => this.submit(e));
    },

    async loadClubs() {
        try {
            const response = await Utils.get(CONFIG.ENDPOINTS.CLUBS);
            const data = await response.json();
            const clubs = data.results || data;

            const select = document.getElementById('club');
            
            clubs.forEach(club => {
                const option = document.createElement('option');
                option.value = club.id;
                option.textContent = `${club.name} (ID: ${club.id})`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading clubs:', error);
        }
    },

    async submit(e) {
        e.preventDefault();

        if (!Auth.requireLogin()) return;

        const clubId = document.getElementById('club').value;
        const data = {
            club: parseInt(clubId),
            amount: document.getElementById('amount').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.DONATION_MEMBER,
                data
            );

            const res = await response.json();

            if (response.ok) {
                Utils.showToast('Donation successful 💚');
                document.getElementById('donationForm').reset();
            } else {
                Utils.showToast(res.detail || 'Failed', 'error');
            }

        } catch (error) {
            Utils.showToast('Error processing donation', 'error');
        }
    }
};
