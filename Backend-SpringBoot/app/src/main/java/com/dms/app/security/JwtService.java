package com.dms.app.security;

import com.dms.app.dto.PersonLoginDto;
import com.dms.app.exception.InvalidJWTException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.io.InvalidClassException;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    @Value("${dms.app.jwtSecret}")
    private String jwtSecret;

    @Value("${dms.app.jwtExpirationMs}")
    private int jwtExpirationMs;


    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    public String extractNationalId(String token) {
        return extractClaim(token, claims -> claims.get("nationalId", String.class));
    }
    public String extractFullName(String token) {
        return extractClaim(token, claims -> claims.get("fullName", String.class));
    }
    public Long extractId(String token) {
        return extractClaim(token, claims -> claims.get("id", Long.class));
    }
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String generateToken(String email, String nationalId, String fullName, Long id) {
        final Date now = new Date();
        final Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("nationalId", nationalId);
        claims.put("fullName", fullName);
        claims.put("id", id);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .claims(claims)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token){
        Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
        return true;
    }
}
