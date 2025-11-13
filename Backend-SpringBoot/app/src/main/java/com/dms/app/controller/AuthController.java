package com.dms.app.controller;

import com.dms.app.dto.PersonLoginDto;
import com.dms.app.dto.PersonRegisterDto;
import com.dms.app.security.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController

@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody PersonLoginDto person) {
        Map<String, Object> response = authService.loginUser(person);
        response.put("message", "Login successful");
        return ResponseEntity.ok(response);
    }

    // response<map>

    @PostMapping("/refresh-token")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, String> request) {
        log.info("Refresh token request received ");
        Map<String, Object> response = new HashMap<>();
        String refreshToken = request.get("refreshToken");

        if (refreshToken == null || refreshToken.isBlank()) {
            response.put("errorMessage", "Missed refresh token");
            return ResponseEntity.badRequest().body(response); // 400
        }

        response =authService.refreshToken(refreshToken);
        // check if the response contains errorMessage as a key
        if(response.containsKey("errorMessage")){
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body(response);        }
        log.info("Refresh token request processed");

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
