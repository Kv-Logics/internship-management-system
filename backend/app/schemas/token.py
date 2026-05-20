from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    faculty_name: str
    role: Optional[str] = "faculty"