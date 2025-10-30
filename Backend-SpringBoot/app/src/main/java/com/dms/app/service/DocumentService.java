package com.dms.app.service;

import com.dms.app.model.Files;
import com.dms.app.model.Folder;
import com.dms.app.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
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
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
@Slf4j
@Service
public class DocumentService {

    @Value("${spring.data.mongodb.page-size}")
    int pageSize = 10;

    @Value("${local.folder.path}")
    String basePath;
    private final FolderService folderService;
    private final DocumentRepository documentRepository;
    @Autowired
    public DocumentService(FolderService folderService, DocumentRepository documentRepository) {
        this.folderService = folderService;
        this.documentRepository = documentRepository;
    }

    public List<Files> getDocumentsByFolderId(String folderId) {
        return documentRepository.findAllByFolderId(folderId);
    }

    public List<Files> getDeletedDocuments(String ownerId) {
        Pageable pageable = PageRequest.of(0, pageSize);
        return documentRepository.findAllByOwnerIdAndDeleted(ownerId, true, pageable);
    }

    public Files getDocumentById(String documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public Files uploadDocument(MultipartFile uploadedFile, Files file, String ownerId, String ownerName) throws IOException {

        Folder folder = folderService.getFolderById(file.getFolderId());
        String fullFolderPath = basePath + "\\" + ownerId + "_root" + "\\" + folder.getPath();
        String originalName = uploadedFile.getOriginalFilename();

        Files document = Files.builder()
                .name(originalName)
                .type(uploadedFile.getContentType())
                .size(uploadedFile.getSize())
                .folderId(folder.getId())
                .filePath(fullFolderPath)
                .deleted(false)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .build();
        document = documentRepository.save(document);

        String uniqueName = document.getId() + "_" + originalName;
        Path filePath = Paths.get(fullFolderPath, uniqueName);
        File localFolder = new File(fullFolderPath);
        if (!localFolder.exists() && !localFolder.mkdirs()) {
            throw new IOException("Failed to create folder: " + fullFolderPath);
        }
        uploadedFile.transferTo(filePath.toFile());
        folder.setSize(folder.getSize() + uploadedFile.getSize());
        folderService.updateFolder(folder.getId(), folder);

        log.info("Uploaded file '{}' to path: {}", originalName, filePath);
        return document;
    }

    public Resource downloadDocument(String documentId, String requesterId) {
        Files document = getDocumentById(documentId);

        // 🔐 Check authorization — only owner can download
        if (!document.getOwnerId().equals(requesterId)) {
            throw new SecurityException("Unauthorized to download this document.");
        }

        Path filePath = Path.of(document.getFilePath());
//        if (!Files.exists(filePath)) {
//            throw new RuntimeException("File not found on server: " + filePath);
//        }

        return new FileSystemResource(filePath);
    }


    public Files updateDocument(String documentId, Files file) {
        Files document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setName(file.getName());
        document.setFilePath(file.getFilePath());
        document.setFolderId(file.getFolderId());
        document.setDeleted(false);
        document.setOwnerId(file.getOwnerId());
        document.setOwnerName(file.getOwnerName());
        return documentRepository.save(document);
    }

    public Files deleteDocument(String documentId) {
        Files document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setDeleted(true);
        return documentRepository.save(document);
    }

    public Files restoreDocument(String documentId) {
        Files document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setDeleted(false);
        return documentRepository.save(document);
    }

    public Files deleteDocumentHard(String documentId) {
        Files document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        documentRepository.delete(document);
        return document;
    }
}
