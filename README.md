# Spots Backend API

A production-ready REST API for a social photo-sharing application. Users can publish location-aware posts, follow accounts, interact through likes and comments, organize bookmarks, receive notifications, discover profiles, and explore nearby content.

## Features

- Secure registration, login, token refresh, and logout
- Short-lived JWT access tokens
- Hashed and revocable refresh-token sessions
- User profiles and account discovery
- Public and private accounts
- Follow requests and follower management
- Public, follower-only, and private posts
- Geographic post locations and nearby discovery
- Likes and comments with authorization controls
- Collections and private bookmarks
- Automatic social notifications
- Privacy-aware profile galleries
- Password changes and logout from all devices
- Secure account deletion and dependent-data cleanup
- Request IDs, structured logging, and readiness monitoring
- Automated GitHub Actions quality checks

## Technology Stack

- Node.js 24
- Express 5
- MongoDB and Mongoose
- JSON Web Tokens
- bcrypt
- Joi and Celebrate
- Winston and express-winston
- Helmet and express-rate-limit
- Node test runner and Supertest
- ESLint and Prettier
- GitHub Actions

## Requirements

- Node.js 24
- npm 11 or newer
- MongoDB

Supported runtime versions are declared in `.nvmrc` and `package.json`.

## Local Setup

Clone and enter the repository:

    git clone git@github.com:tito1718/spots-backend.git
    cd spots-backend

Select the required Node.js version and install dependencies:

    nvm use
    npm ci

Create your environment file:

    cp .env.example .env

Configure these environment variables:

    NODE_ENV=development
    PORT=3002
    DATABASE_URL=mongodb://127.0.0.1:27017/spots
    ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
    REFRESH_TOKEN_SECRET=replace_with_a_different_long_random_secret
    CLIENT_ORIGINS=http://localhost:5173

Start MongoDB, then start the API:

    npm start

The local API runs at `http://localhost:3002`.

For automatic server restarts during development:

    npm run dev

## Docker

Build the production container:

    docker build -t spots-backend .

Run it with environment variables from the local environment file:

    docker run --rm \
      --name spots-backend \
      --env-file .env \
      -p 3002:3002 \
      spots-backend

The container runs as an unprivileged Node user and includes an HTTP health check for `GET /health`.

## Available Commands

| Command                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm start`            | Start the production-style server         |
| `npm run dev`          | Start with Node watch mode                |
| `npm test`             | Run the automated test suite              |
| `npm run lint`         | Run ESLint                                |
| `npm run format`       | Format the project                        |
| `npm run format:check` | Check formatting                          |
| `npm run check`        | Run linting, tests, and formatting checks |

## Health Monitoring

### Liveness

`GET /health`

Confirms that the HTTP application is running.

### Readiness

`GET /ready`

Confirms that the application is running and MongoDB is connected.

Every response includes an `X-Request-Id` header. Error responses also include the same identifier in their JSON body for troubleshooting.

## API Specification

The complete OpenAPI 3.1 specification is stored in `docs/openapi.json`.

While the server is running, retrieve it from:

    GET /openapi.json

The file can be imported into tools such as Swagger Editor, Postman, Insomnia, and API-client generators.

## Authentication

Protected endpoints require an access token:

    Authorization: Bearer ACCESS_TOKEN

Refresh tokens are handled separately and cannot be used as access tokens.

### Authentication Routes

| Method | Endpoint         | Description                       |
| ------ | ---------------- | --------------------------------- |
| POST   | `/auth/register` | Register an account               |
| POST   | `/auth/login`    | Authenticate a user               |
| POST   | `/auth/refresh`  | Rotate the authentication session |
| POST   | `/auth/logout`   | End the current refresh session   |

## User Routes

| Method | Endpoint               | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| GET    | `/users`               | Search for users                    |
| GET    | `/users/me`            | Get the authenticated user          |
| PATCH  | `/users/me`            | Update the authenticated user       |
| PATCH  | `/users/me/password`   | Change the current password         |
| DELETE | `/users/me/sessions`   | Log out from every device           |
| DELETE | `/users/me`            | Permanently delete the account      |
| GET    | `/users/:userId`       | Get a public user profile           |
| GET    | `/users/:userId/posts` | Get a privacy-aware profile gallery |

## Post Routes

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/posts`                  | Browse visible posts               |
| GET    | `/posts/nearby`           | Discover visible nearby posts      |
| GET    | `/posts/mine`             | Get the authenticated user's posts |
| POST   | `/posts`                  | Create a post                      |
| GET    | `/posts/:postId`          | Get a visible post                 |
| PATCH  | `/posts/:postId`          | Update an owned post               |
| DELETE | `/posts/:postId`          | Delete an owned post               |
| PUT    | `/posts/:postId/likes`    | Like a visible post                |
| DELETE | `/posts/:postId/likes`    | Remove the current user's like     |
| GET    | `/posts/:postId/comments` | List visible post comments         |
| POST   | `/posts/:postId/comments` | Comment on a visible post          |

