package com.dms.app.security;

import com.dms.app.model.Folder;
import com.dms.app.model.UserFile;
import com.dms.app.repository.FolderRepository;
import com.dms.app.repository.PersonRepository;
import com.dms.app.repository.UserFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final UserFileRepository userFileRepository;
    private final FolderRepository folderRepository;
    private final PersonRepository personRepository;


    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();

        return switch (targetType) {
            case "USER_FILE" -> hasUserFilePermission(nationalId, targetId.toString(), permission.toString());
            case "FOLDER" -> hasFolderPermission(nationalId, targetId.toString(), permission.toString());
            case "PERSON" -> hasPersonPermission(nationalId, targetId.toString(), permission.toString());
            default -> false;
        };
    }

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        return false;
    }

    private boolean hasUserFilePermission(String nationalId, String targetId, String permission) {
        // if nationalId is ownerId return true
        UserFile file = userFileRepository.findById(targetId).orElse(null);
        if (file == null)
            return false;
        if (file.getOwnerId().equals(nationalId))
            return true;

        // if DOWNLOAD then user can read, preview, download
        log.info("Permission: " + permission);
        boolean access = false;

        if (permission.equals("DOWNLOAD") || permission.equals("READ") || permission.equals("PREVIEW")) {
            access |= file.getSharedWith().stream().anyMatch(entry ->
                    entry.getUserId().equals(nationalId) && (entry.getPermission().equals("DOWNLOAD")));
        }
        if (permission.equals("PREVIEW")) {
            access|= file.getSharedWith().stream().anyMatch(entry ->
                    entry.getUserId().equals(nationalId) && entry.getPermission().equals("READ"));
        }

        access|= file.getSharedWith().stream().anyMatch(entry ->
                    entry.getUserId().equals(nationalId) && entry.getPermission().equals(permission));

        log.info("Access: " + (access?"Allowed":"Denied"));
        log.info("________________");
        return access;


    }

    private boolean hasFolderPermission(String nationalId, String targetId, String permission) {
        // if nationalId is ownerId return true
        Folder folder = folderRepository.findById(targetId).orElse(null);
        if (folder == null)
            return false;
        if (folder.getOwnerId().equals(nationalId))
            return true;
        else
            return false;

//        if(folder.getSharedWith() != null) {
//            return folder.getSharedWith().stream().anyMatch(entry ->
//                    entry.getUserId().equals(nationalId) && entry.getPermission().equals(permission));
//        }
//        else
//            return false;

    }

    private boolean hasPersonPermission(String nationalId, String email, String permission) {
        switch (permission) {
            case "test" -> {
                return true;
            }
            default -> {
                return personRepository.findByEmail(email).getNationalId().equals(nationalId);
            }
        }
    }
}
