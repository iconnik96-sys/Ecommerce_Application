package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private double price;

    // New fields for AI features and richer catalog
    private String category;
    private String imageUrl;
    private String tags;
    private int stock;

    @Column(columnDefinition = "TEXT")
    private String reviewSummary;
}
