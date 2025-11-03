package com.dms.app.service;

import com.dms.app.exception.CanNotDeleteFileException;
import com.dms.app.model.UserFile;
import com.dms.app.repository.UserFileRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class UserFileService {

    @Value("${spring.data.mongodb.page-size}")
    int pageSize = 10;
    @Value("${local.folder.path}")
    String basePath;

    private  Pageable limit ;
    private final UserFileRepository userFileRepository;
    private final StorageManager storageManager;

    @Autowired
    public UserFileService(UserFileRepository userFileRepository, StorageManager storageManager) {
        this.userFileRepository = userFileRepository;
        this.storageManager = storageManager;
    }

    @PostConstruct
    public void init() {
        limit = PageRequest.of(0, pageSize);
    }

    public List<UserFile> getFilesByFolderId(String folderId) {
        return userFileRepository.findAllByFolderIdAndDeleted(folderId, false, limit);
    }

    public List<UserFile> getDeletedFiles(String ownerId) {
        return userFileRepository.findAllByOwnerIdAndDeleted(ownerId, true, limit);
    }

    public UserFile getFileById(String fileId, String nationalId) {
        Optional<UserFile> userFile=userFileRepository.findById(fileId);
        if(!userFile.isPresent()){
            throw new RuntimeException("File not found");
        }
        return userFile.get();
    }

    public UserFile uploadFile(MultipartFile uploadedFile,
                                   String ownerId,
                                   String folderId,
                                   String folderPath,
                                   String ownerName){

        String originalName = uploadedFile.getOriginalFilename();
        String uniqueName = UUID.randomUUID().toString();

        String type = originalName.substring(originalName.lastIndexOf(".")+1);
        String absolutePath = folderPath + File.separator + uniqueName + "." + type;

        UserFile file = UserFile.builder()
                .id(uniqueName)
                .name(originalName)
                .type(type)
                .size(uploadedFile.getSize())
                .folderId(folderId)
                .filePath(absolutePath)
                .deleted(false)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .build();
        try{
            storageManager.saveFile(absolutePath, uploadedFile);}
        catch (Exception ex){
            log.error("Failed to save file: {}", absolutePath, ex);
            throw new RuntimeException("Failed to save file");
        }

        file = userFileRepository.save(file);


        log.info("Uploaded file '{}' to path: {}", originalName, absolutePath);
        return file;
    }

    public Resource downloadFile(String fileId, String requesterId) {
        UserFile file = getFileById(fileId, requesterId);
        File toBeDownloaded = storageManager.getFile(file.getFilePath());
        return new FileSystemResource(toBeDownloaded);
    }


    public UserFile rename(String fileId, String newName) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        file.setName(newName);
        return userFileRepository.save(file);
    }

    public UserFile deleteFile(String fileId) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        file.setDeleted(true);
        return userFileRepository.save(file);
    }

    public UserFile restoreFile(String fileId) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        file.setDeleted(false);
        return userFileRepository.save(file);
    }

    public UserFile deleteFileHard(String fileId) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        try{
            storageManager.deleteFile(file.getFilePath());
        } catch (Exception ex){
            log.error("Failed to delete file: {}", file.getFilePath(), ex);
            throw new CanNotDeleteFileException("Failed to delete file: ");
        }
        userFileRepository.delete(file);

        return file;
    }
}
