const Donations = {

    init() {
        document.getElementById('donationForm')
            .addEventListener('submit', this.submit);
    },

    async submit(e) {
        e.preventDefault();

        if (!Auth.requireLogin()) return;

        const data = {
            club: document.getElementById('club').value,
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
            } else {
                Utils.showToast(res.detail || 'Failed', 'error');
            }

        } catch (error) {
            Utils.showToast('Error processing donation', 'error');
        }
    }
};