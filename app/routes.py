from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token, get_jwt, get_jwt_identity,
    decode_token, jwt_required, set_refresh_cookies, unset_jwt_cookies,
)

from app.extensions import db
from app.models import (
    EventLog, Listing, Match, Order, Payment, Role, Seat,
    Arena, Club, SeasonTicket, TokenBlocklist, User,
)

bp = Blueprint("api", __name__)


def error(code, message, status, details=None):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


def current_user():
    return db.session.get(User, int(get_jwt_identity()))


def user_json(user):
    return {
        "id": user.id, "email": user.email, "first_name": user.first_name,
        "last_name": user.last_name, "roles": sorted(role.name for role in user.roles),
        "is_active": user.is_active,
    }


def listing_json(item):
    return {
        "id": item.id, "match_id": item.match_id, "seat_id": item.seat_id,
        "sector": item.seat.sector, "row": item.seat.row, "seat": item.seat.number,
        "price": str(item.price), "currency": item.currency, "status": item.status,
        "seller_id": item.seller_id, "reserved_until": item.reserved_until.isoformat() if item.reserved_until else None,
    }


def order_json(order):
    return {
        "id": order.id, "listing_id": order.listing_id, "buyer_id": order.buyer_id,
        "amount": str(order.amount), "currency": order.currency, "status": order.status,
        "expires_at": order.expires_at.isoformat(), "paid_at": order.paid_at.isoformat() if order.paid_at else None,
    }


def require_admin():
    user = current_user()
    if not user or not user.has_role("admin"):
        return None
    return user


def expire_reservations():
    now = datetime.now(timezone.utc)
    stale = Listing.query.filter(
        Listing.status == "reserved", Listing.reserved_until <= now
    ).all()
    for listing in stale:
        for order in Order.query.filter_by(listing_id=listing.id, status="pending_payment").all():
            order.status = "expired"
        listing.status = "active"
        listing.reserved_until = None
    if stale:
        db.session.commit()


def log_event(actor_id, entity_type, entity_id, action, payload=None):
    db.session.add(EventLog(
        actor_id=actor_id, entity_type=entity_type, entity_id=entity_id,
        action=action, payload=payload or {},
    ))


def parse_price(value):
    try:
        price = Decimal(str(value))
        if not price.is_finite() or price <= 0 or price > Decimal("1000000"):
            raise InvalidOperation
        return price
    except (InvalidOperation, TypeError, ValueError):
        return None


def match_json(item):
    return {
        "id": item.id, "home_club": {"id": item.home_club.id, "name": item.home_club.name},
        "away_club": {"id": item.away_club.id, "name": item.away_club.name},
        "starts_at": item.starts_at.isoformat(), "competition": item.competition,
        "match_type": item.match_type, "status": item.status,
        "arena": {"id": item.arena.id, "name": item.arena.name, "city": item.arena.city},
    }


@bp.get("/")
def index():
    return jsonify({"name": "PARMA RESELL", "version": "1.0.0", "api": "/api/v1"})


@bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    first_name = str(data.get("first_name", "")).strip()
    last_name = str(data.get("last_name", "")).strip()
    if not email or "@" not in email or len(email) > 255:
        return error("VALIDATION_ERROR", "Укажите корректный email", 422)
    if not isinstance(password, str) or len(password) < 10:
        return error("VALIDATION_ERROR", "Пароль должен содержать не менее 10 символов", 422)
    if not first_name or not last_name:
        return error("VALIDATION_ERROR", "Укажите имя и фамилию", 422)
    if User.query.filter_by(email=email).first():
        return error("EMAIL_ALREADY_EXISTS", "Пользователь с таким email уже существует", 409)
    buyer_role = Role.query.filter_by(name="buyer").first()
    if not buyer_role:
        buyer_role = Role(name="buyer")
        db.session.add(buyer_role)
        db.session.flush()
    from werkzeug.security import generate_password_hash
    user = User(email=email, first_name=first_name, last_name=last_name,
                password_hash=generate_password_hash(password), roles=[buyer_role])
    db.session.add(user)
    db.session.commit()
    access = create_access_token(identity=str(user.id), additional_claims={"roles": ["buyer"]})
    refresh_token = create_refresh_token(identity=str(user.id))
    response = jsonify({"user": user_json(user), "access_token": access, "token_type": "Bearer"})
    set_refresh_cookies(response, refresh_token)
    return response, 201


@bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    user = User.query.filter_by(email=email).first()
    from werkzeug.security import check_password_hash
    if not user or not user.is_active or not check_password_hash(user.password_hash, str(password)):
        return error("INVALID_CREDENTIALS", "Неверный email или пароль", 401)
    access = create_access_token(identity=str(user.id), additional_claims={"roles": [r.name for r in user.roles]})
    refresh_token = create_refresh_token(identity=str(user.id))
    response = jsonify({"user": user_json(user), "access_token": access, "token_type": "Bearer"})
    set_refresh_cookies(response, refresh_token)
    return response


@bp.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    user = current_user()
    if not user or not user.is_active:
        return error("USER_NOT_AVAILABLE", "Пользователь недоступен", 401)
    access = create_access_token(identity=str(user.id), additional_claims={"roles": [r.name for r in user.roles]})
    return jsonify({"access_token": access, "token_type": "Bearer"})


@bp.post("/auth/logout")
@jwt_required()
def logout():
    db.session.add(TokenBlocklist(jti=get_jwt()["jti"]))
    refresh_raw = request.cookies.get("refresh_token_cookie")
    if refresh_raw:
        try:
            refresh_payload = decode_token(refresh_raw)
            db.session.add(TokenBlocklist(jti=refresh_payload["jti"]))
        except Exception:
            pass
    db.session.commit()
    response = jsonify({"message": "Выход выполнен"})
    unset_jwt_cookies(response)
    return response


@bp.get("/auth/me")
@jwt_required()
def me():
    return jsonify({"user": user_json(current_user())})


@bp.get("/matches")
def matches():
    query = Match.query
    match_type = request.args.get("type")
    status = request.args.get("status")
    if match_type in ("home", "away"):
        query = query.filter_by(match_type=match_type)
    if status:
        query = query.filter_by(status=status)
    if request.args.get("season"):
        query = query.filter(Match.competition.ilike(f"%{request.args['season']}%"))
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 20, type=int), 1), 100)
    pagination = query.order_by(Match.starts_at.asc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "items": [match_json(m) for m in pagination.items],
        "pagination": {"page": page, "per_page": per_page, "total": pagination.total, "pages": pagination.pages},
    })


@bp.get("/matches/<int:match_id>")
def match_detail(match_id):
    item = db.session.get(Match, match_id)
    if not item:
        return error("MATCH_NOT_FOUND", "Матч не найден", 404)
    return jsonify(match_json(item))


@bp.get("/matches/<int:match_id>/listings")
def match_listings(match_id):
    expire_reservations()
    if not db.session.get(Match, match_id):
        return error("MATCH_NOT_FOUND", "Матч не найден", 404)
    query = Listing.query.filter_by(match_id=match_id, status="active")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    return jsonify({"items": [listing_json(x) for x in query.order_by(Listing.price.asc()).all()]})


@bp.post("/listings")
@jwt_required()
def create_listing():
    user = current_user()
    data = request.get_json(silent=True) or {}
    try:
        match_id, seat_id, ticket_id = int(data["match_id"]), int(data["seat_id"]), int(data["season_ticket_id"])
    except (KeyError, TypeError, ValueError):
        return error("VALIDATION_ERROR", "Необходимо указать match_id, seat_id и season_ticket_id", 422)
    price = parse_price(data.get("price"))
    if price is None:
        return error("INVALID_PRICE", "Укажите корректную положительную цену", 422)
    ticket = SeasonTicket.query.filter_by(id=ticket_id, owner_id=user.id, status="verified").first()
    if not user.has_role("seller"):
        return error("SELLER_ROLE_REQUIRED", "Для публикации необходимо подтвердить абонемент", 403)
    match = db.session.get(Match, match_id)
    seat = db.session.get(Seat, seat_id)
    if not ticket or ticket.seat_id != seat_id:
        return error("SEASON_TICKET_NOT_VERIFIED", "Не найден подтверждённый абонемент на это место", 403)
    if not match or not seat or match.match_type != "home" or match.status != "scheduled":
        return error("MATCH_OR_SEAT_NOT_AVAILABLE", "Матч или место недоступны", 409)
    if seat.arena_id != match.arena_id:
        return error("SEAT_ARENA_MISMATCH", "Место не относится к арене матча", 422)
    duplicate = Listing.query.filter(
        Listing.match_id == match_id, Listing.seat_id == seat_id,
        Listing.status.in_(["active", "reserved", "sold"]),
    ).first()
    if duplicate:
        return error("LISTING_ALREADY_EXISTS", "Для этого места уже существует предложение", 409)
    item = Listing(seller_id=user.id, season_ticket_id=ticket.id, match_id=match_id,
                   seat_id=seat_id, price=price)
    db.session.add(item)
    db.session.flush()
    log_event(user.id, "listing", item.id, "created", {"price": str(price)})
    db.session.commit()
    return jsonify({"listing": listing_json(item)}), 201


