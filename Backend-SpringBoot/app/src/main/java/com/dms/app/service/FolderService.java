package com.dms.app.service;

import com.dms.app.model.Folder;
import com.dms.app.model.Person;
import com.dms.app.repository.DocumentRepository;
import com.dms.app.repository.FolderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class FolderService {
    @Value("${spring.data.mongodb.page-size}")
    int pageSize;
    @Value("${local.folder.path}")
    String localFolderPath;
    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;

    @Autowired
    public FolderService(FolderRepository folderRepository, DocumentRepository documentRepository) {
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
    }

    public Folder createFolder(Folder folder, String ownerId, String ownerName) {

        String folderPath = localFolderPath + "\\" + ownerId + "_root" + "\\" + folder.getPath();
        if(folder.getParentId() == "root"){
            folder.setParentId( ownerId + "_root");
        }
        folder.setDeleted(false);
        folder.setPath(folderPath);
        folder.setOwnerId(ownerId);
        folder.setOwnerName(ownerName);
        folder.setSize(0L);
        folder = folderRepository.save(folder);

        // create a physical folder in the local file system
        String folderName = folder.getId() ;
        File localFolder = new File(folder.getPath(), folderName);
        localFolder.mkdirs();
        return folder;
    }

    public Folder getFolderById(String folderId) {
        return folderRepository.findById(folderId).orElse(null);
    }

    public List<Folder> getFoldersByOwnerId(String ownerId) {
        Pageable limit = PageRequest.of(0, pageSize);
        return folderRepository.findAllByOwnerIdAndDeleted(ownerId, false, limit);
    }


    public Folder updateFolder(String folderId, Folder folder) {
        Folder existingFolder = folderRepository.findById(folderId).orElse(null);
        if (existingFolder != null) {
            existingFolder.setName(folder.getName());
            return folderRepository.save(existingFolder);
        }
        return null;
    }

    public Folder deleteFolder(String folderId) {
        Folder existingFolder = folderRepository.findById(folderId).orElse(null);
        if (existingFolder != null) {
            existingFolder.setDeleted(true);
            return folderRepository.save(existingFolder);
        }
        return null;
    }

    public Folder deleteFolderHard(String folderId) {
        Folder existingFolder = folderRepository.findById(folderId).orElse(null);

        if (existingFolder != null) {
            String folderPath = existingFolder.getPath();
            File folder = new File(folderPath+existingFolder.getId() );
            if (folder.exists()) {
                try {
                    deleteRecursively(folder);
                    log.info("Deleted physical folder: {}", folderPath+existingFolder.getId());
                } catch (IOException e) {
                    log.error("Failed to delete folder physically: {}", folderPath+existingFolder.getId(), e);
                }
            }
            folderRepository.delete(existingFolder);
            return existingFolder;
        }
        return null;
    }
    private void deleteRecursively(File file) throws IOException {
        if (file.isDirectory()) {
            for (File subFile : Objects.requireNonNull(file.listFiles())) {
                deleteRecursively(subFile);
                folderRepository.deleteById(subFile.getName());
            }
            folderRepository.deleteById(file.getName());
        }
        if (!file.delete()) {
            throw new IOException("Failed to delete file: " + file.getAbsolutePath());
        }
    }

    public List<Folder> getDeletedFolders(String ownerId) {
        Pageable limit = PageRequest.of(0, pageSize);
        return folderRepository.findAllByOwnerIdAndDeleted(ownerId, true, limit);
    }

    public Folder restoreFolder(String folderId) {
        Folder existingFolder = folderRepository.findById(folderId).orElse(null);
        if (existingFolder != null) {
            // update the deleted field to false
            existingFolder.setDeleted(false);
            return folderRepository.save(existingFolder);
        }
        return null;
    }

    public List<Folder> getFoldersByParentId(String ownerId, String parentId) {
        if(parentId == "root"){
            parentId= ownerId + "_root";
        }
        return folderRepository.findAllByParentIdAndDeleted(parentId, false);
    }
}
