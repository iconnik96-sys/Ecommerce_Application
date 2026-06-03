package com.ecom.DTO;


import lombok.Data;

import java.util.List;

@Data
public class WishlistResponseDTO {


    private Long wishlistId;
  private List<WishlistItemResponseDTO> items;
}
