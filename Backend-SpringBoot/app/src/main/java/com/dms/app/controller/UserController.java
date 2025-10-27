package com.dms.app.controller;

import com.dms.app.dto.PersonResponseDto;
import com.dms.app.security.JwtService;
import com.dms.app.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private PersonService personService;
    @Autowired
    private JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<PersonResponseDto>> getAllUsers(){
        return ResponseEntity.ok(personService.getAllUsers());
    }
    @GetMapping("/{id}")
    public ResponseEntity<PersonResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(personService.getUserById(id));
    }


    @GetMapping("/email/{email}")
    public ResponseEntity<PersonResponseDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(personService.getUserByEmail(email));
    }

/*


owner
visitor
editor
veiwer

signed url
 */
}
