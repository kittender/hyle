package com.example.domain.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

/**
 * Domain service for the User aggregate.
 */
@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repo;
    private final ApplicationEventPublisher events;

    public UserService(UserRepository repo, ApplicationEventPublisher events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional
    public User createUser(CreateUserCommand cmd) {
        if (repo.existsByEmail(cmd.email())) {
            throw new UserAlreadyExistsException(cmd.email());
        }
        User user = User.create(cmd.email(), cmd.displayName());
        User saved = repo.save(user);
        events.publishEvent(new UserCreatedEvent(saved.getId()));
        return saved;
    }

    public Optional<User> findById(UserId id) {
        return repo.findById(id);
    }
}
