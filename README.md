# Sycamore Backend Assessment

A comprehensive Node.js/TypeScript/Sequelize/PostgresSQL backend application demonstrating idempotent wallet transfers with race condition prevention and precise interest accumulation calculations.

## Overview

This project implements two core features:

1. **The Idempotent Wallet** - A robust transfer system that handles concurrent requests, prevents double-spending, and ensures transactional integrity through idempotency keys, database transactions and atomic operations.

2. **The Interest Accumulator** - A high-precision interest calculation service (27.5% APR) that accurately handles leap years and floating-point precision using Decimal.js.

## Features

### Idempotent Wallet Features

- ✅ **Idempotency Key Support** - Prevents duplicate transaction processing
- ✅ **Race Condition Prevention** - Uses row-level locks and database transactions
- ✅ **Transaction Logging** - All transfers logged with status tracking (PENDING, SUCCESSFUL, FAILED)
- ✅ **Currency Validation** - Ensures transfers only occur between wallets of the same currency
- ✅ **Atomic Operations** - Database transactions ensure all-or-nothing semantics
- ✅ **Error Recovery** - Automatic transaction rollback on failures

### Interest Accumulator Features

- ✅ **High Precision Calculations** - Uses Decimal.js to avoid floating-point errors
- ✅ **Leap Year Handling** - Correctly identifies leap years and adjusts day counts
- ✅ **27.5% APR Rate** - Configurable annual percentage rate
- ✅ **Daily Interest Calculation** - Formula: (Balance × APR) / DaysInYear
- ✅ **Comprehensive Testing** - 100% test coverage with edge cases

### General Features

- ✅ **Rate Limiting** - Express rate limiter (10 requests per 5 minutes)
- ✅ **CORS Support** - Configurable cross-origin resource sharing
- ✅ **Error Handling** - Global error handling middleware with standardized responses
- ✅ **Type Safety** - Full TypeScript implementation with strict mode
- ✅ **Jest Testing** - Comprehensive unit test suite

## Setup Instructions

### Prerequisites

- **Node.js** 16+ (tested with Node 18+)
- **PostgreSQL** 12+ (locally or remote instance)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/JacceyCode/sycamore_backend_assessment.git
cd sycamore_backend_assessment
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration

### Step 4: Set Up the Database

Ensure PostgreSQL is running(locallly or docker), and create the database:

Or using psql:

```bash
psql -U postgres
CREATE DATABASE sycamore_assessment;
\q
```

## Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

The server will start on `http://localhost:3000` and watch for file changes.

### Expected Output

In the terminal:

```
Database connected successfully 🚀.
Server 🌐 is running on port 3000
```

Once server is running, it will automatically run migrations to set up the database schema.
The migration will create two tables:

- **Wallets** - Stores wallet information (id, name, balance, currency)
- **Ledgers** - Stores transaction logs (id, debitWalletId, creditWalletId, amount, status, idempotencyKey, comment)

### Verify Setup

To run test, open a new terminal or stop the dev server and run:

```bash
npm test
```

All tests should pass ✅

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Root Endpoint

```http
GET /
```

**Response:**

```
Sycamore Backend Assessment API is running.
```

### Transfer Endpoint

#### Request

```http
POST /transfer
Content-Type: application/json
Idempotency-Key: <UUID v4>

{
  "fromAccount": "WALLET_1",
  "toAccount": "WALLET_2",
  "amount": 500,
  "comment": "Payment for services"
}
```

**Headers:**

- `Idempotency-Key` (required) - UUID v4 to ensure idempotency

**Body:**

- `fromAccount` (string, required) - Source wallet name
- `toAccount` (string, required) - Destination wallet name
- `amount` (number, required) - Transfer amount (minimum 1)
- `comment` (string, optional) - Transfer description

#### Success Response (201 Created)

```json
{
  "status": "success",
  "message": "Transfer of amount USD500 from WALLET_3 to WALLET_4 completed successfully."
}
```

## Architecture & Design Patterns

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Routes)             │
├─────────────────────────────────────────┤
│    Middleware (Validation, Rate Limit)  │
├─────────────────────────────────────────┤
│      Controllers (Request Handlers)     │
├─────────────────────────────────────────┤
│     Services (Business Logic)           │
├─────────────────────────────────────────┤
│       Models (Data Access Layer)        │
├─────────────────────────────────────────┤
│         Database (PostgreSQL)           │
└─────────────────────────────────────────┘
```

### Git Repository

https://github.com/JacceyCode/sycamore_backend_assessment

---

**Last Updated:** February 2025  
**Author:** JacceyCode  
**License:** MIT  
**Version:** 1.0.0
