# PayMoney Lite Account — Workflow & Required Changes

## 1. Objective

Add a new **PayMoney Lite Account** feature to the existing PayMoney application.

The existing normal PayMoney account and its workflow should continue working as before.

The new Lite Account is designed for children/family members whose spending can be monitored by a connected parent account.

The Lite Account should provide the existing payment functionality of PayMoney while introducing a separate parent-child monitoring system.

The parent should be able to view the Lite Account's transaction activity in real time.

---

# 2. Important Design Principle

The Lite Account is **not a restricted merchant-only account**.

A Lite Account user can:

* Send money to normal PayMoney users.
* Make merchant payments.
* Pay electricity bills.
* Recharge mobile phones.
* Pay DTH bills.
* Pay broadband/internet bills.
* Use QR payments.
* Use other supported PayMoney payment services.
* Use subscription/automatic recharge functionality.

The main difference is:

> A Lite Account can optionally be connected to a parent's existing PayMoney account, allowing the parent to monitor the Lite Account's spending through a separate Lite Transaction History.

The existing normal transaction history should not be mixed with the Lite monitoring history.

---

# 3. Changes Required in the Existing Workflow

## 3.1 Registration Page

The current registration system should be expanded to provide two registration options.

Current:

```text
Register
```

New:

```text
Create PayMoney Account

[ Normal Account Register ]

[ Lite Account Register ]
```

### Normal Account Register

The existing registration workflow remains unchanged.

Current flow:

```text
Name
Email
Mobile Number
Password
        ↓
Validation
        ↓
OTP sent to user's email
        ↓
OTP verification
        ↓
Normal PayMoney account created
```

Do not break or unnecessarily modify this workflow.

---

# 4. New Lite Account Registration

When the user selects:

```text
Lite Account Register
```

show the following fields:

```text
Full Name
Mobile Number
Age
Password
Parent's PayMoney Email
```

The Lite Account does not require a separate child email for the parent-link verification process.

The parent email is the email address already registered with an existing PayMoney parent account.

---

# 5. Parent Email Validation

After the user enters the parent's email:

```text
Parent Email
       ↓
Check whether this email belongs to
an existing PayMoney account
```

If the parent account does not exist:

```text
Parent account not found.

Please enter the email address
associated with an existing PayMoney account.
```

If the parent account exists:

```text
Send OTP to parent's registered email.
```

The OTP should be sent to the parent's email, not the child's email.

---

# 6. Lite Registration OTP

The Lite registration should use the existing OTP security architecture wherever possible.

Flow:

```text
Child enters Lite registration details
                ↓
Parent email entered
                ↓
Check parent account exists
                ↓
Generate OTP
                ↓
Send OTP to parent's registered email
                ↓
Parent receives OTP
                ↓
Parent provides OTP to child
                ↓
Child enters OTP
                ↓
OTP verified
                ↓
Lite Account created
                ↓
Parent and Lite Account linked
```

The purpose of this OTP is to establish that the parent is involved in creating/linking the Lite Account.

The system should not claim that OTP verification legally proves a parent-child relationship.

It verifies access to the parent's registered email and establishes consent/participation for the project workflow.

---

# 7. Login System Changes

The existing login page should be modified to provide two login modes.

```text
                PAYMONEY LOGIN

        ┌───────────────────────┐
        │     Normal Login      │
        └───────────────────────┘

        ┌───────────────────────┐
        │      Lite Login       │
        └───────────────────────┘
```

## Normal Login

The existing login workflow remains unchanged.

```text
Phone Number
      +
Password
      ↓
Authentication
      ↓
OTP / existing authentication workflow
      ↓
Normal Dashboard
```

The existing localStorage session mechanism should continue to be used.

---

# 8. Lite Login

When the user selects:

```text
Lite Login
```

the system authenticates the user against the Lite Account.

The user should remain logged in using the existing localStorage/session mechanism.

After successful authentication:

```text
Lite Login
     ↓
Identify Lite Account
     ↓
Load Lite Account data
     ↓
Load Lite Dashboard
```

