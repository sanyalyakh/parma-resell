import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://parma:parma_dev_password@localhost:5432/parma_resell",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
