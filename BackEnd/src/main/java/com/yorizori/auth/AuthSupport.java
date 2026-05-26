package com.yorizori.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class AuthSupport {

    private final JwtTokenProvider tokenProvider;

    public AuthSupport(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    public long currentUserId(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                return tokenProvider.parseUserId(authorization.substring("Bearer ".length()).trim());
            } catch (IllegalArgumentException e) {
                throw new UnauthorizedException(e.getMessage());
            }
        }

        String fallbackUserId = request.getHeader("X-User-Id");
        if (fallbackUserId != null && !fallbackUserId.isBlank()) {
            try {
                return Long.parseLong(fallbackUserId.trim());
            } catch (NumberFormatException e) {
                throw new UnauthorizedException("X-User-Id must be a number.");
            }
        }

        throw new UnauthorizedException("Authorization token is required.");
    }
}
