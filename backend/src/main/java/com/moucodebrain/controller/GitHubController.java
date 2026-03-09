package com.moucodebrain.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.moucodebrain.model.User;
import com.moucodebrain.repository.UserRepository;
import com.moucodebrain.service.GitHubService;
import com.moucodebrain.service.JwtService;
import java.util.Optional;

@RestController
@RequestMapping("/api/github")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173" })
public class GitHubController {

    private final GitHubService gitHubService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public GitHubController(GitHubService gitHubService, JwtService jwtService, UserRepository userRepository) {
        this.gitHubService = gitHubService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    private Optional<User> getUserFromAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);
        return userRepository.findByEmail(email);
    }

    @PostMapping("/connect")
    public ResponseEntity<?> connectRepository(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ConnectRepoRequest request) {

        Optional<User> userContent = getUserFromAuthHeader(authHeader);
        if (userContent.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return ResponseEntity.ok(gitHubService.connectRepository(request, userContent.get().getId()));
    }

    @GetMapping("/repos")
    public ResponseEntity<?> getAllRepositories(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<User> userContent = getUserFromAuthHeader(authHeader);
        if (userContent.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return ResponseEntity.ok(gitHubService.getAllRepositories(userContent.get().getId()));
    }

    @GetMapping("/{repoId}")
    public ResponseEntity<?> getRepository(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String repoId) {
        Optional<User> userContent = getUserFromAuthHeader(authHeader);
        if (userContent.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return gitHubService.getRepositoryByIdAndUser(repoId, userContent.get().getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{repoId}/status")
    public ResponseEntity<?> getIndexingStatus(@PathVariable String repoId) {
        return ResponseEntity.ok(gitHubService.getIndexingStatus(repoId));
    }

    @DeleteMapping("/{repoId}")
    public ResponseEntity<?> deleteRepository(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String repoId) {
        Optional<User> userContent = getUserFromAuthHeader(authHeader);
        if (userContent.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        boolean deleted = gitHubService.deleteRepository(repoId, userContent.get().getId());
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}