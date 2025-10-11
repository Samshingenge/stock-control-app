from fastapi import Depends
from sqlmodel import Session

from .db import get_session


def get_db(session: Session = Depends(get_session)) -> Session:
    return session
