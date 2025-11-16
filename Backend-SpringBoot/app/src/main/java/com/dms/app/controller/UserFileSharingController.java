package com.dms.app.controller;

import com.dms.app.dto.ShareRequest;
import com.dms.app.dto.SharedFile;
import com.dms.app.dto.SharedUserEntry;
import com.dms.app.model.UserFile;
import com.dms.app.security.CustomUserDetails;
import com.dms.app.service.UserFileService;
import com.dms.app.service.UserFileShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class UserFileSharingController {

    private final UserFileShareService userFileShareService;

    // Share a file with a user
    @PostMapping("/{fileId}/share")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'SHARE')")
    public ResponseEntity<UserFile> shareFile(
            @PathVariable String fileId,
            @RequestBody ShareRequest request
    ) {
        UserFile updated = userFileShareService.shareFile(fileId, request);
        return ResponseEntity.ok(updated);
    }

    // Remove a user's access to the file
    @DeleteMapping("/{fileId}/share/{email}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'REMOVE_SHARE')")
    public ResponseEntity<UserFile> removeShare(
            @PathVariable String fileId,
            @PathVariable String email
    ) {
        UserFile updated = userFileShareService.removeShare(fileId, email);
        return ResponseEntity.ok(updated);
    }

    // Update permission for a shared user
    @PatchMapping("/{fileId}/share/{email}")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'UPDATE_SHARE_PERMISSION')")
    public ResponseEntity<UserFile> updatePermission(
            @PathVariable String fileId,
            @PathVariable String email,
            @RequestBody String permission
    ) {
        UserFile updated = userFileShareService.updateSharePermission(fileId, email, permission);
        return ResponseEntity.ok(updated);
    }

    // List of users a file is shared with
    @GetMapping("/{fileId}/share")
    @PreAuthorize("hasPermission(#fileId, 'USER_FILE', 'OWNER')")
    public ResponseEntity<List<SharedUserEntry>> getSharedUsers(
            @PathVariable String fileId
    ) {
        return ResponseEntity.ok(userFileShareService.getSharedUsers(fileId));
    }

    // Files shared with me
    // api -> localhost:8080/api/files/shared-with-me
    @GetMapping("/shared-with-me")
    public ResponseEntity<Page<SharedFile>> getSharedWithMe(
            @RequestParam int page,
            @RequestParam int size,
            Authentication authentication
    ) {
        String nationalId = ((CustomUserDetails) authentication.getPrincipal()).getNationalId();
        return ResponseEntity.ok(userFileShareService.getFilesSharedWithUser(nationalId, page, size));
    }

    // Files shared by me
    @GetMapping("/shared-by-me")
    public ResponseEntity<Page<UserFile>> getSharedByMe(
            @RequestParam int page,
            @RequestParam int size,
            Authentication authentication
    ) {
        String nationalId = ((CustomUserDetails) authentication.getPrincipal()).getNationalId();
        return ResponseEntity.ok(userFileShareService.getFilesSharedByUser(nationalId, page, size));
    }
}
