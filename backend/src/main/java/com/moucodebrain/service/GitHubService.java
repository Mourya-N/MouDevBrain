package com.moucodebrain.service;

import com.moucodebrain.controller.ConnectRepoRequest;
import com.moucodebrain.model.IndexingStatus;
import com.moucodebrain.model.Repository;
import com.moucodebrain.repository.RepositoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class GitHubService {

    private final RepositoryRepository repositoryRepository;
    private final String AI_ENGINE_URL = System.getenv().getOrDefault("AI_ENGINE_URL", "http://localhost:8000");

    public GitHubService(RepositoryRepository repositoryRepository) {
        this.repositoryRepository = repositoryRepository;
    }

    public Repository connectRepository(ConnectRepoRequest request, String userId) {
        // Save repo to MongoDB
        Repository repo = new Repository();
        repo.setGithubRepoUrl(request.getRepoUrl());
        repo.setRepoName(extractRepoName(request.getRepoUrl()));
        repo.setOwner(extractOwner(request.getRepoUrl()));
        repo.setStatus(IndexingStatus.INDEXING);
        repo.setIndexedAt(LocalDateTime.now());
        repo.setBranch(request.getBranch() != null ? request.getBranch() : "main");
        repo.setUserId(userId);

        Repository saved = repositoryRepository.save(repo);

        // Trigger indexing on AI engine in a background thread
        new Thread(() -> triggerIndexing(saved)).start();

        return saved;
    }

    private void triggerIndexing(Repository repo) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("repo_url", repo.getGithubRepoUrl());
            aiRequest.put("branch", repo.getBranch());
            aiRequest.put("repo_id", repo.getId());

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    AI_ENGINE_URL + "/connect-and-index",
                    aiRequest,
                    Map.class);

            if (response != null && "completed".equals(response.get("status"))) {
                repo.setStatus(IndexingStatus.COMPLETED);
                Object totalFiles = response.get("total_files");
                if (totalFiles instanceof Number) {
                    repo.setTotalFiles(((Number) totalFiles).intValue());
                }

                Object filesListObj = response.get("files");
                if (filesListObj instanceof java.util.List) {
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> files = (java.util.List<String>) filesListObj;
                        repo.setFilePaths(files);
                    } catch (ClassCastException e) {
                        System.err.println("Could not cast files list: " + e.getMessage());
                    }
                }

                Object languagesObj = response.get("languages");
                if (languagesObj instanceof java.util.Map) {
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Integer> languages = (java.util.Map<String, Integer>) languagesObj;
                        repo.setLanguages(languages);
                    } catch (ClassCastException e) {
                        System.err.println("Could not cast languages map: " + e.getMessage());
                    }
                }
            } else {
                repo.setStatus(IndexingStatus.FAILED);
            }
        } catch (Exception e) {
            System.err.println("Failed to trigger indexing: " + e.getMessage());
            repo.setStatus(IndexingStatus.FAILED);
        }

        repositoryRepository.save(repo);
    }

    public IndexingStatus getIndexingStatus(String repoId) {
        return repositoryRepository.findById(repoId)
                .map(Repository::getStatus)
                .orElse(IndexingStatus.FAILED);
    }

    public java.util.List<Repository> getAllRepositories(String userId) {
        return repositoryRepository.findByUserId(userId);
    }

    private String extractRepoName(String url) {
        String cleaned = url.endsWith(".git") ? url.substring(0, url.length() - 4) : url;
        String[] parts = cleaned.split("/");
        return parts[parts.length - 1];
    }

    private String extractOwner(String url) {
        String cleaned = url.endsWith(".git") ? url.substring(0, url.length() - 4) : url;
        String[] parts = cleaned.split("/");
        return parts[parts.length - 2];
    }

    public java.util.Optional<Repository> getRepositoryByIdAndUser(String id, String userId) {
        return repositoryRepository.findByIdAndUserId(id, userId);
    }

    public boolean deleteRepository(String repoId, String userId) {
        java.util.Optional<Repository> repo = repositoryRepository.findByIdAndUserId(repoId, userId);
        if (repo.isPresent()) {
            repositoryRepository.delete(repo.get());
            // Optionally, write an API call here to delete from AI Engine vector store
            return true;
        }
        return false;
    }
}