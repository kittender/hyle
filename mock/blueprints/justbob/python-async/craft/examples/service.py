from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class CreateUser:
    email: str
    display_name: str


class UserRepository(Protocol):
    async def exists_by_email(self, email: str) -> bool: ...
    async def save(self, user: "User") -> "User": ...


class UserService:
    """Framework-agnostic async domain service."""

    def __init__(self, repo: UserRepository, events) -> None:
        self._repo = repo
        self._events = events

    async def create_user(self, cmd: CreateUser) -> "User":
        if await self._repo.exists_by_email(cmd.email):
            raise UserAlreadyExists(cmd.email)
        user = User.create(cmd.email, cmd.display_name)
        saved = await self._repo.save(user)
        await self._events.publish(UserCreated(saved.id))
        return saved
