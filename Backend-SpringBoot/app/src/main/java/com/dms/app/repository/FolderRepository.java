package com.dms.app.repository;

import com.dms.app.model.Folder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface FolderRepository extends MongoRepository<Folder, String> {
    List<Folder> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);

    List<Folder> findAllByParentId(String folderId);

    List<Folder> findAllByParentIdAndDeleted(String folderId, boolean b);
}
