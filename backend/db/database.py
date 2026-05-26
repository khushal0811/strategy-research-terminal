from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

raw_url = os.environ.get("DATABASE_URL")
if raw_url:
    if raw_url.startswith("postgres://"):
        DATABASE_URL = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
        DATABASE_URL = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        DATABASE_URL = raw_url
else:
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/strategy_terminal"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,    # recycle connections after 1 hour to avoid stale connections
    pool_pre_ping=True,   # validate connections before use (handles PG idle timeouts)
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Self-healing migration: Automatically add the 'trades' column if it's missing in older DB tables
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS trades JSON;"))
    except Exception as e:
        # Log gracefully if the DB doesn't support IF NOT EXISTS or other issues
        print(f"Auto-migration warning: {e}")
