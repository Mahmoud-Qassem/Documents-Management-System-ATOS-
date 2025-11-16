package com.dms.app.repository;

import com.dms.app.model.Folder;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface FolderRepository extends MongoRepository<Folder, String> {
    // by OWNER id and deleted
    Page<Folder> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);
    List<Folder> findAllByParentId(String folderId);
    // by parentId and deleted
    Page<Folder> findAllByParentIdAndDeleted(String folderId, boolean b, Pageable pageable);

    boolean existsByOwnerIdAndDeleted(String ownerId, boolean b);


    @Query("{deleted: ?0, ownerId: ?1, parentId: ?2, name:{ $regex: ?3, $options: 'i' }}")
    Page<Folder> findByDeletedAndOwnerIdAndParentIdAndName(
            boolean deleted, String ownerId, String parentId, String name, Pageable pageable);

    @Query("{ deleted: ?0, ownerId: ?1, name:{ $regex: ?2, $options: 'i' }}")
    Page<Folder> findByDeletedAndOwnerIdAndName(
            boolean deleted, String ownerId, String name, Pageable pageable);

    Page<Folder> findAllByOwnerIdAndDeletedAndParentId(
            String ownerId, boolean deleted, String parentId, Pageable pageable);
}
