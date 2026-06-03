package com.ecom.controller;

import com.ecom.DTO.OrderResponseDTO;
import com.ecom.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/ecom/order")
public class OrderController {

    @Autowired
    private OrderService service;

    @PostMapping("/place/{userId}")
    public OrderResponseDTO placeOrder(@PathVariable Long userId){
        return service.placeOrder(userId);
    }


    @GetMapping("/user/{userId}")
    public List<OrderResponseDTO> getUserOrder(@PathVariable Long userId){
        return service.getUserOrders(userId);
    }

    @GetMapping("/getByOrder/{orderId}")
    public OrderResponseDTO getByOrderId(@PathVariable Long orderId) {
        return service.getOrderById(orderId);
    }

    @PutMapping("/cancel/{orderId}")
    public String cancelOrder(@PathVariable Long orderId){
        return service.cancelOrder(orderId);
    }
}
