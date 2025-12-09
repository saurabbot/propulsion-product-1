from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql://neondb_owner:npg_Bs5GQJn1lLwq@ep-green-union-a4jkrvdi-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

