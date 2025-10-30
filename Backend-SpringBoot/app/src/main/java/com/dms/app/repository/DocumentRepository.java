package com.dms.app.repository;

import com.dms.app.model.Files;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface DocumentRepository extends MongoRepository<Files, String> {
    public List<Files> findAllByFolderId(String folderId);

    List<Files> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);
}
