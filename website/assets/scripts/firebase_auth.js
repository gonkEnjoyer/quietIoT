import { auth } from "./firebase_init.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const logoutBtn = document.getElementById("logout-button");
const userEmailSpan = document.getElementById("user-email-span");

if (loginForm) {
    console.log("login form found");
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("LOGIN SUBMITTED");
        const email = loginForm.querySelector("input[name='email-input']").value;

        const password = loginForm.querySelector("input[name='password-input']").value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            //alert("Logged in as " + userCredential.user.email);
            console.log("Signed in as", userCredential.user.email);

            window.location.href = "./dashboard.html";
        } catch (error) {
            alert("Failed to log in. Check your password or whether the referenced account exists." + "\nError message:\n" + error.message);
            console.error("Login failed:", error.code, error.message);
        }
    });
}

if (signupForm) {
    console.log("signup form found");
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("SIGNUP SUBMITTED");
        const email = signupForm.querySelector("input[name='email-input']").value;

        const password = signupForm.querySelector("input[name='password-input']").value;

        const confirmPassword = signupForm.querySelector("#password-confirm").value;

        // Password match validation
        if (password !== confirmPassword) {
            alert("Error: passwords must match");
            console.error("Passwords do not match");
            return;
        }

        // Minimum length validation
        if (password.length < 8) {
            alert(" Error: password must be at least 8 characters");
            console.error("Password must be at least 8 characters");
            return;
        }

        try {
            const button = signupForm.querySelector("button");
            button.textContent = "...";
            button.disabled = true;

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            alert("Account created: " + userCredential.user.email);
            console.log("Account created:", userCredential.user.email);
            window.location.href = "./dashboard.html";
        } catch (error) {
            console.error("Signup failed:", error.code, error.message);
        }
    });
}

if (logoutBtn) {
    console.log("Found logout button");
    logoutBtn.addEventListener("click", (event) => {
        try {
            signOut(auth);

            window.location.reload();

            console.log("Successfully logged out");
        } catch (error) {
            console.error("Logout failed:", error.code, error.message);
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in as:", user.email, user.uid);
        document.documentElement.classList.add("logged-in");
        if (userEmailSpan){
            userEmailSpan.textContent = '"'+ user.email + '"';
        }
    } else {
        if (window.location.pathname.endsWith("dashboard.html")) {
            alert("User is signed out. Please log in.")
            console.log("User is signed out");
            window.location.href = "login.html";
        }
    }
});