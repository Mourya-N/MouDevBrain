package com.moucodebrain.service;

import com.moucodebrain.model.IndexingStatus;
import com.moucodebrain.model.Repository;
import com.moucodebrain.repository.RepositoryRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class IndexingService {

    private final RepositoryRepository repositoryRepository;
    private final String AI_ENGINE_URL = System.getenv().getOrDefault("AI_ENGINE_URL", "http://localhost:8000");

    public IndexingService(RepositoryRepository repositoryRepository) {
        this.repositoryRepository = repositoryRepository;
    }

    @Async
    public void startIndexing(String repoId) {
        Repository repo = repositoryRepository.findById(repoId).orElseThrow();
        repo.setStatus(IndexingStatus.INDEXING);
        repositoryRepository.save(repo);

        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> request = new HashMap<>();
            request.put("repo_id", repoId);
            request.put("files", fetchFilesFromGithub(repo));

            restTemplate.postForObject(AI_ENGINE_URL + "/index", request, String.class);

            repo.setStatus(IndexingStatus.COMPLETED);
        } catch (Exception e) {
            repo.setStatus(IndexingStatus.FAILED);
        }

        repositoryRepository.save(repo);
    }

    private Object fetchFilesFromGithub(Repository repo) {
        return new Object();
    }
}