@bp.get("/listings/my")
@jwt_required()
def my_listings():
    items = Listing.query.filter_by(seller_id=current_user().id).order_by(Listing.created_at.desc()).all()
    return jsonify({"items": [listing_json(x) for x in items]})


@bp.get("/listings/<int:listing_id>")
def listing_detail(listing_id):
    item = db.session.get(Listing, listing_id)
    if not item:
        return error("LISTING_NOT_FOUND", "Предложение не найдено", 404)
    return jsonify({"listing": listing_json(item)})


@bp.patch("/listings/<int:listing_id>")
@jwt_required()
def update_listing(listing_id):
    user = current_user()
    item = db.session.get(Listing, listing_id)
    if not item:
        return error("LISTING_NOT_FOUND", "Предложение не найдено", 404)
    if item.seller_id != user.id:
        return error("FORBIDDEN", "Можно изменять только собственные предложения", 403)
    if item.status != "active":
        return error("LISTING_NOT_EDITABLE", "Изменять можно только активное предложение", 409)
    data = request.get_json(silent=True) or {}
    if "price" in data:
        price = parse_price(data["price"])
        if price is None:
            return error("INVALID_PRICE", "Укажите корректную положительную цену", 422)
        item.price = price
    db.session.commit()
    return jsonify({"listing": listing_json(item)})


@bp.delete("/listings/<int:listing_id>")
@jwt_required()
def delete_listing(listing_id):
    user = current_user()
    item = db.session.get(Listing, listing_id)
    if not item:
        return error("LISTING_NOT_FOUND", "Предложение не найдено", 404)
    if item.seller_id != user.id:
        return error("FORBIDDEN", "Можно снимать только собственные предложения", 403)
    if item.status != "active":
        return error("LISTING_NOT_CANCELLABLE", "Предложение нельзя снять в текущем статусе", 409)
    item.status = "cancelled"
    log_event(user.id, "listing", item.id, "cancelled")
    db.session.commit()
    return "", 204


@bp.get("/seller/dashboard")
@jwt_required()
def seller_dashboard():
    user_id = current_user().id
    listings = Listing.query.filter_by(seller_id=user_id).all()
    orders = Order.query.join(Listing).filter(Listing.seller_id == user_id, Order.status == "paid").all()
    return jsonify({
        "active_listings": sum(x.status == "active" for x in listings),
        "reserved_listings": sum(x.status == "reserved" for x in listings),
        "sold_tickets": len(orders),
        "sales_amount": str(sum((x.amount for x in orders), Decimal("0.00"))),
        "currency": "RUB",
    })


@bp.get("/seller/statistics")
@jwt_required()
def seller_statistics():
    return seller_dashboard()


@bp.get("/seller/sales")
@jwt_required()
def seller_sales():
    user_id = current_user().id
    orders = Order.query.join(Listing).filter(Listing.seller_id == user_id).order_by(Order.created_at.desc()).all()
    return jsonify({"items": [order_json(x) for x in orders]})


@bp.get("/buyer/dashboard")
@jwt_required()
def buyer_dashboard():
    orders = Order.query.filter_by(buyer_id=current_user().id).all()
    return jsonify({
        "orders_total": len(orders), "paid_orders": sum(x.status == "paid" for x in orders),
        "pending_orders": sum(x.status == "pending_payment" for x in orders),
    })


@bp.get("/buyer/orders")
@jwt_required()
def buyer_orders():
    items = Order.query.filter_by(buyer_id=current_user().id).order_by(Order.created_at.desc()).all()
    return jsonify({"items": [order_json(x) for x in items]})


@bp.get("/buyer/orders/<int:order_id>")
@jwt_required()
def buyer_order_detail(order_id):
    item = Order.query.filter_by(id=order_id, buyer_id=current_user().id).first()
    if not item:
        return error("ORDER_NOT_FOUND", "Заказ не найден", 404)
    return jsonify({"order": order_json(item), "listing": listing_json(item.listing)})


@bp.get("/buyer/tickets")
@jwt_required()
def buyer_tickets():
    orders = Order.query.filter_by(buyer_id=current_user().id, status="paid").all()
    return jsonify({"items": [{"order": order_json(o), "listing": listing_json(o.listing)} for o in orders]})


