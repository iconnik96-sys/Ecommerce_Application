package com.ecom.DTO;


import lombok.Data;


@Data
public class ProductResponseDTO {

    private String id;

    private String name;
    private String description;
    private double price;
}
