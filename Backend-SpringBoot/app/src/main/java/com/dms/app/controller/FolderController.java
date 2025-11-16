package com.dms.app.controller;

import com.dms.app.dto.PersonResponseDto;
import com.dms.app.exception.CanNotCreateFolderException;
import com.dms.app.exception.CanNotDeleteFolderException;
import com.dms.app.model.Folder;
import com.dms.app.model.Person;
import com.dms.app.model.SearchCriteria;
import com.dms.app.security.CustomUserDetails;
import com.dms.app.security.JwtService;
import com.dms.app.service.FolderService;
import com.dms.app.service.PersonService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
// E:\06_Java\Fullstack-dms\Backend-SpringBoot\UsersUploads
@Slf4j
@RestController
@RequestMapping("/api/folders")
public class FolderController {
    private final FolderService folderService;

    @Autowired
    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }
    ///  api -> localhost:8080/api/folders/search
    @PostMapping("/search")
    public ResponseEntity<Page<Folder>> searchFolders(
            @RequestBody SearchCriteria searchCriteria,
            Authentication authentication) {

        String nationalId = getNationalId(authentication);
        Page<Folder> folders = folderService.searchFolders(nationalId, searchCriteria);
        return ResponseEntity.ok(folders);
    }



    @PostMapping
    public ResponseEntity<Folder> createFolder(@RequestBody Folder folder, Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();
        String ownerName = userDetails.getFullName();

        Folder createdFolder = folderService.createFolder(folder, nationalId, ownerName);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFolder);
    }

    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasPermission(#ownerId, 'OWNER', 'READ')")
    public ResponseEntity<Page<Folder>> getFoldersByOwnerId(@PathVariable String ownerId, HttpServletRequest request){
        Page<Folder> folders = folderService.getFoldersByOwnerId(ownerId);
        return ResponseEntity.ok(folders);
    }


    @GetMapping("/deleted/{ownerId}")
    @PreAuthorize("hasPermission(#ownerId, 'OWNER', 'READ')")
    public ResponseEntity<Page<Folder>> getDeletedFolders(@PathVariable String ownerId, HttpServletRequest request){
        Page<Folder> folders = folderService.getDeletedFolders(ownerId);
        return ResponseEntity.ok(folders);
    }


    @GetMapping("/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'READ')")
    public ResponseEntity<Folder> getFolderById(@PathVariable String folderId){
        Folder folder = folderService.getFolderById(folderId);
        return ResponseEntity.ok(folder);
    }


    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasPermission(#parentId, 'FOLDER', 'READ')")
    public ResponseEntity<Page<Folder>> getFoldersByParentId(@PathVariable String parentId, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String ownerId = userDetails.getNationalId();
        Page<Folder> folders = folderService.getFoldersByParentId( ownerId, parentId);
        return ResponseEntity.ok(folders);
    }

    @PutMapping("/restore/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'UPDATE')")
    public ResponseEntity<Folder> restoreFolder(@PathVariable String folderId){
        Folder restoredFolder = folderService.restoreFolder(folderId);
        folderService.increaseFolderSize(restoredFolder.getParentId(), restoredFolder.getSize());
        return ResponseEntity.ok(restoredFolder);
    }


    @PostMapping("/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'UPDATE')")
    public ResponseEntity<Folder> updateFolder(@PathVariable String folderId, @RequestBody Folder folder){
        Folder updatedFolder = folderService.updateFolder(folderId, folder);
        return ResponseEntity.ok(updatedFolder);
    }

    @DeleteMapping("/{folderId}/hard")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'DELETE')")
    public ResponseEntity<Folder> deleteFolderHard(@PathVariable String folderId){
        Folder deletedFolder = folderService.deleteFolderHard(folderId);
        return ResponseEntity.ok(deletedFolder);
    }

    @DeleteMapping("/{folderId}")
    @PreAuthorize("hasPermission(#folderId, 'FOLDER', 'DELETE')")
    public ResponseEntity<Folder> deleteFolder(@PathVariable String folderId){
        Folder deletedFolder = folderService.deleteFolder(folderId);
        folderService.decreaseFolderSize(deletedFolder.getParentId(), deletedFolder.getSize());
        return ResponseEntity.ok(deletedFolder);
    }

    private String getNationalId(Authentication authentication) {
        return ((CustomUserDetails) authentication.getPrincipal()).getNationalId();
    }

}
