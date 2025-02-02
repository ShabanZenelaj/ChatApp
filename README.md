# ChatApp

ChatApp is a real-time chat application built using modern web technologies. It allows users to engage in real-time conversations in chat rooms or private messages with enhanced security and performance optimizations.

## Features

- **Real-time Messaging**: Instant message exchange using WebSockets.
- **Chat Rooms**: Users can join and communicate in public or private rooms.
- **Private Messaging (DMs)**: Direct one-on-one messaging.
- **Message History & Pagination**: using a page-based system with a skip parameter for better synchronization.
- **Typing Indicators**: Real-time feedback when users are typing.
- **JWT Authentication**: Secure authentication with stolen token detection.
- **Redis Integration**: Fast message storage and retrieval using Redis.
- **Scalability**: Supports horizontal scaling using Redis Pub/Sub.
- **Docker Support**: Easily deployable with Docker.

## Tech Stack

### Backend:
- **Node.js**: JavaScript runtime.
- **TypeScript**: Type safety and improved developer experience.
- **Express.js**: Lightweight web framework.
- **Socket.io**: Real-time bidirectional communication.
- **Redis**: High-performance in-memory data store for message persistence and pub/sub.
- **JWT**: Secure authentication and session management.
- **Docker**: Containerized deployment.

### Frontend:
- **React (Vite + TypeScript)**: Fast and modern frontend.
- **ShadCN**: UI components for styling.
- **React Router**: Client-side navigation.
- **Axios**: For handling API requests and JWT refresh
- **Custom Hooks & Context API**: State management and global context.
- **Docker**: Containerized deployment.

---

## Getting Started

### Prerequisites

- **Node.js** (>= 20.x)
- **Redis** (>= 7.x)
- **Docker** (optional, for deployment)

### Cloning the repository
   ```sh
   git clone https://github.com/ShabanZenelaj/ChatApp.git
   cd ChatApp
   ```

---

## Running the Application

### Manually
#### Start redis-server
```sh
redis-server
```
#### Build and start the client
```sh
cd client
npm install
npm run build
npm run preview
```
#### Build and start the server
```sh
cd server
npm install
npm run build
npm start
```

### Running with Docker
```sh
docker-compose up --build
```

---

## API Endpoints

### Authentication
| Method | Endpoint           | Description                              |
|--------|--------------------|------------------------------------------|
| POST   | /api/auth/login    | User login                               |
| POST   | /api/auth/register | User registration                        |
| POST   | /api/auth/token    | Refresh access token using refresh token |

### Chat
| Method | Endpoint         | Description                |
|--------|------------------|----------------------------|
| GET    | /api/messages/dm | Check if user exists to DM |

---

## WebSocket Events

| Event Name             | Description                                   |
|------------------------|-----------------------------------------------|
| `joinRoom`             | Join a chat room                              |
| `joinFriend`           | Start a private chat                          |
| `message`              | Send a message in a room                      |
| `dm`                   | Send a private message                        |
| `conversations`        | Send available conversations                  |
| `refreshConversations` | Notify clients to refresh their conversations |
| `refreshToken`         | Notify user to refresh their access token     |
| `typing`               | Notify when a user is typing                  |
| `previousMessages`     | Fetch paginated older messages                |

---

## Architectural Decisions

## Message Pagination
- The pagination is **page-based**, with an additional `skip` parameter to avoid fetching already received messages.

### Redis for Message Storage & Pub/Sub
- **Fast Retrieval**: Messages are stored as lists in Redis for quick access.
- **Scalability**: Pub/Sub mechanism allows messages to be broadcast across multiple instances.
- **Persistence**: While Redis is in-memory, it supports snapshotting to disk.

### JWT Security Enhancements
- Uses **short-lived tokens** with refresh token strategy.
- Verifies token uniqueness to prevent replay attacks.

---

## Implementation Summary
- Both the front end and back end were designed with performance and efficiency in mind. While the plan was to give equal focus to both, the front end naturally ended up taking more time due to the challenge of ensuring a smooth user experience—things like seamless scrolling, real-time updates, state management, and optimized pagination.
- The back end, on the other hand, was more straightforward, with Redis handling message storage and WebSockets managing real-time communication.
- **Authentication was made seamless** with auto-refresh mechanisms to prevent frequent logouts.