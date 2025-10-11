from fastapi import HTTPException, status


def ensure(cond: bool, msg: str, code: int = status.HTTP_400_BAD_REQUEST):
    if not cond:
        raise HTTPException(status_code=code, detail=msg)
