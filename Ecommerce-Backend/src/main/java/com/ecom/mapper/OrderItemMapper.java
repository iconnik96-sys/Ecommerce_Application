package com.ecom.mapper;

import com.ecom.DTO.OrderItemResponseDTO;
import com.ecom.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    OrderItemResponseDTO toDTO(OrderItem orderItem);
}
