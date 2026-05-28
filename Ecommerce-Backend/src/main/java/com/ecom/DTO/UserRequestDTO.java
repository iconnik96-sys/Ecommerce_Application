package com.ecom.DTO;


import jakarta.persistence.Column;
import lombok.Data;

@Data
public class UserRequestDTO {



    private String name;

    private String role;

    private String email;

    private String password;



}
