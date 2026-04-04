# AI Agent Marketplace MVP

This is the frontend skeleton for the AI Agent Marketplace.

## Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Scanning**: JSZip (for package analysis)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    cd marketplace-app
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open Browser**:
    Visit [http://localhost:3000](http://localhost:3000)

## Features Implemented

*   **Landing Page**: Hero section, categories, and "How it works".
*   **Authentication (Mock)**: Login as Buyer, Creator, or Admin using the `/login` page.
*   **Marketplace Browse**: Filter agents by category and search by name.
*   **Agent Detail**: View agent info, pricing, permissions, and trust signals.
*   **Creator Dashboard**: View my agents and "Submit New Agent" form with secure upload.
*   **Admin Dashboard**: Review queue with automated security scan results (Malware, Secrets, File Allowlist) and Approve/Reject actions.

## Security Pipeline (MVP)
*   **Malware Scan**: Mocked (randomly flags files with "virus" in name).
*   **Secrets Scan**: Regex check for AWS keys, OpenAI keys, and Private Keys.
*   **Allowlist**: Enforces allowed file extensions (.py, .js, .json, etc.) and blocks executables (.exe, .dll).
*   **Audit Logging**: Tracks all uploads, scans, approvals, and rejections.

## Project Structure

*   `src/app`: App Router pages.
*   `src/components`: Reusable UI components (Navbar, Button).
*   `src/context`: AuthContext for managing mock user sessions.
*   `src/data`: Mock data for Users and Agents.
*   `src/lib`: Services for DB, Storage, and Security Scanning.
