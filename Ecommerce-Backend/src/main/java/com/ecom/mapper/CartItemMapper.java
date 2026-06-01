package com.ecom.mapper;

import com.ecom.DTO.CartItemResponseDTO;
import com.ecom.entity.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CartItemMapper {
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "name")
    @Mapping(source = "product.price", target = "price")
    @Mapping(source = "quantity", target = "quantity")

    @Mapping(target = "subtotal",
            expression = "java(cartItem.getProduct().getPrice() * cartItem.getQuantity())")
    CartItemResponseDTO toDTO(CartItem cartItem);
}