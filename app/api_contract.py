"""Preview API contract for the React frontend.

The endpoints described here are implemented in the backend feature branch.
Any endpoint returning 503 is intentionally unavailable pending provider integration.
"""

API_CONTRACT = {
    "version": "v1-preview",
    "authentication": {
        "register": "POST /api/auth/register",
        "login": "POST /api/auth/login",
        "profile": "GET /api/auth/me",
        "header": "Authorization: Bearer <access_token>",
        "token_lifetime_seconds": 3600,
    },
    "public": [
        "GET /api/health",
        "GET /api/ready",
        "GET /api/meta",
        "GET /api/clubs",
        "GET /api/matches?club_id=<id>&limit=20&offset=0",
    ],
    "holder": [
        "GET /api/my/tickets",
        "POST /api/my/tickets",
        "GET /api/my/listings",
        "POST /api/my/listings",
        "POST /api/my/listings/<id>/withdraw",
    ],
    "club_admin": [
        "POST /api/admin/matches",
        "GET /api/admin/ticket-claims?status=pending",
        "POST /api/admin/ticket-claims/<id>/reject",
    ],
    "disabled": [
        "POST /api/admin/ticket-claims/<id>/verify",
        "POST /api/listings/<id>/reserve",
    ],
    "error_format": {"error": "machine_readable_error_code"},
}
