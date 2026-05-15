package com.yorizori.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final ObjectMapper objectMapper;
    private final byte[] secret;

    public JwtTokenProvider(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret:${JWT_SECRET:yorizori-local-secret-change-me}}") String secret
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createAccessToken(long userId, String email) {
        return createToken(userId, email, "access", Instant.now().plusSeconds(60 * 60 * 6));
    }

    public String createRefreshToken(long userId, String email) {
        return createToken(userId, email, "refresh", Instant.now().plusSeconds(60L * 60 * 24 * 30));
    }

    public long parseUserId(String token) {
        Map<String, Object> payload = parsePayload(token);
        Object exp = payload.get("exp");
        if (exp instanceof Number number && number.longValue() < Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("Token expired.");
        }
        Object sub = payload.get("sub");
        if (sub == null) {
            throw new IllegalArgumentException("Token subject is missing.");
        }
        return Long.parseLong(String.valueOf(sub));
    }

    public String parseEmail(String token) {
        Object email = parsePayload(token).get("email");
        return email == null ? "" : String.valueOf(email);
    }

    public String parseType(String token) {
        Object type = parsePayload(token).get("type");
        return type == null ? "" : String.valueOf(type);
    }

    private String createToken(long userId, String email, String type, Instant expiresAt) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", String.valueOf(userId));
            payload.put("email", email);
            payload.put("type", type);
            payload.put("iat", Instant.now().getEpochSecond());
            payload.put("exp", expiresAt.getEpochSecond());
            String headerPart = encode(objectMapper.writeValueAsBytes(header));
            String payloadPart = encode(objectMapper.writeValueAsBytes(payload));
            String signaturePart = encode(sign(headerPart + "." + payloadPart));
            return headerPart + "." + payloadPart + "." + signaturePart;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create token.", e);
        }
    }

    private Map<String, Object> parsePayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token.");
            }
            String expectedSignature = encode(sign(parts[0] + "." + parts[1]));
            if (!constantTimeEquals(expectedSignature, parts[2])) {
                throw new IllegalArgumentException("Invalid token signature.");
            }
            byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(payload, new TypeReference<>() {
            });
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token.", e);
        }
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Token signing is not available.", e);
        }
    }

    private String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private boolean constantTimeEquals(String left, String right) {
        byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
        byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
        if (leftBytes.length != rightBytes.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < leftBytes.length; i++) {
            result |= leftBytes[i] ^ rightBytes[i];
        }
        return result == 0;
    }
}
