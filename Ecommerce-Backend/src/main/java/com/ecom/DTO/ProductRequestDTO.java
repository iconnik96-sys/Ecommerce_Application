package com.ecom.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ProductRequestDTO {

    private Long id;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Product description is required")
    private String description;

    @Positive(message = "Price must be greater than zero")
    private double price;

    // New fields (additive — no breaking change)
    private String category;
    private String imageUrl;
    private String tags;
    private int stock;
}
