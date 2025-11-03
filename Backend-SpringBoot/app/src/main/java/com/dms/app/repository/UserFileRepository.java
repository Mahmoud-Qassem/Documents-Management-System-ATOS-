package com.dms.app.repository;

import com.dms.app.model.UserFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface UserFileRepository extends MongoRepository<UserFile, String> {
    List<UserFile> findAllByFolderIdAndDeleted(String folderId, boolean deleted, Pageable pageable);

    List<UserFile> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);

    boolean existsByOwnerIdAndDeleted(String ownerId, boolean b);
}