@bp.post("/orders")
@jwt_required()
def create_order():
    expire_reservations()
    user = current_user()
    data = request.get_json(silent=True) or {}
    try:
        listing_id = int(data["listing_id"])
    except (KeyError, TypeError, ValueError):
        return error("VALIDATION_ERROR", "Необходимо указать listing_id", 422)
    item = Listing.query.filter_by(id=listing_id).with_for_update().first()
    now = datetime.now(timezone.utc)
    if not item or item.status != "active":
        return error("LISTING_NOT_AVAILABLE", "Предложение недоступно", 409)
    if item.seller_id == user.id:
        return error("SELF_PURCHASE", "Нельзя купить собственное предложение", 409)
    match = db.session.get(Match, item.match_id)
    if not match or match.starts_at <= now:
        return error("MATCH_ALREADY_STARTED", "Матч уже начался или завершён", 409)
    item.status = "reserved"
    item.reserved_until = now + timedelta(minutes=current_app.config["LISTING_RESERVATION_MINUTES"])
    order = Order(buyer_id=user.id, listing_id=item.id, amount=item.price,
                  currency=item.currency, expires_at=item.reserved_until)
    db.session.add(order)
    db.session.flush()
    payment = Payment(order_id=order.id, amount=order.amount, currency=order.currency)
    db.session.add(payment)
    log_event(user.id, "order", order.id, "created", {"listing_id": item.id})
    db.session.commit()
    return jsonify({"order": order_json(order), "payment": {"status": payment.status, "provider": payment.provider}}), 201


@bp.get("/orders/<int:order_id>")
@jwt_required()
def order_detail(order_id):
    user = current_user()
    order = db.session.get(Order, order_id)
    if not order:
        return error("ORDER_NOT_FOUND", "Заказ не найден", 404)
    if order.buyer_id != user.id and order.listing.seller_id != user.id:
        return error("FORBIDDEN", "Нет доступа к заказу", 403)
    return jsonify({"order": order_json(order)})


@bp.get("/orders/<int:order_id>/payment")
@jwt_required()
def payment_status(order_id):
    user = current_user()
    order = db.session.get(Order, order_id)
    if not order or (order.buyer_id != user.id and order.listing.seller_id != user.id):
        return error("ORDER_NOT_FOUND", "Заказ не найден", 404)
    payment = Payment.query.filter_by(order_id=order.id).first()
    return jsonify({"order_id": order.id, "status": payment.status if payment else "not_created"})


@bp.post("/orders/<int:order_id>/payment/test")
@jwt_required()
def test_payment(order_id):
    if not current_app.config["PAYMENT_TEST_MODE"]:
        return error("TEST_PAYMENT_DISABLED", "Тестовая оплата отключена", 403)
    user = current_user()
    order = Order.query.filter_by(id=order_id, buyer_id=user.id).with_for_update().first()
    if not order:
        return error("ORDER_NOT_FOUND", "Заказ не найден", 404)
    if order.status != "pending_payment":
        return error("ORDER_NOT_PAYABLE", "Заказ не ожидает оплаты", 409)
    now = datetime.now(timezone.utc)
    if order.expires_at <= now or order.listing.status != "reserved":
        order.status = "expired"
        order.listing.status = "active"
        order.listing.reserved_until = None
        db.session.commit()
        return error("ORDER_EXPIRED", "Время бронирования истекло", 409)
    payment = Payment.query.filter_by(order_id=order.id).first()
    payment.status = "succeeded"
    order.status = "paid"
    order.paid_at = now
    order.listing.status = "sold"
    order.listing.reserved_until = None
    log_event(user.id, "order", order.id, "test_payment_succeeded")
    db.session.commit()
    return jsonify({"order": order_json(order), "payment": {"status": payment.status, "provider": "test"}})


@bp.post("/admin/clubs")
@jwt_required()
def admin_create_club():
    user = require_admin()
    if not user:
        return error("FORBIDDEN", "Требуются права администратора", 403)
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return error("VALIDATION_ERROR", "Необходимо указать name", 422)
    item = Club(name=name, short_name=data.get("short_name"), external_id=data.get("external_id"))
    db.session.add(item)
    db.session.commit()
    return jsonify({"id": item.id, "name": item.name}), 201


