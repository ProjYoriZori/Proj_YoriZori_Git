package com.yorizori.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {

    private final PasswordHasher passwordHasher = new PasswordHasher();

    @Test
    void matchesOriginalPasswordOnly() {
        String hash = passwordHasher.hash("secret-password");

        assertThat(passwordHasher.matches("secret-password", hash)).isTrue();
        assertThat(passwordHasher.matches("wrong-password", hash)).isFalse();
    }
}
