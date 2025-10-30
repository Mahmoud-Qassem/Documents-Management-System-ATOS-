package com.dms.app.controller;

import com.dms.app.dto.PersonResponseDto;
import com.dms.app.model.Folder;
import com.dms.app.model.Person;
import com.dms.app.security.JwtService;
import com.dms.app.service.FolderService;
import com.dms.app.service.PersonService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    private final PersonService personService;
    private final JwtService jwtService;

    @Autowired
    public FolderController(FolderService folderService, PersonService personService, JwtService jwtService) {
        this.folderService = folderService;
        this.personService = personService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<Folder> createFolder(@RequestBody Folder folder, HttpServletRequest request){
        // the sent folder with the request should have the pathOfTheParentFolder
        // the pathOfTheParentFolder should be in the form: firstFoldeId + "\\" + secondFolderId +"\\" and so on
        String token = request.getHeader("Authorization");
        String nationalId = jwtService.extractAccessTokenNationalId(token);
        String ownerName = jwtService.extractAccessTokenFullName(token);

        Folder createdFolder = folderService.createFolder(folder, nationalId, ownerName);
        return ResponseEntity.ok(createdFolder);
    }



    @DeleteMapping("/{folderId}/hard")
    public ResponseEntity<Folder> deleteFolderHard(@PathVariable String folderId){
        Folder deletedFolder = folderService.deleteFolderHard(folderId);
        return ResponseEntity.ok(deletedFolder);
    }
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Folder>> getFoldersByOwnerId(@PathVariable String ownerId){
        List<Folder> folders = folderService.getFoldersByOwnerId(ownerId);
        return ResponseEntity.ok(folders);
    }


    @GetMapping
    public ResponseEntity<List<Folder>> getFolders(HttpServletRequest request){
        String token = request.getHeader("Authorization");
        String nationalId = jwtService.extractAccessTokenNationalId(token);
        List<Folder> folders = folderService.getFoldersByOwnerId(nationalId);
        return ResponseEntity.ok(folders);
    }


    @GetMapping("/deleted/{ownerId}")
    public ResponseEntity<List<Folder>> getDeletedFolders(@PathVariable String ownerId){
        List<Folder> folders = folderService.getDeletedFolders(ownerId);
        return ResponseEntity.ok(folders);
    }


    @GetMapping("/{folderId}")
    public ResponseEntity<Folder> getFolderById(@PathVariable String folderId){
        Folder folder = folderService.getFolderById(folderId);
        return ResponseEntity.ok(folder);
    }


    @GetMapping("/parent/{folderId}")
    public ResponseEntity<List<Folder>> getFoldersByParentId(@PathVariable String folderId, HttpServletRequest request) {
        String ownerId = jwtService.extractAccessTokenNationalId(request.getHeader("Authorization"));
        List<Folder> folders = folderService.getFoldersByParentId( ownerId, folderId);
        return ResponseEntity.ok(folders);
    }


    @PutMapping("/{folderId}")
    public ResponseEntity<Folder> updateFolder(@PathVariable String folderId, @RequestBody Folder folder){
        Folder updatedFolder = folderService.updateFolder(folderId, folder);
        return ResponseEntity.ok(updatedFolder);
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<Folder> deleteFolder(@PathVariable String folderId){
        Folder deletedFolder = folderService.deleteFolder(folderId);
        return ResponseEntity.ok(deletedFolder);
    }


    @PutMapping("/restore/{folderId}")
    public ResponseEntity<Folder> restoreFolder(@PathVariable String folderId){
        Folder restoredFolder = folderService.restoreFolder(folderId);
        return ResponseEntity.ok(restoredFolder);
    }


}
