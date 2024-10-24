/* eslint-disable @typescript-eslint/no-unused-vars */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('password-icon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        passwordIcon.textContent = 'Show';
    }
}

function toggleConfirmPasswordVisibility() {
    const confirmPasswordInput = document.getElementById('confirm-password');
    const confirmPasswordIcon = document.getElementById('confirm-password-icon');
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        confirmPasswordIcon.textContent = 'Hide';
    } else {
        confirmPasswordInput.type = 'password';
        confirmPasswordIcon.textContent = 'Show';
    }
}

// Function to show error toast message
function showErrorToast() {
    const errorToast = document.getElementById('error-toast');
    if (errorToast) {
        errorToast.classList.add('show');
        setTimeout(() => {
            errorToast.classList.remove('show');
        }, 5000); // Change the time (in milliseconds) as needed
    }
}

// Function to close the toast manually
function closeToast() {
    const errorToast = document.getElementById('error-toast');
    if (errorToast) {
        errorToast.classList.remove('show');
    }
}

// Event listener for close button
document.getElementById('close-toast')?.addEventListener('click', closeToast);

// Call the function on page load to show the error toast
window.onload = function () {
    showErrorToast();
};
