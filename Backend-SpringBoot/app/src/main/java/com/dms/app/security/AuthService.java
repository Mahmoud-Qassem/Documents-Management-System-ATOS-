package com.dms.app.security;

import com.dms.app.dto.PersonLoginDto;
import com.dms.app.dto.PersonRegisterDto;
import com.dms.app.dto.PersonResponseDto;
import com.dms.app.mapper.PersonMapper;
import com.dms.app.model.Person;
import com.dms.app.repository.PersonRepository;
import com.dms.app.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;


//@Service
//@RequiredArgsConstructor
//public class AuthService {
//    private final PersonRepository personRepository;
//    private final PasswordEncoder passwordEncoder;
//    private final JwtService jwtService;
//    private final AuthenticationManager authenticationManager;
//
//    @Autowired
//    public AuthService(PersonRepository personRepository,
//                       PasswordEncoder passwordEncoder,
//                       JwtService jwtService,
//                       AuthenticationManager authenticationManager) {
//        this.personRepository = personRepository;
//        this.passwordEncoder = passwordEncoder;
//        this.jwtService = jwtService;
//        this.authenticationManager = authenticationManager;
//    }
//
//    public JwtResponse register(PersonRegisterDto person) {
//        User user = User.builder()
//                .username(person.getFirstName())
//                .email(person.getEmail())
//                .password(passwordEncoder.encode(person.getPassword()))
//                .build();
//
//        personRepository.save(user);
//
//        String token = jwtService.generateToken(user);
//        return new JwtResponse(token);
//    }
//
//    public JwtResponse login(LoginRequest request) {
//        authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
//        );
//        User user = personRepository.findByUsername(request.getUsername())
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//        String token = jwtService.generateToken(user);
//        return new JwtResponse(token);
//    }
//}


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

    public String loginUser(PersonLoginDto dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtService.generateToken( dto);
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
        return "User registered successfully";
    }
}
