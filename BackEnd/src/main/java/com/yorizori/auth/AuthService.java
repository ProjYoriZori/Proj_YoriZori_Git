package com.yorizori.auth;

import com.yorizori.auth.AuthDtos.AuthResponse;
import com.yorizori.auth.AuthDtos.LoginRequest;
import com.yorizori.auth.AuthDtos.SignupRequest;
import com.yorizori.auth.AuthDtos.UserProfileResponse;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordHasher passwordHasher;
    private final JwtTokenProvider tokenProvider;

    public AuthService(JdbcTemplate jdbcTemplate, PasswordHasher passwordHasher, JwtTokenProvider tokenProvider) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordHasher = passwordHasher;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (request.age() != null && (request.age() < 1 || request.age() > 120)) {
            throw new IllegalArgumentException("올바른 나이를 입력해 주세요(1~120).");
        }
        try {
            jdbcTemplate.update("""
                    INSERT INTO users (
                        email, password_hash, nickname, gender, age, height_cm, weight_kg, goal, activity_level
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    email,
                    passwordHasher.hash(request.password()),
                    defaultNickname(request.nickname(), email),
                    nullToUpper(request.gender()),
                    request.age(),
                    request.heightCm(),
                    request.weightKg(),
                    nullToDefaultUpper(request.goal(), "MAINTAIN"),
                    nullToDefaultUpper(request.activityLevel(), "NORMAL")
            );
        } catch (DuplicateKeyException e) {
            throw new IllegalArgumentException("Email already exists.");
        }
        UserProfileResponse user = findUserByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Created user was not found."));
        return tokensFor(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserCredentials credentials = findCredentials(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!passwordHasher.matches(request.password(), credentials.passwordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        UserProfileResponse user = findUser(credentials.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return tokensFor(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!"refresh".equals(tokenProvider.parseType(refreshToken))) {
            throw new IllegalArgumentException("Refresh token is required.");
        }
        long userId = tokenProvider.parseUserId(refreshToken);
        UserProfileResponse user = findUser(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return tokensFor(user);
    }

    public Optional<UserProfileResponse> findUser(long userId) {
        return jdbcTemplate.query("""
                        SELECT user_id, email, nickname, gender, age, height_cm, weight_kg, goal, activity_level
                          FROM users
                                                 WHERE user_id = ?
                                                     AND (is_deleted = FALSE OR is_deleted IS NULL)
                        """,
                (rs, rowNum) -> new UserProfileResponse(
                        rs.getLong("user_id"),
                        rs.getString("email"),
                        rs.getString("nickname"),
                        rs.getString("gender"),
                        (Integer) rs.getObject("age"),
                        rs.getBigDecimal("height_cm"),
                        rs.getBigDecimal("weight_kg"),
                        rs.getString("goal"),
                        rs.getString("activity_level")
                ),
                userId
        ).stream().findFirst();
    }

    private Optional<UserProfileResponse> findUserByEmail(String email) {
        return jdbcTemplate.query("""
                        SELECT user_id, email, nickname, gender, age, height_cm, weight_kg, goal, activity_level
                          FROM users
                                                 WHERE email = ?
                                                     AND (is_deleted = FALSE OR is_deleted IS NULL)
                        """,
                (rs, rowNum) -> new UserProfileResponse(
                        rs.getLong("user_id"),
                        rs.getString("email"),
                        rs.getString("nickname"),
                        rs.getString("gender"),
                        (Integer) rs.getObject("age"),
                        rs.getBigDecimal("height_cm"),
                        rs.getBigDecimal("weight_kg"),
                        rs.getString("goal"),
                        rs.getString("activity_level")
                ),
                email
        ).stream().findFirst();
    }

    private Optional<UserCredentials> findCredentials(String email) {
        return jdbcTemplate.query("""
                        SELECT user_id, password_hash
                          FROM users
                                                 WHERE email = ?
                                                     AND (is_deleted = FALSE OR is_deleted IS NULL)
                        """,
                (rs, rowNum) -> new UserCredentials(rs.getLong("user_id"), rs.getString("password_hash")),
                email
        ).stream().findFirst();
    }

    private AuthResponse tokensFor(UserProfileResponse user) {
        return new AuthResponse(
                tokenProvider.createAccessToken(user.id(), user.email()),
                tokenProvider.createRefreshToken(user.id(), user.email()),
                user
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid email format.");
        }
        return normalized;
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private String defaultNickname(String nickname, String email) {
        if (nickname != null && !nickname.trim().isEmpty()) {
            return nickname.trim();
        }
        return email.substring(0, email.indexOf('@'));
    }

    private String nullToUpper(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String nullToDefaultUpper(String value, String fallback) {
        String normalized = nullToUpper(value);
        return normalized == null ? fallback : normalized;
    }

    private record UserCredentials(long userId, String passwordHash) {
    }
}
