package com.dms.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class PersonResponseDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String mobileNumber;
}
