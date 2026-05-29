package com.yorizori.auth;

import com.yorizori.auth.AuthDtos.AuthResponse;
import com.yorizori.auth.AuthDtos.LoginRequest;
import com.yorizori.auth.AuthDtos.RefreshRequest;
import com.yorizori.auth.AuthDtos.SignupRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    @PostMapping("/find-email")
    public ResponseEntity<Map<String, String>> findEmail(@RequestBody Map<String, String> body) {
        // placeholder endpoint for UI entry point. Implementation deferred.
        return ResponseEntity.ok(Map.of("message", "This feature is not implemented. Contact admin."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        // placeholder endpoint for UI entry point. Implementation deferred.
        return ResponseEntity.ok(Map.of("message", "This feature is not implemented. Contact admin."));
    }
}
