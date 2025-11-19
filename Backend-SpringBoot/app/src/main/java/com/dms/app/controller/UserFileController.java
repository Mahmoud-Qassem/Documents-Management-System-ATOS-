package com.dms.app.controller;

import com.dms.app.exception.ErrorUploadingFileException;
import com.dms.app.interfaces.PreviewResponse;
import com.dms.app.model.SearchCriteria;
import com.dms.app.model.UserFile;
import com.dms.app.security.CustomUserDetails;
import com.dms.app.interfaces.Base64Preview;
import com.dms.app.interfaces.FilePreview;
import com.dms.app.service.UserFileService;
import com.dms.app.service.FolderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Optional;


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

    ///  SearchCriteria  to do -> done
    // api -> localhost:8080/api/files/search
    @PostMapping("/search")
    public ResponseEntity<Page<UserFile>> searchFiles(
           @RequestBody SearchCriteria searchCriteria,
            Authentication authentication) {

        String nationalId = getNationalId(authentication);
        Page<UserFile> files = userFileService.searchFiles(nationalId, searchCriteria);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{fileId}/preview")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'PREVIEW')")
    public ResponseEntity<?> previewFile(@PathVariable String fileId)throws FileNotFoundException {

        PreviewResponse result = userFileService.previewFile(fileId);

        if (result instanceof Base64Preview base64) {
            return ResponseEntity.ok(base64);
        }

        if (result instanceof FilePreview filePreview) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(filePreview.mimeType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + filePreview.resource().getFilename() + "\"")
                    .body(filePreview.resource());
        }

        throw new IllegalStateException("Unexpected preview response type: " + result.getClass());
    }


    @GetMapping("/folder/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'READ')")
    public ResponseEntity<Page<UserFile>> getUserFilesByFolderId(@PathVariable String folderId,
                                                                 @RequestParam(value = "page", defaultValue = "0") int page,
                                                                 @RequestParam(value = "size", defaultValue = "10") int size,
                                                                 @RequestParam(value = "sort", defaultValue = "name") String sort,
                                                                 @RequestParam(value = "dir", defaultValue = "asc") String dir) {
        Page<UserFile> files = userFileService.getFilesByFolderId(folderId, page, size, sort, dir);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/deleted/{ownerId}")
    @PreAuthorize("hasPermission(#ownerId, 'USER_FILE', 'READ')")
    public ResponseEntity<Page<UserFile>> getDeletedUserFiles(@PathVariable String ownerId,
                                                              @RequestParam(value = "page", defaultValue = "0") int page,
                                                              @RequestParam(value = "size", defaultValue = "10") int size,
                                                              @RequestParam(value = "sort", defaultValue = "name") String sort,
                                                              @RequestParam(value = "dir", defaultValue = "asc") String dir
    ) {
        Page<UserFile> deletedUserFiles = userFileService.getDeletedFiles(ownerId, page, size, sort, dir);
        return ResponseEntity.ok(deletedUserFiles);
    }

    @GetMapping("/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'READ')")
    public ResponseEntity<UserFile> getFileById(@PathVariable String fileId) throws FileNotFoundException {
        UserFile file = userFileService.getFileById(fileId);
        return ResponseEntity.ok(file);
    }

    @PostMapping(value = "/upload/{folderId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'WRITE')")
    public ResponseEntity<UserFile> uploadFile(@RequestParam(value = "file", required = false) MultipartFile uploadedFile,
                                               @PathVariable String folderId, Authentication authentication) {
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
        folderService.increaseFolderSize(folderId, uploadedFile.getSize());
        return ResponseEntity.ok(createdFile);
    }


    @GetMapping("/download/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'DOWNLOAD')")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileId)throws FileNotFoundException, IOException {
        Resource file = userFileService.downloadFile(fileId);
        ResponseEntity<Resource> response = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
        return response;
    }

    @PostMapping("/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'UPDATE')")
    public ResponseEntity<UserFile> rename(@PathVariable String fileId, @RequestParam("newName") String newName) {
        if (newName.length() < 3) {
            return ResponseEntity.badRequest().build();
        }
        UserFile updatedFile = userFileService.rename(fileId, newName);
        return ResponseEntity.ok(updatedFile);
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'DELETE')")
    public ResponseEntity<UserFile> deleteUserFile(@PathVariable String fileId) {
        UserFile deletedFile = userFileService.deleteFile(fileId);
        folderService.decreaseFolderSize(deletedFile.getFolderId(), deletedFile.getSize());
        return ResponseEntity.ok(deletedFile);
    }

    @DeleteMapping("/{fileId}/hard")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'DELETE')")
    public ResponseEntity<UserFile> deleteFileHard(@PathVariable String fileId) {
        UserFile deletedFile = userFileService.deleteFileHard(fileId);
        return ResponseEntity.ok(deletedFile);
    }

    @PutMapping("/restore/{fileId}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'UPDATE')")
    public ResponseEntity<UserFile> restoreFile(@PathVariable String fileId) {
        UserFile restoredFile = userFileService.restoreFile(fileId);
        folderService.increaseFolderSize(restoredFile.getFolderId(), restoredFile.getSize());
        return ResponseEntity.ok(restoredFile);
    }

    private String getNationalId(Authentication authentication) {
        return ((CustomUserDetails) authentication.getPrincipal()).getNationalId();
    }

}
