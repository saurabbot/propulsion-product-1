from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from app.core.config import settings

def convert_to_asyncpg_url(original_url: str) -> str:
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    
    query_params.pop('sslmode', None)
    query_params.pop('channel_binding', None)
    
    new_query = urlencode(query_params, doseq=True) if query_params else ''
    
    new_parsed = parsed._replace(
        scheme='postgresql+asyncpg',
        query=new_query
    )
    
    return urlunparse(new_parsed)

database_url = convert_to_asyncpg_url(settings.database_url)

engine = create_async_engine(
    database_url,
    echo=True,
    future=True,
    connect_args={
        "ssl": True
    }
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def migrate_add_deployment_columns():
    async with engine.begin() as conn:
        check_column_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'agents' AND column_name = :column_name
        """
        
        async def column_exists(column_name: str) -> bool:
            result = await conn.execute(text(check_column_query), {"column_name": column_name})
            return result.scalar() is not None
        
        if not await column_exists('dispatch_id'):
            await conn.execute(text("ALTER TABLE agents ADD COLUMN dispatch_id VARCHAR"))
        
        if not await column_exists('room_name'):
            await conn.execute(text("ALTER TABLE agents ADD COLUMN room_name VARCHAR"))
        
        if not await column_exists('deployment_status'):
            await conn.execute(text("ALTER TABLE agents ADD COLUMN deployment_status VARCHAR DEFAULT 'not_deployed' NOT NULL"))
        
        if not await column_exists('deployed_at'):
            await conn.execute(text("ALTER TABLE agents ADD COLUMN deployed_at TIMESTAMP WITH TIME ZONE"))
        
        if not await column_exists('deployment_metadata'):
            await conn.execute(text("ALTER TABLE agents ADD COLUMN deployment_metadata JSONB"))

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await migrate_add_deployment_columns()

