package com.dms.app.repository;

import com.dms.app.model.UserFile;
import org.apache.catalina.User;
import org.apache.catalina.WebResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface UserFileRepository extends MongoRepository<UserFile, String> {
    List<UserFile> findAllByFolderIdAndDeleted(String folderId, boolean deleted);

    Page<UserFile> findAllByFolderIdAndDeleted(String folderId, boolean deleted, Pageable pageable);

    List<UserFile> findAllByFolderId(String folderId);
    Page<UserFile> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);
    @Query("{deleted: ?0, ownerId: ?1, folderId: ?2, name:{ $regex: ?3, $options: 'i' }}")
    Page<UserFile> findByDeletedAndOwnerIdAndFolderIdAndName(
            boolean deleted, String ownerId, String folderId, String name, Pageable pageable);

    @Query("{deleted: ?0, ownerId: ?1, folderId: ?2, type:{ $regex: ?3, $options: 'i' }}")
    Page<UserFile> findByDeletedAndOwnerIdAndFolderIdAndType(
            boolean deleted, String ownerId, String folderId, String type, Pageable pageable);

    @Query("{ deleted: ?0, ownerId: ?1, name:{ $regex: ?2, $options: 'i' } }")
    Page<UserFile> findByDeletedAndOwnerIdAndName(boolean deleted, String ownerId, String name, Pageable pageable);
    @Query("{ deleted: ?0, ownerId: ?1, type:{ $regex: ?2, $options: 'i' } }")
    Page<UserFile> findByDeletedAndOwnerIdAndType(boolean deleted, String ownerId, String type, Pageable pageable);

    Page<UserFile> findAllByOwnerIdAndDeletedAndFolderId(String ownerId, boolean deleted, String folderId, Pageable pageable);
}
