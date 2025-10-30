package com.dms.app.security;

import com.dms.app.Constants;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    @Value("${dms.app.access.jwtSecret}")
    private String access_jwt_Secret;
    @Value("${dms.app.refresh.jwtSecret}")
    private String refresh_jwt_Secret;

    @Value("${dms.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    @Value("${dms.app.jwtRefreshExpirationMs}")
    private int jwtRefreshExpirationMs;


    private SecretKey getAccessTokenSigningKey() {
        return Keys.hmacShaKeyFor(access_jwt_Secret.getBytes());
    }
    private SecretKey getRefreshTokenSigningKey() {
        return Keys.hmacShaKeyFor(refresh_jwt_Secret.getBytes());
    }



    public Claims extractAccessTokenClaims(String token) {
        return Jwts.parser()
                .verifyWith(getAccessTokenSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public <T> T extractAccessTokenClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAccessTokenClaims(token);
        return claimsResolver.apply(claims);
    }

    public String extractAccessTokenEmail(String token) {
        return extractAccessTokenClaim(token, Claims::getSubject);
    }
    public Claims extractRefreshTokenClaims(String token) {
        return Jwts.parser()
                .verifyWith(getRefreshTokenSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public <T> T extractRefreshTokenClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractRefreshTokenClaims(token);
        return claimsResolver.apply(claims);
    }
    public String extractRefreshTokenEmail(String token) {
        return extractRefreshTokenClaim(token, Claims::getSubject);
    }

    public String extractAccessTokenNationalId(String token) {
        if(token != null && token.startsWith("Bearer "))
            token = token.substring(7);
        return extractAccessTokenClaim(token, claims -> claims.get("nationalId", String.class));


    }
    public String extractAccessTokenFullName(String token) {
        if(token != null && token.startsWith("Bearer "))
            token = token.substring(7);
        return extractAccessTokenClaim(token, claims -> claims.get("fullName", String.class));
    }
    public Long extractAccessTokenId(String token) {
        if(token != null && token.startsWith("Bearer "))
            token = token.substring(7);
        return extractAccessTokenClaim(token, claims -> claims.get("id", Long.class));
    }


//    public boolean isExpired(String token){
//            try {
//                Jwts.parser()
//                        .verifyWith(getSigningKey())
//                        .build()
//                        .parseSignedClaims(token);
//            }catch (ExpiredJwtException e){
//                return true;
//            }
//            return false;
//    }

    public String generateAccessToken(String email, String nationalId, String fullName, Long id) {
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
                .signWith(getAccessTokenSigningKey())
                .compact();
    }
    public int validateAccessToken(String token){
        try {
            Jwts.parser()
                    .verifyWith(getAccessTokenSigningKey())
                    .build()
                    .parseSignedClaims(token);
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            log.warn("JWT expired");
            return Constants.EXPIRED;
        } catch (Exception ex) {
            log.warn("JWT Invalid");
            return Constants.INVALID;
        }
        return Constants.VALID;
    }

    public String generateRefreshToken(String email) {
        final Date now = new Date();
        final Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getRefreshTokenSigningKey())
                .compact();
    }

    public int  validateRefreshToken(String refreshToken) {
        try{
            Jwts.parser()
                    .verifyWith(getRefreshTokenSigningKey())
                    .build()
                    .parseSignedClaims(refreshToken);
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            log.warn("Refresh JWT expired");
            return Constants.EXPIRED;
        } catch (Exception ex) {
            log.warn("Refresh JWT Invalid");
            return Constants.INVALID;
        }
        return Constants.VALID;
    }


}
