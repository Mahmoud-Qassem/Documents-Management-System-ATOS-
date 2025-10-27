package com.dms.app.mapper;

import com.dms.app.dto.PersonLoginDto;
import com.dms.app.dto.PersonRegisterDto;
import com.dms.app.dto.PersonResponseDto;
import com.dms.app.model.Person;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PersonMapper {

    //Register DTO to Entity
    Person toEntity(PersonRegisterDto dto);

    //Entity to Response DTO
    PersonResponseDto toResponseDto(Person person);

    //Login DTO to Entity (optional)
    @Mapping(target = "firstName", ignore = true)
    @Mapping(target = "lastName", ignore = true)
    @Mapping(target = "nationalId", ignore = true)
    @Mapping(target = "mobileNumber", ignore = true)
    @Mapping(target = "address", ignore = true)
    Person toEntity(PersonLoginDto dto);


    //Update existing entity from register DTO (for PATCH/PUT)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRegisterDto(PersonRegisterDto dto, @MappingTarget Person entity);
}