package com.dms.app.service;

import com.dms.app.exception.CanNotCreateFolderException;
import com.dms.app.exception.CanNotDeleteFolderException;
import com.dms.app.model.Folder;
import com.dms.app.model.UserFile;
import com.dms.app.repository.FolderRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
@Slf4j
@Service
public class FolderService {

    @Value("${spring.data.mongodb.page-size}")
    private int pageSize;
    @Value("${local.folder.path}")
    private String localFolderPath;

    private final FolderRepository folderRepository;
    private final UserFileService userFileService;
    private final StorageManager storageManager;
    private Pageable limit;

    @Autowired
    public FolderService(FolderRepository folderRepository,
                         UserFileService userFileService,
                         StorageManager storageManager) {
        this.folderRepository = folderRepository;
        this.userFileService = userFileService;
        this.storageManager = storageManager;
    }

    @PostConstruct
    public void init() {
        limit = PageRequest.of(0, pageSize);
    }

    public Folder createFolder(Folder folder, String ownerId, String ownerName) {
        try {
            // Construct folder path
            String uniqueId = UUID.randomUUID().toString();
            String basePath = localFolderPath + "\\" + ownerId + "_root\\" + folder.getPath();
            String folderPath = basePath + uniqueId;

            if ("root".equals(folder.getParentId())) {
                folder.setParentId(ownerId + "_root");
            }

            folder.setId(uniqueId);
            folder.setPath(folderPath);
            folder.setDeleted(false);
            folder.setOwnerId(ownerId);
            folder.setOwnerName(ownerName);
            folder.setSize(0L);

            folderRepository.save(folder);

            storageManager.createFolder(folderPath);
            return folder;

        } catch (Exception ex) {
            log.error("Failed to create folder for user {}: {}", ownerId, ex.getMessage(), ex);
            throw new CanNotCreateFolderException("Failed to create folder: " + ex.getMessage());
        }
    }

    public Folder updateFolder(String folderId, Folder folder) {
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        existing.setName(folder.getName());
        return folderRepository.save(existing);
    }

    public Folder deleteFolder(String folderId) {
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        existing.setDeleted(true);
        return folderRepository.save(existing);
    }

    public Folder deleteFolderHard(String folderId) {
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        // delete all files
        List<UserFile> files = userFileService.getFilesByFolderId(folderId);
        for (UserFile file : files) {
            try {
                userFileService.deleteFileHard(file.getId());
            } catch (Exception ex) {
                log.error("Failed to delete file {} in folder {}: {}", file.getId(), folderId, ex.getMessage());
                throw new CanNotDeleteFolderException("Failed to delete file: " + file.getId());
            }
        }

        List<Folder> subFolders = folderRepository.findAllByParentId(folderId);
        for (Folder sub : subFolders) {
            deleteFolderHard(sub.getId());
        }

        folderRepository.delete(existing);

        try {
            storageManager.deleteFolder(existing.getPath());
        } catch (Exception ex) {
            log.error("Storage deletion error for folder {}: {}", existing.getId(), ex.getMessage());
            throw new CanNotDeleteFolderException("Failed to delete folder from storage: " + existing.getId());
        }

        return existing;
    }

    public List<Folder> getDeletedFolders(String ownerId) {
        return folderRepository.findAllByOwnerIdAndDeleted(ownerId, true, limit);
    }

    public Folder restoreFolder(String folderId) {
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        existing.setDeleted(false);
        return folderRepository.save(existing);
    }

    public List<Folder> getFoldersByParentId(String ownerId, String parentId) {
        if ("root".equals(parentId)) {
            parentId = ownerId + "_root";
        }
        return folderRepository.findAllByParentIdAndDeleted(parentId, false, limit);
    }

    public Folder getFolderById(String folderId) {
        return folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));
    }

    public List<Folder> getFoldersByOwnerId(String ownerId) {
        return folderRepository.findAllByOwnerIdAndDeleted(ownerId, false, limit);
    }

    public String getFolderPath(String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));
        return folder.getPath();
    }
}
