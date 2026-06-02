package com.ecom.mapper;

import com.ecom.DTO.OrderResponseDTO;
import com.ecom.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = OrderItemMapper.class)
public interface OrderMapper {

    @Mapping(source = "id", target = "orderId")
    @Mapping(source = "amount", target = "totalAmount")
    @Mapping(source = "orderDate", target = "orderDate")
    @Mapping(source = "orderItems", target = "items")
    OrderResponseDTO toDTO(Order order);
}
