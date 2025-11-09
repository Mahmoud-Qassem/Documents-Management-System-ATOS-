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
    Page<UserFile> findAllByFolderIdAndDeleted(String folderId, boolean deleted, Pageable pageable);
    Page<UserFile> findAllByOwnerIdAndDeleted(String ownerId, boolean deleted, Pageable pageable);
    @Query("{ 'ownerId' : ?0, 'deleted' : ?1, 'folderId' : ?2, 'name' : { $regex : ?3 , $options: 'i' } }")
    Page<UserFile>  searchByOwnerIdAndDeletedAndFolderIdAndName(String ownerId, Boolean deleted, String folderId, String name, Pageable pageable);
    @Query("{ 'ownerId' : ?0, 'deleted' : ?1, 'folderId' : ?2, 'type' : { $regex : ?3 , $options: 'i' } }")
    Page<UserFile> searchByOwnerIdAndDeletedAndFolderIdAndType(String ownerId, Boolean deleted, String folderId, String type, Pageable pageable);
    @Query("{ownerId: ?0, deleted: ?1, folderId: ?2, $or: [{name: { $regex : ?3 , $options: 'i' } }, {type: { $regex : ?3 , $options: 'i' }}]}")
    Page<UserFile>searchByOwnerIdAndDeletedAndFolderIdAndNameOrType(String ownerId, Boolean deleted, String folderId, String keyword, Pageable pageable);
}
