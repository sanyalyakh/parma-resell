from datetime import datetime, timezone
from app import create_app
from app.extensions import db
from app.models import Club, Arena, Match

app = create_app()

with app.app_context():
    home = Club.query.filter_by(
        external_id="demo-parma"
    ).first()
    if not home:
        home = Club(
            name="ТСТ ",
            short_name="",
            external_id="demo-parma"
        )
        db.session.add(home)

    away = Club.query.filter_by(
        external_id="demo-vector"
    ).first()
    if not away:
        away = Club(
            name=" Т (ТСТ)",
            short_name="Т",
            external_id="demo-vector"
        )
        db.session.add(away)

    arena = Arena.query.filter_by(
        name="С олот (ТСТ)",
        city="ермь"
    ).first()
    if not arena:
        arena = Arena(
            name="С олот (ТСТ)",
            city="ермь",
            capacity=7047
        )
        db.session.add(arena)

    db.session.flush()

    start = datetime(
        2026, 12, 12, 13, 0,
        tzinfo=timezone.utc
    )

    match = Match.query.filter_by(
        home_club_id=home.id,
        away_club_id=away.id,
        arena_id=arena.id,
        starts_at=start
    ).first()

    if not match:
        match = Match(
            home_club_id=home.id,
            away_club_id=away.id,
            arena_id=arena.id,
            starts_at=start,
            competition="Тестовый матч PARMA RESELL",
            match_type="home",
            status="scheduled"
        )
        db.session.add(match)

    db.session.commit()
    print(f"Demo match ID: {match.id}")
