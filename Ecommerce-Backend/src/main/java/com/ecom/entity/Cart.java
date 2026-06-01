package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Cart {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private long id;

    @OneToOne
    private User user;


}
