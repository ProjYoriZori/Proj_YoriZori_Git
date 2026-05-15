package com.yorizori.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignupRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            String nickname,
            String gender,
            Integer age,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String goal,
            String activityLevel
    ) {
    }

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record AuthResponse(String accessToken, String refreshToken, UserProfileResponse user) {
    }

    public record UserProfileResponse(
            long id,
            String email,
            String nickname,
            String gender,
            Integer age,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String goal,
            String activityLevel
    ) {
    }
}
