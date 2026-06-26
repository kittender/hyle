use thiserror::Error;

#[derive(Debug, Error)]
pub enum UserError {
    #[error("user already exists: {0}")]
    AlreadyExists(String),
    #[error("user not found")]
    NotFound,
    #[error(transparent)]
    Store(#[from] StoreError),
}

pub fn create_user(repo: &impl UserRepository, cmd: CreateUser) -> Result<User, UserError> {
    if repo.exists_by_email(&cmd.email)? {
        return Err(UserError::AlreadyExists(cmd.email));
    }
    let user = User::new(cmd.email, cmd.display_name);
    repo.save(user).map_err(UserError::from)
}
