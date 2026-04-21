const Donations = {

    async init() {
        await this.loadClubs();
        
        // Show guest fields if not logged in
        if (!Auth.isLoggedIn()) {
            document.getElementById('guestFields').style.display = 'block';
            document.getElementById('guestEmailField').style.display = 'block';
            document.getElementById('guestName').required = true;
            document.getElementById('guestEmail').required = true;
        }
        
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

        const clubId = document.getElementById('club').value;
        const data = {
            club: parseInt(clubId, 10),
            amount: parseFloat(document.getElementById('amount').value),
            message: document.getElementById('message').value
        };

        // Add guest fields if not logged in
        if (!Auth.isLoggedIn()) {
            data.guest_name = document.getElementById('guestName').value;
            data.guest_email = document.getElementById('guestEmail').value;
        }

        try {
            const response = await Utils.post(
                CONFIG.ENDPOINTS.DONATION_CREATE,
                data
            );

            const res = await response.json();

            if (response.ok) {
                const transactionId = res.donation.transaction_id;
                Utils.showToast(`Donation successful! Transaction ID: ${transactionId} 💚`);
                document.getElementById('donationForm').reset();
            } else {
                Utils.showToast(res.detail || res.error || 'Failed', 'error');
            }

        } catch (error) {
            Utils.showToast('Error processing donation', 'error');
        }
    }
};
