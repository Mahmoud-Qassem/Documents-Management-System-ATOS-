package com.dms.app.controller;

import com.dms.app.dto.PersonResponseDto;
import com.dms.app.security.JwtService;
import com.dms.app.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
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
//    @PreAuthorize("hasPermission(#nationalId, 'PERSON', 'READ')")
    public ResponseEntity<PersonResponseDto> getPersonByNationalId(@PathVariable String nationalId) {
        return ResponseEntity.ok(personService.getPersonByNationalId(nationalId));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasPermission(#email, 'PERSON', 'READ')")
    public ResponseEntity<PersonResponseDto> getPersonByEmail(@PathVariable String email) {
        return ResponseEntity.ok(personService.getPersonByEmail(email));
    }
}
