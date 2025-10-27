package com.dms.app.service;


import com.dms.app.dto.PersonResponseDto;
import com.dms.app.mapper.PersonMapper;
import com.dms.app.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
public class PersonService {
    private PersonRepository personRepository;
    private PersonMapper personMapper;

    @Autowired
    public PersonService(PersonRepository personRepository, PersonMapper personMapper) {
        this.personRepository = personRepository;
        this.personMapper = personMapper;
    }

    public List<PersonResponseDto> getAllUsers() {

        return personRepository.findAll().stream()
                .map(personMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    public PersonResponseDto getUserById(Long id) {
        return personMapper.toResponseDto(personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found")));
    }

    public PersonResponseDto getUserByEmail(String email) {
        PersonResponseDto personResponseDto= personMapper.toResponseDto(personRepository.findByEmail(email));
        if(personResponseDto == null) {
            throw new RuntimeException("User not found");
        }
        return personResponseDto;
    }





}
