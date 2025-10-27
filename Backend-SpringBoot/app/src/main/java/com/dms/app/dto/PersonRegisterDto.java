package com.dms.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonRegisterDto {

    @NotBlank(message = "First name is required")
    @Size(min = 3, max = 50, message = "Full name must be between 3 and 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 3, max = 50, message = "Full name must be between 3 and 100 characters")
    private String lastName;



    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "National ID is required")
    @Size(min = 14, max = 14, message = "Invalid National ID")
    private String nationalId;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 255, message = "Password must be at least 8 characters long")
    private String password;

    @Pattern(
            regexp = "^(010|011|012|015)\\d{8}$",
            message = "Invalid  phone number"
    )
    private String mobileNumber;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;
}
