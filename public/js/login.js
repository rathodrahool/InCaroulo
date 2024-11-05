document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorToast = document.getElementById('error-toast');
    const errorList = errorToast.querySelector('ul');
    const closeToastButton = document.getElementById('close-toast');

    function showErrorToast(messages) {
        errorList.innerHTML = '';
        messages.forEach((message) => {
            const li = document.createElement('li');
            li.textContent = message;
            errorList.appendChild(li);
        });
        errorToast.style.display = 'flex';
    }

    function hideErrorToast() {
        errorToast.style.display = 'none';
    }

    function showSuccessToast(message) {
        const successToast = document.createElement('div');
        successToast.className =
            'fixed right-4 bottom-4 bg-green-100 text-green-700 p-4 rounded-lg shadow-lg flex items-center space-x-4';
        successToast.innerHTML = `
            <div>${message}</div>
            <button class='ml-4 text-green-600 hover:text-green-800 focus:outline-none' onclick='this.parentElement.remove();'>
                &times;
            </button>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => {
            successToast.remove();
        }, 3000);
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3400/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Login failed. Please try again.');
            }

            const data = await response.json();

            localStorage.setItem('access_token', data.data.access_token);
            localStorage.setItem('refresh_token', data.data.refresh_token);

            showSuccessToast(data.message);

            setTimeout(() => {
                window.location.href = 'http://localhost:3400/api/v1/auth/dashboard';
            }, 2000);
        } catch (error) {
            showErrorToast([error.message]);
        }
    });

    // Close toast button event listener
    closeToastButton.addEventListener('click', hideErrorToast);
});
