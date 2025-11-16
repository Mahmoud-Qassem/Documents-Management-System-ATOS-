package com.dms.app.service;

import com.dms.app.dto.ShareRequest;
import com.dms.app.dto.SharedFile;
import com.dms.app.dto.SharedUserEntry;
import com.dms.app.model.Person;
import com.dms.app.model.UserFile;
import com.dms.app.repository.PersonRepository;
import com.dms.app.repository.UserFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Slf4j
@Service
@RequiredArgsConstructor
public class UserFileShareService {

    private final UserFileService userFileService;
    private final PersonRepository personRepository;
    private final UserFileRepository userFileRepository;


    public UserFile shareFile(String fileId, ShareRequest request) {

        UserFile file = userFileService.getFileById(fileId);
        String email = request.getTargetUserEmail();
        Person person = personRepository.findByEmail(email);
        String targetUserId = "";
        if(person!=null){
            targetUserId = person.getNationalId();
        }
        else{
            throw new RuntimeException("User not found: " + email);
        }
        final String id = targetUserId;

        validatePermission(request.getPermission());

        if (file.getSharedWith() == null) {
            file.setSharedWith(new ArrayList<>());
        }

        // Remove duplicates
        file.getSharedWith().removeIf(entry ->
                entry.getUserId().equals(id)
        );

        file.getSharedWith().add(
                new SharedUserEntry(
                        targetUserId,
                        email,
                        request.getPermission().toUpperCase(),
                        LocalDateTime.now()
                )
        );
        file.setShared(true);

        return userFileRepository.save(file);
    }


    public UserFile removeShare(String fileId, String email) {

        UserFile file = userFileService.getFileById(fileId);

        String targetUserId = "";
        Person person = personRepository.findByEmail(email);
        if(person!=null){
            targetUserId = person.getNationalId();
        }
        else{
            throw new RuntimeException("User not found: " + email);
        }

        if (file.getSharedWith() == null) return file;

        final String id = targetUserId;

        file.getSharedWith().removeIf(entry ->
                entry.getUserId().equals(id)
        );
        if(file.getSharedWith().isEmpty()){
            file.setShared(false);
        }

        return userFileRepository.save(file);
    }


    public UserFile updateSharePermission(String fileId, String email, String permission) {

        validatePermission(permission);

        String targetUserId = "";
        Person person = personRepository.findByEmail(email);
        if(person!=null){
            targetUserId = person.getNationalId();
        }
        else{
            throw new RuntimeException("User not found: " + email);
        }

        UserFile file = userFileService.getFileById(fileId);

        if (file.getSharedWith() == null)
            throw new RuntimeException("No users were shared previously.");
        final String id = targetUserId;
        SharedUserEntry entry = file.getSharedWith().stream()
                .filter(e -> e.getUserId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User is not in the share list"));

        entry.setPermission(permission.toUpperCase());

        return userFileRepository.save(file);
    }


    public List<SharedUserEntry> getSharedUsers(String fileId) {
        UserFile file = userFileService.getFileById(fileId);
        return file.getSharedWith() == null ? List.of() : file.getSharedWith();
    }


    public Page<SharedFile> getFilesSharedWithUser(String nationalId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserFile> files = userFileRepository.findBySharedWithUserId(nationalId, pageable);
        Page<SharedFile> sharedFiles = files.map(file -> {
            return SharedFile.builder()
                    .id(file.getId())
                    .name(file.getName())
                    .type(file.getType())
                    .size(file.getSize())
                    .ownerName(file.getOwnerName())
                    .createdAt(file.getCreatedAt())
                    .permission(file.getSharedWith().stream()
                            .filter(e -> e.getUserId().equals(nationalId))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("User is not in the share list"))
                            .getPermission())
                    .build();
        });
        return sharedFiles;
    }


    private void validatePermission(String permission) {
        String perm = permission.toUpperCase();
        if (!perm.equals("READ") && !perm.equals("DOWNLOAD")) {
            throw new RuntimeException("Permission must be READ or DOWNLOAD");
        }
    }

    public Page<UserFile> getFilesSharedByUser(String nationalId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userFileRepository.findBySharedAndOwnerId(true,nationalId, pageable);
    }
}
