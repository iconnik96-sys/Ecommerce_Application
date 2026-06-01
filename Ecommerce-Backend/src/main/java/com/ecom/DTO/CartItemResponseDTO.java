package com.ecom.DTO;

import lombok.Data;

@Data
public class CartItemResponseDTO {

    private Long productId;
    private String name;

    private double price;

    private int quantity;

    private double subtotal;



}
