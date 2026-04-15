# 🎨 CognitoMark Frontend

A premium, real-time interface for the High-Fidelity Exam Portal. Built with Next.js, it features glassmorphism aesthetics and advanced behavioral tracking.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

---

## 📂 Exhaustive File Structure

| Path | Description |
| :--- | :--- |
| `src/app/` | Next.js App Router. Contains global layout and page entry points. |
| `src/screens/student/` | Student views: Login, Exam Picker, and the high-fidelity Exam Interface. |
| `src/screens/admin/` | Admin views: Live Dashboard, Student/Session management, and Reports. |
| `src/components/` | Reusable UI: `Sidebar`, `Navbar`, `ConfirmModal`, `MetricCard`, and Auth Guards. |
| `src/api/` | API service wrappers for backend communication. |
| `src/hooks/` | Custom React hooks for socket connections and telemetry. |
| `src/utils/` | Shared utilities for formatting and data processing. |
| `src/index.css` | Core design system with glassmorphism and modern UI tokens. |

---

## 📊 Way of Working: Exam Interface State

```mermaid
graph TD
    A[Exam Start] --> B[Load Questions]
    B --> C[Render Current Question]
    C -->|Answer Changed| D[Auto-save to Backend]
    C -->|Click Event| E[Check Coordinates & Buffer]
    E -->|10s Window| F[Send Telemetry Batch]
    C -->|Next/Prev| G{Check Answers}
    G -->|Partial| H[Stay / Warn]
    G -->|Valid| I[Update Index]
    I --> C
    C -->|Submit| J[Final Score & Feedback]
```

---

## 💎 Design Aesthetics

- **Glassmorphism**: Subtle translucent backgrounds with frosted glass effects.
- **Micro-animations**: Smooth transitions for sidebars and modals.
- **Dynamic Telemetry**: Live stress-bar and click visualization for admins.
- **Responsive Layout**: Seamless experience across different screen sizes.

---

## 🛠️ Development

### Setup
1. `cd frontend`
2. `npm install`
3. Configure `.env`:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
4. `npm run dev` (Starts development server on port 3000)