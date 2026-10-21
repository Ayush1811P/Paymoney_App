# PayMoney App

PayMoney is a comprehensive web and native Kotlin Android application for seamless financial transactions, including recharges, DTH, broadband, electricity, UPI payments, and Fixed Deposits.

## Features

- **PayMoney Rebirth Landing Page**: High-performance, responsive luxury fintech landing experience.
- **Normal & Lite Accounts**: Independent adult accounts alongside supervised Lite child accounts.
- **Family Dashboard**: Parent monitoring system with real-time child transaction feeds and spending overview.
- **Dashboard**: Track your balance, recent transactions, and quick links.
- **UPI Payments & Dynamic QR**: Scan and pay with camera QR reader, generate dynamic payment QR codes, or send money directly to UPI IDs.
- **Mobile & DTH Recharge**: Quick and easy prepaid/postpaid recharges with downloadable receipts.
- **Utility Bills**: Pay your electricity and broadband bills instantly.
- **Fixed Deposits**: Secure your money with attractive interest rates.
- **Android Native App**: High-performance Kotlin WebView application wrapper with camera permissions, file upload support, and offline resilience.

## Getting Started

1. Open [index.html](file:///c:/Users/ayush/Desktop/Paymoney%20App/index.html) in your browser for the web version.
2. For Android, you can install the pre-built [PayMoney_fixed.apk](file:///c:/Users/ayush/Desktop/Paymoney%20App/PayMoney_fixed.apk) directly or rebuild using `./gradlew assembleDebug` in the `android/` directory.

## Architecture

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Backend/Database**: Supabase PostgreSQL + Netlify Serverless Functions
- **Android**: Native Kotlin, AndroidX, Modern WebView with hardware acceleration

## Automated Build

The Android APK is automatically built on every push to the `main` or `master` branch using GitHub Actions (`.github/workflows/android-build.yml`). Check the Actions tab in this repository to download the latest debug APK.
