package com.ecom.DTO;

import jakarta.persistence.Entity;
import lombok.Data;

@Data
public class UserResponseDTO {

    private Long id;

    private String name;

    private String email;

    private  String role;
}