The system must distinguish between:

```text
Normal Account
```

and

```text
Lite Account
```

so that a Lite user cannot accidentally enter the normal account dashboard.

---

# 9. Account Type

The user/profile system should now support an account type.

Conceptually:

```text
account_type

normal
lite
```

For a normal user:

```text
account_type = normal
```

For a Lite user:

```text
account_type = lite
```

The Lite account should additionally have a connection to its parent account.

---

# 10. Parent-Lite Relationship

A Lite Account can be connected to one parent PayMoney account.

Conceptually:

```text
Parent PayMoney Account
          │
          │
          ▼
      Lite Account
          │
          │
          ▼
      Child User
```

The relationship should store enough information to identify:

```text
Parent Account
Lite Account
Connection status
Connection creation time
```

---

# 11. Separate Transaction Histories

This is an important requirement.

Do NOT mix the parent's normal transactions with the child's Lite transactions.

The parent should have two possible transaction views.

### Normal Transaction History

```text
My Transactions
```

This shows transactions made by the parent.

### Lite Transaction History

```text
Lite Account Activity
```

This shows transactions made by the connected Lite Account.

The Lite Transaction History option should only appear if the parent actually has a connected Lite Account.

Example:

```text
Parent Dashboard

Transaction History

[ My Transactions ]

[ Lite Account Activity ]
```

If no Lite Account is connected:

```text
Lite Account Activity
```

should not be displayed.

---

# 12. Real-Time Lite Transaction Monitoring

When a Lite Account performs a transaction, the parent's Lite Transaction History should update in real time.

Example:

```text
Child/Lite Account
        ↓
Makes ₹500 payment
        ↓
Transaction completed
        ↓
Lite transaction record created
        ↓
Parent's Lite Activity updated
        ↓
Parent sees the transaction
```

The parent should not have to manually create a transaction record.

The system should automatically associate the transaction with the Lite Account.

---

# 13. Example of Parent View

Parent dashboard:

```text
PAYMONEY

Balance
₹18,500

My Transactions
-------------------------
₹2,000 → Rahul
₹799   → Electricity
₹500   ← Amit


LITE ACCOUNT
-------------------------
Child: Ayush

Current Balance: ₹3,250

[ View Lite Transactions ]
```

When the parent opens Lite Activity:

```text
LITE ACCOUNT ACTIVITY

Child: Ayush

Today

10:42 AM
₹299
Mobile Recharge

11:15 AM
₹450
Paid to Rahul

01:30 PM
₹699
Broadband Payment

03:05 PM
₹250
Merchant Payment
```

These transactions belong to the Lite Account and should not be mixed into the parent's own transaction history.

---

# 14. Lite Account Dashboard

The Lite Account should still have the main PayMoney functionality.

Example:

```text
PAYMONEY LITE

Welcome, Ayush

Wallet Balance
₹3,250

Quick Actions

[ Send Money ]
[ Scan & Pay ]
[ Mobile Recharge ]
[ Electricity ]
[ DTH ]
[ Broadband ]
[ Transactions ]

Subscriptions

[ Mobile Auto Recharge ]
[ Internet Auto Payment ]
```

The Lite user should be able to send money to another normal PayMoney user.

Example:

```text
Lite User
    ↓
Enter normal PayMoney user's
phone number / PayMoney ID
    ↓
UPI PIN verification
    ↓
Payment
    ↓
Transaction recorded
    ↓
Parent sees transaction
```

---

# 15. Lite Account Does Not Change Existing Payment Security

The existing UPI PIN security mechanism should continue to protect balance-deducting operations.

The project already uses a centralized UPI PIN verification mechanism for operations such as:

* P2P transfers
* Bill payments
* Mobile recharge
* FD creation

The Lite Account should use the same security principle.

Therefore:

```text
Lite Payment
     ↓
UPI PIN Verification
     ↓
Payment Authorized
     ↓
Transaction Created
```

---

# 16. Lite Account Subscriptions

