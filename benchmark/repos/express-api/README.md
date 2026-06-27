# Express API

A simple REST API with user CRUD operations, used as a benchmark fixture.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| GET | /api/users | Yes | List users (filter: ?role=, ?search=) |
| GET | /api/users/:id | Yes | Get single user |
| POST | /api/users | Yes | Create user |
| PUT | /api/users/:id | Yes | Update user |
| DELETE | /api/users/:id | Yes | Delete user |

## Run

```bash
npm start     # start server on :3000
npm test      # run test suite
```
