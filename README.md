# Request.me

<div align="center">
  <img src="/client/public/RequestLogoDark.png" alt="Request.me Logo" width="200"/>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
</div>

A comprehensive request management system that streamlines and automates request processing workflows. Built with a modern tech stack, it offers real-time analytics using websockets and modern payouts using Stripe's developer API.

[Live Demo](https://www.request-app.me/) | [GitHub Repository](https://github.com/daniel1lima/request_web)

## 🚀 Features

<table>
<tr>
<td width="50%">

### 1. Payment Integration
- Seamless Stripe integration
- Automated payout processing
- Transaction history and reporting
- Multi-currency support

</td>
<td width="50%">

![Stripe Payment Integration](/images/projects/request/payment.jpg)
*The main client facing page utilizing the express checkout stripe component*

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### 2. Real-time Request Processing
- Instant request submission and processing
- Live status updates using WebSocket technology
- Real-time analytics dashboard
- Automated request categorization

</td>
<td width="50%">

![WebSocket Integration](/images/projects/request/websocket.jpg)
*Websocket status displaying on the admin dashboard*

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### 3. Accepted Request Tracking
- Real-time queue visualization for upcoming songs
- Live updates when requests are accepted or played
- Song history tracking for event attendees

</td>
<td width="50%">

![Request Tracking](/images/projects/request/tracking.jpg)
*Public-facing request queue showing upcoming songs and currently playing track*

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### 4. Multi-DJ Management
- Create and manage multiple DJs for a single event
- Seamless DJ handoffs with real-time status updates
- Dynamic DJ rotation with customizable schedules
- Individual request queues for each performing DJ

</td>
<td width="50%">

![DJ Management](/images/projects/request/dj-management.jpg)
*Admin interface showing DJ management panel with current active DJ and rotation controls*

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### 5. SMS Notification System
- Twilio SMS integration for request updates
- Text message confirmations when requests are accepted
- SMS-based request cancellation functionality
- Automated reminders when a request is about to play

</td>
<td width="50%">

![SMS Notifications](/images/projects/request/sms-notification.jpg)
*Example of SMS notifications sent to attendees with request status updates*

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### 6. Spotify API Integration
- Real-time song search across Spotify's vast library
- Rich metadata including album art, artist info, and song duration
- Audio previews for DJs to evaluate requests
- Smart search with autocomplete and filtering options

</td>
<td width="50%">

![Spotify Integration](/images/projects/request/spot.jpg)
*Song search interface powered by Spotify API showing search results with album artwork*

</td>
</tr>
</table>

## 🏗️ Technical Architecture

![System Architecture](/images/projects/request/arch.jpg)
*High-level overview of the Request.me system architecture*

### Frontend Stack
- React 18
- TypeScript
- Next.js
- Tailwind CSS
- WebSocket for real-time updates
- React Query for data fetching

### Backend Stack
- Node.js
- Express
- PostgreSQL
- WebSocket Server
- Stripe API Integration
- Spotify API Integration

## 📁 Project Structure

```
request_web/
├── client/           # Frontend Next.js application
├── server/           # Backend Express server
├── shared/           # Shared types and utilities
└── docs/            # Project documentation
```

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Rate limiting
- Data encryption
- Secure WebSocket connections

## ⚡ Performance Optimizations

- Database indexing
- Query optimization
- Caching strategies
- Load balancing
- CDN integration

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/daniel1lima/request_web.git

# Install dependencies
bun install:all

# Set up environment variables
cp .env.example .env

# Start development servers
bun dev
```

## 🗺️ Future Roadmap

- Enhanced analytics and reporting
- Soundcloud Support
- Native integration with [Serrato](https://serato.com/) or [RekordBox](https://rekordbox.com/en/)
- Mobile application
- Additional payment providers
- Advanced analytics
- Custom workflow builder

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
