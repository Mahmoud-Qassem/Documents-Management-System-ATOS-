package com.dms.app.service;


import com.dms.app.dto.PersonResponseDto;
import com.dms.app.mapper.PersonMapper;
import com.dms.app.model.Person;
import com.dms.app.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonService {
    private final PersonRepository personRepository;
    private final PersonMapper personMapper;

    @Autowired
    public PersonService(PersonRepository personRepository, PersonMapper personMapper) {
        this.personRepository = personRepository;
        this.personMapper = personMapper;
    }

    public List<PersonResponseDto> getAllPersons() {
        return personRepository.findAll().stream()
                .map(personMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    public PersonResponseDto getPersonById(Long id) {
        return personMapper.toResponseDto(personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Person not found")));
    }

    public PersonResponseDto getPersonByEmail(String email) {
        PersonResponseDto personResponseDto = personMapper.toResponseDto(personRepository.findByEmail(email));
        if (personResponseDto == null) {
            throw new RuntimeException("Person not found");
        }
        return personResponseDto;
    }

    public PersonResponseDto getPersonByNationalId(String nationalId) {
        PersonResponseDto personResponseDto = personMapper.toResponseDto(personRepository.findByNationalId(nationalId));
        if (personResponseDto == null) {
            throw new RuntimeException("Person not found");
        }
        return personResponseDto;
    }
}
