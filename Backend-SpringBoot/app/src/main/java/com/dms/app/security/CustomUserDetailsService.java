package com.dms.app.security;

import com.dms.app.model.Person;
import com.dms.app.repository.PersonRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private PersonRepository userRepository;

    @Override
    @Transactional // to prevent lazy loading exception
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Person user = userRepository.findByEmail(username);
        if(user == null) {
            throw new UsernameNotFoundException("User not found");
        }
        return User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .build();
    }

}
