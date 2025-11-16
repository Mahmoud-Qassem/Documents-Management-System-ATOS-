package com.dms.app.service;


import com.dms.app.exception.CanNotDeleteFileException;
import com.dms.app.interfaces.Base64Preview;
import com.dms.app.interfaces.FilePreview;
import com.dms.app.interfaces.PreviewResponse;
import com.dms.app.model.SearchCriteria;
import com.dms.app.model.UserFile;
import com.dms.app.repository.PersonRepository;
import org.apache.tika.Tika;
import com.dms.app.repository.UserFileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class UserFileService {


    @Value("${local.folder.path}")
    String basePath;

    @Value("${preview.base64.threshold-bytes:5242880}") // Default 5MB
    private long base64ThresholdBytes;

    private final UserFileRepository userFileRepository;
    private final StorageManager storageManager;
    private final PersonRepository personRepository;
    private final Tika tika = new Tika(); // For robust MIME detection

    @Autowired
    public UserFileService(UserFileRepository userFileRepository, StorageManager storageManager, PersonRepository personRepository) {
        this.userFileRepository = userFileRepository;
        this.storageManager = storageManager;
        this.personRepository = personRepository;
    }


    public PreviewResponse previewFile(String fileId, String requesterId) {
        UserFile file = getFileById(fileId); // Assume implemented elsewhere

        // --- Path validation (prevent directory traversal) ---
        Path root = Paths.get(basePath).normalize().toAbsolutePath();
        Path target = Paths.get(file.getFilePath()).normalize().toAbsolutePath();
        if (!target.startsWith(root)) {
            throw new SecurityException("Invalid file path detected.");
        }

        try {
            long fileSize = storageManager.getFileSize(file.getFilePath());
            File fileObj = storageManager.getFile(file.getFilePath());

            if (!fileObj.exists()) {
                throw new FileNotFoundException("File not found on disk.");
            }

            // --- Detect MIME type safely using Apache Tika ---
            String mimeType = tika.detect(fileObj);

            // --- Small file → Return Base64 encoded preview ---
            if (fileSize <= base64ThresholdBytes) {
                byte[] bytes = storageManager.readFileBytes(file.getFilePath());
                String base64Data = Base64.getEncoder().encodeToString(bytes);

                return new Base64Preview(
                        mimeType,
                        base64Data,
                        file.getName(),
                        file.getType()
                );
            }

            // --- Large file → Stream directly as Resource (efficient) ---
            Resource resource = new InputStreamResource(new FileInputStream(fileObj));
            return new FilePreview(resource, mimeType);

        } catch (IOException e) {
            log.error("Error while preparing file preview for ID: {}", fileId, e);
            throw new RuntimeException("Failed to preview file", e);
        }
    }


    public Page<UserFile> searchFiles(String ownerId, SearchCriteria params) {
        String name = params.getName();
        String type = params.getType();
        String folderId = params.getFolderId();
        boolean deleted = params.getDeleted();
        int page = params.getPage();
        int size = params.getSize();
        String sort = params.getSort();
        String sortDirection = params.getDir();

        Pageable pageable = getPageable(page, size, sort, sortDirection);
        if (deleted) {
            if (name != null && !name.isEmpty()) {
                log.info("search by name {}", name);
                return userFileRepository.findByDeletedAndOwnerIdAndName(deleted, ownerId, name, pageable);
            } else if (type != null && !type.isEmpty()) {
                log.info("search by type {}", type);
                return userFileRepository.findByDeletedAndOwnerIdAndType(deleted, ownerId, type, pageable);
            }
            return userFileRepository.findAllByOwnerIdAndDeleted(ownerId, deleted, pageable);
        } else {
            if (name != null && !name.isEmpty()) {
                log.info("search by name {}", name);
                return userFileRepository.findByDeletedAndOwnerIdAndFolderIdAndName(deleted, ownerId, folderId, name, pageable);
            } else if (type != null && !type.isEmpty()) {
                log.info("search by type {}", type);
                return userFileRepository.findByDeletedAndOwnerIdAndFolderIdAndType(deleted, ownerId, folderId, type, pageable);
            }
        }
        return userFileRepository.findAllByOwnerIdAndDeletedAndFolderId(ownerId, deleted, folderId, pageable);

    }

    private Pageable getPageable(int page, int size, String sort, String sortDirection) {
        if (sort.isEmpty() || (!sort.equalsIgnoreCase("name") && !sort.equalsIgnoreCase("size") && !sort.equalsIgnoreCase("type") && !sort.equalsIgnoreCase("createdAt")))
            sort = "name";
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return pageable;
    }

    public Page<UserFile> getFilesByFolderId(String folderId, int page, int size, String sort, String sortDirection) {
        Pageable pageable = getPageable(page, size, sort, sortDirection);
        return userFileRepository.findAllByFolderIdAndDeleted(folderId, false, pageable);
    }


    public Page<UserFile> getDeletedFiles(String ownerId, int page, int size, String sort, String sortDirection) {
        Pageable pageable = getPageable(page, size, sort, sortDirection);
        return userFileRepository.findAllByOwnerIdAndDeleted(ownerId, true, pageable);
    }

    public UserFile getFileById(String fileId) {
        Optional<UserFile> userFile = userFileRepository.findById(fileId);
        if (!userFile.isPresent()) {
            throw new RuntimeException("File not found");
        }
        return userFile.get();
    }

    public UserFile uploadFile(MultipartFile uploadedFile,
                               String ownerId,
                               String folderId,
                               String folderPath,
                               String ownerName) {

        String originalName = uploadedFile.getOriginalFilename();
        String type = originalName.substring(originalName.lastIndexOf(".") + 1);
        String name = originalName.substring(0, originalName.lastIndexOf("."));
        String uniqueName = UUID.randomUUID().toString();

        String absolutePath = folderPath + File.separator + uniqueName + "." + type;
        LocalDateTime crntTime = LocalDateTime.now();
        UserFile file = UserFile.builder()
                .id(uniqueName)
                .name(name)
                .type(type)
                .size(uploadedFile.getSize())
                .folderId(folderId)
                .filePath(absolutePath)
                .deleted(false)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .build();
        file.setCreatedAt(crntTime);
        try {
            storageManager.saveFile(absolutePath, uploadedFile);
        } catch (Exception ex) {
            log.error("Failed to save file: {}", absolutePath, ex);
            throw new RuntimeException("Failed to save file");
        }
        file = userFileRepository.save(file);

        return file;
    }

    public Resource downloadFile(String fileId, String requesterId) {
        UserFile file = getFileById(fileId);
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
        try {
            storageManager.deleteFile(file.getFilePath());
        } catch (Exception ex) {
            log.error("Failed to delete file: {}", file.getFilePath(), ex);
            throw new CanNotDeleteFileException("Failed to delete file: ");
        }
        userFileRepository.delete(file);

        return file;
    }
    public List<UserFile> getALLFilesByFolderId(String folderId) {
        return userFileRepository.findAllByFolderId(folderId);
    }
}
