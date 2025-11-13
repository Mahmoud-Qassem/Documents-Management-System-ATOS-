package com.dms.app.security;

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
        CustomUserDetails userDetails = (CustomUserDetails)authentication.getPrincipal();
        String nationalId = userDetails.getNationalId();

        return switch (targetType) {
            case "USER_FILE" -> hasUserFilePermission(nationalId, targetId.toString(), permission.toString());
            case "FOLDER" -> hasFolderPermission(nationalId, targetId.toString(),permission.toString());
            case "PERSON" -> hasPersonPermission(nationalId, targetId.toString(),permission.toString());
            case "OWNER" -> nationalId.equals(targetId.toString());
            default -> false;
        };
    }

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        return false;
    }

    private boolean hasUserFilePermission(String ownerId, String targetId, String permission) {
        switch (permission) {
            case "test" -> {
                return true;
            }
            default -> {
                return userFileRepository.findById(targetId)
                    .map(file -> file.getOwnerId().equals(ownerId))
                    .orElse(false);
            }
        }
    }
    private boolean hasFolderPermission(String ownerId, String targetId, String permission) {
        if(targetId.equals("root"))
            return true;
        switch (permission) {
            case "test" -> {
                return true;
            }
            default -> {

                return folderRepository.findById(targetId)
                        .map(file ->
                        {
                            return file.getOwnerId().equals(ownerId);
                        })
                        .orElse(false);
            }
        }
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
