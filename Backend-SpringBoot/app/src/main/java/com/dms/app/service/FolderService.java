package com.dms.app.service;

import com.dms.app.exception.CanNotCreateFolderException;
import com.dms.app.exception.CanNotDeleteFolderException;
import com.dms.app.model.Folder;
import com.dms.app.model.SearchCriteria;
import com.dms.app.model.UserFile;
import com.dms.app.repository.FolderRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;
@Slf4j
@Service
public class FolderService {

    @Value("${spring.data.mongodb.page-size}")
    private int pageSize;


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
            String basePath = ownerId + "_root\\" + folder.getPath();
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
            // crnt time
            LocalDateTime crntTime = LocalDateTime.now();
            folder.setCreatedAt(crntTime);

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
        List<UserFile> files = userFileService.getALLFilesByFolderId(folderId);
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

    public Page<Folder> getDeletedFolders(String ownerId) {
        Page<Folder> folders = folderRepository.findAllByOwnerIdAndDeleted(ownerId, true, limit);
        return folders;
    }

    public Folder restoreFolder(String folderId) {
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        existing.setDeleted(false);
        return folderRepository.save(existing);
    }

    public Page<Folder> getFoldersByParentId(String ownerId, String parentId) {
        if ("root".equals(parentId)) {
            parentId = ownerId + "_root";
        }
        Page<Folder>folders = folderRepository.findAllByParentIdAndDeleted(parentId, false, limit);
        return folders;
    }

    public Folder getFolderById(String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));
        return folder;
    }

    public Page<Folder> getFoldersByOwnerId(String ownerId) {
        Page<Folder> folders = folderRepository.findAllByOwnerIdAndDeleted(ownerId, false, limit);
        return folders;
    }

    public String getFolderPath(String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));
        return folder.getPath();
    }
    public void increaseFolderSize(String folderId, long fileSize) {
        updateFolderSize(folderId, fileSize);
    }

    public void decreaseFolderSize(String folderId, long fileSize) {
        updateFolderSize(folderId, -fileSize);
    }

    private void updateFolderSize(String folderId, long delta) {
        if (folderId.endsWith("_root")) {
            return;
        }

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found: " + folderId));
        String parentId = folder.getParentId();
        updateFolderSize(parentId, delta);
        // Now update this folder
        folder.setSize(folder.getSize() + delta);
        folderRepository.save(folder);
    }


    public Page<Folder> searchFolders(String ownerId, SearchCriteria params) {

        String name = params.getName();
        String parentId = params.getFolderId();   // same key used for parent folder
        boolean deleted = params.getDeleted();
        int page = params.getPage();
        int size = params.getSize();
        String sort = params.getSort();
        String dir = params.getDir();

        if(parentId.equals("root")) parentId=ownerId+"_root";
        Page<Folder> folders;
        Pageable pageable = getPageable(page, size, sort, dir);

        if (deleted) {
            if (name != null && !name.isEmpty()) {
                log.info("search folder by name {}", name);
                return folderRepository.findByDeletedAndOwnerIdAndName(true, ownerId, name, pageable);
            }
            return folderRepository.findAllByOwnerIdAndDeleted(ownerId, true, pageable);
        } else {
            if (name != null && !name.isEmpty()) {
                log.info("search folder by name {}", name);
                return folderRepository.findByDeletedAndOwnerIdAndParentIdAndName(deleted, ownerId, parentId, name, pageable);
            }
        }

        return  folderRepository.findAllByOwnerIdAndDeletedAndParentId(
                ownerId, deleted, parentId, pageable
        );
    }

    private Pageable getPageable(int page, int size, String sort, String sortDirection) {
        if (sort.isEmpty() || (!sort.equalsIgnoreCase("name") && !sort.equalsIgnoreCase("size") && !sort.equalsIgnoreCase("type") && !sort.equalsIgnoreCase("createdAt")))
            sort = "name";
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return pageable;
    }


}
