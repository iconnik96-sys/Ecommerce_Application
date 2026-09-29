package com.ecom.DTO;

import lombok.Data;

@Data
public class ProductResponseDTO {

    private Long id;

    private String name;
    private String description;
    private double price;

    // New fields (additive)
    private String category;
    private String imageUrl;
    private String tags;
    private int stock;
    private String reviewSummary;
}
