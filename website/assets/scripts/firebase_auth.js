import { auth } from "./firebase_init.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, deleteUser, signOut, validatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

let currentUser = null;

/*export function getCurrentUser(){
    return CurrentUser;
}*/

const authStateListeners = [];

export function subscribeToAuthChanges(callback) {
    authStateListeners.push(callback);
    callback(currentUser);

    return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1){
            authStateListeners.splice(index, 1);
        }
    };
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        console.log("Login submitted");

        const button = loginForm.querySelector("button");
        const loadingIcon = button.querySelector(".button-loading-icon");
        const text = button.querySelector(".button-text")

        if (loadingIcon) {
            loadingIcon.classList.remove("hidden");
        }

        const email = loginForm.querySelector("input[name='email-input']").value;
        const password = loginForm.querySelector("input[name='password-input']").value;

        try {
            text.textContent = ""
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Signed in as", userCredential.user.email);

            //window.location.href = "./dashboard.html";
        } catch (error) {
            alert("Failed to log in. \nError message: " + error.message);
            console.error("Login failed:", error.code, error.message);
            window.location.reload();
        }
    });
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        console.log("Signup submitted");

        const button = signupForm.querySelector("button");
        const loadingIcon = button.querySelector(".button-loading-icon");
        const text = button.querySelector(".button-text")

        const email = signupForm.querySelector("input[name='email-input']").value;
        const password = signupForm.querySelector("input[name='password-input']").value;
        const confirmPassword = signupForm.querySelector("#password-confirm").value;

        if (password !== confirmPassword) {
            alert("Error: passwords must match");
            console.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            alert("Error: password must be at least 8 characters");
            console.error("Password must be at least 8 characters");
            return;
        }

        if (loadingIcon) loadingIcon.classList.remove("hidden");

        try {
            if (text) text.textContent = "";
            button.disabled = true;

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            alert("Account created: " + userCredential.user.email);
            console.log("Account created:", userCredential.user.email);
            window.location.href = "./dashboard.html";
        } catch (error) {
            alert("Failed to sign up: " + error.message);
            console.error("Signup failed:", error.code, error.message);
        } finally {
            window.location.reload();
        }
    });
}

const logoutBtn = document.getElementById("logout-button");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async (event) => {
        try {
            if (logoutBtn) logoutBtn.textContent = "..."
            await signOut(auth);
            console.log("Successfully logged out");
        } catch (error) {
            alert("Logout failed: " + error.message);
            console.error("Logout failed:", error.code, error.message);
        } finally {
            window.location.reload();
        }
    });
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;

    authStateListeners.forEach(listener => listener(user));

    const loginPageLink = document.querySelector(".right>a");

    if (user) {
        //console.log("Logged in as:", user.email, user.uid);
        currentUser = user

        document.documentElement.classList.add("logged-in");

        if (loginPageLink) {
            loginPageLink.textContent = "Logged in"
        }

        const userEmailSpan = document.getElementById("user-email-span");
        if (userEmailSpan){
            userEmailSpan.textContent = '"'+ user.email + '"';
        }

        const changePasswordBtn = document.getElementById("change-password-button");
        if (changePasswordBtn) {
            changePasswordBtn.onclick = async () => {
                try {
                    await sendPasswordResetEmail(auth, user.email);

                    alert('An email has been sent to "' + user.email + '" to reset your password.');
                    console.log("Sent email to change password");
                } catch (error) {
                    console.error("Logout failed:", error.code, error.message);
                }
            };
        }

        const deleteAccountBtn = document.getElementById("delete-account-button");
        if (deleteAccountBtn) {
            deleteAccountBtn.onclick = async () => {
                try {
                    confirm("Are you sure you wish to delete your account? You will lose all account and sensor data permanently.");

                    await deleteUser(user);
                    console.log("User deleted");
                    signOut(auth);
                    window.location.reload();
                } catch (error) {
                    console.error("Logout failed:", error.code, error.message);
                }
            };
        }

        window.markAuthReady?.(); // Sets the flag which indicates all UI changes due to auth state checking are ready (to remove loading screen)
    } else {
        currentUser = null;

        if (window.location.pathname.endsWith("dashboard.html")) {
            alert("You are logged out. Please log in or create an account.");
            window.location.href = "login.html";
        }

        if (loginPageLink) {
            loginPageLink.textContent = "Login";
            window.markAuthReady?.();
        }
    }
});