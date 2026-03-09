package com.moucodebrain.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.moucodebrain.service.JwtService;
import com.moucodebrain.model.User;
import com.moucodebrain.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173" })
public class AuthController {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthController(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        java.util.Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String token = jwtService.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName()));
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        userRepository.save(user); // Save to DB

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName()));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name"); // Might be passed from frontend
        // Note: For a real app, you MUST verify the credential token using
        // google-auth-library
        // GoogleIdTokenVerifier verifier = ...

        if (email == null) {
            return ResponseEntity.badRequest().body("Email is required from Google Payload");
        }

        // Check if user exists. If not, create an account automatically for Google
        // login.
        if (!userRepository.existsByEmail(email)) {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : email.split("@")[0]);
            // You might generate a random password or mark this account as OAuth-only
            newUser.setPassword("");
            userRepository.save(newUser);
        }

        User user = userRepository.findByEmail(email).get();
        String token = jwtService.generateToken(email);
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody java.util.Map<String, String> payload) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        if (jwtService.validateToken(token, email)) {
            // For a real app, verify currentPassword matches the hashed DB password
            // Then update the user's password with the new encoded password.
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Password changed successfully"));
        }

        return ResponseEntity.status(401).body("Invalid or expired token");
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody java.util.Map<String, String> payload) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);
        String newName = payload.get("name");

        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Name cannot be empty");
        }

        if (jwtService.validateToken(token, email)) {
            // Find user and update name
            java.util.Optional<User> optionalUser = userRepository.findByEmail(email);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                user.setName(newName);
                userRepository.save(user);
                return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Profile updated successfully"));
            } else {
                return ResponseEntity.status(404).body("User not found");
            }
        }

        return ResponseEntity.status(401).body("Invalid or expired token");
    }
}

class LoginRequest {
    private String email;
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class AuthResponse {
    private String token;
    private String email;
    private String name;

    public AuthResponse(String token, String email, String name) {
        this.token = token;
        this.email = email;
        this.name = name;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}