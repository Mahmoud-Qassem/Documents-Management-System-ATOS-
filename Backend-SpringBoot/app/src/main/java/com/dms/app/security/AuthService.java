package com.dms.app.security;

import com.dms.app.Constants;
import com.dms.app.dto.PersonLoginDto;
import com.dms.app.dto.PersonRegisterDto;
import com.dms.app.mapper.PersonMapper;
import com.dms.app.model.Person;
import com.dms.app.repository.PersonRepository;
import com.dms.app.service.PersonService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.HashMap;
import java.util.Map;


@Slf4j
@Service
public class AuthService {
    private final PasswordEncoder passwordEncoder;
    private final PersonRepository personRepository;
    private final PersonMapper personMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Autowired
    public AuthService(PersonService personService,
                       PasswordEncoder passwordEncoder,
                       PersonRepository personRepository,
                       PersonMapper personMapper,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.passwordEncoder = passwordEncoder;
        this.personRepository = personRepository;
        this.personMapper = personMapper;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }


    public Map<String, Object> loginUser(PersonLoginDto dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.info("User authenticated using email & password successfully !!");

        Person person = personRepository.findByEmail(dto.getEmail());
        String accessToken = jwtService.generateAccessToken( person.getEmail(),
                                        person.getNationalId(),
                                        person.getFirstName()+" "+person.getLastName(),
                                        person.getId());
        String refreshToken = jwtService.generateRefreshToken(person.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);

        return response;
    }



    public String registerUser(PersonRegisterDto person) {
        Person personByEmail = personRepository.findByEmail(person.getEmail());
        Person personByNationalId = personRepository.findByNationalId(person.getNationalId());

        if(personByEmail != null){
            System.out.println("Email already exists");
            throw new RuntimeException("Email already exists");
        }
        if(personByNationalId != null){
            System.out.println("National ID already exists");
            throw new RuntimeException("National ID already exists");
        }
        person.setPassword(passwordEncoder.encode(person.getPassword()));
        personRepository.save( personMapper.toEntity(person) );

        // Create folder for the new person
        String basePath = "E:\\06_Java\\Fullstack-dms\\Backend-SpringBoot\\UsersUploads";
        String folderName = person.getNationalId() + "_root";

        // to do call the storage manager
        File folder = new File(basePath, folderName);
        boolean created = folder.mkdirs();


        return "User registered successfully";
    }

    public Map<String, Object> refreshToken(String refreshToken) {
        Map<String, Object> response = new HashMap<>();

        int checkCode = jwtService.validateRefreshToken(refreshToken);
        if(checkCode == Constants.INVALID){
            response.put("errorMessage", "Invalid refresh token");
            return response;
        }
        else if(checkCode == Constants.EXPIRED){
            response.put("errorMessage", "Expired refresh token");
            return response;
        }

        String email = jwtService.extractRefreshTokenEmail(refreshToken);
        Person person = personRepository.findByEmail(email);
        String  accessT =jwtService.generateAccessToken(person.getEmail(), person.getNationalId(), person.getFirstName()+" "+person.getLastName(), person.getId());
        String refreshT = jwtService.generateRefreshToken(person.getEmail());
        response.put("accessToken", accessT);
        response.put("refreshToken", refreshT);
        return response;
    }
}
