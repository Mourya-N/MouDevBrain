package com.moucodebrain.repository;

import com.moucodebrain.model.Repository;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

@org.springframework.stereotype.Repository
public interface RepositoryRepository extends MongoRepository<Repository, String> {
    List<Repository> findByUserId(String userId);

    List<Repository> findByOwner(String owner);

    java.util.Optional<Repository> findByIdAndUserId(String id, String userId);
}
