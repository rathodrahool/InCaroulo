document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const errorToast = document.getElementById('error-toast');
    const errorList = errorToast.querySelector('ul');
    const closeToastButton = document.getElementById('close-toast');

    let toastTimeout;

    // Show Error Toast with Auto-hide
    function showErrorToast(messages) {
        errorList.innerHTML = '';
        messages.forEach((message) => {
            const li = document.createElement('li');
            li.textContent = message;
            errorList.appendChild(li);
        });
        errorToast.classList.add('show');

        // Clear any previous timeout and set a new one to auto-hide after 3 seconds
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(hideErrorToast, 3000);
    }

    // Hide Error Toast
    function hideErrorToast() {
        errorToast.classList.remove('show');
    }

    // Show Success Toast with Auto-hide
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

        // Auto-hide after 3 seconds
        setTimeout(() => {
            successToast.remove();
        }, 3000);
    }

    // Toggle Password Visibility for Password and Confirm Password Fields
    function togglePasswordVisibility(inputId, iconId) {
        const passwordInput = document.getElementById(inputId);
        const icon = document.getElementById(iconId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            icon.textContent = 'Show';
        }
    }

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const full_name = document.getElementById('full_name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm-password').value;
        try {
            const response = await fetch('http://localhost:3400/api/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ full_name, email, password, confirm_password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Signup failed. Please try again.');
            }

            showSuccessToast('Verification link sent. Check your email.');

            setTimeout(() => {
                window.location.href = 'http://localhost:3400/api/v1/auth/verificationMail';
            }, 2000);
        } catch (error) {
            showErrorToast([error.message]);
        }
    });

    // Event listeners for show/hide password buttons
    document.getElementById('password-icon').addEventListener('click', () => {
        togglePasswordVisibility('password', 'password-icon');
    });
    document.getElementById('confirm-password-icon').addEventListener('click', () => {
        togglePasswordVisibility('confirm-password', 'confirm-password-icon');
    });

    // Close toast button event listener
    closeToastButton.addEventListener('click', hideErrorToast);
});
