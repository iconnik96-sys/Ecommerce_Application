package com.ecom.DTO;


import lombok.Data;

@Data
public class ProductRequestDTO {


    private Long id;

    private String name;
    private String description;
    private double price;



}
