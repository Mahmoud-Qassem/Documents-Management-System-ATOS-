package com.dms.app.controller;

import com.dms.app.model.Files;
import com.dms.app.security.JwtService;
import com.dms.app.service.DocumentService;
import com.dms.app.service.PersonService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
// E:\06_Java\Fullstack-dms\Backend-SpringBoot\UsersUploads


@Slf4j
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final PersonService personService;
    private final JwtService jwtService;

    @Autowired
    public DocumentController(DocumentService documentService, PersonService personService, JwtService jwtService) {
        this.documentService = documentService;
        this.personService = personService;
        this.jwtService = jwtService;
    }

    //  Get all documents of a folder --> GET /api/documents/folder/{folderId}
    @GetMapping("/folder/{folderId}")
    public ResponseEntity<List<Files>> getDocumentsByFolderId(@PathVariable String folderId) {
        List<Files> documents = documentService.getDocumentsByFolderId(folderId);
        return ResponseEntity.ok(documents);
    }

    //  Get deleted documents of an owner --> GET /api/documents/deleted/{ownerId}
    @GetMapping("/deleted/{ownerId}")
    public ResponseEntity<List<Files>> getDeletedDocuments(@PathVariable String ownerId) {
        List<Files> deletedDocuments = documentService.getDeletedDocuments(ownerId);
        return ResponseEntity.ok(deletedDocuments);
    }

    //  Get document by id --> GET /api/documents/{documentId}
    @GetMapping("/{documentId}")
    public ResponseEntity<Files> getDocumentById(@PathVariable String documentId) {
        Files document = documentService.getDocumentById(documentId);
        return ResponseEntity.ok(document);
    }

    //  Upload / create a document --> POST /api/documents
    @PostMapping("/upload/{folderId}")
    public ResponseEntity<Files> uploadDocument(@RequestParam("file") MultipartFile uploadedFile,@RequestBody Files file, HttpServletRequest request) throws IOException {
        String token = request.getHeader("Authorization");
        String nationalId = jwtService.extractAccessTokenNationalId(token);
        String ownerName = jwtService.extractAccessTokenFullName(token);

        Files createdFile = documentService.uploadDocument(uploadedFile,file, nationalId, ownerName);
        return ResponseEntity.ok(createdFile);
    }


    //  Update document metadata --> PUT /api/documents/{documentId}
    @PutMapping("/{documentId}")
    public ResponseEntity<Files> updateDocument(@PathVariable String documentId, @RequestBody Files file) {
        Files updatedFile = documentService.updateDocument(documentId, file);
        return ResponseEntity.ok(updatedFile);
    }

    //  Soft delete document --> DELETE /api/documents/{documentId}
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Files> deleteDocument(@PathVariable String documentId) {
        Files deletedFile = documentService.deleteDocument(documentId);
        return ResponseEntity.ok(deletedFile);
    }

    //  Hard delete document --> DELETE /api/documents/{documentId}/hard
    @DeleteMapping("/{documentId}/hard")
    public ResponseEntity<Files> deleteDocumentHard(@PathVariable String documentId) {
        Files deletedFile = documentService.deleteDocumentHard(documentId);
        return ResponseEntity.ok(deletedFile);
    }

    //  Restore deleted document --> PUT /api/documents/restore/{documentId}
    @PutMapping("/restore/{documentId}")
    public ResponseEntity<Files> restoreDocument(@PathVariable String documentId) {
        Files restoredFile = documentService.restoreDocument(documentId);
        return ResponseEntity.ok(restoredFile);
    }
}
