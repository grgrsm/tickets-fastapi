from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import bookings, events
from app.core.config import settings
from app.exceptions import AppError

app = FastAPI(title="Ticket booking", version="1.0.0")

app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)

app.include_router(events.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")


def _error(status: int, code: str, message: str, details: list[dict] | None = None) -> JSONResponse:
    body: dict = {"code": code, "message": message}
    if details:
        body["details"] = details
    return JSONResponse(status_code=status, content={"error": body})


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return _error(exc.status_code, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        loc = [str(x) for x in err["loc"] if x != "body"]
        msg = str(err["msg"]).removeprefix("Value error, ")
        details.append({"field": ".".join(loc), "message": _message(err["type"], msg, err.get("ctx"))})
    return _error(422, "validation_error", "Please check the data you entered", details)


def _message(kind: str, msg: str, ctx: dict | None) -> str:
    if kind == "greater_than_equal" or kind == "less_than_equal":
        return "Age must be between 0 and 120"
    if kind in ("int_parsing", "int_type"):
        return "Enter a whole number"
    if kind in ("too_short", "too_long"):
        return "An order must have from 1 to 4 participants"
    if kind == "missing":
        return "This field is required"
    if kind == "string_type":
        return "Enter text"
    return msg


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    return _error(500, "internal_error", "Internal server error. Please try again later.")


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}
