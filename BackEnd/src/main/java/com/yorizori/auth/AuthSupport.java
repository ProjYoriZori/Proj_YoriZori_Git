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
            return tokenProvider.parseUserId(authorization.substring("Bearer ".length()).trim());
        }
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.trim().isEmpty()) {
            return Long.parseLong(userIdHeader.trim());
        }
        throw new IllegalArgumentException("Authorization token is required.");
    }
}
