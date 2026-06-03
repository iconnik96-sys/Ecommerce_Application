package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Wishlist {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private User user;
}
