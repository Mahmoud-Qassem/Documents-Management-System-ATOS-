package com.dms.app.controller;

import com.dms.app.dto.PersonResponseDto;
import com.dms.app.dto.UpdateProfileRequest;
import com.dms.app.security.CustomUserDetails;
import com.dms.app.security.JwtService;
import com.dms.app.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/persons")
public class PersonController {
    @Autowired
    private PersonService personService;
    @Autowired
    private JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<PersonResponseDto>> getAllPersons() {
        return ResponseEntity.ok(personService.getAllPersons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonResponseDto> getPersonById(@PathVariable Long id) {
        return ResponseEntity.ok(personService.getPersonById(id));
    }

    @GetMapping("/nationalId/{nationalId}")
    public ResponseEntity<PersonResponseDto> getPersonByNationalId(@PathVariable String nationalId) {
        return ResponseEntity.ok(personService.getPersonByNationalId(nationalId));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasPermission(#email, 'PERSON', 'READ')")
    public ResponseEntity<PersonResponseDto> getPersonByEmail(@PathVariable String email) {
        return ResponseEntity.ok(personService.getPersonByEmail(email));
    }
    // get the registered person
    // api -> localhost:8080/api/persons/registered
    @GetMapping("/registered")
    public ResponseEntity<PersonResponseDto> getRegisteredPerson(Authentication authentication) {
        String nationalId = getNationalId(authentication);
        return ResponseEntity.ok(personService.getPersonByNationalId(nationalId));
    }

    // update profile
    // api -> localhost:8080/api/persons/updateProfile
    @PostMapping("/updateProfile")
//    @PreAuthorize("hasPermission(#updateProfileRequest.email, 'PERSON', 'WRITE')")
    public ResponseEntity<PersonResponseDto> updateProfile(@RequestBody UpdateProfileRequest updateProfileRequest, Authentication authentication) {
        String nationalId = getNationalId(authentication);
        return ResponseEntity.ok(personService.updateProfile(updateProfileRequest, nationalId));
    }


    private String getNationalId(Authentication authentication) {
        return ((CustomUserDetails) authentication.getPrincipal()).getNationalId();
    }



}
