package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "products")
public class Product {

    @Id
    private Long id;

    private String name;
    private String description;
    private double price;
}
