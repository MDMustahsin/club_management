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
                const donationData = {
                    transactionId: transactionId,
                    amount: res.donation.amount,
                    clubName: res.donation.club.name,
                    timestamp: new Date().toISOString()
                };
                
                // Store for persistent notification
                localStorage.setItem('donation_success', JSON.stringify(donationData));
                
                if (Auth.isLoggedIn()) {
                    // Redirect logged-in users to dashboard
                    Utils.showToast(`Donation successful! Transaction ID: ${transactionId} 💚`);
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    // For guests, show persistent notification
                    Donations.showGuestSuccessNotification(donationData);
                }
            } else {
                Utils.showToast(res.detail || res.error || 'Failed', 'error');
            }

        } catch (error) {
            Utils.showToast('Error processing donation', 'error');
        }
    },

    showGuestSuccessNotification(donationData) {
        const notification = document.getElementById('guest-donation-success');
        const details = document.getElementById('guest-donation-details');
        
        details.innerHTML = `
            <strong>Transaction ID:</strong> ${donationData.transactionId}<br>
            <strong>Amount:</strong> $${donationData.amount}<br>
            <strong>Club:</strong> ${donationData.clubName}<br>
            <strong>Date:</strong> ${Utils.formatDateTime(donationData.timestamp)}
        `;
        
        notification.style.display = 'block';
        
        // Reset form after showing notification
        document.getElementById('donationForm').reset();
    },

    closeGuestNotification() {
        const notification = document.getElementById('guest-donation-success');
        notification.style.display = 'none';
    }
};