Lite users should be able to configure recurring services such as:

```text
Mobile Auto Recharge
Internet/Broadband Auto Payment
Other supported recurring services
```

Example:

```text
Mobile Recharge

Amount: ₹299
Frequency: Monthly

[ Enable Auto Recharge ]
```

The parent should be able to see the Lite Account's recurring/subscription activity as part of the Lite account information.

Example:

```text
LITE SUBSCRIPTIONS

Mobile Recharge
₹299 / month

Internet
₹699 / month

Total recurring payments
₹998 / month
```

---

# 17. Complete Lite Account Workflow

The complete workflow should be:

```text
                    PAYMONEY
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    NORMAL REGISTER           LITE REGISTER
          │                         │
          │                    Name
          │                    Mobile
          │                    Age
          │                    Password
          │                    Parent Email
          │                         │
          │                         ▼
          │                 Check Parent Account
          │                         │
          │                    Account exists
          │                         │
          │                         ▼
          │                 Send OTP to Parent
          │                     Email
          │                         │
          │                         ▼
          │                  Parent receives OTP
          │                         │
          │                         ▼
          │                  OTP given to child
          │                         │
          │                         ▼
          │                    OTP verified
          │                         │
          │                         ▼
          │                Lite Account Created
          │                         │
          │                         ▼
          │                 Parent ↔ Lite Linked
          │
          ▼
    Normal Account
```

---

# 18. Lite Login Workflow

```text
                    LOGIN
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    NORMAL LOGIN             LITE LOGIN
          │                       │
          ▼                       ▼
   Normal Account           Lite Account
          │                       │
          ▼                       ▼
 Normal Dashboard          Lite Dashboard
          │                       │
          ▼                       ▼
 Normal Transactions       Lite Transactions
                                  │
                                  ▼
                         Payment / Recharge /
                         Bills / QR / etc.
                                  │
                                  ▼
                          UPI PIN Verification
                                  │
                                  ▼
                            Transaction
                                  │
                                  ▼
                         Lite Transaction
                              History
                                  │
                                  ▼
                         Parent's Lite
                         Activity History
                                  │
                                  ▼
                            Real-Time View
```

---

# 19. Parent Monitoring Workflow

```text
Parent Account
      │
      ▼
Check connected Lite Account
      │
      ▼
Lite Account exists?
      │
    YES
      │
      ▼
Show "Lite Account Activity"
      │
      ▼
Parent opens Lite Activity
      │
      ▼
View child's transactions
      │
      ▼
New child transaction occurs
      │
      ▼
Lite transaction database updated
      │
      ▼
Parent activity updates in real time
```

---

# 20. Important Separation

The application should maintain two conceptual transaction systems:

```text
NORMAL TRANSACTIONS
        │
        └── Transactions belonging to normal
            PayMoney account activity


LITE TRANSACTIONS
        │
        └── Transactions belonging to Lite
            Account activity
```

A Lite transaction should still be a genuine PayMoney transaction, but it should additionally be identifiable as belonging to a Lite Account so that it can be displayed separately to the connected parent.

The parent's own transaction history must remain unaffected.

---

# 21. Final Product Concept

The resulting PayMoney system will have:

### Normal PayMoney

```text
Register
Login
Wallet
UPI
QR
P2P Payments
Recharge
Bills
FD
Offers
Support
```

### PayMoney Lite

```text
Lite Register
Lite Login
Wallet
UPI
QR
P2P Payments
Recharge
Bills
Subscriptions / Auto Recharge
Separate Transaction History
```

### Parent Monitoring

```text
Connected Lite Account
        ↓
Separate Lite Activity
        ↓
Real-Time Child Transactions
        ↓
Spending Visibility
```

The core USP becomes:

> **PayMoney Lite is a connected family payment account that allows children to use the PayMoney ecosystem normally while giving a verified parent real-time visibility into the child's Lite Account transactions through a separate monitoring history.**

This feature extends the existing PayMoney ecosystem instead of replacing the current normal account workflow.
