package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    private String mobile;

    private String addressLine;

    private String city;

    private String state;

    private String pincode;

    @ManyToOne
    private User user;
}
