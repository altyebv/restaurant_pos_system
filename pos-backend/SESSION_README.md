# Session management (SHIFT) API

This document describes the new session (shift) management endpoints to record cashier shifts, including starting/closing sessions, recording expenses, and attaching orders to sessions.

Base path: `/api/session`

Endpoints:
- POST `/open` (auth required): open a new session for the authenticated cashier. Optionally pass `startingBalance`.
- POST `/close` (auth required): close the current session. Accepts `sessionId` (optional if authenticated) and review data: `expenses` (array), `totalCashCollected`, `comment`.
 - POST `/logout` (auth required): logs out the current user and will automatically close any open session for the authenticated user, computing totals from existing orders and expenses when needed.
- GET `/current` (auth required): returns the current open session for the authenticated user.
- GET `/` (auth required): list all sessions (paginated across generations) with basic data.
- GET `/:id` (auth required): get a single session by id.
- POST `/:sessionId/expense` (auth required): add an expense to the session.
 - POST `/:sessionId/expense` (auth required): add an expense to the session.
 - Session operations (internal): `operations[]` will contain audit events like `session_open`, `session_closed`, `order_created`, `order_status_changed`, `expense_added`, `table_status_changed`, `user_login`.

Notes:
- If the POS is unauthenticated, orders should include `session` in the body to attach to an existing session. When an authenticated cashier creates an order, the server will attempt to automatically attach the order to the cashier's open session if one is present.
- When closing a session, the server computes `totalSales` from orders associated with the session and updates the end balance as: `endBalance = startingBalance + totalCashCollected - totalExpenses`.
- The `Session` model stores `expenses[]`, aggregated totals, and an `endBalance` for future shifts.
 - The `Session` model also maintains an `operations[]` array that stores recorded actions, each with `type`, `details`, `createdBy`, and `createdAt` for audit and reporting.

Use the seed script to create a demo session: `node ./scripts/seedSession.js` (requires a demo user available in DB).

Examples:

1) Open a session (authenticated):

curl -X POST http://localhost:3000/api/session/open -H "Content-Type: application/json" -b "accessToken=<token>" -d '{"startingBalance": 100}'

2) Close a session (authenticated):

curl -X POST http://localhost:3000/api/session/close -H "Content-Type: application/json" -b "accessToken=<token>" -d '{ "sessionId": "<sessionId>", "expenses": [{ "amount": 10, "description": "Refund" }], "totalCashCollected": 250.32, "comment": "End shift" }'

3) Create an order tied to a session (unauthenticated, POS terminal) - include `session` in body:

curl -X POST http://localhost:3000/api/order -H "Content-Type: application/json" -d '{ "items": [{"name":"Coffee","quantity":1,"price":4}], "bills": {"total":4, "tax": 0.4, "totalWithTax": 4.4 }, "paymentMethod": "cash", "session": "<sessionId>" }'

4) Fetch orders for a session (authenticated):

curl -X GET "http://localhost:3000/api/order/session/<sessionId>" -b "accessToken=<token>"

