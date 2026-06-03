package com.ecom.mapper;

import com.ecom.DTO.WishlistItemResponseDTO;
import com.ecom.entity.WishlistItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WishlistItemMapper {

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.price", target = "productPrice")
    WishlistItemResponseDTO toDTO(WishlistItem wishlistItem);
}