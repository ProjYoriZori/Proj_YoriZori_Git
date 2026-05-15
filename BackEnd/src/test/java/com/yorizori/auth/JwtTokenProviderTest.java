package com.yorizori.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    private final JwtTokenProvider tokenProvider = new JwtTokenProvider(new ObjectMapper(), "test-secret");

    @Test
    void createsReadableAccessAndRefreshTokens() {
        String accessToken = tokenProvider.createAccessToken(12L, "user@example.com");
        String refreshToken = tokenProvider.createRefreshToken(12L, "user@example.com");

        assertThat(tokenProvider.parseUserId(accessToken)).isEqualTo(12L);
        assertThat(tokenProvider.parseEmail(accessToken)).isEqualTo("user@example.com");
        assertThat(tokenProvider.parseType(accessToken)).isEqualTo("access");
        assertThat(tokenProvider.parseType(refreshToken)).isEqualTo("refresh");
    }
}
