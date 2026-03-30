# Roommate Link: Authentication & Google OAuth Guide

This guide explains exactly how to set up the "Sign in with Google" button and help you understand the flow of your application's security.

---

## 1. The Global Auth Strategy
Your app uses **Supabase Auth** as the "Brain" of your security.
- **Goal:** Allow any student to sign up (Gmail, Hotmail, UCC email).
- **Verification:** Give a "Verified Student" badge ONLY to those who prove they own a `@stu.ucc.edu.gh` email.
- **Experience:** Google Login for speed, Email/Password for students without Google.

---

## 2. Setting Up "Sign in with Google"
Since you have a Google button on your page, follow these steps to make it work:

### Step A: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** called "Roommate Link".
3. Search for **"APIs & Services"** -> **"OAuth consent screen"**.
4. Choose **"External"** (since students are technically external users).
5. Fill in the App Name, User Support Email, and Developer Contact Info.
6. Under **"Scopes"**, add `./auth/userinfo.email` and `./auth/userinfo.profile`.
7. Fill in the rest and hit Save.

### Step B: Create Credentials
1. Click **"Credentials"** in the left menu.
2. Click **"Create Credentials"** -> **"OAuth client ID"**.
3. Select **"Web application"**.
4. Under **"Authorized redirect URIs"**, you need to paste your Supabase URL. 
   - *Find this in your Supabase Dashboard -> Auth -> Providers -> Google.* 
   - It usually looks like: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
5. Click **Create**. You will receive a **Client ID** and **Client Secret**.

### Step C: Supabase Configuration
1. Go to your **Supabase Dashboard**.
2. Go to **Auth** -> **Providers** -> **Google**.
3. Toggle "Enabled" to **ON**.
4. Paste your **Client ID** and **Client Secret** from Step B.
5. Hit **Save**.

---

## 3. The "Student Verification" Logic
Here is how we handle the "I have a Gmail but I am a student" problem:

1. **User Signs In:** Kwame signs in with `kwame123@gmail.com` via Google.
2. **First State:** Kwame is logged in but has NO "Verified Student" badge.
3. **The Hook:** In the Settings page, Kwame sees a button: **"Verify Student Status"**.
4. **The Input:** Kwame enters his official `kwame@stu.ucc.edu.gh` email.
5. **The Magic:** We call `supabase.auth.verifyOtp` or send a magic link specifically to that address.
6. **Confirmation:** Once Kwame clicks the link in his UCC inbox, we set `is_student_verified = true` in the database.

---

## 4. Rate Limiting & Security
- **Built-in Protection:** Supabase automatically limits how many times someone can try to log in per hour. You don't need to write any code for this.
- **Middleware (The Bouncer):** Our `proxy.ts` file is already checking every single request. If a user is NOT logged in, they are instantly kicked back to `/auth`.

---

### 🛡️ Final Step
Before we start wiring up the buttons, make sure you have run the SQL to add the checkmark column:
```sql
ALTER TABLE users ADD COLUMN is_student_verified BOOLEAN DEFAULT FALSE;
```
