🎓 Campus Connect: "The Board"

🌐 Live Demo: https://campus-news-ten.vercel.app
⚙️ Live API: https://campusnews.onrender.com

A modern, full-stack campus announcement and event tracking platform inspired by the aesthetic of physical split-flap departure boards. Built for speed, reliability, and real-time filtering.

✨ Features

"The Board" UI/UX: A highly customized, premium interface featuring live clocks, monospace date chips, and a distinct non-generic identity.

Lightning-Fast Client-Side Filtering: Search and categorize notices and events instantly with zero network latency.

Role-Based Access Control: Distinct database models for Students, Organizers, and Admins to ensure secure operations.

Cloud-Native Database: Powered by a PostgreSQL database hosted on Neon.tech, interfaced seamlessly via Prisma ORM.

🛠️ Tech Stack

Frontend:

React.js (Vite)

Tailwind CSS

Custom typography (Space Grotesk, Inter, IBM Plex Mono)

Backend:

Node.js & Express.js

Prisma ORM

PostgreSQL (Neon.tech)

JWT Authentication & Bcryptjs

📡 API Endpoints

POST /register - Register a new organizer

POST /login - Organizer login

POST /register-admin - Create a master admin

POST /login-admin - Admin login

PATCH /users/:id/approve - Admin approval for organizers

GET /users - List all users

POST /events - Create a new event

GET /events - Fetch all events (supports ?category= query)

POST /notices - Create a new notice

GET /notices - Fetch all notices
