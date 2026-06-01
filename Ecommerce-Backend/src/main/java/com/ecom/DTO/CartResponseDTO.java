package com.ecom.DTO;


import lombok.Data;

import java.util.List;

@Data
public class CartResponseDTO {

    private Long userId;
    private Long cartId;
    private List<CartItemResponseDTO> items;
    private double totalprice;


}
