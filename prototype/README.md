# PARMA RESELL — clickable frontend prototype

Open `prototype/index.html` in a browser. This standalone demo requires
no npm installation, API server, or database. It is deliberately isolated
from the production React application.

## Clickable scenarios

- Browse home games and filter by month.
- Select a game and a seat from a simplified arena layout.
- Add/remove a **local-only test request**.
- Try the sign-in form (no server authentication).
- Create a simulated season-ticket claim.
- Navigate between matches, season-ticket area and requests.

The UI uses a dark charcoal / bright-lime basketball visual direction,
inspired by the club's sports aesthetic. It does not copy official
logos, sponsor artwork or site assets.

## Important limitations

- All seat availability and prices are fictitious.
- Fixtures are static demonstration data and may change.
- LocalStorage is used only for demonstration state.
- Passwords are neither saved nor sent anywhere.
- There are no payments, ticket transfers, or actual reservations.
- This is **not an official club website** and does not imply partnership.
- No backend API integration is implemented yet.

The backend remains the source of truth for any future real-world operations.
