package com.dms.app.controller;

import com.dms.app.dto.PersonLoginDto;
import com.dms.app.dto.PersonRegisterDto;
import com.dms.app.security.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody PersonLoginDto person) {
        String token = authService.loginUser(person);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("message", "Login successful");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody PersonRegisterDto person) {
        String resultMessage = authService.registerUser(person);

        Map<String, Object> response = new HashMap<>();
        response.put("message", resultMessage);

        return ResponseEntity.ok(response);
    }
}
