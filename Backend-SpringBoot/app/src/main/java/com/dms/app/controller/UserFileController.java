package com.dms.app.controller;

import com.dms.app.exception.ErrorUploadingFileException;
import com.dms.app.model.UserFile;
import com.dms.app.security.CustomUserDetails;
import com.dms.app.service.UserFileService;
import com.dms.app.service.FolderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;


@Slf4j
@RestController
@RequestMapping("/api/files")
public class UserFileController {

    private final UserFileService userFileService;
    private final FolderService folderService;

    @Autowired
    public UserFileController(UserFileService userFileService, FolderService folderService) {
        this.userFileService = userFileService;
        this.folderService = folderService;
    }

    // sort by name, type, size
    // api/files/searchByName
    @GetMapping("/searchByName")
    public ResponseEntity<List<UserFile>> searchFilesByName(@RequestParam("name") String name,
                                                      @RequestParam(value = "page", defaultValue = "0") int page,
                                                      @RequestParam(value = "size", defaultValue = "20") int size,
                                                      @RequestParam(value = "folderId") String folderId,
                                                      @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
                                                      @RequestParam(value = "sort", defaultValue = "name") String sort,
                                                      @RequestParam(value = "dir" , defaultValue = "asc") String dir,
                                                      Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();

        List<UserFile> files = userFileService.searchFilesByName(nationalId, name, folderId, deleted, sort, dir, page, size);
        return ResponseEntity.ok(files);
    }

    // api/files/searchByType
    @GetMapping("/searchByType")
    public ResponseEntity<List<UserFile>> searchFilesByType(@RequestParam("type") String type,
                                                            @RequestParam(value = "page", defaultValue = "0") int page,
                                                            @RequestParam(value = "size", defaultValue = "20") int size,
                                                            @RequestParam(value = "folderId") String folderId,
                                                            @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
                                                            @RequestParam(value = "sort", defaultValue = "name") String sort,
                                                            @RequestParam(value = "dir" , defaultValue = "asc") String dir,
                                                            Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();

        List<UserFile> files = userFileService.searchFilesByType(nationalId, type, folderId, deleted, sort, dir, page, size);
        return ResponseEntity.ok(files);
    }

    // api/files/searchByNameOrType
    @GetMapping("/searchByNameOrType")
    public ResponseEntity<List<UserFile>> searchFilesByNameOrType(@RequestParam("keyword") String keyword,
                                                                  @RequestParam(value = "page", defaultValue = "0") int page,
                                                                  @RequestParam(value = "size", defaultValue = "20") int size,
                                                                  @RequestParam(value = "folderId") String folderId,
                                                                  @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
                                                                  @RequestParam(value = "sort", defaultValue = "name") String sort,
                                                                  @RequestParam(value = "dir" , defaultValue = "asc") String dir,
                                                                  Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();

        List<UserFile> files = userFileService.searchFilesByNameOrType(nationalId, keyword, folderId, deleted, sort, dir , page, size);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/folder/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'READ')")
    public ResponseEntity<List<UserFile>> getUserFilesByFolderId(@PathVariable String folderId) {
        List<UserFile> files = userFileService.getFilesByFolderId(folderId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/deleted/{ownerId}")
    public ResponseEntity<List<UserFile>> getDeletedUserFiles(@PathVariable String ownerId) {
        List<UserFile> deletedUserFiles = userFileService.getDeletedFiles(ownerId);
        return ResponseEntity.ok(deletedUserFiles);
    }

    @GetMapping("/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'READ')")
    public ResponseEntity<UserFile> getFileById(@PathVariable String fileId, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();
        UserFile file = userFileService.getFileById(fileId, nationalId);
        return ResponseEntity.ok(file);
    }

    @PostMapping(value = "/upload/{folderId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'WRITE')")
    public ResponseEntity<UserFile> uploadFile(@RequestParam(value = "file", required = false) MultipartFile uploadedFile, @PathVariable String folderId, Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();
        String ownerName = userDetails.getFullName();
        String folderPath = folderService.getFolderPath(folderId);

        if (folderPath.isEmpty()) {
            throw new ErrorUploadingFileException("Folder not found");
        }

        UserFile createdFile = userFileService.uploadFile(
                uploadedFile, nationalId, folderId, folderPath, ownerName
        );
        return ResponseEntity.ok(createdFile);
    }


    @GetMapping("/download/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'READ')")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileId, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();
        Resource file = userFileService.downloadFile(fileId, nationalId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    @PutMapping("/{fileId}/newName")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'UPDATE')")
    public ResponseEntity<UserFile> rename(@PathVariable String fileId, @RequestParam("newName") String newName) {
        if(newName.length()<3){
            return ResponseEntity.badRequest().build();
        }
        UserFile updatedFile = userFileService.rename(fileId, newName);
        return ResponseEntity.ok(updatedFile);
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'DELETE')")
    public ResponseEntity<UserFile> deleteUserFile(@PathVariable String fileId){
        UserFile deletedFile = userFileService.deleteFile(fileId);
        return ResponseEntity.ok(deletedFile);
    }

    @DeleteMapping("/{fileId}/hard")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'DELETE')")
    public ResponseEntity<UserFile> deleteFileHard(@PathVariable String fileId){
        UserFile deletedFile = userFileService.deleteFileHard(fileId);
        return ResponseEntity.ok(deletedFile);
    }

    @PutMapping("/restore/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'UPDATE')")
    public ResponseEntity<UserFile> restoreFile(@PathVariable String fileId) {
        UserFile restoredFile = userFileService.restoreFile(fileId);
        return ResponseEntity.ok(restoredFile);
    }
}