## Comment Routes

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| PATCH  | `/comments/:commentId` | Edit an owned comment        |
| DELETE | `/comments/:commentId` | Delete or moderate a comment |

## Follow Routes

| Method | Endpoint                             | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/follows/summary`                   | Get relationship totals         |
| GET    | `/follows/followers`                 | List followers                  |
| GET    | `/follows/following`                 | List followed accounts          |
| GET    | `/follows/requests`                  | List pending requests           |
| POST   | `/follows/users/:userId`             | Follow a user or request access |
| DELETE | `/follows/users/:userId`             | Unfollow a user                 |
| POST   | `/follows/requests/:followId/accept` | Accept a request                |
| DELETE | `/follows/requests/:followId`        | Reject a request                |
| DELETE | `/follows/followers/:userId`         | Remove a follower               |

## Collection Routes

| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| GET    | `/collections/mine`          | List owned collections       |
| POST   | `/collections`               | Create a collection          |
| GET    | `/collections/:collectionId` | Get an accessible collection |
| PATCH  | `/collections/:collectionId` | Update an owned collection   |
| DELETE | `/collections/:collectionId` | Delete an owned collection   |

## Bookmark Routes

| Method | Endpoint                 | Description                        |
| ------ | ------------------------ | ---------------------------------- |
| GET    | `/bookmarks`             | List accessible personal bookmarks |
| POST   | `/bookmarks`             | Bookmark a visible post            |
| GET    | `/bookmarks/:bookmarkId` | Get a personal bookmark            |
| PATCH  | `/bookmarks/:bookmarkId` | Update a personal bookmark         |
| DELETE | `/bookmarks/:bookmarkId` | Delete a personal bookmark         |

## Notification Routes

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| GET    | `/notifications`                      | Get the notification inbox     |
| GET    | `/notifications/unread-count`         | Get the unread total           |
| PATCH  | `/notifications/read-all`             | Mark all notifications as read |
| PATCH  | `/notifications/:notificationId/read` | Mark one notification as read  |
| DELETE | `/notifications/:notificationId`      | Delete one notification        |
| DELETE | `/notifications`                      | Clear the notification inbox   |

Notifications are generated automatically for supported follow, like, and comment events.

## Post Privacy

| Visibility  | Accessible by                                 |
| ----------- | --------------------------------------------- |
| `public`    | Everyone                                      |
| `followers` | Owner, administrators, and accepted followers |
| `private`   | Owner and administrators                      |

Privacy rules are enforced across feeds, profile galleries, nearby discovery, comments, likes, and bookmarks.

## Pagination and Filtering

List endpoints support validated query parameters such as:

    ?page=1&limit=12

Depending on the endpoint, additional filters include:

- `search`
- `tag`
- `sort=latest`
- `sort=oldest`
- `collectionId`
- `unread`
- Geographic coordinates and radius

## Error Responses

Errors return a safe JSON response containing a message and request ID:

    {
      "message": "Requested resource not found",
      "requestId": "78fa3241-d08b-44b7-9296-48bee7d3303f"
    }

Validation failures may also include field-specific information generated by Celebrate. Unexpected errors are logged without exposing internal implementation details to clients.

## Security

The API includes:

- bcrypt password hashing
- Short-lived typed access tokens
- Hashed refresh-token storage
- Session revocation and refresh-token rotation
- HTTP-only refresh cookies
- Role and ownership authorization
- Privacy-aware database queries
- Request validation before database access
- Authentication and global rate limiting
- Restricted CORS origins
- Helmet security headers
- Safe production errors
- Logs that exclude passwords, tokens, cookies, and request bodies
- Account cleanup across dependent data

Never commit `.env` or production secrets.

## Testing and Continuous Integration

Run all local quality checks:

    npm run check
    npm audit --omit=dev --audit-level=high
    git diff --check

GitHub Actions automatically runs quality and production-dependency security checks for supported pushes and pull requests.

## Repository

[github.com/tito1718/spots-backend](https://github.com/tito1718/spots-backend)

## Author

Cesar Chirino