@bp.post("/admin/arenas")
@jwt_required()
def admin_create_arena():
    user = require_admin()
    if not user:
        return error("FORBIDDEN", "Требуются права администратора", 403)
    data = request.get_json(silent=True) or {}
    name, city = str(data.get("name", "")).strip(), str(data.get("city", "")).strip()
    if not name or not city:
        return error("VALIDATION_ERROR", "Необходимо указать name и city", 422)
    capacity = data.get("capacity")
    if capacity is not None and (not isinstance(capacity, int) or capacity <= 0):
        return error("VALIDATION_ERROR", "capacity должен быть положительным целым числом", 422)
    item = Arena(name=name, city=city, capacity=capacity)
    db.session.add(item)
    db.session.commit()
    return jsonify({"id": item.id, "name": item.name, "city": item.city}), 201


@bp.post("/admin/seats")
@jwt_required()
def admin_create_seat():
    user = require_admin()
    if not user:
        return error("FORBIDDEN", "Требуются права администратора", 403)
    data = request.get_json(silent=True) or {}
    try:
        arena_id = int(data["arena_id"])
        sector, row, number = str(data["sector"]).strip(), str(data["row"]).strip(), str(data["number"]).strip()
    except (KeyError, TypeError, ValueError):
        return error("VALIDATION_ERROR", "Необходимо указать arena_id, sector, row и number", 422)
    if not db.session.get(Arena, arena_id) or not all([sector, row, number]):
        return error("VALIDATION_ERROR", "Некорректная арена или параметры места", 422)
    item = Seat(arena_id=arena_id, sector=sector, row=row, number=number)
    db.session.add(item)
    db.session.commit()
    return jsonify({"id": item.id, "arena_id": arena_id, "sector": sector, "row": row, "number": number}), 201


@bp.post("/admin/matches")
@jwt_required()
def admin_create_match():
    user = require_admin()
    if not user:
        return error("FORBIDDEN", "Требуются права администратора", 403)
    data = request.get_json(silent=True) or {}
    try:
        home_id, away_id, arena_id = int(data["home_club_id"]), int(data["away_club_id"]), int(data["arena_id"])
        starts_at = datetime.fromisoformat(str(data["starts_at"]).replace("Z", "+00:00"))
        competition = str(data["competition"]).strip()
    except (KeyError, TypeError, ValueError):
        return error("VALIDATION_ERROR", "Некорректные данные матча", 422)
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if not db.session.get(Club, home_id) or not db.session.get(Club, away_id) or not db.session.get(Arena, arena_id):
        return error("VALIDATION_ERROR", "Не найдены клуб или арена", 422)
    if home_id == away_id or not competition:
        return error("VALIDATION_ERROR", "Домашняя и гостевая команды должны различаться", 422)
    match_type = data.get("match_type", "home")
    if match_type not in ("home", "away"):
        return error("VALIDATION_ERROR", "match_type должен быть home или away", 422)
    item = Match(home_club_id=home_id, away_club_id=away_id, arena_id=arena_id,
                 starts_at=starts_at, competition=competition, match_type=match_type,
                 status=data.get("status", "scheduled"))
    db.session.add(item)
    db.session.commit()
    return jsonify(match_json(item)), 201


@bp.post("/admin/season-tickets")
@jwt_required()
def admin_create_season_ticket():
    user = require_admin()
    if not user:
        return error("FORBIDDEN", "Требуются права администратора", 403)
    data = request.get_json(silent=True) or {}
    try:
        owner_id, seat_id = int(data["owner_id"]), int(data["seat_id"])
    except (KeyError, TypeError, ValueError):
        return error("VALIDATION_ERROR", "Необходимо указать owner_id и seat_id", 422)
    owner, seat = db.session.get(User, owner_id), db.session.get(Seat, seat_id)
    if not owner or not seat:
        return error("VALIDATION_ERROR", "Пользователь или место не найдены", 422)
    status = data.get("status", "pending")
    if status not in ("pending", "verified", "rejected"):
        return error("VALIDATION_ERROR", "Недопустимый статус абонемента", 422)
    ticket = SeasonTicket(owner_id=owner_id, seat_id=seat_id,
                          external_id=data.get("external_id"), status=status,
                          verified_at=datetime.now(timezone.utc) if status == "verified" else None)
    if status == "verified":
        seller_role = Role.query.filter_by(name="seller").first()
        if not seller_role:
            seller_role = Role(name="seller")
            db.session.add(seller_role)
            db.session.flush()
        if not owner.has_role("seller"):
            owner.roles.append(seller_role)
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"id": ticket.id, "owner_id": owner_id, "seat_id": seat_id,
                    "status": ticket.status}), 201
