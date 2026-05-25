## NITT Auth Integration

This project now uses `nitt_auth_final` for sign-in. The internship frontend redirects users to the central auth frontend and receives public profile metadata on `/auth/callback`. API authorization is handled by the central `accessToken` HTTP-only cookie.

### Local Setup

1. Start `nitt_auth_final` backend and frontend.
2. In `nitt_auth_final/backend/.env`, include the internship frontend in `CORS_ORIGIN`, for example:

```env
CORS_ORIGIN="http://localhost:3000|http://localhost:5001"
```

3. In `internship-management-system/backend/.env`, set `JWT_ACCESS_SECRET` to the same value used by `nitt_auth_final/backend/.env`.
4. In `internship-management-system/frontend/.env.local`, set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_NITT_AUTH_URL=http://localhost:5001
NEXT_PUBLIC_NITT_AUTH_API_URL=http://localhost:5000/api/v1
```

5. Run the internship backend and frontend. Opening `/login` will send users to central NITT Auth and return them to `/auth/callback`.
