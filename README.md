# PayMoney App

PayMoney is a comprehensive web and native Kotlin Android application for seamless financial transactions, including recharges, DTH, broadband, electricity, UPI payments, and Fixed Deposits.

## Features

- **Dashboard**: Track your balance, recent transactions, and quick links.
- **Mobile & DTH Recharge**: Quick and easy prepaid/postpaid recharges.
- **Utility Bills**: Pay your electricity and broadband bills instantly.
- **UPI Payments**: Scan and pay or send money directly to UPI IDs.
- **Fixed Deposits**: Secure your money with attractive interest rates.
- **Android App**: A native Kotlin WebView application wrapper with optimized performance.

## Getting Started

1. Open `index.html` in your browser for the web version.
2. For Android, you can build the APK via the provided GitHub Actions workflow `.github/workflows/android-build.yml` or using Gradle.

## Architecture

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend/Database**: Supabase
- **Android**: Native Kotlin, WebView

## Automated Build

The Android APK is automatically built on every push to the `main` or `master` branch using GitHub Actions. Check the Actions tab in this repository to download the latest debug APK.
