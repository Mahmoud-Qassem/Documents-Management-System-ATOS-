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

    private String firstName;
    private String lastName;
    private String email;
    private String nationalId;
    private String mobileNumber;
    private String address;
}
